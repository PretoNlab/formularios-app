"use client"

import type { FieldProps } from "./field-props"
import { isSafeUrl } from "@/lib/utils/safe-url"
import { getFileKind, getFileNameFromUrl, formatFileSize, normalizeDownloadUrl } from "@/lib/utils/file-meta"

const WRAP_ALIGN = {
    left: "justify-start",
    center: "justify-center",
    right: "justify-end",
    full: "justify-center",
}

const CARD_MAX_WIDTH = {
    sm: "max-w-sm",
    default: "max-w-md",
    lg: "max-w-lg",
}

const downloadIcon = (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
)

export function DownloadField({ question, onChange }: FieldProps) {
    const rawUrl = question.properties.downloadUrl
    const url = isSafeUrl(rawUrl) ? normalizeDownloadUrl(rawUrl!) : null
    const size = question.properties.downloadButtonSize ?? "default"
    const align = question.properties.downloadButtonAlign ?? "center"

    const fallbackName = question.properties.buttonText ?? "Arquivo para download"
    const fileName = question.properties.fileName ?? (rawUrl ? getFileNameFromUrl(rawUrl) : null) ?? fallbackName
    const fileSize = question.properties.fileSize
    const kind = getFileKind(fileName || rawUrl || "")

    const wrapClass = `flex ${WRAP_ALIGN[align]} mt-2 mb-4`
    const cardClass = `ff-file-card ${align === "full" ? "w-full" : CARD_MAX_WIDTH[size] + " w-full"}`

    if (!url) {
        return (
            <div className={wrapClass}>
                <div className={`${cardClass} ff-file-card--disabled`}>
                    <div className="ff-file-icon" style={{ background: kind.color }}>{kind.label}</div>
                    <div className="ff-file-meta">
                        <div className="ff-file-name">{fallbackName}</div>
                        <div className="ff-file-sub">Link de download indisponível</div>
                    </div>
                    <button type="button" disabled aria-label="URL de download inválida" className="ff-file-dl-btn">
                        {downloadIcon}
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className={wrapClass}>
            <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => onChange(true)}
                className={cardClass}
            >
                <div className="ff-file-icon" style={{ background: kind.color }}>{kind.label}</div>
                <div className="ff-file-meta">
                    <div className="ff-file-name">{fileName}</div>
                    <div className="ff-file-sub">{fileSize ? `${formatFileSize(fileSize)} · ` : ""}Toque para baixar</div>
                </div>
                <div className="ff-file-dl-btn" aria-hidden>
                    {downloadIcon}
                </div>
            </a>
        </div>
    )
}
