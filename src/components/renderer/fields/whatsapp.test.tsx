import { render, screen, fireEvent } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { WhatsAppField } from "./whatsapp"
import { makeQuestion, noop } from "./test-helpers"

const question = makeQuestion()

describe("WhatsAppField", () => {
  it("renders with default placeholder", () => {
    render(<WhatsAppField question={question} value={null} onChange={noop} onSubmit={noop} />)
    expect(screen.getByPlaceholderText("(00) 00000-0000")).toBeInTheDocument()
  })

  it("applies WhatsApp mask for 11 digits (celular)", () => {
    const onChange = vi.fn()
    const { container } = render(<WhatsAppField question={question} value="" onChange={onChange} onSubmit={noop} />)
    fireEvent.change(container.querySelector("input")!, { target: { value: "11987654321" } })
    expect(onChange).toHaveBeenCalledWith("(11) 98765-4321")
  })

  it("applies partial mask for 8 digits (shows dash)", () => {
    const onChange = vi.fn()
    const { container } = render(<WhatsAppField question={question} value="" onChange={onChange} onSubmit={noop} />)
    fireEvent.change(container.querySelector("input")!, { target: { value: "11987654" } })
    expect(onChange).toHaveBeenCalledWith("(11) 9876-54")
  })

  it("calls onSubmit on Enter", async () => {
    const onSubmit = vi.fn()
    const { container } = render(<WhatsAppField question={question} value="(11) 98765-4321" onChange={noop} onSubmit={onSubmit} />)
    await userEvent.type(container.querySelector("input")!, "{Enter}")
    expect(onSubmit).toHaveBeenCalledTimes(1)
  })
})
