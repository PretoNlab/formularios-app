import type { QuestionAnalytics } from "@/lib/types/form"
import { pct } from "../utils"

export function MatrixViz({ stat }: { stat: QuestionAnalytics }) {
  const matrix = stat.matrixData ?? []

  if (matrix.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">Sem respostas ainda.</p>
    )
  }

  const columns = matrix[0]?.columns.map((c) => c.column) ?? []

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-separate border-spacing-0.5">
        <thead>
          <tr>
            <th className="text-left px-2 py-1.5 font-medium text-muted-foreground min-w-[120px]" />
            {columns.map((col) => (
              <th
                key={col}
                className="px-2 py-1.5 font-medium text-muted-foreground text-center"
                title={col}
              >
                <span className="block truncate max-w-[100px]">{col}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matrix.map((row) => {
            const maxPct = Math.max(...row.columns.map((c) => c.percentage), 0.01)
            return (
              <tr key={row.row}>
                <td
                  className="px-2 py-1.5 text-foreground font-medium truncate max-w-[160px]"
                  title={row.row}
                >
                  {row.row}
                </td>
                {row.columns.map((cell) => {
                  const intensity = maxPct > 0 ? cell.percentage / maxPct : 0
                  const isTop = cell.percentage > 0 && cell.percentage === maxPct
                  return (
                    <td
                      key={cell.column}
                      className="text-center tabular-nums rounded"
                      style={{
                        backgroundColor: cell.count === 0
                          ? "hsl(var(--muted) / 0.3)"
                          : `hsl(var(--primary) / ${Math.max(intensity * 0.85 + 0.08, 0.1)})`,
                        padding: "6px 8px",
                      }}
                      title={`${cell.count} resposta${cell.count !== 1 ? "s" : ""} (${pct(cell.percentage)})`}
                    >
                      <span className={`text-xs ${isTop ? "font-semibold text-foreground" : "text-foreground/70"}`}>
                        {cell.count > 0 ? pct(cell.percentage) : "—"}
                      </span>
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
