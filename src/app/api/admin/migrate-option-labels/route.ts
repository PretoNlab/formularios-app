/**
 * POST /api/admin/migrate-option-labels?secret=XXX&dry=1
 *
 * Corrige respostas históricas que salvaram opt.id (UUID) em vez de opt.label
 * nos campos: multiple_choice, dropdown, checkbox.
 *
 * Parâmetros:
 *   secret  — deve bater com MIGRATION_SECRET no .env (obrigatório)
 *   dry=1   — só mostra o que mudaria, sem alterar o banco
 *
 * Deletar esta rota após executar a migração.
 */

import { NextRequest, NextResponse } from "next/server"
import { inArray, eq, sql } from "drizzle-orm"
import { db } from "@/lib/db/client"
import { questions, answers } from "@/lib/db/schema"
import type { QuestionOption } from "@/lib/db/schema"

const CHOICE_TYPES = ["multiple_choice", "dropdown", "checkbox"]

export async function GET(req: NextRequest) {
  // Auth
  const secret = req.nextUrl.searchParams.get("secret")
  const expectedSecret = process.env.MIGRATION_SECRET
  if (!expectedSecret || secret !== expectedSecret) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 })
  }

  const dry = req.nextUrl.searchParams.get("dry") === "1"

  // 1. Perguntas de seleção com suas opções
  const choiceQuestions = await db
    .select({ id: questions.id, type: questions.type, properties: questions.properties })
    .from(questions)
    .where(inArray(questions.type, CHOICE_TYPES))

  // 2. Monta mapa questionId -> Map<optId, optLabel>
  const optMaps = new Map<string, Map<string, string>>()
  for (const q of choiceQuestions) {
    const opts: QuestionOption[] = (q.properties as { options?: QuestionOption[] })?.options ?? []
    if (opts.length === 0) continue
    const map = new Map<string, string>()
    for (const opt of opts) map.set(opt.id, opt.label)
    optMaps.set(q.id, map)
  }

  const questionIds = [...optMaps.keys()]
  if (questionIds.length === 0) {
    return NextResponse.json({ message: "Nenhuma pergunta com opções encontrada.", updated: 0 })
  }

  // 3. Busca respostas candidatas
  const allAnswers = await db
    .select({ id: answers.id, questionId: answers.questionId, value: answers.value })
    .from(answers)
    .where(inArray(answers.questionId, questionIds))

  const changes: { id: string; type: string; before: unknown; after: unknown }[] = []

  for (const answer of allAnswers) {
    const optMap = optMaps.get(answer.questionId)
    if (!optMap) continue

    const q = choiceQuestions.find((x) => x.id === answer.questionId)!

    if (q.type === "checkbox") {
      if (!Array.isArray(answer.value)) continue
      const original = answer.value as string[]
      const migrated = original.map((v) => optMap.get(v) ?? v)
      if (migrated.every((v, i) => v === original[i])) continue

      changes.push({ id: answer.id, type: "checkbox", before: original, after: migrated })

      if (!dry) {
        await db
          .update(answers)
          .set({ value: sql`${JSON.stringify(migrated)}::jsonb` })
          .where(eq(answers.id, answer.id))
      }
    } else {
      if (typeof answer.value !== "string") continue
      const label = optMap.get(answer.value)
      if (!label) continue

      changes.push({ id: answer.id, type: q.type, before: answer.value, after: label })

      if (!dry) {
        await db
          .update(answers)
          .set({ value: sql`${JSON.stringify(label)}::jsonb` })
          .where(eq(answers.id, answer.id))
      }
    }
  }

  return NextResponse.json({
    dry,
    updated: changes.length,
    skipped: allAnswers.length - changes.length,
    changes: changes.slice(0, 50), // mostra até 50 exemplos
    message: dry
      ? `${changes.length} respostas seriam atualizadas. Chame sem dry=1 para aplicar.`
      : `${changes.length} respostas atualizadas com sucesso.`,
  })
}
