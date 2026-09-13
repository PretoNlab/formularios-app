import { render, screen, cleanup } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { vi, describe, it, expect, afterEach } from "vitest"
import { SignupExperience } from "./signup-experience"
import { DRAFT_KEY } from "@/lib/onboarding/draft"

vi.mock("./signup-account-form", () => ({
  SignupAccountForm: ({ draft }: { draft: { title: string } }) => <div>Cadastro para salvar: {draft.title}</div>,
}))
afterEach(() => { cleanup(); localStorage.clear() })

describe("signup experience", () => {
  it("adds five onboarding credits after each completed step", async () => {
    const user = userEvent.setup()
    render(<SignupExperience />)
    expect(screen.queryByText(/Cadastro para salvar/)).not.toBeInTheDocument()
    expect(screen.getByText("+0 / 20 extras")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: /Captar contatos/ }))
    expect(screen.getByText("+5 / 20 extras")).toBeInTheDocument()

    await user.type(screen.getByLabelText("Para qual negócio, evento ou assunto?"), "Studio Aurora")
    await user.type(screen.getByLabelText("Qual pergunta não pode faltar?"), "Qual seu objetivo?")
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("Studio Aurora")

    await user.click(screen.getByRole("button", { name: /Ver meu formulário/ }))
    expect(screen.getByText("+10 / 20 extras")).toBeInTheDocument()

    await user.type(screen.getByLabelText("Título do formulário"), "Vamos criar juntos")
    await user.click(screen.getByRole("radio", { name: "Criativo" }))

    await user.click(screen.getByRole("button", { name: /Salvar e/ }))
    expect(screen.getByText("+15 / 20 extras")).toBeInTheDocument()
    expect(screen.getByText("Cadastro para salvar: Vamos criar juntos")).toBeInTheDocument()

    const saved = JSON.parse(localStorage.getItem(DRAFT_KEY)!)
    expect(saved.draft.style).toBe("lavender")
    expect(saved).not.toHaveProperty("password")
  }, 15000)

  it("offers a blank start with the first three rewards unlocked", async () => {
    const user = userEvent.setup()
    render(<SignupExperience />)
    await user.click(screen.getByRole("button", { name: /Prefiro começar em branco/ }))
    expect(screen.getByText("+15 / 20 extras")).toBeInTheDocument()
    expect(screen.getByText(/Cadastro para salvar/)).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Voltar" }))
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("O que vamos criar hoje?")
    expect(screen.getByText("+15 / 20 extras")).toBeInTheDocument()
  })

  it("allows selecting a question preset quickly", async () => {
    const user = userEvent.setup()
    render(<SignupExperience />)
    await user.click(screen.getByRole("button", { name: /Ouvir clientes/ }))
    const presetBtn = screen.getByRole("button", { name: "O que mais chamou sua atenção positivamente?" })
    await user.click(presetBtn)
    expect(screen.getByLabelText("Qual pergunta não pode faltar?")).toHaveValue(
      "O que mais chamou sua atenção positivamente?"
    )
  })

  it("toggles between form editor and live preview on mobile view", async () => {
    const user = userEvent.setup()
    render(<SignupExperience />)

    // Mobile tabs exist
    const previewTabBtn = screen.getByRole("button", { name: /Prévia \(/ })
    expect(previewTabBtn).toBeInTheDocument()

    // Switch to preview tab
    await user.click(previewTabBtn)
    expect(screen.getByRole("button", { name: /Voltar para o editor/ })).toBeInTheDocument()

    // Switch back to form tab
    await user.click(screen.getByRole("button", { name: /Voltar para o editor/ }))
    expect(screen.getByRole("button", { name: /Captar contatos/ })).toBeInTheDocument()
  })
})
