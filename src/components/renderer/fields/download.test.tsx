import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { DownloadField } from "./download"
import { makeQuestion, noop } from "./test-helpers"

function makeDownloadQuestion(downloadUrl: string | undefined) {
  return makeQuestion({
    type: "download",
    properties: downloadUrl !== undefined
      ? { downloadUrl, buttonText: "Baixar" }
      : { buttonText: "Baixar" },
  })
}

describe("DownloadField", () => {
  it("renders an anchor with a safe https URL", () => {
    const q = makeDownloadQuestion("https://example.com/file.pdf")
    const { container } = render(
      <DownloadField question={q} value={null} onChange={noop} onSubmit={noop} />
    )
    const anchor = container.querySelector("a")
    expect(anchor).not.toBeNull()
    expect(anchor!.getAttribute("href")).toBe("https://example.com/file.pdf")
  })

  it("renders an anchor with a same-origin path", () => {
    const q = makeDownloadQuestion("/static/file.pdf")
    const { container } = render(
      <DownloadField question={q} value={null} onChange={noop} onSubmit={noop} />
    )
    const anchor = container.querySelector("a")
    expect(anchor!.getAttribute("href")).toBe("/static/file.pdf")
  })

  it("does NOT render an anchor for a javascript: URL (XSS guard)", () => {
    const q = makeDownloadQuestion("javascript:alert(document.cookie)")
    const { container } = render(
      <DownloadField question={q} value={null} onChange={noop} onSubmit={noop} />
    )
    expect(container.querySelector("a")).toBeNull()
    // Fallback button keeps the layout intact
    expect(container.querySelector("button[disabled]")).not.toBeNull()
  })

  it("does NOT render an anchor for a data: URL", () => {
    const q = makeDownloadQuestion("data:text/html,<script>alert(1)</script>")
    const { container } = render(
      <DownloadField question={q} value={null} onChange={noop} onSubmit={noop} />
    )
    expect(container.querySelector("a")).toBeNull()
  })

  it("does NOT render an anchor for a protocol-relative URL", () => {
    const q = makeDownloadQuestion("//evil.com/phish")
    const { container } = render(
      <DownloadField question={q} value={null} onChange={noop} onSubmit={noop} />
    )
    expect(container.querySelector("a")).toBeNull()
  })

  it("does NOT render an anchor for plain http (downgrade attack)", () => {
    const q = makeDownloadQuestion("http://example.com/file.pdf")
    const { container } = render(
      <DownloadField question={q} value={null} onChange={noop} onSubmit={noop} />
    )
    expect(container.querySelector("a")).toBeNull()
  })

  it("does NOT render an anchor when downloadUrl is missing", () => {
    const q = makeDownloadQuestion(undefined)
    const { container } = render(
      <DownloadField question={q} value={null} onChange={noop} onSubmit={noop} />
    )
    expect(container.querySelector("a")).toBeNull()
  })

  it("still shows the button label even when URL is blocked", () => {
    const q = makeDownloadQuestion("javascript:alert(1)")
    render(<DownloadField question={q} value={null} onChange={noop} onSubmit={noop} />)
    expect(screen.getByText("Baixar")).toBeInTheDocument()
  })
})
