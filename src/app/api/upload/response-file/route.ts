import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { db } from "@/lib/db/client"
import { forms } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

const BUCKET = "form-responses"
const MAX_SIZE_BYTES = 10 * 1024 * 1024 // 10MB

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

  const isAllowedType =
    file.type.startsWith("image/") ||
    file.type.startsWith("video/") ||
    file.type.startsWith("audio/") ||
    file.type === "application/pdf" ||
    file.type === "application/msword" ||
    file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    file.type === "application/zip";

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

  const extParts = file.name.split('.')
  const ext = extParts.length > 1 ? extParts.pop() : "bin"
  const randomHex = Math.random().toString(16).slice(2, 10)
  const path = `${formId}/${Date.now()}-${randomHex}.${ext}`

  const buffer = Buffer.from(await file.arrayBuffer())
  const admin = serviceClient()

  const { error } = await admin.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType: file.type, upsert: false })

  if (error) {
    return NextResponse.json({ error: "Falha ao salvar arquivo." }, { status: 500 })
  }

  const { data: { publicUrl } } = admin.storage.from(BUCKET).getPublicUrl(path)

  return NextResponse.json({ url: publicUrl, fileName: file.name })
}
