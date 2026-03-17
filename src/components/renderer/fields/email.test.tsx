import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { EmailField } from "./email"
import { makeQuestion, noop } from "./test-helpers"

const question = makeQuestion()

describe("EmailField", () => {
  it("renders an email input", () => {
    render(<EmailField question={question} value={null} onChange={noop} onSubmit={noop} />)
    expect(screen.getByRole("textbox")).toHaveAttribute("type", "email")
  })

  it("shows default placeholder", () => {
    render(<EmailField question={question} value={null} onChange={noop} onSubmit={noop} />)
    expect(screen.getByPlaceholderText("nome@exemplo.com")).toBeInTheDocument()
  })

  it("displays the current value", () => {
    render(<EmailField question={question} value="a@b.com" onChange={noop} onSubmit={noop} />)
    expect(screen.getByRole("textbox")).toHaveValue("a@b.com")
  })

  it("calls onChange when the user types", async () => {
    const onChange = vi.fn()
    render(<EmailField question={question} value="" onChange={onChange} onSubmit={noop} />)
    await userEvent.type(screen.getByRole("textbox"), "x")
    expect(onChange).toHaveBeenCalledWith("x")
  })

  it("calls onSubmit on Enter", async () => {
    const onSubmit = vi.fn()
    render(<EmailField question={question} value="a@b.com" onChange={noop} onSubmit={onSubmit} />)
    await userEvent.type(screen.getByRole("textbox"), "{Enter}")
    expect(onSubmit).toHaveBeenCalledTimes(1)
  })
})
