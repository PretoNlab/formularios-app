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

type OnTokenRefresh = (accessToken: string, tokenExpiry: number) => void

function buildAuthenticatedClient(
  accessToken: string,
  refreshToken: string,
  tokenExpiry?: number,
  onTokenRefresh?: OnTokenRefresh
) {
  const client = getOAuthClient()
  client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
    expiry_date: tokenExpiry,
  })
  if (onTokenRefresh) {
    client.on("tokens", (tokens) => {
      if (tokens.access_token) {
        onTokenRefresh(tokens.access_token, tokens.expiry_date ?? Date.now() + 3600_000)
      }
    })
  }
  return client
}

export async function listSheetTabs(
  accessToken: string,
  refreshToken: string,
  spreadsheetId: string,
  tokenExpiry?: number,
  onTokenRefresh?: OnTokenRefresh
): Promise<string[]> {
  const auth = buildAuthenticatedClient(accessToken, refreshToken, tokenExpiry, onTokenRefresh)
  const sheets = google.sheets({ version: "v4", auth })
  const res = await sheets.spreadsheets.get({ spreadsheetId })
  return (res.data.sheets ?? [])
    .map((s) => s.properties?.title ?? "")
    .filter(Boolean)
}

export async function createSpreadsheet(
  accessToken: string,
  refreshToken: string,
  title: string,
  headers: string[],
  tokenExpiry?: number,
  onTokenRefresh?: OnTokenRefresh
): Promise<{ spreadsheetId: string; sheetName: string }> {
  const auth = buildAuthenticatedClient(accessToken, refreshToken, tokenExpiry, onTokenRefresh)
  const sheets = google.sheets({ version: "v4", auth })

  const res = await sheets.spreadsheets.create({
    requestBody: { properties: { title } },
  })

  const spreadsheetId = res.data.spreadsheetId!
  const sheetName = res.data.sheets?.[0]?.properties?.title ?? "Plan1"

  if (headers.length > 0) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `'${sheetName}'!A1`,
      valueInputOption: "RAW",
      requestBody: { values: [headers] },
    })
  }

  return { spreadsheetId, sheetName }
}

export function extractSpreadsheetId(urlOrId: string): string {
  const match = urlOrId.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)
  return match ? match[1] : urlOrId.trim()
}

/**
 * Google Sheets treats a cell starting with `=`, `+`, `-`, `@`, tab or CR as a
 * formula when appended with `USER_ENTERED`. Respondent answers are untrusted,
 * so neutralize them exactly like the CSV export does (leading apostrophe),
 * otherwise an anonymous respondent can plant a formula that runs — and can
 * exfiltrate other rows — when the form owner opens the spreadsheet.
 */
export function neutralizeSheetFormula(str: string): string {
  return /^[=+\-@\t\r]/.test(str) ? "'" + str : str
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return ""
  let str: string
  if (typeof value === "boolean") str = value ? "Sim" : "Não"
  else if (Array.isArray(value)) str = (value as unknown[]).join("; ")
  else if (typeof value === "object" && "fileName" in (value as object)) {
    const v = value as { fileName: string; fileUrl?: string }
    str = v.fileUrl ?? v.fileName
  } else if (typeof value === "object") {
    str = Object.entries(value as Record<string, unknown>).map(([k, v]) => `${k}: ${v}`).join("; ")
  } else str = String(value)
  return neutralizeSheetFormula(str)
}

export async function appendGoogleSheetsRow({
  accessToken,
  refreshToken,
  tokenExpiry,
  spreadsheetId,
  sheetName,
  questionOrder,
  answers,
  onTokenRefresh,
}: {
  accessToken: string
  refreshToken: string
  tokenExpiry?: number
  spreadsheetId: string
  sheetName: string
  questionOrder: Array<{ id: string; title: string; order: number }>
  answers: Record<string, unknown>
  onTokenRefresh?: OnTokenRefresh
}): Promise<void> {
  const auth = buildAuthenticatedClient(accessToken, refreshToken, tokenExpiry, onTokenRefresh)
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
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [row] },
  })
}
