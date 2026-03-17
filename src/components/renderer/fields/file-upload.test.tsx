import { render, screen } from "@testing-library/react"
import { FileUploadField } from "./file-upload"
import { makeQuestion, noop } from "./test-helpers"

describe("FileUploadField", () => {
  it("renders the 'coming soon' placeholder", () => {
    const q = makeQuestion()
    render(<FileUploadField question={q} value={null} onChange={noop} onSubmit={noop} />)
    expect(screen.getByText("Upload de arquivo")).toBeInTheDocument()
    expect(screen.getByText(/Em breve/)).toBeInTheDocument()
  })

  it("does not render an interactive file input (disabled state)", () => {
    const q = makeQuestion()
    const { container } = render(<FileUploadField question={q} value={null} onChange={noop} onSubmit={noop} />)
    expect(container.querySelector("input[type='file']")).not.toBeInTheDocument()
  })
})
