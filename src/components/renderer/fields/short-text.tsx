"use client"

import type { FieldProps } from "./field-props"

/**
 * ShortTextField — single-line free text input.
 * Pressing Enter advances to the next question.
 */
export function ShortTextField({ question, value, onChange, onSubmit }: FieldProps) {
    return (
        <input
            autoFocus
            className="ff-input"
            type="text"
            placeholder={question.properties.placeholder ?? "Digite sua resposta..."}
            maxLength={question.properties.maxLength}
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
                if (e.key === "Enter") {
                    e.preventDefault()
                    onSubmit()
                }
            }}
        />
    )
}
