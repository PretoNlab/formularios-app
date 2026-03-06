"use client"

import type { FieldProps } from "./field-props"

function maskCnpj(raw: string): string {
    const d = raw.replace(/\D/g, "").slice(0, 14)
    if (d.length <= 2) return d
    if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`
    if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`
    if (d.length <= 12) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`
    return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`
}

export function CnpjField({ question, value, onChange, onSubmit }: FieldProps) {
    return (
        <input
            autoFocus
            className="ff-input"
            type="text"
            inputMode="numeric"
            placeholder={question.properties.placeholder ?? "00.000.000/0000-00"}
            value={(value as string) ?? ""}
            onChange={(e) => onChange(maskCnpj(e.target.value))}
            onKeyDown={(e) => {
                if (e.key === "Enter") {
                    e.preventDefault()
                    onSubmit()
                }
            }}
        />
    )
}
