"use client"

import { useRef, useState } from "react"
import type { FieldProps } from "./field-props"

type FileAnswer = { fileUrl: string; fileName: string }

const ALLOWED_MIME = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/zip",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
])

export function FileUploadField({ question, value, onChange }: FieldProps & { formId?: string }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const fileData = value as FileAnswer | null
  const { allowedFileTypes, maxFileSize } = question.properties
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const accept = allowedFileTypes?.join(",") ?? undefined

  const handleFiles = async (files: FileList | null) => {
    const file = files?.[0]
    if (!file) return

    if (maxFileSize && file.size > maxFileSize * 1024 * 1024) {
      setUploadError(`O arquivo excede o tamanho máximo de ${maxFileSize} MB.`)
      return
    }

    if (!ALLOWED_MIME.has(file.type)) {
      setUploadError("Tipo de arquivo não permitido.")
      return
    }

    setUploadError(null)
    setUploading(true)

    const data = new FormData()
    data.append("file", file)
    // formId is embedded in question if available via the renderer context
    const fid = (question as unknown as { formId?: string }).formId
    if (fid) data.append("formId", fid)

    try {
      const res = await fetch("/api/upload/response-file", { method: "POST", body: data })
      const json = await res.json() as { url?: string; fileName?: string; error?: string }
      if (!res.ok || !json.url) {
        setUploadError(json.error ?? "Falha ao enviar arquivo.")
      } else {
        onChange({ fileUrl: json.url, fileName: json.fileName ?? file.name })
      }
    } catch {
      setUploadError("Erro de conexão. Tente novamente.")
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    handleFiles(e.dataTransfer.files)
  }

  return (
    <div
      className="ff-upload"
      role="button"
      tabIndex={uploading ? -1 : 0}
      aria-label="Área de upload. Clique ou arraste um arquivo."
      onClick={() => !uploading && inputRef.current?.click()}
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      onKeyDown={(e) => e.key === "Enter" && !uploading && inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        style={{ display: "none" }}
        onChange={(e) => handleFiles(e.target.files)}
        disabled={uploading}
      />

      {uploading ? (
        <div className="ff-upload-preview">
          <span className="ff-upload-uploading">⏳ Enviando arquivo...</span>
        </div>
      ) : fileData ? (
        <div className="ff-upload-preview">
          <span className="ff-upload-filename">📎 {fileData.fileName}</span>
          <button
            className="ff-upload-clear"
            aria-label="Remover arquivo"
            onClick={(e) => {
              e.stopPropagation()
              onChange(null)
            }}
          >
            ✕
          </button>
        </div>
      ) : (
        <>
          <div className="ff-upload-icon" aria-hidden>📁</div>
          <p className="ff-upload-label">Clique ou arraste um arquivo aqui</p>
          {((allowedFileTypes?.length ?? 0) > 0 || maxFileSize) && (
            <p className="ff-upload-hint">
              {(allowedFileTypes?.length ?? 0) > 0 && (
                <>Formatos: {allowedFileTypes!.map((t) =>
                  t === "image/*" ? "Imagens" :
                  t === "video/*" ? "Vídeos" :
                  t === "audio/*" ? "Áudio" :
                  t === "application/pdf" ? "PDF" :
                  t.includes("word") ? "Word" : t
                ).join(", ")}</>
              )}
              {maxFileSize ? ` • Máx ${maxFileSize} MB` : ""}
            </p>
          )}
          {uploadError && <p className="ff-upload-error">{uploadError}</p>}
        </>
      )}
    </div>
  )
}
