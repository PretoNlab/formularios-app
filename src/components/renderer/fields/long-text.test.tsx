import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { LongTextField } from "./long-text"
import { makeQuestion, noop } from "./test-helpers"

const question = makeQuestion({ properties: { placeholder: "Detalhe aqui" } })

describe("LongTextField", () => {
  it("renders a textarea with the given placeholder", () => {
    render(<LongTextField question={question} value={null} onChange={noop} onSubmit={noop} />)
    expect(screen.getByPlaceholderText("Detalhe aqui")).toBeInTheDocument()
  })

  it("displays the current value", () => {
    render(<LongTextField question={question} value="Meu texto" onChange={noop} onSubmit={noop} />)
    expect(screen.getByRole("textbox")).toHaveValue("Meu texto")
  })

  it("calls onChange when the user types", async () => {
    const onChange = vi.fn()
    render(<LongTextField question={question} value="" onChange={onChange} onSubmit={noop} />)
    await userEvent.type(screen.getByRole("textbox"), "x")
    expect(onChange).toHaveBeenCalledWith("x")
  })

  it("calls onSubmit on Shift+Enter", async () => {
    const onSubmit = vi.fn()
    render(<LongTextField question={question} value="texto" onChange={noop} onSubmit={onSubmit} />)
    await userEvent.keyboard("{Shift>}{Enter}{/Shift}")
    expect(onSubmit).toHaveBeenCalledTimes(1)
  })

  it("does NOT call onSubmit on bare Enter", async () => {
    const onSubmit = vi.fn()
    render(<LongTextField question={question} value="texto" onChange={noop} onSubmit={onSubmit} />)
    await userEvent.type(screen.getByRole("textbox"), "{Enter}")
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it("shows the keyboard hint", () => {
    render(<LongTextField question={question} value={null} onChange={noop} onSubmit={noop} />)
    expect(screen.getByText(/Shift \+ Enter/)).toBeInTheDocument()
  })
})
