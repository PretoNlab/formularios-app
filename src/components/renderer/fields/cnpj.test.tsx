import { render, screen, fireEvent } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { CnpjField } from "./cnpj"
import { makeQuestion, noop } from "./test-helpers"

const question = makeQuestion()

describe("CnpjField", () => {
  it("renders with default placeholder", () => {
    render(<CnpjField question={question} value={null} onChange={noop} onSubmit={noop} />)
    expect(screen.getByPlaceholderText("00.000.000/0000-00")).toBeInTheDocument()
  })

  it("displays the current value", () => {
    render(<CnpjField question={question} value="11.222.333/0001-81" onChange={noop} onSubmit={noop} />)
    expect(screen.getByDisplayValue("11.222.333/0001-81")).toBeInTheDocument()
  })

  it("applies CNPJ mask for full 14 digits", () => {
    const onChange = vi.fn()
    render(<CnpjField question={question} value="" onChange={onChange} onSubmit={noop} />)
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "11222333000181" } })
    expect(onChange).toHaveBeenCalledWith("11.222.333/0001-81")
  })

  it("applies partial CNPJ mask for 5 digits", () => {
    const onChange = vi.fn()
    render(<CnpjField question={question} value="" onChange={onChange} onSubmit={noop} />)
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "11222" } })
    expect(onChange).toHaveBeenCalledWith("11.222")
  })

  it("calls onSubmit on Enter", async () => {
    const onSubmit = vi.fn()
    render(<CnpjField question={question} value="11.222.333/0001-81" onChange={noop} onSubmit={onSubmit} />)
    await userEvent.type(screen.getByRole("textbox"), "{Enter}")
    expect(onSubmit).toHaveBeenCalledTimes(1)
  })
})
