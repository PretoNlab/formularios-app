import { render, screen } from "@testing-library/react"
import { FileUploadField } from "./file-upload"
import { makeQuestion, noop } from "./test-helpers"

describe("FileUploadField", () => {
  it("renders the upload prompt", () => {
    const q = makeQuestion()
    render(<FileUploadField question={q} value={null} onChange={noop} onSubmit={noop} />)
    expect(screen.getByText(/Clique ou arraste um arquivo aqui/)).toBeInTheDocument()
  })

  it("renders a hidden file input", () => {
    const q = makeQuestion()
    const { container } = render(<FileUploadField question={q} value={null} onChange={noop} onSubmit={noop} />)
    const input = container.querySelector("input[type='file']")
    expect(input).toBeInTheDocument()
  })

  it("shows the file name when a value is provided", () => {
    const q = makeQuestion()
    render(
      <FileUploadField
        question={q}
        value={{ fileUrl: "https://example.com/file.pdf", fileName: "relatorio.pdf" }}
        onChange={noop}
        onSubmit={noop}
      />
    )
    expect(screen.getByText(/relatorio\.pdf/)).toBeInTheDocument()
  })
})
