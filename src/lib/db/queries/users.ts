import { eq, sql, and, gte } from "drizzle-orm"
import { db } from "../client"
import { users, workspaces, workspaceMembers, creditTransactions } from "../schema"
import { generateSlug } from "../../utils/slug"
import { sendWelcomeEmail } from "../../email"
import type { ApiResponse } from "../../types/form"
import { draftSchema } from "../../onboarding/draft"
import { getInitialCreditGrant } from "../../credits"

type UserRow = typeof users.$inferSelect
type WorkspaceRow = typeof workspaces.$inferSelect

export type UserWithWorkspace = UserRow & { defaultWorkspace: WorkspaceRow }

/**
 * Looks up a user by their Supabase Auth ID.
 * Returns null if not found (first-time login).
 */
export async function getUserByAuthId(
  supabaseAuthId: string
): Promise<ApiResponse<UserRow | null>> {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.supabaseAuthId, supabaseAuthId),
    })
    return { success: true, data: user ?? null }
  } catch (error) {
    return {
      success: false,
      error: {
        code: "DB_ERROR",
        message: error instanceof Error ? error.message : "Database error",
      },
    }
  }
}

/**
 * Ensures a user row (and a default workspace) exist for the given Supabase Auth user.
 * Safe to call on every login — idempotent.
 *
 * On first login:
 *  1. Creates a `users` row linked to the Supabase Auth ID.
 *  2. Creates a personal workspace.
 *  3. Adds the user as owner in `workspace_members`.
 *
 * On subsequent logins: returns the existing user.
 */
export async function ensureUserExists(authUser: {
  id: string
  email: string
  user_metadata?: Record<string, unknown>
}): Promise<ApiResponse<UserWithWorkspace & { isNewUser?: boolean }>> {
  try {
    // Fast path — user already exists (by auth ID)
    const existingByAuthId = await db.query.users.findFirst({
      where: eq(users.supabaseAuthId, authUser.id),
    })

    if (existingByAuthId) {
      const workspace = await db.query.workspaces.findFirst({
        where: eq(workspaces.ownerId, existingByAuthId.id),
      })
      return {
        success: true,
        data: { ...existingByAuthId, defaultWorkspace: workspace!, isNewUser: false },
      }
    }

    // Fallback — same email registered via different provider (e.g. Google + email/password)
    const existingByEmail = await db.query.users.findFirst({
      where: eq(users.email, authUser.email),
    })

    if (existingByEmail) {
      const workspace = await db.query.workspaces.findFirst({
        where: eq(workspaces.ownerId, existingByEmail.id),
      })
      return {
        success: true,
        data: { ...existingByEmail, defaultWorkspace: workspace!, isNewUser: false },
      }
    }

    // First login — create user + workspace in a single transaction
    const result = await db.transaction(async (tx) => {
      // Serializes the limited launch offer so concurrent signups cannot exceed 50 grants.
      await tx.execute(sql`select pg_advisory_xact_lock(730502001)`)

      // A concurrent request for the same Auth user may have completed while waiting.
      const concurrentUser = await tx.query.users.findFirst({
        where: eq(users.supabaseAuthId, authUser.id),
      })
      if (concurrentUser) {
        const concurrentWorkspace = await tx.query.workspaces.findFirst({
          where: eq(workspaces.ownerId, concurrentUser.id),
        })
        if (!concurrentWorkspace) throw new Error("Workspace missing for existing user")
        return { user: concurrentUser, workspace: concurrentWorkspace, isNewUser: false }
      }

      const [{ existingUserCount }] = await tx
        .select({ existingUserCount: sql<number>`count(*)::int` })
        .from(users)
      const completedSignupOnboarding = draftSchema.safeParse(
        authUser.user_metadata?.signup_draft
      ).success
      const creditGrant = getInitialCreditGrant(existingUserCount, completedSignupOnboarding)

      const name =
        (authUser.user_metadata?.full_name as string | undefined) ??
        (authUser.user_metadata?.name as string | undefined) ??
        authUser.email.split("@")[0]

      const avatarUrl =
        (authUser.user_metadata?.avatar_url as string | undefined) ?? null

      const [user] = await tx
        .insert(users)
        .values({
          supabaseAuthId: authUser.id,
          email: authUser.email,
          name,
          avatarUrl,
          creditBalance: creditGrant.totalCredits,
        })
        .returning()

      // Record welcome credits transaction
      await tx.insert(creditTransactions).values({
        userId: user.id,
        amount: creditGrant.welcomeCredits,
        type: "welcome",
        metadata: {
          reason: creditGrant.isEarlyAdopter
            ? "Oferta de lançamento para os 50 primeiros usuários"
            : "Bônus padrão de boas-vindas",
          earlyAdopter: creditGrant.isEarlyAdopter,
        },
      })

      if (creditGrant.onboardingCredits > 0) {
        await tx.insert(creditTransactions).values({
          userId: user.id,
          amount: creditGrant.onboardingCredits,
          type: "signup_onboarding",
          metadata: { reason: "Onboarding interativo concluído" },
        })
      }

      const workspaceSlug = generateSlug(name + " workspace")
      const [workspace] = await tx
        .insert(workspaces)
        .values({
          name: `${name}'s Workspace`,
          slug: workspaceSlug,
          ownerId: user.id,
        })
        .returning()

      await tx.insert(workspaceMembers).values({
        workspaceId: workspace.id,
        userId: user.id,
        role: "owner",
      })

      return { user, workspace, isNewUser: true }
    })

    // Fire-and-forget: welcome email on first login
    if (result.isNewUser) {
      sendWelcomeEmail({ toEmail: authUser.email, name: result.user.name ?? authUser.email.split("@")[0] }).catch(() => { })
    }

    return {
      success: true,
      data: { ...result.user, defaultWorkspace: result.workspace, isNewUser: result.isNewUser },
    }
  } catch (error) {
    return {
      success: false,
      error: {
        code: "DB_ERROR",
        message: error instanceof Error ? error.message : "Database error",
      },
    }
  }
}

