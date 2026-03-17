import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ShortTextField } from "./short-text"
import { makeQuestion, noop } from "./test-helpers"

const question = makeQuestion({ properties: { placeholder: "Digite aqui" } })

describe("ShortTextField", () => {
  it("renders an input with the given placeholder", () => {
    render(<ShortTextField question={question} value={null} onChange={noop} onSubmit={noop} />)
    expect(screen.getByPlaceholderText("Digite aqui")).toBeInTheDocument()
  })

  it("displays the current value", () => {
    render(<ShortTextField question={question} value="Olá" onChange={noop} onSubmit={noop} />)
    expect(screen.getByRole("textbox")).toHaveValue("Olá")
  })

  it("calls onChange when the user types", async () => {
    const onChange = vi.fn()
    render(<ShortTextField question={question} value="" onChange={onChange} onSubmit={noop} />)
    await userEvent.type(screen.getByRole("textbox"), "a")
    expect(onChange).toHaveBeenCalledWith("a")
  })

  it("calls onSubmit when Enter is pressed", async () => {
    const onSubmit = vi.fn()
    render(<ShortTextField question={question} value="texto" onChange={noop} onSubmit={onSubmit} />)
    await userEvent.type(screen.getByRole("textbox"), "{Enter}")
    expect(onSubmit).toHaveBeenCalledTimes(1)
  })

  it("respects maxLength from properties", () => {
    const q = makeQuestion({ properties: { maxLength: 10 } })
    render(<ShortTextField question={q} value={null} onChange={noop} onSubmit={noop} />)
    expect(screen.getByRole("textbox")).toHaveAttribute("maxLength", "10")
  })
})
