import { eq, and } from "drizzle-orm"
import { db } from "../client"
import { integrations } from "../schema"
import type { ApiResponse } from "../../types/form"

type IntegrationRow = typeof integrations.$inferSelect
type IntegrationInsert = typeof integrations.$inferInsert

export type { IntegrationRow }

export interface WebhookConfig {
  url: string
  secret?: string
}

// ─── Queries ─────────────────────────────────────────────────────────────────

export async function getIntegrationsByForm(
  formId: string,
  type?: string
): Promise<ApiResponse<IntegrationRow[]>> {
  try {
    const rows = await db
      .select()
      .from(integrations)
      .where(
        type
          ? and(eq(integrations.formId, formId), eq(integrations.type, type))
          : eq(integrations.formId, formId)
      )

    return { success: true, data: rows }
  } catch (error) {
    return {
      success: false,
      error: { code: "DB_ERROR", message: error instanceof Error ? error.message : "Database error" },
    }
  }
}

export async function createIntegration(
  input: Omit<IntegrationInsert, "id" | "createdAt">
): Promise<ApiResponse<IntegrationRow>> {
  try {
    const [created] = await db.insert(integrations).values(input).returning()
    return { success: true, data: created }
  } catch (error) {
    return {
      success: false,
      error: { code: "DB_ERROR", message: error instanceof Error ? error.message : "Database error" },
    }
  }
}

export async function updateIntegration(
  id: string,
  input: Partial<Pick<IntegrationInsert, "name" | "enabled" | "config">>
): Promise<ApiResponse<IntegrationRow>> {
  try {
    const [updated] = await db
      .update(integrations)
      .set(input)
      .where(eq(integrations.id, id))
      .returning()

    if (!updated) {
      return { success: false, error: { code: "NOT_FOUND", message: "Integration not found" } }
    }

    return { success: true, data: updated }
  } catch (error) {
    return {
      success: false,
      error: { code: "DB_ERROR", message: error instanceof Error ? error.message : "Database error" },
    }
  }
}

export async function deleteIntegration(id: string): Promise<ApiResponse<void>> {
  try {
    await db.delete(integrations).where(eq(integrations.id, id))
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: { code: "DB_ERROR", message: error instanceof Error ? error.message : "Database error" },
    }
  }
}
