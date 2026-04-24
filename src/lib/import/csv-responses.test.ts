import { parseCsvPreview, parseCsvRows, type QuestionInfo, type ColumnMapping } from "./csv-responses"

const nomeQ: QuestionInfo = { id: "q-nome", title: "Nome", type: "short_text" }
const emailQ: QuestionInfo = { id: "q-email", title: "E-mail", type: "email" }
const idadeQ: QuestionInfo = { id: "q-idade", title: "Idade", type: "number" }
const gostaQ: QuestionInfo = { id: "q-gosta", title: "Você gosta?", type: "yes_no" }
const hobbiesQ: QuestionInfo = { id: "q-hobbies", title: "Hobbies", type: "checkbox" }
const notaQ: QuestionInfo = { id: "q-nota", title: "Nota", type: "nps" }
const dataQ: QuestionInfo = { id: "q-data", title: "Data", type: "date" }

describe("parseCsvPreview", () => {
  it("rejects CSV with only a header row", () => {
    expect(() => parseCsvPreview("Nome,E-mail", [nomeQ, emailQ])).toThrowError(
      /pelo menos um cabeçalho e uma linha de dados/
    )
  })

  it("rejects completely empty content", () => {
    expect(() => parseCsvPreview("", [])).toThrowError()
  })

  it("detects comma delimiter and maps headers by exact match", () => {
    const csv = "Nome,E-mail\nAna,ana@test.com\nBruno,bruno@test.com"
    const result = parseCsvPreview(csv, [nomeQ, emailQ])

    expect(result.totalRows).toBe(2)
    expect(result.mappings).toHaveLength(2)
    expect(result.mappings[0]).toMatchObject({ csvHeader: "Nome", questionId: "q-nome" })
    expect(result.mappings[1]).toMatchObject({ csvHeader: "E-mail", questionId: "q-email" })
    expect(result.previewRows).toHaveLength(2)
  })

  it("detects semicolon delimiter (Brazilian CSV)", () => {
    const csv = "Nome;E-mail\nAna;ana@test.com"
    const result = parseCsvPreview(csv, [nomeQ, emailQ])
    expect(result.mappings[0].questionId).toBe("q-nome")
    expect(result.mappings[1].questionId).toBe("q-email")
  })

  it("detects tab delimiter (TSV)", () => {
    const csv = "Nome\tE-mail\nAna\tana@test.com"
    const result = parseCsvPreview(csv, [nomeQ, emailQ])
    expect(result.mappings[0].questionId).toBe("q-nome")
    expect(result.mappings[1].questionId).toBe("q-email")
  })

  it("strips UTF-8 BOM from first column header", () => {
    const csv = "\uFEFFNome,E-mail\nAna,ana@test.com"
    const result = parseCsvPreview(csv, [nomeQ, emailQ])
    expect(result.mappings[0].csvHeader).toBe("Nome")
    expect(result.mappings[0].questionId).toBe("q-nome")
  })

  it("detects timestamp column (Google Forms pt-BR)", () => {
    const csv = "Carimbo de data/hora,Nome\n01/01/2026 10:00:00,Ana"
    const result = parseCsvPreview(csv, [nomeQ])
    expect(result.detectedTimestampCol).toBe(0)
    expect(result.mappings[0].questionId).toBeNull()
  })

  it("ignores email address metadata column without erroring", () => {
    const csv = "Endereço de e-mail,Nome\nana@test.com,Ana"
    const result = parseCsvPreview(csv, [nomeQ])
    expect(result.mappings[0].questionId).toBeNull()
    expect(result.warnings.some((w) => /ignorada/.test(w))).toBe(true)
  })

  it("matches headers ignoring case, accents and punctuation", () => {
    const csv = "voce gosta,IDADE\nSim,30"
    const result = parseCsvPreview(csv, [gostaQ, idadeQ])
    expect(result.mappings[0].questionId).toBe("q-gosta")
    expect(result.mappings[1].questionId).toBe("q-idade")
  })

  it("handles quoted fields with embedded delimiter and escaped quotes", () => {
    const csv = 'Nome,E-mail\n"Silva, Ana","ana""test""@x.com"'
    const result = parseCsvPreview(csv, [nomeQ, emailQ])
    expect(result.previewRows[0][0]).toBe("Silva, Ana")
    expect(result.previewRows[0][1]).toBe('ana"test"@x.com')
  })

  it("does not remap the same question to two CSV columns", () => {
    const csv = "Nome,Nome completo\nAna,Ana Silva"
    const result = parseCsvPreview(csv, [nomeQ])
    const mapped = result.mappings.filter((m) => m.questionId === "q-nome")
    expect(mapped).toHaveLength(1)
  })

  it("emits warning when no column could be mapped", () => {
    const csv = "Foo,Bar\n1,2"
    const result = parseCsvPreview(csv, [nomeQ])
    expect(result.warnings[0]).toMatch(/Nenhuma coluna foi mapeada/)
  })

  it("enforces the 10k row limit", () => {
    const header = "Nome\n"
    const body = "Ana\n".repeat(10_001)
    expect(() => parseCsvPreview(header + body, [nomeQ])).toThrowError(/máximo/)
  })
})

