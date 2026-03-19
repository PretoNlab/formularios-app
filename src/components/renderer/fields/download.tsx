"use client"

import type { FieldProps } from "./field-props"

export function DownloadField({ question, onChange }: FieldProps) {
    const url = question.properties.downloadUrl ?? "#"
    const text = question.properties.buttonText ?? "Baixar arquivo"
    const size = question.properties.downloadButtonSize ?? "default"
    const align = question.properties.downloadButtonAlign ?? "center"

    const sizeClasses = {
        sm: "px-3 py-1.5 text-sm",
        default: "px-4 py-2 text-base",
        lg: "px-8 py-4 text-lg",
    }

    const alignClasses = {
        left: "justify-start",
        center: "justify-center",
        right: "justify-end",
        full: "w-full justify-center",
    }
    
    const isFull = align === "full"

    return (
        <div className={`flex ${alignClasses[align]} mt-2 mb-4`}>
            <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => onChange(true)}
                className={`inline-flex items-center rounded-md font-semibold transition-colors bg-[var(--ff-accent)] text-[var(--ff-bg)] hover:opacity-90 shadow-sm ${sizeClasses[size]} ${isFull ? "w-full text-center" : ""}`}
            >
                <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                {text}
            </a>
        </div>
    )
}
