"use server"

import { revalidatePath } from "next/cache"
import { bulkImportResponses } from "@/lib/db/queries/responses"
import { db } from "@/lib/db/client"
import { questions } from "@/lib/db/schema"
import {
  parseCsvPreview,
  parseCsvRows,
  type ColumnMapping,
} from "@/lib/import/csv-responses"
import { requireFormOwner as requireFormOwnerBase } from "@/lib/auth"
import type { ApiResponse, QuestionType } from "@/lib/types/form"

// ─── Auth + Ownership ──────────────────────────────────────────────────────

async function requireFormOwner(formId: string) {
  const { user, form } = await requireFormOwnerBase(formId)
  return {
    user,
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

// ─── Generate Questions Action ────────────────────────────────────────────────

export async function createQuestionsFromHeadersAction(
  formId: string,
  headers: string[]
): Promise<ApiResponse<{ questionsJson: string }>> {
  try {
    const { questions: existingQs } = await requireFormOwner(formId)

    if (existingQs.length > 0) {
      throw new Error("O formulário já possui perguntas. Crie manualmente caso necessário.")
    }

    const timestampKeywords = ["timestamp", "carimbo de data/hora", "data", "hora", "criado em"]
    const validHeaders = headers.filter(h => {
      const lower = h.trim().toLowerCase()
      return lower && !timestampKeywords.includes(lower)
    })

    if (validHeaders.length === 0) {
      throw new Error("Nenhum cabeçalho válido encontrado no CSV para virar pergunta.")
    }

    const newQuestions = validHeaders.map((header, index) => ({
      formId,
      type: "short_text" as QuestionType,
      title: header.trim(),
      order: index,
      required: false,
      properties: {},
      logicRules: [],
    }))

    const inserted = await db.insert(questions).values(newQuestions).returning()

    return {
      success: true,
      data: {
        questionsJson: JSON.stringify(inserted.map(q => ({
          id: q.id,
          title: q.title,
          type: q.type as QuestionType,
        })))
      }
    }
  } catch (error) {
    return {
      success: false,
      error: {
        code: "CREATE_QUESTIONS_ERROR",
        message: error instanceof Error ? error.message : "Erro ao criar perguntas.",
      },
    }
  }
}
