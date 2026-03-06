"use client"

import type { FieldProps } from "./field-props"

/**
 * UrlField — URL input with `type="url"` for browser-native validation.
 */
export function UrlField({ question, value, onChange, onSubmit }: FieldProps) {
    return (
        <input
            autoFocus
            className="ff-input"
            type="url"
            placeholder={question.properties.placeholder ?? "https://"}
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
