import type { QuestionAnalytics } from "@/lib/types/form"

export function TextViz({ stat }: { stat: QuestionAnalytics }) {
  return (
    <div className="space-y-2">
      {(stat.textSamples ?? []).map((text, i) => (
        <div key={i} className="rounded-lg bg-muted/40 px-3 py-2">
          <p className="text-sm text-foreground/80 line-clamp-2">{text}</p>
        </div>
      ))}
      {stat.totalAnswers > 5 && (
        <p className="text-xs text-muted-foreground text-right">
          +{stat.totalAnswers - 5} respostas adicionais
        </p>
      )}
    </div>
  )
}
