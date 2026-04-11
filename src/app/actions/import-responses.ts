"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { ensureUserExists } from "@/lib/db/queries/users"
import { getFormById } from "@/lib/db/queries/forms"
import { bulkImportResponses } from "@/lib/db/queries/responses"
import {
  parseCsvPreview,
  parseCsvRows,
  type ColumnMapping,
  type CsvPreviewResult,
} from "@/lib/import/csv-responses"
import type { ApiResponse, QuestionType } from "@/lib/types/form"

// ─── Auth + Ownership ──────────────────────────────────────────────────────

async function requireFormOwner(formId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: dbUser, success } = await ensureUserExists({
    id: user.id,
    email: user.email!,
    user_metadata: user.user_metadata,
  })

  if (!success || !dbUser) {
    throw new Error("Falha ao obter dados do usuário.")
  }

  const { data: form } = await getFormById(formId)
  if (!form) throw new Error("Formulário não encontrado.")
  if (form.createdById !== dbUser.id) throw new Error("Você não tem permissão para importar respostas neste formulário.")

  return {
    user: dbUser,
    form,
    questions: form.questions.map((q) => ({
      id: q.id,
      title: q.title,
      type: q.type as QuestionType,
    })),
  }
}

// ─── Get Questions Action ──────────────────────────────────────────────────

export async function getFormQuestionsAction(
  formId: string,
): Promise<ApiResponse<{ id: string; title: string; type: string }[]>> {
  try {
    const { questions } = await requireFormOwner(formId)
    return {
      success: true,
      data: questions.map((q) => ({ id: q.id, title: q.title, type: q.type })),
    }
  } catch (error) {
    return {
      success: false,
      error: {
        code: "IMPORT_ERROR",
        message: error instanceof Error ? error.message : "Erro ao buscar perguntas.",
      },
    }
  }
}

// ─── Preview Action ────────────────────────────────────────────────────────

interface PreviewResponse {
  totalRows: number
  mappings: ColumnMapping[]
  previewRows: string[][]
  warnings: string[]
  detectedTimestampCol: number | null
  questionsJson: string // JSON-encoded array — avoids serialization issues
}

export async function previewCsvImportAction(
  formId: string,
  csvContent: string,
): Promise<ApiResponse<PreviewResponse>> {
  try {
    const { questions } = await requireFormOwner(formId)
    const preview = parseCsvPreview(csvContent, questions)
    return {
      success: true,
      data: {
        totalRows: preview.totalRows,
        mappings: preview.mappings,
        previewRows: preview.previewRows,
        warnings: preview.warnings,
        detectedTimestampCol: preview.detectedTimestampCol,
        questionsJson: JSON.stringify(questions),
      },
    }
  } catch (error) {
    return {
      success: false,
      error: {
        code: "IMPORT_ERROR",
        message: error instanceof Error ? error.message : "Erro ao analisar o CSV.",
      },
    }
  }
}

// ─── Import Action ─────────────────────────────────────────────────────────

export async function importCsvResponsesAction(
  formId: string,
  csvContent: string,
  mappings: ColumnMapping[],
  timestampColIndex: number | null,
): Promise<ApiResponse<{ imported: number; errors: number; warnings: string[] }>> {
  try {
    await requireFormOwner(formId)

    const { rows, errors: parseErrors } = parseCsvRows(csvContent, mappings, timestampColIndex)

    if (rows.length === 0) {
      throw new Error("Nenhuma resposta válida encontrada no CSV.")
    }

    const result = await bulkImportResponses(formId, rows)

    if (!result.success) {
      throw new Error(result.error?.message ?? "Erro ao salvar no banco de dados.")
    }

    const warnings: string[] = []
    if (parseErrors.length > 0) {
      warnings.push(`${parseErrors.length} linha(s) com erro foram ignoradas`)
    }

    revalidatePath(`/responses/${formId}`)

    return {
      success: true,
      data: {
        imported: result.data!.imported,
        errors: result.data!.errors + parseErrors.length,
        warnings,
      },
    }
  } catch (error) {
    return {
      success: false,
      error: {
        code: "IMPORT_ERROR",
        message: error instanceof Error ? error.message : "Erro ao importar respostas.",
      },
    }
  }
}
