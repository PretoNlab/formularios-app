"use client"

import type { FieldProps } from "./field-props"

/**
 * DateField — native date picker input.
 * Enter submits the currently selected date.
 */
export function DateField({ value, onChange, onSubmit }: FieldProps) {
    return (
        <input
            autoFocus
            className="ff-input"
            type="date"
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
