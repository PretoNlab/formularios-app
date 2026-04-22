import { parseJsonImport } from "./json-import"

describe("parseJsonImport — top-level shape", () => {
  it("throws on invalid JSON", () => {
    expect(() => parseJsonImport("{not json")).toThrowError(/JSON inválido/)
  })

  it("throws when top-level is not an object", () => {
    expect(() => parseJsonImport("[]")).toThrowError(/objeto no topo/)
    expect(() => parseJsonImport('"string"')).toThrowError(/objeto no topo/)
  })

  it("throws when title is missing", () => {
    expect(() => parseJsonImport(JSON.stringify({ questions: [{ type: "short_text", title: "a" }] })))
      .toThrowError(/Título do formulário ausente/)
  })

  it("accepts 'name' as fallback for form title without warnings", () => {
    const json = JSON.stringify({ name: "Meu form", questions: [{ type: "short_text", title: "Nome" }] })
    const result = parseJsonImport(json)
    expect(result.title).toBe("Meu form")
  })

  it("accepts 'fields' and 'items' as aliases for questions", () => {
    const json = JSON.stringify({ title: "X", fields: [{ type: "short_text", title: "A" }] })
    expect(parseJsonImport(json).questions).toHaveLength(1)

    const json2 = JSON.stringify({ title: "X", items: [{ type: "short_text", title: "A" }] })
    expect(parseJsonImport(json2).questions).toHaveLength(1)
  })

  it("throws on empty questions array", () => {
    expect(() => parseJsonImport(JSON.stringify({ title: "X", questions: [] })))
      .toThrowError(/pelo menos 1 pergunta/)
  })

  it("throws above max questions", () => {
    const questions = Array.from({ length: 201 }, (_, i) => ({ type: "short_text", title: `P${i}` }))
    expect(() => parseJsonImport(JSON.stringify({ title: "X", questions }))).toThrowError(/Máximo de 200/)
  })
})

describe("parseJsonImport — canonical happy path", () => {
  it("parses a canonical multi-type form with zero warnings", () => {
    const input = {
      title: "Canônico",
      description: "desc",
      questions: [
        { type: "short_text", title: "Nome", required: true, properties: {} },
        {
          type: "multiple_choice",
          title: "Cor favorita",
          required: false,
          properties: {
            options: [{ id: "a", label: "Azul" }, { id: "b", label: "Vermelho" }],
            allowOther: false,
            randomizeOptions: false,
          },
        },
        {
          type: "scale",
          title: "Concorda?",
          properties: { scaleMin: 1, scaleMax: 5, scaleMinLabel: "Não", scaleMaxLabel: "Sim" },
        },
        {
          type: "matrix",
          title: "Aspectos",
          properties: { matrixRows: ["R1", "R2"], matrixColumns: ["C1", "C2"] },
        },
      ],
    }
    const result = parseJsonImport(JSON.stringify(input))
    expect(result.title).toBe("Canônico")
    expect(result.description).toBe("desc")
    expect(result.questions).toHaveLength(4)
    expect(result.warnings).toEqual([])
    expect(result.questions[1].properties.options).toEqual([
      { id: "a", label: "Azul" },
      { id: "b", label: "Vermelho" },
    ])
  })
})

describe("parseJsonImport — options normalization", () => {
  it("converts options as string array to {id, label} objects", () => {
    const input = {
      title: "X",
      questions: [
        { type: "multiple_choice", title: "Q", properties: { options: ["Azul", "Vermelho"] } },
      ],
    }
    const result = parseJsonImport(JSON.stringify(input))
    expect(result.questions[0].properties.options).toEqual([
      { id: "opt_1", label: "Azul" },
      { id: "opt_2", label: "Vermelho" },
    ])
    expect(result.warnings.some((w) => w.message.includes("strings convertidas"))).toBe(true)
  })

  it("injects id when missing", () => {
    const input = {
      title: "X",
      questions: [
        { type: "dropdown", title: "Q", properties: { options: [{ label: "A" }, { label: "B" }] } },
      ],
    }
    const result = parseJsonImport(JSON.stringify(input))
    expect(result.questions[0].properties.options).toEqual([
      { id: "opt_1", label: "A" },
      { id: "opt_2", label: "B" },
    ])
    expect(result.warnings.some((w) => w.message.includes("id gerado"))).toBe(true)
  })

  it("infers label from 'value'/'text'/'name' fields", () => {
    const input = {
      title: "X",
      questions: [
        {
          type: "checkbox",
          title: "Q",
          properties: {
            options: [
              { id: "a", value: "Val A" },
              { id: "b", text: "Text B" },
              { id: "c", name: "Name C" },
            ],
          },
        },
      ],
    }
    const result = parseJsonImport(JSON.stringify(input))
    expect(result.questions[0].properties.options).toEqual([
      { id: "a", label: "Val A" },
      { id: "b", label: "Text B" },
      { id: "c", label: "Name C" },
    ])
    expect(result.warnings.some((w) => w.message.includes("label inferido"))).toBe(true)
  })

  it("moves top-level 'options' into properties.options", () => {
    const input = {
      title: "X",
      questions: [
        { type: "multiple_choice", title: "Q", options: ["A", "B"] },
      ],
    }
    const result = parseJsonImport(JSON.stringify(input))
    expect(result.questions[0].properties.options).toHaveLength(2)
    expect(result.warnings.some((w) => w.message.includes("movido"))).toBe(true)
  })

  it("maps 'choices' to 'options'", () => {
    const input = {
      title: "X",
      questions: [
        { type: "multiple_choice", title: "Q", choices: ["A", "B"] },
      ],
    }
    const result = parseJsonImport(JSON.stringify(input))
    expect(result.questions[0].properties.options).toHaveLength(2)
  })
})

