import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { SignatureField } from "./signature"
import { makeQuestion, noop } from "./test-helpers"

// jsdom doesn't implement HTMLCanvasElement.getContext — mock it for all tests
const mockCtx = {
  strokeStyle: "",
  lineWidth: 0,
  lineCap: "round" as CanvasLineCap,
  lineJoin: "round" as CanvasLineJoin,
  clearRect: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  stroke: vi.fn(),
  drawImage: vi.fn(),
}

beforeEach(() => {
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
    mockCtx as unknown as CanvasRenderingContext2D
  )
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe("SignatureField", () => {
  it("renders a canvas for drawing", () => {
    const q = makeQuestion()
    const { container } = render(<SignatureField question={q} value={null} onChange={noop} onSubmit={noop} />)
    const canvas = container.querySelector("canvas")
    expect(canvas).toBeInTheDocument()
    expect(canvas).toHaveAttribute("aria-label", "Área de assinatura")
  })

  it("renders the clear button", () => {
    const q = makeQuestion()
    render(<SignatureField question={q} value={null} onChange={noop} onSubmit={noop} />)
    expect(screen.getByRole("button", { name: "Limpar" })).toBeInTheDocument()
  })

  it("calls onChange(null) when the clear button is clicked", async () => {
    const onChange = vi.fn()
    const q = makeQuestion()
    render(<SignatureField question={q} value="data:image/png;base64,abc" onChange={onChange} onSubmit={noop} />)
    await userEvent.click(screen.getByRole("button", { name: "Limpar" }))
    expect(onChange).toHaveBeenCalledWith(null)
  })

  it("shows 'Assinatura registrada' when value is present", () => {
    const q = makeQuestion()
    render(<SignatureField question={q} value="data:image/png;base64,abc" onChange={noop} onSubmit={noop} />)
    expect(screen.getByText(/Assinatura registrada/)).toBeInTheDocument()
  })

  it("does not show saved indicator when value is null", () => {
    const q = makeQuestion()
    render(<SignatureField question={q} value={null} onChange={noop} onSubmit={noop} />)
    expect(screen.queryByText(/Assinatura registrada/)).not.toBeInTheDocument()
  })
})
