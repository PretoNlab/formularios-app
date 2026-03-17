import { render, screen, fireEvent } from "@testing-library/react"
import { RatingField } from "./rating"
import { makeQuestion, noop } from "./test-helpers"

describe("RatingField", () => {
  it("renders 5 buttons by default", () => {
    const q = makeQuestion()
    render(<RatingField question={q} value={null} onChange={noop} onSubmit={noop} />)
    expect(screen.getAllByRole("radio")).toHaveLength(5)
  })

  it("renders N buttons according to ratingMax", () => {
    const q = makeQuestion({ properties: { ratingMax: 7 } })
    render(<RatingField question={q} value={null} onChange={noop} onSubmit={noop} />)
    expect(screen.getAllByRole("radio")).toHaveLength(7)
  })

  it("marks the selected button as aria-checked", () => {
    const q = makeQuestion()
    render(<RatingField question={q} value={3} onChange={noop} onSubmit={noop} />)
    const radios = screen.getAllByRole("radio")
    expect(radios[2]).toHaveAttribute("aria-checked", "true")
    expect(radios[0]).toHaveAttribute("aria-checked", "false")
  })

  it("calls onChange with the clicked numeric value", () => {
    const onChange = vi.fn()
    const q = makeQuestion()
    render(<RatingField question={q} value={null} onChange={onChange} onSubmit={noop} />)
    fireEvent.click(screen.getAllByRole("radio")[4]) // 5th star
    expect(onChange).toHaveBeenCalledWith(5)
  })

  it("calls onSubmit after 350ms delay", () => {
    vi.useFakeTimers()
    const onSubmit = vi.fn()
    const q = makeQuestion()
    render(<RatingField question={q} value={null} onChange={noop} onSubmit={onSubmit} />)
    fireEvent.click(screen.getAllByRole("radio")[1])
    expect(onSubmit).not.toHaveBeenCalled()
    vi.advanceTimersByTime(350)
    expect(onSubmit).toHaveBeenCalledTimes(1)
    vi.useRealTimers()
  })

  it("renders the radiogroup with aria-label", () => {
    const q = makeQuestion({ properties: { ratingMax: 5 } })
    render(<RatingField question={q} value={null} onChange={noop} onSubmit={noop} />)
    expect(screen.getByRole("radiogroup", { name: "Avaliação de 1 a 5" })).toBeInTheDocument()
  })
})
