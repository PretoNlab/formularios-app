import { render, screen, fireEvent } from "@testing-library/react"
import { MultipleChoiceField } from "./multiple-choice"
import { makeQuestion, noop } from "./test-helpers"

const options = [
  { id: "a", label: "Opção A" },
  { id: "b", label: "Opção B" },
  { id: "c", label: "Opção C" },
]
const question = makeQuestion({ properties: { options } })

describe("MultipleChoiceField", () => {
  it("renders all options as radio buttons", () => {
    render(<MultipleChoiceField question={question} value={null} onChange={noop} onSubmit={noop} />)
    expect(screen.getAllByRole("radio")).toHaveLength(3)
  })

  it("shows option labels", () => {
    render(<MultipleChoiceField question={question} value={null} onChange={noop} onSubmit={noop} />)
    expect(screen.getByText("Opção A")).toBeInTheDocument()
    expect(screen.getByText("Opção B")).toBeInTheDocument()
  })

  it("marks the selected option as checked", () => {
    render(<MultipleChoiceField question={question} value="Opção B" onChange={noop} onSubmit={noop} />)
    const radios = screen.getAllByRole("radio")
    expect(radios[1]).toHaveAttribute("aria-checked", "true")
    expect(radios[0]).toHaveAttribute("aria-checked", "false")
  })

  it("calls onChange with the option id when clicked", () => {
    const onChange = vi.fn()
    render(<MultipleChoiceField question={question} value={null} onChange={onChange} onSubmit={noop} />)
    fireEvent.click(screen.getAllByRole("radio")[2])
    expect(onChange).toHaveBeenCalledWith("Opção C")
  })

  it("calls onSubmit after 280ms delay on click", () => {
    vi.useFakeTimers()
    const onSubmit = vi.fn()
    render(<MultipleChoiceField question={question} value={null} onChange={noop} onSubmit={onSubmit} />)
    fireEvent.click(screen.getAllByRole("radio")[0])
    expect(onSubmit).not.toHaveBeenCalled()
    vi.advanceTimersByTime(280)
    expect(onSubmit).toHaveBeenCalledTimes(1)
    vi.useRealTimers()
  })

  it("shows letter labels A, B, C", () => {
    render(<MultipleChoiceField question={question} value={null} onChange={noop} onSubmit={noop} />)
    expect(screen.getByText("A")).toBeInTheDocument()
    expect(screen.getByText("B")).toBeInTheDocument()
    expect(screen.getByText("C")).toBeInTheDocument()
  })
})
