/**
 * migrate-option-labels.ts
 *
 * Corrige respostas históricas que salvaram opt.id (UUID) em vez de opt.label
 * nos campos: multiple_choice, dropdown, checkbox.
 *
 * Uso:
 *   npx tsx src/scripts/migrate-option-labels.ts          # aplica as mudanças
 *   npx tsx src/scripts/migrate-option-labels.ts --dry    # só mostra o que mudaria
 */

import "dotenv/config"
import { eq, inArray, sql } from "drizzle-orm"
import { db } from "../lib/db/client"
import { questions, answers } from "../lib/db/schema"
import type { QuestionOption } from "../lib/db/schema"

const DRY = process.argv.includes("--dry")

const CHOICE_TYPES = ["multiple_choice", "dropdown", "checkbox"]

async function main() {
  console.log(`\n🔍 Modo: ${DRY ? "DRY RUN (sem alterações)" : "APLICANDO MUDANÇAS"}\n`)

  // 1. Busca todas as perguntas de seleção com suas opções
  const choiceQuestions = await db
    .select({ id: questions.id, type: questions.type, properties: questions.properties })
    .from(questions)
    .where(inArray(questions.type, CHOICE_TYPES))

  if (choiceQuestions.length === 0) {
    console.log("Nenhuma pergunta de seleção encontrada.")
    return
  }

  console.log(`Perguntas de seleção encontradas: ${choiceQuestions.length}`)

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
    console.log("Nenhuma pergunta com opções configuradas.")
    return
  }

  // 3. Busca todas as respostas dessas perguntas
  const allAnswers = await db
    .select({ id: answers.id, questionId: answers.questionId, value: answers.value })
    .from(answers)
    .where(inArray(answers.questionId, questionIds))

  console.log(`Respostas candidatas: ${allAnswers.length}\n`)

  let updated = 0
  let skipped = 0

  for (const answer of allAnswers) {
    const optMap = optMaps.get(answer.questionId)
    if (!optMap) { skipped++; continue }

    const q = choiceQuestions.find((x) => x.id === answer.questionId)!
    const isCheckbox = q.type === "checkbox"

    if (isCheckbox) {
      // value é string[]
      if (!Array.isArray(answer.value)) { skipped++; continue }
      const original = answer.value as string[]
      const migrated = original.map((v) => optMap.get(v) ?? v)
      const changed = migrated.some((v, i) => v !== original[i])
      if (!changed) { skipped++; continue }

      console.log(`  [checkbox] answer ${answer.id}`)
      console.log(`    antes:  ${JSON.stringify(original)}`)
      console.log(`    depois: ${JSON.stringify(migrated)}`)

      if (!DRY) {
        await db
          .update(answers)
          .set({ value: sql`${JSON.stringify(migrated)}::jsonb` })
          .where(eq(answers.id, answer.id))
      }
      updated++
    } else {
      // value é string
      if (typeof answer.value !== "string") { skipped++; continue }
      const label = optMap.get(answer.value)
      if (!label) { skipped++; continue } // já é label ou valor desconhecido

      console.log(`  [${q.type}] answer ${answer.id}`)
      console.log(`    antes:  "${answer.value}"`)
      console.log(`    depois: "${label}"`)

      if (!DRY) {
        await db
          .update(answers)
          .set({ value: sql`${JSON.stringify(label)}::jsonb` })
          .where(eq(answers.id, answer.id))
      }
      updated++
    }
  }

  console.log(`\n✅ Resultado:`)
  console.log(`   ${updated} respostas ${DRY ? "seriam atualizadas" : "atualizadas"}`)
  console.log(`   ${skipped} respostas já estavam corretas ou sem correspondência`)

  if (DRY && updated > 0) {
    console.log(`\n💡 Para aplicar, rode sem --dry:`)
    console.log(`   npx tsx src/scripts/migrate-option-labels.ts\n`)
  }
}

main().catch((err) => {
  console.error("Erro na migração:", err)
  process.exit(1)
})
