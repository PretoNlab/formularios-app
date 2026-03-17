import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { UrlField } from "./url"
import { makeQuestion, noop } from "./test-helpers"

const question = makeQuestion()

describe("UrlField", () => {
  it("renders a url input", () => {
    const { container } = render(<UrlField question={question} value={null} onChange={noop} onSubmit={noop} />)
    expect(container.querySelector("input[type='url']")).toBeInTheDocument()
  })

  it("shows default placeholder", () => {
    render(<UrlField question={question} value={null} onChange={noop} onSubmit={noop} />)
    expect(screen.getByPlaceholderText("https://")).toBeInTheDocument()
  })

  it("displays the current value", () => {
    render(<UrlField question={question} value="https://exemplo.com" onChange={noop} onSubmit={noop} />)
    expect(screen.getByDisplayValue("https://exemplo.com")).toBeInTheDocument()
  })

  it("calls onChange when the user types", async () => {
    const onChange = vi.fn()
    const { container } = render(<UrlField question={question} value="" onChange={onChange} onSubmit={noop} />)
    await userEvent.type(container.querySelector("input")!, "h")
    expect(onChange).toHaveBeenCalledWith("h")
  })

  it("calls onSubmit on Enter", async () => {
    const onSubmit = vi.fn()
    const { container } = render(<UrlField question={question} value="https://x.com" onChange={noop} onSubmit={onSubmit} />)
    await userEvent.type(container.querySelector("input")!, "{Enter}")
    expect(onSubmit).toHaveBeenCalledTimes(1)
  })
})
