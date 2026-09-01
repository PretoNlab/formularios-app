import { describe, it, expect } from "vitest"
import { neutralizeSheetFormula } from "./google-sheets"

// Google Sheets interprets a cell starting with these characters as a formula
// when written with `USER_ENTERED`. Respondent answers are untrusted, so they
// must be neutralized the same way the CSV export does.
describe("neutralizeSheetFormula", () => {
  it("prefixes formula-leading characters with an apostrophe", () => {
    expect(neutralizeSheetFormula("=HYPERLINK(\"https://evil.com\",\"x\")")).toBe("'=HYPERLINK(\"https://evil.com\",\"x\")")
    expect(neutralizeSheetFormula("+1+1")).toBe("'+1+1")
    expect(neutralizeSheetFormula("-1")).toBe("'-1")
    expect(neutralizeSheetFormula("@SUM(A1)")).toBe("'@SUM(A1)")
    expect(neutralizeSheetFormula("\t=1")).toBe("'\t=1")
    expect(neutralizeSheetFormula("\r=1")).toBe("'\r=1")
  })

  it("leaves ordinary values untouched", () => {
    expect(neutralizeSheetFormula("hello")).toBe("hello")
    expect(neutralizeSheetFormula("")).toBe("")
    expect(neutralizeSheetFormula("a = b")).toBe("a = b")
    expect(neutralizeSheetFormula("https://x.com/y.pdf")).toBe("https://x.com/y.pdf")
  })
})
