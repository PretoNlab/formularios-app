import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { StatementField } from "./statement"
import { makeQuestion, noop } from "./test-helpers"

describe("StatementField", () => {
  it("renders the default CTA button label", () => {
    const q = makeQuestion()
    render(<StatementField question={q} value={null} onChange={noop} onSubmit={noop} />)
    expect(screen.getByRole("button", { name: /Continuar/ })).toBeInTheDocument()
  })

  it("renders a custom button label from properties", () => {
    const q = makeQuestion({ properties: { buttonText: "Entendido" } })
    render(<StatementField question={q} value={null} onChange={noop} onSubmit={noop} />)
    expect(screen.getByRole("button", { name: /Entendido/ })).toBeInTheDocument()
  })

  it("calls onChange(true) and onSubmit when clicked", async () => {
    const onChange = vi.fn()
    const onSubmit = vi.fn()
    const q = makeQuestion()
    render(<StatementField question={q} value={null} onChange={onChange} onSubmit={onSubmit} />)
    await userEvent.click(screen.getByRole("button"))
    expect(onChange).toHaveBeenCalledWith(true)
    expect(onSubmit).toHaveBeenCalledTimes(1)
  })
})
