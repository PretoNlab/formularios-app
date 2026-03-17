import { render, screen, fireEvent } from "@testing-library/react"
import { YesNoField } from "./yes-no"
import { makeQuestion, noop } from "./test-helpers"

const question = makeQuestion()

describe("YesNoField", () => {
  it("renders Sim and Não buttons", () => {
    render(<YesNoField question={question} value={null} onChange={noop} onSubmit={noop} />)
    expect(screen.getByRole("button", { name: "Sim" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Não" })).toBeInTheDocument()
  })

  it("calls onChange(true) when Sim is clicked", () => {
    const onChange = vi.fn()
    render(<YesNoField question={question} value={null} onChange={onChange} onSubmit={noop} />)
    fireEvent.click(screen.getByRole("button", { name: "Sim" }))
    expect(onChange).toHaveBeenCalledWith(true)
  })

  it("calls onChange(false) when Não is clicked", () => {
    const onChange = vi.fn()
    render(<YesNoField question={question} value={null} onChange={onChange} onSubmit={noop} />)
    fireEvent.click(screen.getByRole("button", { name: "Não" }))
    expect(onChange).toHaveBeenCalledWith(false)
  })

  it("calls onSubmit after 280ms when Sim is clicked", () => {
    vi.useFakeTimers()
    const onSubmit = vi.fn()
    render(<YesNoField question={question} value={null} onChange={noop} onSubmit={onSubmit} />)
    fireEvent.click(screen.getByRole("button", { name: "Sim" }))
    expect(onSubmit).not.toHaveBeenCalled()
    vi.advanceTimersByTime(280)
    expect(onSubmit).toHaveBeenCalledTimes(1)
    vi.useRealTimers()
  })

  it("calls onSubmit after 280ms when Não is clicked", () => {
    vi.useFakeTimers()
    const onSubmit = vi.fn()
    render(<YesNoField question={question} value={null} onChange={noop} onSubmit={onSubmit} />)
    fireEvent.click(screen.getByRole("button", { name: "Não" }))
    vi.advanceTimersByTime(280)
    expect(onSubmit).toHaveBeenCalledTimes(1)
    vi.useRealTimers()
  })
})
