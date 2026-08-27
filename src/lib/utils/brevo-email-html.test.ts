import { describe, it, expect } from "vitest"
import { generateBrevoEmailHtml } from "./brevo-email-html"
import type { Form } from "@/lib/types/form"

const mockForm: Form = {
  id: "form-123",
  title: "Pesquisa de Satisfação",
  description: "Diga-nos o que achou do serviço",
  slug: "pesquisa-satisfacao",
  status: "published",
  responseCount: 0,
  viewCount: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  theme: {
    id: "default",
    colors: { bg: "#ffffff", card: "#ffffff", accent: "#2563eb", text: "#111827", muted: "#6b7280" },
    font: { heading: "Inter", body: "Inter" },
    borderRadius: "0.5rem",
    logo: { url: "https://example.com/logo.png", position: "center" },
  },
  settings: {
    showProgressBar: true,
    showQuestionNumbers: true,
    allowPartialResponses: false,
    notifyOnResponse: false,
    notificationEmail: null,
    redirectUrl: null,
    closeMessage: "Obrigado!",
    responseLimit: null,
    closedAt: null,
    downloadUrl: null,
    downloadLabel: null,
    autoResponderEnabled: false,
    autoResponderEmailFieldId: null,
    autoResponderSubject: null,
    autoResponderBody: null,
  },
  questions: [
    {
      id: "q_nps",
      formId: "form-123",
      type: "nps",
      title: "De 0 a 10, qual a chance de recomendar?",
      required: true,
      order: 0,
      properties: { scaleMin: 0, scaleMax: 10, scaleMinLabel: "Zero", scaleMaxLabel: "Certa" },
      logicRules: [],
    },
    {
      id: "q_rating",
      formId: "form-123",
      type: "rating",
      title: "Como avalia o atendimento?",
      required: true,
      order: 1,
      properties: { ratingMax: 5 },
      logicRules: [],
    },
  ],
}

describe("generateBrevoEmailHtml", () => {
  it("should generate card CTA mode HTML with Brevo email tag and logo", () => {
    const html = generateBrevoEmailHtml(mockForm, {
      shareUrl: "https://formularios.ia/f/pesquisa-satisfacao",
      mode: "card",
      includeEmailTag: true,
    })

    expect(html).toContain("<!-- Inicio Bloco Formularios.ia para Brevo -->")
    expect(html).toContain("Pesquisa de Satisfação")
    expect(html).toContain("https://example.com/logo.png")
    expect(html).toContain("utm_source=brevo")
    expect(html).toContain("email={{ contact.EMAIL }}")
  })

  it("should generate interactive NPS question HTML with buttons", () => {
    const html = generateBrevoEmailHtml(mockForm, {
      shareUrl: "https://formularios.ia/f/pesquisa-satisfacao",
      mode: "question",
      questionId: "q_nps",
      includeEmailTag: true,
    })

    expect(html).toContain("De 0 a 10, qual a chance de recomendar?")
    expect(html).toContain("q_q_nps=10")
    expect(html).toContain("Zero")
    expect(html).toContain("Certa")
    expect(html).toContain("email={{ contact.EMAIL }}")
  })

  it("should generate interactive rating question HTML with stars", () => {
    const html = generateBrevoEmailHtml(mockForm, {
      shareUrl: "https://formularios.ia/f/pesquisa-satisfacao",
      mode: "question",
      questionId: "q_rating",
      includeEmailTag: false,
    })

    expect(html).toContain("Como avalia o atendimento?")
    expect(html).toContain("★ 5")
    expect(html).toContain("q_q_rating=5")
    expect(html).not.toContain("email={{ contact.EMAIL }}")
  })
})