/**
 * Gets the current credit balance of a user.
 */
export async function getUserCreditBalance(userId: string): Promise<number> {
  const [user] = await db
    .select({ creditBalance: users.creditBalance })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  return user?.creditBalance ?? 0
}

/**
 * Atomically checks and deducts user credits in a single transaction.
 */
export async function deductUserCredits(
  userId: string,
  amount: number,
  feature: string,
  metadata?: Record<string, unknown>
): Promise<{
  success: boolean
  newBalance?: number
  error?: { code: "INSUFFICIENT_CREDITS" | "USER_NOT_FOUND" | "DB_ERROR"; message: string }
}> {
  try {
    return await db.transaction(async (tx) => {
      // 1. Attempt atomic decrement guarded by sufficient balance
      const [updatedUser] = await tx
        .update(users)
        .set({
          creditBalance: sql`${users.creditBalance} - ${amount}`,
          updatedAt: new Date(),
        })
        .where(and(eq(users.id, userId), gte(users.creditBalance, amount)))
        .returning({ creditBalance: users.creditBalance })

      if (!updatedUser) {
        // Find out if user exists or simply lacked credits
        const [existing] = await tx
          .select({ creditBalance: users.creditBalance })
          .from(users)
          .where(eq(users.id, userId))
          .limit(1)

        if (!existing) {
          return {
            success: false,
            error: { code: "USER_NOT_FOUND", message: "Usuário não encontrado." },
          }
        }

        return {
          success: false,
          error: {
            code: "INSUFFICIENT_CREDITS",
            message: `Créditos insuficientes. Esta ação requer ${amount} créditos, mas seu saldo atual é de ${existing.creditBalance} créditos.`,
          },
        }
      }

      // 2. Record transaction
      await tx.insert(creditTransactions).values({
        userId,
        amount: -amount,
        type: "usage",
        metadata: {
          feature,
          cost: amount,
          newBalance: updatedUser.creditBalance,
          ...metadata,
        },
      })

      return {
        success: true,
        newBalance: updatedUser.creditBalance,
      }
    })
  } catch (error) {
    console.error("[deductUserCredits] Error:", error)
    return {
      success: false,
      error: {
        code: "DB_ERROR",
        message: error instanceof Error ? error.message : "Erro ao debitar créditos.",
      },
    }
  }
}
