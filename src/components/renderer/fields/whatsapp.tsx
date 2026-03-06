"use client"

import type { FieldProps } from "./field-props"

function maskWhatsApp(raw: string): string {
    const d = raw.replace(/\D/g, "").slice(0, 11)
    if (d.length <= 2) return d
    if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`
    if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

export function WhatsAppField({ question, value, onChange, onSubmit }: FieldProps) {
    return (
        <input
            autoFocus
            className="ff-input"
            type="tel"
            inputMode="numeric"
            placeholder={question.properties.placeholder ?? "(00) 00000-0000"}
            value={(value as string) ?? ""}
            onChange={(e) => onChange(maskWhatsApp(e.target.value))}
            onKeyDown={(e) => {
                if (e.key === "Enter") {
                    e.preventDefault()
                    onSubmit()
                }
            }}
        />
    )
}
