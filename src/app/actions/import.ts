"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { ensureUserExists } from "@/lib/db/queries/users"
import { createForm } from "@/lib/db/queries/forms"
import { upsertQuestions, type UpsertQuestionInput } from "@/lib/db/queries/questions"
import { parseGoogleFormsUrl } from "@/lib/import/google-forms"
import { parseJsonImport } from "@/lib/import/json-import"
import type { ApiResponse } from "@/lib/types/form"
import type { ImportWarning, ImportResult } from "@/lib/import/types"

// ─── Auth ───────────────────────────────────────────────────────────────────

async function requireUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: userWithWorkspace, success } = await ensureUserExists({
    id: user.id,
    email: user.email!,
    user_metadata: user.user_metadata,
  })

  if (!success || !userWithWorkspace) {
    throw new Error("Falha ao obter dados do usuário.")
  }

  return userWithWorkspace
}

// ─── Shared ─────────────────────────────────────────────────────────────────

export interface ImportFormResponse {
  formId: string
  warnings: ImportWarning[]
}

async function createFormFromImport(
  result: ImportResult,
  userId: string,
  workspaceId: string,
): Promise<ImportFormResponse> {
  const formResult = await createForm({
    workspaceId,
    createdById: userId,
    title: result.title || "Formulário importado",
    description: result.description,
  })

  if (!formResult.success || !formResult.data) {
    throw new Error("Falha ao criar formulário.")
  }

  const questions: UpsertQuestionInput[] = result.questions.map((q) => ({
    formId: formResult.data!.id,
    type: q.type,
    title: q.title,
    description: q.description,
    required: q.required,
    order: q.order,
    properties: q.properties ?? {},
    logicRules: [],
  }))

  if (questions.length > 0) {
    await upsertQuestions(formResult.data.id, questions)
  }

  revalidatePath("/dashboard")

  return {
    formId: formResult.data.id,
    warnings: result.warnings,
  }
}

// ─── Actions ────────────────────────────────────────────────────────────────

export async function importFromGoogleFormsAction(
  url: string,
): Promise<ApiResponse<ImportFormResponse>> {
  try {
    const user = await requireUser()
    const result = await parseGoogleFormsUrl(url)

    const data = await createFormFromImport(
      result,
      user.id,
      user.defaultWorkspace.id,
    )

    return { success: true, data }
  } catch (error) {
    return {
      success: false,
      error: {
        code: "IMPORT_ERROR",
        message: error instanceof Error ? error.message : "Erro ao importar formulário.",
      },
    }
  }
}

export async function importFromJsonAction(
  jsonString: string,
): Promise<ApiResponse<ImportFormResponse>> {
  try {
    const user = await requireUser()
    const result = parseJsonImport(jsonString)

    const data = await createFormFromImport(
      result,
      user.id,
      user.defaultWorkspace.id,
    )

    return { success: true, data }
  } catch (error) {
    return {
      success: false,
      error: {
        code: "IMPORT_ERROR",
        message: error instanceof Error ? error.message : "Erro ao importar formulário.",
      },
    }
  }
}
