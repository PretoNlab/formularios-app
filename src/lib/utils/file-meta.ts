const EXT_KIND: Record<string, { label: string; color: string }> = {
  pdf: { label: "PDF", color: "#ef4444" },
  doc: { label: "DOC", color: "#2563eb" },
  docx: { label: "DOC", color: "#2563eb" },
  xls: { label: "XLS", color: "#16a34a" },
  xlsx: { label: "XLS", color: "#16a34a" },
  ppt: { label: "PPT", color: "#ea580c" },
  pptx: { label: "PPT", color: "#ea580c" },
  zip: { label: "ZIP", color: "#71717a" },
  rar: { label: "RAR", color: "#71717a" },
  csv: { label: "CSV", color: "#16a34a" },
  txt: { label: "TXT", color: "#71717a" },
  png: { label: "IMG", color: "#8b5cf6" },
  jpg: { label: "IMG", color: "#8b5cf6" },
  jpeg: { label: "IMG", color: "#8b5cf6" },
  gif: { label: "IMG", color: "#8b5cf6" },
  webp: { label: "IMG", color: "#8b5cf6" },
  svg: { label: "IMG", color: "#8b5cf6" },
  mp4: { label: "VID", color: "#0ea5e9" },
  webm: { label: "VID", color: "#0ea5e9" },
  mov: { label: "VID", color: "#0ea5e9" },
  mp3: { label: "AUD", color: "#d946ef" },
  wav: { label: "AUD", color: "#d946ef" },
  ogg: { label: "AUD", color: "#d946ef" },
}
const DEFAULT_KIND = { label: "FILE", color: "#71717a" }

function extractExtension(nameOrUrl: string): string {
  const clean = nameOrUrl.split("?")[0].split("#")[0]
  const match = /\.([a-zA-Z0-9]+)$/.exec(clean)
  return match ? match[1].toLowerCase() : ""
}

export function getFileKind(nameOrUrl: string): { label: string; color: string } {
  return EXT_KIND[extractExtension(nameOrUrl)] ?? DEFAULT_KIND
}

const NON_FILENAME_SEGMENTS = new Set(["view", "preview", "edit", "download", "d", "file", "share", "s"])

export function getFileNameFromUrl(url: string): string | null {
  try {
    const path = new URL(url, "https://placeholder.invalid").pathname
    const last = path.split("/").filter(Boolean).pop()
    if (!last) return null
    const decoded = decodeURIComponent(last)
    // Drive/Dropbox-style share links end in a keyword, not a real filename (e.g. .../file/d/ID/view)
    if (!decoded.includes(".") || NON_FILENAME_SEGMENTS.has(decoded.toLowerCase())) return null
    return decoded
  } catch {
    return null
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
