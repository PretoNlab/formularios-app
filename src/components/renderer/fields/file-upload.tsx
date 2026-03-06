"use client"

import { useRef } from "react"
import type { FieldProps } from "./field-props"

type FileAnswer = { fileUrl: string; fileName: string }

/**
 * FileUploadField — drag-and-drop / click-to-browse file upload.
 * Stores a local object URL and the file name as the answer value.
 * Note: the parent form submission layer is responsible for uploading
 * the blob to storage and replacing the local URL with the remote one.
 */
export function FileUploadField({ question, value, onChange }: FieldProps) {
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
