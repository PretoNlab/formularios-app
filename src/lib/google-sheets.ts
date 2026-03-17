import { google } from "googleapis"

function getOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  )
}

export function getAuthUrl(state: string): string {
  const client = getOAuthClient()
  return client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: ["https://www.googleapis.com/auth/spreadsheets"],
    state,
  })
}

export async function exchangeCode(code: string): Promise<{
  accessToken: string
  refreshToken: string
  tokenExpiry: number
}> {
  const client = getOAuthClient()
  const { tokens } = await client.getToken(code)
  if (!tokens.access_token || !tokens.refresh_token) {
    throw new Error("Google não retornou os tokens OAuth necessários.")
  }
  return {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    tokenExpiry: tokens.expiry_date ?? Date.now() + 3600 * 1000,
  }
}

function buildAuthenticatedClient(accessToken: string, refreshToken: string, tokenExpiry?: number) {
  const client = getOAuthClient()
  client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
    expiry_date: tokenExpiry,
  })
  return client
}

export async function listSheetTabs(
  accessToken: string,
  refreshToken: string,
  spreadsheetId: string,
  tokenExpiry?: number
): Promise<string[]> {
  const auth = buildAuthenticatedClient(accessToken, refreshToken, tokenExpiry)
  const sheets = google.sheets({ version: "v4", auth })
  const res = await sheets.spreadsheets.get({ spreadsheetId })
  return (res.data.sheets ?? [])
    .map((s) => s.properties?.title ?? "")
    .filter(Boolean)
}

export function extractSpreadsheetId(urlOrId: string): string {
  const match = urlOrId.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)
  return match ? match[1] : urlOrId.trim()
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return ""
  if (typeof value === "boolean") return value ? "Sim" : "Não"
  if (Array.isArray(value)) return (value as unknown[]).join("; ")
  if (typeof value === "object" && "fileName" in (value as object)) {
    return (value as { fileName: string }).fileName
  }
  return String(value)
}

export async function appendGoogleSheetsRow({
  accessToken,
  refreshToken,
  tokenExpiry,
  spreadsheetId,
  sheetName,
  questionOrder,
  answers,
}: {
  accessToken: string
  refreshToken: string
  tokenExpiry?: number
  spreadsheetId: string
  sheetName: string
  questionOrder: Array<{ id: string; title: string; order: number }>
  answers: Record<string, unknown>
}): Promise<void> {
  const auth = buildAuthenticatedClient(accessToken, refreshToken, tokenExpiry)
  const sheets = google.sheets({ version: "v4", auth })

  const orderedQuestions = [...questionOrder].sort((a, b) => a.order - b.order)
  const range = `'${sheetName}'!A1`

  // Check if the sheet is empty (no header yet)
  const existing = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `'${sheetName}'!A1:A1`,
  })
  const isEmpty = !existing.data.values || existing.data.values.length === 0

  if (isEmpty) {
    const headers = [
      "Timestamp",
      ...orderedQuestions.map((q, i) => q.title || `Pergunta ${i + 1}`),
    ]
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range,
      valueInputOption: "RAW",
      requestBody: { values: [headers] },
    })
  }

  const row = [
    new Date().toISOString(),
    ...orderedQuestions.map((q) => formatValue(answers[q.id])),
  ]

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range,
    valueInputOption: "RAW",
    requestBody: { values: [row] },
  })
}
