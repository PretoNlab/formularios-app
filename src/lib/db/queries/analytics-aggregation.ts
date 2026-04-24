import type { QuestionAnalytics } from "../../types/form"

/**
 * Matrix answers are stored as `Record<rowLabel, columnLabel>`.
 * Given all raw answers for a matrix question and the declared rows/columns,
 * returns per-row column frequencies (count + percentage within the row).
 */
export function aggregateMatrix(
  rawAnswers: unknown[],
  declaredRows: readonly string[],
  declaredColumns: readonly string[],
): NonNullable<QuestionAnalytics["matrixData"]> {
  const byRow = new Map<string, Map<string, number>>()

  for (const v of rawAnswers) {
    if (!v || typeof v !== "object" || Array.isArray(v)) continue
    const rec = v as Record<string, unknown>
    for (const [row, column] of Object.entries(rec)) {
      if (typeof column !== "string" || !column) continue
      const rowMap = byRow.get(row) ?? new Map<string, number>()
      rowMap.set(column, (rowMap.get(column) ?? 0) + 1)
      byRow.set(row, rowMap)
    }
  }

  const orderedRows = [
    ...declaredRows,
    ...Array.from(byRow.keys()).filter((r) => !declaredRows.includes(r)),
  ]

  return orderedRows
    .map((row) => {
      const rowMap = byRow.get(row) ?? new Map<string, number>()
      const rowTotal = Array.from(rowMap.values()).reduce((a, b) => a + b, 0)
      const orderedCols = [
        ...declaredColumns,
        ...Array.from(rowMap.keys()).filter((c) => !declaredColumns.includes(c)),
      ]
      return {
        row,
        columns: orderedCols.map((column) => {
          const count = rowMap.get(column) ?? 0
          return {
            column,
            count,
            percentage: rowTotal > 0 ? count / rowTotal : 0,
          }
        }),
      }
    })
    .filter((r) => r.columns.some((c) => c.count > 0) || declaredRows.includes(r.row))
}

/**
 * Ranking answers are stored as ordered `string[]` (position 0 = first choice).
 * Returns each item with its average position (1-indexed), sorted ascending.
 * Lower avgPosition = more preferred.
 */
export function aggregateRanking(
  rawAnswers: unknown[],
): NonNullable<QuestionAnalytics["rankingData"]> {
  const positionSum = new Map<string, number>()
  const positionCount = new Map<string, number>()

  for (const v of rawAnswers) {
    if (!Array.isArray(v)) continue
    v.forEach((item, index) => {
      const label = String(item ?? "")
      if (!label) return
      positionSum.set(label, (positionSum.get(label) ?? 0) + (index + 1))
      positionCount.set(label, (positionCount.get(label) ?? 0) + 1)
    })
  }

  return Array.from(positionSum.keys())
    .map((item) => {
      const count = positionCount.get(item) ?? 0
      const avgPosition = count > 0 ? (positionSum.get(item) ?? 0) / count : 0
      return { item, avgPosition: Math.round(avgPosition * 10) / 10, count }
    })
    .sort((a, b) => a.avgPosition - b.avgPosition)
}
