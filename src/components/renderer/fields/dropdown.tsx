"use client"

import type { FieldProps } from "./field-props"

/**
 * DropdownField — native <select> element with themed styling.
 * Auto-advances once a non-empty option is chosen.
 */
export function DropdownField({ question, value, onChange, onSubmit }: FieldProps) {
    const options = question.properties.options ?? []

    return (
        <select
            autoFocus
            className="ff-input ff-select"
            value={(value as string) ?? ""}
            onChange={(e) => {
                if (!e.target.value) return
                onChange(e.target.value)
                setTimeout(onSubmit, 200)
            }}
        >
            <option value="" disabled>
                Escolha uma opção...
            </option>
            {options.map((opt) => (
                <option key={opt.id} value={opt.label}>
                    {opt.label}
                </option>
            ))}
        </select>
    )
}
