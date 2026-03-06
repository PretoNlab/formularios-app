"use client"

import { useRef } from "react"
import type { FieldProps } from "./field-props"

type FileAnswer = { fileUrl: string; fileName: string }

/**
 * FileUploadField — currently shows a "coming soon" notice in the public renderer.
 * Real storage upload (Supabase Storage / S3) will be implemented in a future release.
 */
export function FileUploadField({ question, value: _value, onChange: _onChange }: FieldProps) {
  void question
  return (
    <div className="ff-upload ff-upload-disabled" role="presentation">
      <div className="ff-upload-icon" aria-hidden>📎</div>
      <p className="ff-upload-label">Upload de arquivo</p>
      <p className="ff-upload-hint">Em breve — disponível na próxima versão</p>
    </div>
  )
}

function _FileUploadFieldFull({ question, value, onChange }: FieldProps) {
    const inputRef = useRef<HTMLInputElement>(null)
    const fileData = value as FileAnswer | null
    const { allowedFileTypes, maxFileSize } = question.properties

    const accept = allowedFileTypes?.join(",") ?? undefined

    const handleFiles = (files: FileList | null) => {
        const file = files?.[0]
        if (!file) return

        if (maxFileSize && file.size > maxFileSize * 1024 * 1024) {
            alert(`O arquivo excede o tamanho máximo de ${maxFileSize} MB.`)
            return
        }
        const url = URL.createObjectURL(file)
        onChange({ fileUrl: url, fileName: file.name })
    }

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        handleFiles(e.dataTransfer.files)
    }

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
    }

    return (
        <div
            className="ff-upload"
            role="button"
            tabIndex={0}
            aria-label="Área de upload. Clique ou arraste um arquivo."
            onClick={() => inputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        >
            <input
                ref={inputRef}
                type="file"
                accept={accept}
                style={{ display: "none" }}
                onChange={(e) => handleFiles(e.target.files)}
            />

            {fileData ? (
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
                    <div className="ff-upload-icon" aria-hidden>
                        📁
                    </div>
                    <p className="ff-upload-label">Clique ou arraste um arquivo aqui</p>
                    {(allowedFileTypes?.length ?? 0) > 0 && (
                        <p className="ff-upload-hint">
                            Formatos: {allowedFileTypes!.join(", ")}
                            {maxFileSize ? ` • Máx ${maxFileSize} MB` : ""}
                        </p>
                    )}
                </>
            )}
        </div>
    )
}