describe("parseCsvRows", () => {
  function mappingsFor(csv: string, questions: QuestionInfo[]): { mappings: ColumnMapping[]; timestampCol: number | null } {
    const preview = parseCsvPreview(csv, questions)
    return { mappings: preview.mappings, timestampCol: preview.detectedTimestampCol }
  }

  it("parses short_text values directly", () => {
    const csv = "Nome\nAna\nBruno"
    const { mappings } = mappingsFor(csv, [nomeQ])
    const { rows, errors } = parseCsvRows(csv, mappings, null)
    expect(errors).toEqual([])
    expect(rows).toHaveLength(2)
    expect(rows[0].answers[0]).toEqual({ questionId: "q-nome", value: "Ana" })
  })

  it("parses Brazilian number format (1.234,56 → 1234.56)", () => {
    // Value must be quoted to protect the decimal comma from the CSV delimiter
    const csv = 'Idade\n"1.234,56"'
    const { mappings } = mappingsFor(csv, [idadeQ])
    const { rows } = parseCsvRows(csv, mappings, null)
    expect(rows[0].answers[0].value).toBe(1234.56)
  })

  it("parses yes_no with multiple synonyms", () => {
    const csv = "Você gosta?\nSim\nNão\ntrue\nfalso\n1\n0"
    const { mappings } = mappingsFor(csv, [gostaQ])
    const { rows } = parseCsvRows(csv, mappings, null)
    const values = rows.map((r) => r.answers[0].value)
    expect(values).toEqual([true, false, true, false, true, false])
  })

  it("splits checkbox values on semicolon", () => {
    const csv = "Hobbies\nLer; Cozinhar; Correr"
    const { mappings } = mappingsFor(csv, [hobbiesQ])
    const { rows } = parseCsvRows(csv, mappings, null)
    expect(rows[0].answers[0].value).toEqual(["Ler", "Cozinhar", "Correr"])
  })

  it("wraps single checkbox value in array when no semicolon", () => {
    const csv = "Hobbies\nLer"
    const { mappings } = mappingsFor(csv, [hobbiesQ])
    const { rows } = parseCsvRows(csv, mappings, null)
    expect(rows[0].answers[0].value).toEqual(["Ler"])
  })

  it("parses nps as integer", () => {
    const csv = "Nota\n9\n3"
    const { mappings } = mappingsFor(csv, [notaQ])
    const { rows } = parseCsvRows(csv, mappings, null)
    expect(rows[0].answers[0].value).toBe(9)
    expect(rows[1].answers[0].value).toBe(3)
  })

  it("parses Brazilian date (DD/MM/YYYY) into ISO date string", () => {
    const csv = "Data\n15/03/2026"
    const { mappings } = mappingsFor(csv, [dataQ])
    const { rows } = parseCsvRows(csv, mappings, null)
    expect(rows[0].answers[0].value).toBe("2026-03-15")
  })

  it("skips empty cells without adding answer entries", () => {
    const csv = "Nome,Idade\nAna,\nBruno,30"
    const { mappings } = mappingsFor(csv, [nomeQ, idadeQ])
    const { rows } = parseCsvRows(csv, mappings, null)
    expect(rows[0].answers).toHaveLength(1)
    expect(rows[0].answers[0].questionId).toBe("q-nome")
    expect(rows[1].answers).toHaveLength(2)
  })

  it("skips rows that end up with zero answers", () => {
    const csv = "Nome\n\n\nAna"
    const { mappings } = mappingsFor(csv, [nomeQ])
    const { rows } = parseCsvRows(csv, mappings, null)
    expect(rows).toHaveLength(1)
    expect(rows[0].answers[0].value).toBe("Ana")
  })

  it("extracts timestamp when column index is provided", () => {
    const csv = "Carimbo de data/hora,Nome\n15/03/2026 10:30:00,Ana"
    const { mappings, timestampCol } = mappingsFor(csv, [nomeQ])
    expect(timestampCol).toBe(0)
    const { rows } = parseCsvRows(csv, mappings, timestampCol)
    expect(rows[0].timestamp).toBeInstanceOf(Date)
    expect(rows[0].timestamp?.getFullYear()).toBe(2026)
    expect(rows[0].timestamp?.getMonth()).toBe(2) // March = index 2
    expect(rows[0].timestamp?.getDate()).toBe(15)
  })

  it("only includes mapped columns in output answers", () => {
    const csv = "Nome,Foo,Idade\nAna,lixo,30"
    const { mappings } = mappingsFor(csv, [nomeQ, idadeQ])
    const { rows } = parseCsvRows(csv, mappings, null)
    const qIds = rows[0].answers.map((a) => a.questionId).sort()
    expect(qIds).toEqual(["q-idade", "q-nome"])
  })
})
