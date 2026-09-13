"use server"

import { db } from "@/lib/db/client"
import { users, creditTransactions } from "@/lib/db/schema"
import { eq, and, sql } from "drizzle-orm"
import { requireUser } from "@/lib/auth"
import { revalidatePath } from "next/cache"

interface OnboardingMission {
  id: string
  label: string
  description: string
  rewardCredits: number
}

const ONBOARDING_MISSIONS: Record<string, OnboardingMission> = {
  create: {
    id: "create",
    label: "Criar 1º formulário com IA",
    description: "Crie ou gere seu primeiro formulário inteligente",
    rewardCredits: 10,
  },
  theme: {
    id: "theme",
    label: "Personalizar cores e tema",
    description: "Ajuste o visual para refletir sua identidade",
    rewardCredits: 5,
  },
  publish: {
    id: "publish",
    label: "Publicar o formulário",
    description: "Deixe seu formulário pronto para receber respostas",
    rewardCredits: 10,
  },
  share: {
    id: "share",
    label: "Compartilhar formulário",
    description: "Copie o link público ou código para envio",
    rewardCredits: 5,
  },
  response: {
    id: "response",
    label: "Receber 1ª resposta",
    description: "Colete sua primeira resposta e veja as métricas",
    rewardCredits: 15,
  },
}

/**
 * Fetches current user credit balance and claimed onboarding missions.
 * Also grants retroactive welcome credits for existing accounts if they never received any.
 */
export async function getUserCreditsAction(): Promise<{
  success: boolean
  data?: {
    creditBalance: number
    claimedMissions: string[]
  }
  error?: { message: string }
}> {
  try {
    const authUser = await requireUser()

    // Fetch user from DB
    const [user] = await db
      .select({ creditBalance: users.creditBalance })
      .from(users)
      .where(eq(users.id, authUser.id))
      .limit(1)

    if (!user) {
      return { success: false, error: { message: "Usuário não encontrado." } }
    }

    // Fetch transactions
    const transactions = await db
      .select({ type: creditTransactions.type })
      .from(creditTransactions)
      .where(eq(creditTransactions.userId, authUser.id))

    const claimedMissions = transactions
      .filter((t) => t.type.startsWith("mission_"))
      .map((t) => t.type.replace("mission_", ""))

    const hasWelcomeBonus = transactions.some((t) => t.type === "welcome")

    // Retroactive check: If user never received welcome credits, grant them 20 now!
    let currentBalance = user.creditBalance
    if (!hasWelcomeBonus && currentBalance === 0) {
      await db.transaction(async (tx) => {
        await tx
          .update(users)
          .set({ creditBalance: 20 })
          .where(eq(users.id, authUser.id))

        await tx.insert(creditTransactions).values({
          userId: authUser.id,
          amount: 20,
          type: "welcome",
          metadata: { reason: "Bônus retroativo de boas-vindas" },
        })
      })
      currentBalance = 20
    }

    return {
      success: true,
      data: {
        creditBalance: currentBalance,
        claimedMissions,
      },
    }
  } catch (error) {
    console.error("[getUserCreditsAction] Error:", error)
    return {
      success: false,
      error: { message: error instanceof Error ? error.message : "Erro ao buscar créditos." },
    }
  }
}

/**
 * Claims a completed onboarding mission reward in an idempotent transaction.
 */
export async function claimMissionRewardAction(missionId: string): Promise<{
  success: boolean
  data?: { newBalance: number; rewardedAmount: number }
  error?: { message: string }
}> {
  const mission = ONBOARDING_MISSIONS[missionId]
  if (!mission) {
    return { success: false, error: { message: "Missão inválida." } }
  }

  try {
    const authUser = await requireUser()
    const transactionType = `mission_${missionId}`

    // Check if already claimed
    const existing = await db
      .select({ id: creditTransactions.id })
      .from(creditTransactions)
      .where(
        and(
          eq(creditTransactions.userId, authUser.id),
          eq(creditTransactions.type, transactionType)
        )
      )
      .limit(1)

    if (existing.length > 0) {
      return { success: false, error: { message: "Esta recompensa já foi resgatada!" } }
    }

    // Process reward transaction
    const result = await db.transaction(async (tx) => {
      // 1. Update user balance
      const [updatedUser] = await tx
        .update(users)
        .set({ creditBalance: sql`${users.creditBalance} + ${mission.rewardCredits}` })
        .where(eq(users.id, authUser.id))
        .returning({ creditBalance: users.creditBalance })

      // 2. Insert transaction record
      await tx.insert(creditTransactions).values({
        userId: authUser.id,
        amount: mission.rewardCredits,
        type: transactionType,
        metadata: {
          missionId,
          label: mission.label,
        },
      })

      return updatedUser.creditBalance
    })

    revalidatePath("/dashboard")
    return {
      success: true,
      data: {
        newBalance: result,
        rewardedAmount: mission.rewardCredits,
      },
    }
  } catch (error) {
    console.error("[claimMissionRewardAction] Error:", error)
    return {
      success: false,
      error: { message: error instanceof Error ? error.message : "Erro ao resgatar recompensa." },
    }
  }
}
