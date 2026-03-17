import { render, screen, fireEvent } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { CpfField } from "./cpf"
import { makeQuestion, noop } from "./test-helpers"

const question = makeQuestion()

describe("CpfField", () => {
  it("renders with default placeholder", () => {
    render(<CpfField question={question} value={null} onChange={noop} onSubmit={noop} />)
    expect(screen.getByPlaceholderText("000.000.000-00")).toBeInTheDocument()
  })

  it("displays the current value", () => {
    render(<CpfField question={question} value="123.456.789-09" onChange={noop} onSubmit={noop} />)
    expect(screen.getByDisplayValue("123.456.789-09")).toBeInTheDocument()
  })

  it("applies CPF mask for 6 digits", () => {
    const onChange = vi.fn()
    render(<CpfField question={question} value="" onChange={onChange} onSubmit={noop} />)
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "123456" } })
    expect(onChange).toHaveBeenCalledWith("123.456")
  })

  it("applies full CPF mask for 11 digits", () => {
    const onChange = vi.fn()
    render(<CpfField question={question} value="" onChange={onChange} onSubmit={noop} />)
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "12345678909" } })
    expect(onChange).toHaveBeenCalledWith("123.456.789-09")
  })

  it("calls onSubmit on Enter", async () => {
    const onSubmit = vi.fn()
    render(<CpfField question={question} value="123.456.789-09" onChange={noop} onSubmit={onSubmit} />)
    await userEvent.type(screen.getByRole("textbox"), "{Enter}")
    expect(onSubmit).toHaveBeenCalledTimes(1)
  })
})
