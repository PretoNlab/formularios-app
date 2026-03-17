import { render, screen, fireEvent } from "@testing-library/react"
import { ScaleField } from "./scale"
import { makeQuestion, noop } from "./test-helpers"

describe("ScaleField", () => {
  it("renders 10 buttons for default 1-10 scale", () => {
    const q = makeQuestion()
    render(<ScaleField question={q} value={null} onChange={noop} onSubmit={noop} />)
    expect(screen.getAllByRole("radio")).toHaveLength(10)
  })

  it("renders correct count for custom range", () => {
    const q = makeQuestion({ properties: { scaleMin: 0, scaleMax: 5 } })
    render(<ScaleField question={q} value={null} onChange={noop} onSubmit={noop} />)
    expect(screen.getAllByRole("radio")).toHaveLength(6) // 0,1,2,3,4,5
  })

  it("marks the selected value as aria-checked", () => {
    const q = makeQuestion({ properties: { scaleMin: 1, scaleMax: 5 } })
    render(<ScaleField question={q} value={3} onChange={noop} onSubmit={noop} />)
    const radios = screen.getAllByRole("radio")
    expect(radios[2]).toHaveAttribute("aria-checked", "true")
    expect(radios[0]).toHaveAttribute("aria-checked", "false")
  })

  it("calls onChange with numeric value on click", () => {
    const onChange = vi.fn()
    const q = makeQuestion({ properties: { scaleMin: 1, scaleMax: 5 } })
    render(<ScaleField question={q} value={null} onChange={onChange} onSubmit={noop} />)
    fireEvent.click(screen.getAllByRole("radio")[4]) // button "5"
    expect(onChange).toHaveBeenCalledWith(5)
  })

  it("calls onSubmit after 300ms delay", () => {
    vi.useFakeTimers()
    const onSubmit = vi.fn()
    const q = makeQuestion()
    render(<ScaleField question={q} value={null} onChange={noop} onSubmit={onSubmit} />)
    fireEvent.click(screen.getAllByRole("radio")[0])
    vi.advanceTimersByTime(300)
    expect(onSubmit).toHaveBeenCalledTimes(1)
    vi.useRealTimers()
  })

  it("shows min/max labels when provided", () => {
    const q = makeQuestion({
      properties: { scaleMin: 1, scaleMax: 5, scaleMinLabel: "Péssimo", scaleMaxLabel: "Ótimo" },
    })
    render(<ScaleField question={q} value={null} onChange={noop} onSubmit={noop} />)
    expect(screen.getByText("Péssimo")).toBeInTheDocument()
    expect(screen.getByText("Ótimo")).toBeInTheDocument()
  })

  it("does not render labels section when both labels are empty", () => {
    const q = makeQuestion({ properties: { scaleMin: 1, scaleMax: 5 } })
    const { container } = render(<ScaleField question={q} value={null} onChange={noop} onSubmit={noop} />)
    expect(container.querySelector(".ff-scale-labels")).not.toBeInTheDocument()
  })
})
