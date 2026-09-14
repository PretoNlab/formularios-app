import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { DashboardKpis } from "./dashboard-kpis"
import type { FormListItem } from "@/lib/db/queries/forms"

const mockForms: FormListItem[] = [
  {
    id: "f1",
    title: "Formulário 1",
    description: null,
    status: "published",
    slug: "form-1",
    responseCount: 15,
    viewCount: 100,
    publishedAt: new Date(),
    updatedAt: new Date(),
    createdAt: new Date(),
    theme: {
      id: "midnight",
      colors: { bg: "#000", card: "#111", accent: "#777", text: "#fff", muted: "#888" },
      font: { heading: "Inter", body: "Inter" },
      borderRadius: "8px",
    },
    settings: {
      showProgressBar: true,
      showQuestionNumbers: true,
      allowPartialResponses: true,
      notifyOnResponse: false,
      notificationEmail: null,
      redirectUrl: null,
      closeMessage: "Fechado",
      responseLimit: null,
      closedAt: null,
      downloadUrl: null,
      downloadLabel: null,
      autoResponderEnabled: false,
      autoResponderEmailFieldId: null,
      autoResponderSubject: null,
      autoResponderBody: null,
    },
  },
  {
    id: "f2",
    title: "Formulário 2",
    description: null,
    status: "draft",
    slug: "form-2",
    responseCount: 5,
    viewCount: 20,
    publishedAt: null,
    updatedAt: new Date(),
    createdAt: new Date(),
    theme: {
      id: "midnight",
      colors: { bg: "#000", card: "#111", accent: "#777", text: "#fff", muted: "#888" },
      font: { heading: "Inter", body: "Inter" },
      borderRadius: "8px",
    },
    settings: {
      showProgressBar: true,
      showQuestionNumbers: true,
      allowPartialResponses: true,
      notifyOnResponse: false,
      notificationEmail: null,
      redirectUrl: null,
      closeMessage: "Fechado",
      responseLimit: null,
      closedAt: null,
      downloadUrl: null,
      downloadLabel: null,
      autoResponderEnabled: false,
      autoResponderEmailFieldId: null,
      autoResponderSubject: null,
      autoResponderBody: null,
    },
  },
]

describe("DashboardKpis", () => {
  it("computes and renders consolidated metrics correctly", () => {
    render(<DashboardKpis forms={mockForms} />)

    // Total responses: 15 + 5 = 20
    expect(screen.getByText("20")).toBeInTheDocument()

    // Total views: 100 + 20 = 120
    expect(screen.getByText("120")).toBeInTheDocument()

    // Conversion rate: (20 / 120) * 100 = 16.7%
    expect(screen.getByText("16.7%")).toBeInTheDocument()

    // Published forms: 1 of 2
    expect(screen.getByText("1")).toBeInTheDocument()
    expect(screen.getByText("/ 2")).toBeInTheDocument()
  })

  it("handles empty forms list gracefully with 0%", () => {
    render(<DashboardKpis forms={[]} />)
    expect(screen.getByText("0%")).toBeInTheDocument()
  })
})
