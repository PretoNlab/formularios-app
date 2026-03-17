import { render, screen, fireEvent } from "@testing-library/react"
import { NpsField } from "./nps"
import { makeQuestion, noop } from "./test-helpers"

describe("NpsField", () => {
  it("renders 11 buttons (0 to 10)", () => {
    const q = makeQuestion()
    render(<NpsField question={q} value={null} onChange={noop} onSubmit={noop} />)
    expect(screen.getAllByRole("radio")).toHaveLength(11)
  })

  it("shows 'Nada provável' and 'Muito provável' labels by default", () => {
    const q = makeQuestion()
    render(<NpsField question={q} value={null} onChange={noop} onSubmit={noop} />)
    expect(screen.getByText("Nada provável")).toBeInTheDocument()
    expect(screen.getByText("Muito provável")).toBeInTheDocument()
  })

  it("allows overriding labels via properties", () => {
    const q = makeQuestion({
      properties: { scaleMinLabel: "Péssimo", scaleMaxLabel: "Excelente" },
    })
    render(<NpsField question={q} value={null} onChange={noop} onSubmit={noop} />)
    expect(screen.getByText("Péssimo")).toBeInTheDocument()
    expect(screen.getByText("Excelente")).toBeInTheDocument()
  })

  it("calls onChange with numeric value on click", () => {
    const onChange = vi.fn()
    const q = makeQuestion()
    render(<NpsField question={q} value={null} onChange={onChange} onSubmit={noop} />)
    fireEvent.click(screen.getAllByRole("radio")[10]) // value 10
    expect(onChange).toHaveBeenCalledWith(10)
  })

  it("calls onSubmit after delay on click", () => {
    vi.useFakeTimers()
    const onSubmit = vi.fn()
    const q = makeQuestion()
    render(<NpsField question={q} value={null} onChange={noop} onSubmit={onSubmit} />)
    fireEvent.click(screen.getAllByRole("radio")[9]) // value 9
    vi.advanceTimersByTime(300)
    expect(onSubmit).toHaveBeenCalledTimes(1)
    vi.useRealTimers()
  })
})
