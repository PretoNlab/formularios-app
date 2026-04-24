import { PenTool } from "lucide-react"
import type { QuestionAnalytics } from "@/lib/types/form"

export function SignatureViz({ stat }: { stat: QuestionAnalytics }) {
  const n = stat.totalAnswers
  return (
    <div className="flex items-center gap-4 py-2">
      <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
        <PenTool className="h-6 w-6 text-primary" />
      </div>
      <div>
        <p className="text-2xl font-bold tabular-nums">
          {n.toLocaleString("pt-BR")}
        </p>
        <p className="text-xs text-muted-foreground">
          assinatura{n !== 1 ? "s" : ""} coletada{n !== 1 ? "s" : ""}
        </p>
      </div>
    </div>
  )
}
