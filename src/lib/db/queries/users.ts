import { eq } from "drizzle-orm"
import { db } from "../client"
import { users, workspaces, workspaceMembers } from "../schema"
import { generateSlug } from "../../utils/slug"
import type { ApiResponse } from "../../types/form"

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
}): Promise<ApiResponse<UserWithWorkspace>> {
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
        data: { ...existingByAuthId, defaultWorkspace: workspace! },
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
        data: { ...existingByEmail, defaultWorkspace: workspace! },
      }
    }

    // First login — create user + workspace in a single transaction
    const result = await db.transaction(async (tx) => {
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
        })
        .returning()

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

      return { user, workspace }
    })

    return {
      success: true,
      data: { ...result.user, defaultWorkspace: result.workspace },
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
