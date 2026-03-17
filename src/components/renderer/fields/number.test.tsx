import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { NumberField } from "./number"
import { makeQuestion, noop } from "./test-helpers"

describe("NumberField", () => {
  it("renders a number input", () => {
    const q = makeQuestion()
    render(<NumberField question={q} value={null} onChange={noop} onSubmit={noop} />)
    expect(screen.getByRole("spinbutton")).toHaveAttribute("type", "number")
  })

  it("applies min, max and step from properties", () => {
    const q = makeQuestion({ properties: { min: 1, max: 100, step: 5 } })
    render(<NumberField question={q} value={null} onChange={noop} onSubmit={noop} />)
    const input = screen.getByRole("spinbutton")
    expect(input).toHaveAttribute("min", "1")
    expect(input).toHaveAttribute("max", "100")
    expect(input).toHaveAttribute("step", "5")
  })

  it("displays the current numeric value", () => {
    const q = makeQuestion()
    render(<NumberField question={q} value={42} onChange={noop} onSubmit={noop} />)
    expect(screen.getByRole("spinbutton")).toHaveValue(42)
  })

  it("calls onChange with null when cleared", async () => {
    const onChange = vi.fn()
    const q = makeQuestion()
    render(<NumberField question={q} value={5} onChange={onChange} onSubmit={noop} />)
    const input = screen.getByRole("spinbutton")
    await userEvent.clear(input)
    expect(onChange).toHaveBeenCalledWith(null)
  })

  it("calls onSubmit on Enter", async () => {
    const onSubmit = vi.fn()
    const q = makeQuestion()
    render(<NumberField question={q} value={10} onChange={noop} onSubmit={onSubmit} />)
    await userEvent.type(screen.getByRole("spinbutton"), "{Enter}")
    expect(onSubmit).toHaveBeenCalledTimes(1)
  })
})
