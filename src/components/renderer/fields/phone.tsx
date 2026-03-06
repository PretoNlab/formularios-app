"use client"

import type { FieldProps } from "./field-props"

/**
 * PhoneField — telephone number input.
 * Uses `type="tel"` so mobile keyboards show the dial pad.
 */
export function PhoneField({ question, value, onChange, onSubmit }: FieldProps) {
    return (
        <input
            autoFocus
            className="ff-input"
            type="tel"
            placeholder={question.properties.placeholder ?? "(00) 00000-0000"}
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
