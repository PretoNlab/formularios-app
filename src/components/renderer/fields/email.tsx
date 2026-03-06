"use client"

import type { FieldProps } from "./field-props"

/**
 * EmailField — e-mail address input with browser-native validation.
 */
export function EmailField({ question, value, onChange, onSubmit }: FieldProps) {
    return (
        <input
            autoFocus
            className="ff-input"
            type="email"
            placeholder={question.properties.placeholder ?? "nome@exemplo.com"}
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
