import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { WelcomeField } from "./welcome"
import { makeQuestion, noop } from "./test-helpers"

describe("WelcomeField", () => {
  it("renders the default CTA button label", () => {
    const q = makeQuestion()
    render(<WelcomeField question={q} value={null} onChange={noop} onSubmit={noop} />)
    expect(screen.getByRole("button", { name: /Começar/ })).toBeInTheDocument()
  })

  it("renders a custom button label from properties", () => {
    const q = makeQuestion({ properties: { buttonText: "Iniciar pesquisa" } })
    render(<WelcomeField question={q} value={null} onChange={noop} onSubmit={noop} />)
    expect(screen.getByRole("button", { name: /Iniciar pesquisa/ })).toBeInTheDocument()
  })

  it("calls onChange(true) and onSubmit immediately when clicked", async () => {
    const onChange = vi.fn()
    const onSubmit = vi.fn()
    const q = makeQuestion()
    render(<WelcomeField question={q} value={null} onChange={onChange} onSubmit={onSubmit} />)
    await userEvent.click(screen.getByRole("button"))
    expect(onChange).toHaveBeenCalledWith(true)
    expect(onSubmit).toHaveBeenCalledTimes(1)
  })
})
