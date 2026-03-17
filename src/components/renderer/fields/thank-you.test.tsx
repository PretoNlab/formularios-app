import { render, screen } from "@testing-library/react"
import { ThankYouField } from "./thank-you"
import { makeQuestion, noop } from "./test-helpers"

describe("ThankYouField", () => {
  it("renders the default thank-you message", () => {
    const q = makeQuestion()
    render(<ThankYouField question={q} value={null} onChange={noop} onSubmit={noop} />)
    expect(screen.getByText("Obrigado por responder!")).toBeInTheDocument()
  })

  it("renders a custom message from properties", () => {
    const q = makeQuestion({ properties: { buttonText: "Sua resposta foi registrada." } })
    render(<ThankYouField question={q} value={null} onChange={noop} onSubmit={noop} />)
    expect(screen.getByText("Sua resposta foi registrada.")).toBeInTheDocument()
  })

  it("has aria-live='polite' for screen reader announcement", () => {
    const q = makeQuestion()
    const { container } = render(<ThankYouField question={q} value={null} onChange={noop} onSubmit={noop} />)
    expect(container.querySelector("[aria-live='polite']")).toBeInTheDocument()
  })
})
