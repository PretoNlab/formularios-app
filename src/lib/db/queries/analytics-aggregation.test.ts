import { aggregateMatrix, aggregateRanking } from "./analytics-aggregation"

describe("aggregateMatrix", () => {
  it("returns empty matrix for zero answers when rows are declared", () => {
    const result = aggregateMatrix([], ["R1", "R2"], ["C1", "C2"])
    expect(result).toHaveLength(2)
    expect(result[0].row).toBe("R1")
    expect(result[0].columns.every((c) => c.count === 0 && c.percentage === 0)).toBe(true)
  })

  it("counts column frequencies per row and computes percentages within row", () => {
    const answers = [
      { R1: "C1", R2: "C2" },
      { R1: "C1", R2: "C1" },
      { R1: "C2", R2: "C1" },
    ]
    const result = aggregateMatrix(answers, ["R1", "R2"], ["C1", "C2"])

    expect(result).toHaveLength(2)

    const r1 = result.find((r) => r.row === "R1")!
    expect(r1.columns.find((c) => c.column === "C1")).toMatchObject({ count: 2, percentage: 2 / 3 })
    expect(r1.columns.find((c) => c.column === "C2")).toMatchObject({ count: 1, percentage: 1 / 3 })

    const r2 = result.find((r) => r.row === "R2")!
    expect(r2.columns.find((c) => c.column === "C1")).toMatchObject({ count: 2, percentage: 2 / 3 })
    expect(r2.columns.find((c) => c.column === "C2")).toMatchObject({ count: 1, percentage: 1 / 3 })
  })

  it("preserves declared row/column order", () => {
    const answers = [{ B: "Z", A: "X" }]
    const result = aggregateMatrix(answers, ["A", "B"], ["X", "Y", "Z"])
    expect(result.map((r) => r.row)).toEqual(["A", "B"])
    expect(result[0].columns.map((c) => c.column)).toEqual(["X", "Y", "Z"])
  })

  it("appends unexpected rows/columns at the end", () => {
    const answers = [{ R1: "C1", RX: "CZ" }]
    const result = aggregateMatrix(answers, ["R1"], ["C1"])
    const rowNames = result.map((r) => r.row)
    expect(rowNames).toContain("R1")
    expect(rowNames).toContain("RX")
    const rx = result.find((r) => r.row === "RX")!
    const cz = rx.columns.find((c) => c.column === "CZ")!
    expect(cz.count).toBe(1)
  })

  it("ignores malformed answers (not objects, arrays, null)", () => {
    const answers = [null, "string", [1, 2], { R1: "C1" }, { R1: 42 }]
    const result = aggregateMatrix(answers, ["R1"], ["C1"])
    const r1 = result.find((r) => r.row === "R1")!
    expect(r1.columns.find((c) => c.column === "C1")!.count).toBe(1)
  })
})

describe("aggregateRanking", () => {
  it("returns empty array for zero answers", () => {
    expect(aggregateRanking([])).toEqual([])
  })

  it("computes avg position across responses and sorts asc", () => {
    // Response 1: A=1, B=2, C=3
    // Response 2: B=1, A=2, C=3
    // Response 3: A=1, C=2, B=3
    // A avg = (1+2+1)/3 = 1.3
    // B avg = (2+1+3)/3 = 2.0
    // C avg = (3+3+2)/3 = 2.7
    const answers = [
      ["A", "B", "C"],
      ["B", "A", "C"],
      ["A", "C", "B"],
    ]
    const result = aggregateRanking(answers)
    expect(result.map((r) => r.item)).toEqual(["A", "B", "C"])
    expect(result[0]).toMatchObject({ item: "A", avgPosition: 1.3, count: 3 })
    expect(result[1]).toMatchObject({ item: "B", avgPosition: 2, count: 3 })
    expect(result[2]).toMatchObject({ item: "C", avgPosition: 2.7, count: 3 })
  })

  it("handles items appearing in only some responses", () => {
    const answers = [
      ["A", "B"],
      ["A"],
    ]
    const result = aggregateRanking(answers)
    const a = result.find((r) => r.item === "A")!
    const b = result.find((r) => r.item === "B")!
    expect(a).toMatchObject({ item: "A", count: 2, avgPosition: 1 })
    expect(b).toMatchObject({ item: "B", count: 1, avgPosition: 2 })
  })

  it("ignores non-array answers", () => {
    const answers = [null, "string", { x: 1 }, ["A"], 42]
    const result = aggregateRanking(answers)
    expect(result).toHaveLength(1)
    expect(result[0].item).toBe("A")
  })

  it("skips empty labels", () => {
    const answers = [["A", "", null as unknown as string, "B"]]
    const result = aggregateRanking(answers)
    expect(result.map((r) => r.item).sort()).toEqual(["A", "B"])
  })
})