describe("parseJsonImport — type aliases and coercions", () => {
  it("maps type aliases (radio, select, textarea, boolean)", () => {
    const input = {
      title: "X",
      questions: [
        { type: "radio", title: "Q1", properties: { options: ["A"] } },
        { type: "select", title: "Q2", properties: { options: ["A"] } },
        { type: "textarea", title: "Q3" },
        { type: "boolean", title: "Q4" },
      ],
    }
    const result = parseJsonImport(JSON.stringify(input))
    expect(result.questions.map((q) => q.type)).toEqual([
      "multiple_choice", "dropdown", "long_text", "yes_no",
    ])
    expect(result.warnings.filter((w) => w.message.includes("mapeado")).length).toBe(4)
  })

  it("coerces 'required' string values to boolean", () => {
    const input = {
      title: "X",
      questions: [
        { type: "short_text", title: "Q1", required: "sim" },
        { type: "short_text", title: "Q2", required: "true" },
        { type: "short_text", title: "Q3", required: "não" },
        { type: "short_text", title: "Q4", required: 1 },
        { type: "short_text", title: "Q5", required: 0 },
      ],
    }
    const result = parseJsonImport(JSON.stringify(input))
    expect(result.questions.map((q) => q.required)).toEqual([true, true, false, true, false])
  })

  it("is case-insensitive and normalizes dashes/spaces in type", () => {
    const input = {
      title: "X",
      questions: [
        { type: "Short_Text", title: "Q1" },
        { type: "YES-NO", title: "Q2" },
      ],
    }
    const result = parseJsonImport(JSON.stringify(input))
    expect(result.questions.map((q) => q.type)).toEqual(["short_text", "yes_no"])
  })

  it("throws on unknown type with helpful message", () => {
    const input = { title: "X", questions: [{ type: "mystery", title: "Q" }] }
    expect(() => parseJsonImport(JSON.stringify(input))).toThrowError(/tipo "mystery" desconhecido/)
  })
})

describe("parseJsonImport — per-type validation", () => {
  it("rejects choice types without options", () => {
    const input = { title: "X", questions: [{ type: "multiple_choice", title: "Q" }] }
    expect(() => parseJsonImport(JSON.stringify(input))).toThrowError(/pelo menos 1 opção/)
  })

  it("rejects matrix without rows or columns", () => {
    const noRows = { title: "X", questions: [{ type: "matrix", title: "Q", properties: { matrixColumns: ["C"] } }] }
    expect(() => parseJsonImport(JSON.stringify(noRows))).toThrowError(/matrixRows/)

    const noCols = { title: "X", questions: [{ type: "matrix", title: "Q", properties: { matrixRows: ["R"] } }] }
    expect(() => parseJsonImport(JSON.stringify(noCols))).toThrowError(/matrixColumns/)
  })

  it("applies scale defaults when omitted", () => {
    const input = { title: "X", questions: [{ type: "scale", title: "Q" }] }
    const result = parseJsonImport(JSON.stringify(input))
    expect(result.questions[0].properties).toMatchObject({ scaleMin: 1, scaleMax: 5 })
  })

  it("applies rating defaults when omitted", () => {
    const input = { title: "X", questions: [{ type: "rating", title: "Q" }] }
    const result = parseJsonImport(JSON.stringify(input))
    expect(result.questions[0].properties).toMatchObject({ ratingMax: 5, ratingStyle: "stars" })
  })

  it("rejects download type without downloadUrl", () => {
    const input = { title: "X", questions: [{ type: "download", title: "Q" }] }
    expect(() => parseJsonImport(JSON.stringify(input))).toThrowError(/downloadUrl/)
  })

  it("normalizes matrixRows/matrixColumns from object array", () => {
    const input = {
      title: "X",
      questions: [{
        type: "matrix",
        title: "Q",
        properties: {
          matrixRows: [{ label: "R1" }, { label: "R2" }],
          matrixColumns: [{ text: "C1" }, { name: "C2" }],
        },
      }],
    }
    const result = parseJsonImport(JSON.stringify(input))
    expect(result.questions[0].properties.matrixRows).toEqual(["R1", "R2"])
    expect(result.questions[0].properties.matrixColumns).toEqual(["C1", "C2"])
  })

  it("accepts 'rows'/'columns' as aliases for matrix", () => {
    const input = {
      title: "X",
      questions: [{ type: "matrix", title: "Q", rows: ["R1"], columns: ["C1"] }],
    }
    const result = parseJsonImport(JSON.stringify(input)).questions[0].properties
    expect(result.matrixRows).toEqual(["R1"])
    expect(result.matrixColumns).toEqual(["C1"])
  })
})

describe("parseJsonImport — question title fallbacks", () => {
  it("falls back to 'question' field when 'title' missing", () => {
    const input = { title: "X", questions: [{ type: "short_text", question: "Como se chama?" }] }
    const result = parseJsonImport(JSON.stringify(input))
    expect(result.questions[0].title).toBe("Como se chama?")
  })

  it("throws when both title and fallbacks are missing", () => {
    const input = { title: "X", questions: [{ type: "short_text" }] }
    expect(() => parseJsonImport(JSON.stringify(input))).toThrowError(/título ausente/)
  })
})
