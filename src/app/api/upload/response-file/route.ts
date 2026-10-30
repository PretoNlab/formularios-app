import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { randomBytes } from "crypto"
import { db } from "@/lib/db/client"
import { forms } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { getClientIp } from "@/lib/utils/ip"

const BUCKET = "form-responses"
const MAX_SIZE_BYTES = 10 * 1024 * 1024 // 10MB

// Rate limiting: max 20 uploads per 10 minutes per IP
const uploadAttempts = new Map<string, { count: number; resetAt: number }>()
const UPLOAD_MAX = 20
const UPLOAD_WINDOW_MS = 10 * 60 * 1000

function isUploadRateLimited(ip: string): boolean {
  const now = Date.now()
  const rec = uploadAttempts.get(ip)
  if (!rec || rec.resetAt < now) {
    uploadAttempts.set(ip, { count: 1, resetAt: now + UPLOAD_WINDOW_MS })
    return false
  }
  rec.count++
  return rec.count > UPLOAD_MAX
}

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "audio/mpeg": "mp3",
  "audio/ogg": "ogg",
  "audio/wav": "wav",
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/zip": "zip",
}

function isValidFileSignature(buffer: Buffer, mimeType: string): boolean {
  if (buffer.length < 4) return false

  if (mimeType === "application/pdf") {
    return buffer.subarray(0, 4).toString("ascii") === "%PDF"
  }
  if (mimeType === "image/png") {
    return buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47
  }
  if (mimeType === "image/jpeg") {
    return buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF
  }
  if (mimeType === "image/gif") {
    const header = buffer.subarray(0, 6).toString("ascii")
    return header === "GIF87a" || header === "GIF89a"
  }
  if (mimeType === "image/webp") {
    return (
      buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
      buffer.subarray(8, 12).toString("ascii") === "WEBP"
    )
  }
  if (
    mimeType === "application/zip" ||
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return buffer[0] === 0x50 && buffer[1] === 0x4B
  }
  if (mimeType === "application/msword") {
    return (
      buffer[0] === 0xD0 &&
      buffer[1] === 0xCF &&
      buffer[2] === 0x11 &&
      buffer[3] === 0xE0
    )
  }
  if (mimeType === "video/mp4") {
    if (buffer.length >= 8) {
      return buffer.subarray(4, 8).toString("ascii") === "ftyp"
    }
  }
  return true
}

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

export async function POST(req: NextRequest) {
  const clientIp = getClientIp(req.headers)
  if (isUploadRateLimited(clientIp)) {
    return NextResponse.json(
      { error: "Muitos uploads recentes. Aguarde alguns instantes e tente novamente." },
      { status: 429 }
    )
  }

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 })
  }

  const file = formData.get("file")
  const formId = formData.get("formId")

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Nenhum arquivo enviado." }, { status: 400 })
  }

  if (typeof formId !== "string" || !formId) {
    return NextResponse.json({ error: "formId inválido." }, { status: 400 })
  }

  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: "Arquivo excede o limite de 10MB." }, { status: 400 })
  }

  // Remove os charsets para validação (ex: image/svg+xml;charset=utf-8)
  const rawType = file.type.split(";")[0].trim().toLowerCase()
  const isAllowedType = rawType in MIME_TO_EXT

  if (!isAllowedType) {
    return NextResponse.json({ error: "Tipo de arquivo não permitido." }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())

  // Verify magic bytes (file signature) matches declared mime type
  if (!isValidFileSignature(buffer, rawType)) {
    return NextResponse.json(
      { error: "O conteúdo do arquivo não corresponde ao formato declarado." },
      { status: 400 }
    )
  }

  // Ensure the form exists and is published
  const form = await db.query.forms.findFirst({
    where: eq(forms.id, formId),
    columns: { id: true, status: true },
  })

  if (!form) {
    return NextResponse.json({ error: "Formulário não encontrado." }, { status: 404 })
  }

  if (form.status !== "published") {
    return NextResponse.json({ error: "Formulário não disponível." }, { status: 403 })
  }

  const ext = MIME_TO_EXT[rawType] ?? "bin"
  const randomHex = randomBytes(16).toString("hex")
  const path = `${formId}/${Date.now()}-${randomHex}.${ext}`

  const admin = serviceClient()

  const { error } = await admin.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType: rawType, upsert: false })

  if (error) {
    const msg = error.message ?? ""
    const isStorageNotConfigured =
      /bucket not found/i.test(msg) || /row-level security/i.test(msg)
    console.error("[upload/response-file] Falha Supabase Storage:", msg, { bucket: BUCKET, formId })
    return NextResponse.json(
      {
        error: isStorageNotConfigured
          ? "Upload de arquivos indisponível no momento. Contate o suporte."
          : "Falha ao salvar arquivo.",
      },
      { status: 500 }
    )
  }

  const { data: { publicUrl } } = admin.storage.from(BUCKET).getPublicUrl(path)

  return NextResponse.json({ url: publicUrl, fileName: file.name })
}
