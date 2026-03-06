"use client"

import type { FieldProps } from "./field-props"

function maskCpf(raw: string): string {
    const d = raw.replace(/\D/g, "").slice(0, 11)
    if (d.length <= 3) return d
    if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`
    if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`
    return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`
}

export function CpfField({ question, value, onChange, onSubmit }: FieldProps) {
    return (
        <input
            autoFocus
            className="ff-input"
            type="text"
            inputMode="numeric"
            placeholder={question.properties.placeholder ?? "000.000.000-00"}
            value={(value as string) ?? ""}
            onChange={(e) => onChange(maskCpf(e.target.value))}
            onKeyDown={(e) => {
                if (e.key === "Enter") {
                    e.preventDefault()
                    onSubmit()
                }
            }}
        />
    )
}
