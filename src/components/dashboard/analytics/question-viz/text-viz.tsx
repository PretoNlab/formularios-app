"use client"

import { useState } from "react"
import { ListPlus } from "lucide-react"
import type { QuestionAnalytics } from "@/lib/types/form"
import { QuestionAnswersDialog } from "../question-answers-dialog"

export function TextViz({
  stat,
  formId,
}: {
  stat: QuestionAnalytics
  formId: string
}) {
  const [open, setOpen] = useState(false)
  const samples = stat.textSamples ?? []
  const hidden = Math.max(stat.totalAnswers - samples.length, 0)

  return (
    <div className="space-y-2">
      {samples.map((text, i) => (
        <div key={i} className="rounded-lg bg-muted/40 px-3 py-2">
          <p className="text-sm text-foreground/80 line-clamp-2">{text}</p>
        </div>
      ))}

      {stat.totalAnswers > 0 && (
        <div className="flex items-center justify-between pt-1">
          {hidden > 0 ? (
            <p className="text-xs text-muted-foreground">
              +{hidden.toLocaleString("pt-BR")} respostas adicionais
            </p>
          ) : (
            <span />
          )}
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
          >
            <ListPlus className="h-3.5 w-3.5" />
            Ver todas as {stat.totalAnswers.toLocaleString("pt-BR")} respostas
          </button>
        </div>
      )}

      <QuestionAnswersDialog
        open={open}
        onOpenChange={setOpen}
        formId={formId}
        questionId={stat.questionId}
        questionTitle={stat.questionTitle}
        totalAnswers={stat.totalAnswers}
      />
    </div>
  )
}
