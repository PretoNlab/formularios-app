"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { ensureUserExists } from "@/lib/db/queries/users"
import { getFormById } from "@/lib/db/queries/forms"
import {
  createIntegration,
  updateIntegration,
  deleteIntegration,
  getIntegrationsByForm,
} from "@/lib/db/queries/integrations"
import { listSheetTabs, extractSpreadsheetId } from "@/lib/google-sheets"
import type { IntegrationConfig } from "@/lib/db/schema"

async function requireUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Não autenticado.")

  const { data, success } = await ensureUserExists({
    id: user.id,
    email: user.email!,
    user_metadata: user.user_metadata,
  })
  if (!success || !data) throw new Error("Usuário não encontrado.")
  return data
}

async function requireFormOwner(formId: string) {
  const user = await requireUser()
  const { data: form, success } = await getFormById(formId)
  if (!success || !form) throw new Error("Formulário não encontrado.")
  if (form.createdById !== user.id) throw new Error("Acesso negado.")
  return user
}

export async function createWebhookAction(
  formId: string,
  name: string,
  url: string
) {
  await requireFormOwner(formId)
  const result = await createIntegration({
    formId,
    type: "webhook",
    name,
    enabled: true,
    config: { url },
  })
  if (!result.success) throw new Error("Falha ao criar webhook.")
  revalidatePath(`/builder/${formId}`)
  return result.data
}

export async function toggleIntegrationAction(id: string, enabled: boolean, formId: string) {
  await requireFormOwner(formId)
  const { data: formIntegrations } = await getIntegrationsByForm(formId)
  if (!formIntegrations?.some((i) => i.id === id)) throw new Error("Integração não encontrada.")
  await updateIntegration(id, { enabled })
  revalidatePath(`/builder/${formId}`)
}

export async function deleteIntegrationAction(id: string, formId: string) {
  await requireFormOwner(formId)
  const { data: formIntegrations } = await getIntegrationsByForm(formId)
  if (!formIntegrations?.some((i) => i.id === id)) throw new Error("Integração não encontrada.")
  await deleteIntegration(id)
  revalidatePath(`/builder/${formId}`)
}

/** Fields that must never be sent to the client, regardless of integration type. */
const SENSITIVE_CONFIG_KEYS = [
  "accessToken",
  "refreshToken",
  "tokenExpiry",
  "clientSecret",
  "apiSecret",
] as const

function sanitizeIntegrationConfig(
  type: string,
  config: IntegrationConfig
): Record<string, unknown> {
  // For Google Sheets, use an explicit whitelist — only safe display fields.
  if (type === "google_sheets") {
    const c = config as Record<string, unknown>
    return {
      spreadsheetId: c.spreadsheetId,
      spreadsheetUrl: c.spreadsheetUrl,
      spreadsheetTitle: c.spreadsheetTitle,
      sheetName: c.sheetName,
      lastError: c.lastError,
      lastErrorAt: c.lastErrorAt,
      connected: Boolean(c.accessToken),
    }
  }

  // For all other types: strip every known sensitive key.
  const safe = { ...(config as Record<string, unknown>) }
  for (const key of SENSITIVE_CONFIG_KEYS) {
    delete safe[key]
  }
  return safe
}

export async function getFormIntegrationsAction(formId: string) {
  await requireFormOwner(formId)
  const result = await getIntegrationsByForm(formId)
  if (!result.success) return []
  return (result.data ?? []).map((integration) => ({
    ...integration,
    config: sanitizeIntegrationConfig(integration.type, integration.config as IntegrationConfig),
  }))
}

// ─── Google Sheets ─────────────────────────────────────────────────────────────

/**
 * Returns the path to initiate Google OAuth.
 * Client does: window.location.href = await getGoogleSheetsAuthUrlAction(formId)
 */
export async function getGoogleSheetsAuthUrlAction(formId: string): Promise<string> {
  await requireFormOwner(formId)
  return `/api/auth/google-sheets?formId=${formId}`
}

/**
 * Lists the sheet tabs for a given spreadsheet URL or ID.
 * Uses the stored OAuth tokens for the form's google_sheets integration.
 */
export async function listSheetTabsAction(
  formId: string,
  spreadsheetUrlOrId: string
): Promise<string[]> {
  await requireFormOwner(formId)

  const { data: integrations } = await getIntegrationsByForm(formId, "google_sheets")
  const integration = integrations?.[0]
  if (!integration) throw new Error("Conta Google não conectada.")

  const config = integration.config as IntegrationConfig
  if (!config.accessToken || !config.refreshToken) {
    throw new Error("Tokens OAuth não encontrados. Conecte novamente.")
  }

  const spreadsheetId = extractSpreadsheetId(spreadsheetUrlOrId)
  return listSheetTabs(
    config.accessToken,
    config.refreshToken,
    spreadsheetId,
    config.tokenExpiry,
    (newAccessToken, newExpiry) => {
      updateIntegration(integration.id, {
        config: { ...config, accessToken: newAccessToken, tokenExpiry: newExpiry },
      }).catch(() => {})
    }
  )
}

/**
 * Saves the chosen spreadsheet and sheet tab to the integration.
 * Also enables the integration.
 */
export async function configureGoogleSheetsAction(
  formId: string,
  spreadsheetUrlOrId: string,
  sheetName: string
): Promise<void> {
  await requireFormOwner(formId)

  const { data: integrations } = await getIntegrationsByForm(formId, "google_sheets")
  const integration = integrations?.[0]
  if (!integration) throw new Error("Conta Google não conectada.")

  const spreadsheetId = extractSpreadsheetId(spreadsheetUrlOrId)
  const existingConfig = integration.config as IntegrationConfig

  await updateIntegration(integration.id, {
    enabled: true,
    config: { ...existingConfig, spreadsheetId, sheetName },
  })
  revalidatePath(`/builder/${formId}`)
}

/**
 * Disconnects the Google Sheets integration for a form.
 */
export async function disconnectGoogleSheetsAction(formId: string): Promise<void> {
  await requireFormOwner(formId)

  const { data: integrations } = await getIntegrationsByForm(formId, "google_sheets")
  for (const integration of integrations ?? []) {
    await deleteIntegration(integration.id)
  }
  revalidatePath(`/builder/${formId}`)
}
