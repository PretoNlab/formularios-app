import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { DateField } from "./date"
import { makeQuestion, noop } from "./test-helpers"

const question = makeQuestion()

describe("DateField", () => {
  it("renders a date input", () => {
    const { container } = render(<DateField question={question} value={null} onChange={noop} onSubmit={noop} />)
    const input = container.querySelector("input[type='date']")
    expect(input).toBeInTheDocument()
  })

  it("displays the current value", () => {
    const { container } = render(<DateField question={question} value="2024-01-15" onChange={noop} onSubmit={noop} />)
    expect(container.querySelector("input")).toHaveValue("2024-01-15")
  })

  it("calls onChange when date changes", async () => {
    const onChange = vi.fn()
    const { container } = render(<DateField question={question} value="" onChange={onChange} onSubmit={noop} />)
    const input = container.querySelector("input")!
    await userEvent.type(input, "2024-06-01")
    expect(onChange).toHaveBeenCalled()
  })

  it("calls onSubmit on Enter", async () => {
    const onSubmit = vi.fn()
    const { container } = render(<DateField question={question} value="2024-01-01" onChange={noop} onSubmit={onSubmit} />)
    await userEvent.type(container.querySelector("input")!, "{Enter}")
    expect(onSubmit).toHaveBeenCalledTimes(1)
  })
})
