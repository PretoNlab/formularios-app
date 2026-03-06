"use client"

import type { FieldProps } from "./field-props"

/**
 * NumberField — numeric input that respects `min`, `max`, and `step`
 * from the question's properties.
 */
export function NumberField({ question, value, onChange, onSubmit }: FieldProps) {
    const { placeholder, min, max, step } = question.properties

    return (
        <input
            autoFocus
            className="ff-input"
            type="number"
            placeholder={placeholder ?? "0"}
            min={min}
            max={max}
            step={step ?? 1}
            value={value !== null && value !== undefined ? String(value) : ""}
            onChange={(e) =>
                onChange(e.target.value === "" ? null : Number(e.target.value))
            }
            onKeyDown={(e) => {
                if (e.key === "Enter") {
                    e.preventDefault()
                    onSubmit()
                }
            }}
        />
    )
}
