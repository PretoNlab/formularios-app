import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { PhoneField } from "./phone"
import { makeQuestion, noop } from "./test-helpers"

const question = makeQuestion()

describe("PhoneField", () => {
  it("renders a tel input", () => {
    const { container } = render(<PhoneField question={question} value={null} onChange={noop} onSubmit={noop} />)
    expect(container.querySelector("input[type='tel']")).toBeInTheDocument()
  })

  it("shows default placeholder", () => {
    render(<PhoneField question={question} value={null} onChange={noop} onSubmit={noop} />)
    expect(screen.getByPlaceholderText("(00) 00000-0000")).toBeInTheDocument()
  })

  it("displays the current value", () => {
    render(<PhoneField question={question} value="(11) 91234-5678" onChange={noop} onSubmit={noop} />)
    expect(screen.getByDisplayValue("(11) 91234-5678")).toBeInTheDocument()
  })

  it("calls onChange when the user types", async () => {
    const onChange = vi.fn()
    const { container } = render(<PhoneField question={question} value="" onChange={onChange} onSubmit={noop} />)
    await userEvent.type(container.querySelector("input")!, "1")
    expect(onChange).toHaveBeenCalledWith("1")
  })

  it("calls onSubmit on Enter", async () => {
    const onSubmit = vi.fn()
    const { container } = render(<PhoneField question={question} value="11999999999" onChange={noop} onSubmit={onSubmit} />)
    await userEvent.type(container.querySelector("input")!, "{Enter}")
    expect(onSubmit).toHaveBeenCalledTimes(1)
  })
})
