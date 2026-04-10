import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { db } from "@/lib/db/client"
import { forms } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

const BUCKET = "form-responses"
const MAX_SIZE_BYTES = 10 * 1024 * 1024 // 10MB

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

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

export async function POST(req: NextRequest) {
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
  const rawType = file.type.split(";")[0].trim();
  const isAllowedType = rawType in MIME_TO_EXT;

  if (!isAllowedType) {
    return NextResponse.json({ error: "Tipo de arquivo não permitido." }, { status: 400 })
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
  const randomHex = Math.random().toString(16).slice(2, 10)
  const path = `${formId}/${Date.now()}-${randomHex}.${ext}`

  const buffer = Buffer.from(await file.arrayBuffer())
  const admin = serviceClient()

  const { error } = await admin.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType: rawType, upsert: false })

  if (error) {
    return NextResponse.json({ error: "Falha ao salvar arquivo." }, { status: 500 })
  }

  const { data: { publicUrl } } = admin.storage.from(BUCKET).getPublicUrl(path)

  return NextResponse.json({ url: publicUrl, fileName: file.name })
}
