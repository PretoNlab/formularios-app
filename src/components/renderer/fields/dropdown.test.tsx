import { render, screen, fireEvent } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { DropdownField } from "./dropdown"
import { makeQuestion, noop } from "./test-helpers"

const options = [
  { id: "sp", label: "São Paulo" },
  { id: "rj", label: "Rio de Janeiro" },
]
const question = makeQuestion({ properties: { options } })

describe("DropdownField", () => {
  it("renders a select element with placeholder and options", () => {
    render(<DropdownField question={question} value={null} onChange={noop} onSubmit={noop} />)
    expect(screen.getByRole("combobox")).toBeInTheDocument()
    expect(screen.getByText("Escolha uma opção...")).toBeInTheDocument()
    expect(screen.getByText("São Paulo")).toBeInTheDocument()
    expect(screen.getByText("Rio de Janeiro")).toBeInTheDocument()
  })

  it("displays the current selected value", () => {
    render(<DropdownField question={question} value="rj" onChange={noop} onSubmit={noop} />)
    expect(screen.getByRole("combobox")).toHaveValue("rj")
  })

  it("calls onChange with selected option id", () => {
    const onChange = vi.fn()
    render(<DropdownField question={question} value="" onChange={onChange} onSubmit={noop} />)
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "sp" } })
    expect(onChange).toHaveBeenCalledWith("sp")
  })

  it("calls onSubmit after 200ms when an option is selected", () => {
    vi.useFakeTimers()
    const onSubmit = vi.fn()
    render(<DropdownField question={question} value="" onChange={noop} onSubmit={onSubmit} />)
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "sp" } })
    expect(onSubmit).not.toHaveBeenCalled()
    vi.advanceTimersByTime(200)
    expect(onSubmit).toHaveBeenCalledTimes(1)
    vi.useRealTimers()
  })
})
