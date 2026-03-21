import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { CheckboxField } from "./checkbox"
import { makeQuestion, noop } from "./test-helpers"

const options = [
  { id: "x", label: "X" },
  { id: "y", label: "Y" },
  { id: "z", label: "Z" },
]
const question = makeQuestion({ properties: { options } })

describe("CheckboxField", () => {
  it("renders all options as checkboxes", () => {
    render(<CheckboxField question={question} value={[]} onChange={noop} onSubmit={noop} />)
    expect(screen.getAllByRole("checkbox")).toHaveLength(3)
  })

  it("marks selected options as checked", () => {
    render(<CheckboxField question={question} value={["X", "Z"]} onChange={noop} onSubmit={noop} />)
    const checkboxes = screen.getAllByRole("checkbox")
    expect(checkboxes[0]).toHaveAttribute("aria-checked", "true")
    expect(checkboxes[1]).toHaveAttribute("aria-checked", "false")
    expect(checkboxes[2]).toHaveAttribute("aria-checked", "true")
  })

  it("calls onChange with added id when an unchecked option is clicked", async () => {
    const onChange = vi.fn()
    render(<CheckboxField question={question} value={["X"]} onChange={onChange} onSubmit={noop} />)
    await userEvent.click(screen.getAllByRole("checkbox")[1]) // click Y
    expect(onChange).toHaveBeenCalledWith(["X", "Y"])
  })

  it("calls onChange with id removed when a checked option is clicked", async () => {
    const onChange = vi.fn()
    render(<CheckboxField question={question} value={["X", "Y"]} onChange={onChange} onSubmit={noop} />)
    await userEvent.click(screen.getAllByRole("checkbox")[0]) // uncheck X
    expect(onChange).toHaveBeenCalledWith(["Y"])
  })

  it("does NOT call onSubmit when an option is toggled", async () => {
    const onSubmit = vi.fn()
    render(<CheckboxField question={question} value={[]} onChange={noop} onSubmit={onSubmit} />)
    await userEvent.click(screen.getAllByRole("checkbox")[0])
    expect(onSubmit).not.toHaveBeenCalled()
  })
})
