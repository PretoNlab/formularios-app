"use client"

import type { FieldProps } from "./field-props"

/**
 * CheckboxField — multi-select option list.
 * Does NOT auto-advance; the user presses the OK button when done.
 */
export function CheckboxField({ question, value, onChange }: FieldProps) {
    const options = question.properties.options ?? []
    const selected: string[] = Array.isArray(value) ? (value as string[]) : []

    const toggle = (id: string) => {
        const next = selected.includes(id)
            ? selected.filter((s) => s !== id)
            : [...selected, id]
        onChange(next)
    }

    return (
        <div className="ff-options" role="group">
            {options.map((opt, i) => {
                const isChecked = selected.includes(opt.id)
                return (
                    <button
                        key={opt.id}
                        role="checkbox"
                        aria-checked={isChecked}
                        className={`ff-option${isChecked ? " ff-option--selected" : ""}`}
                        onClick={() => toggle(opt.id)}
                    >
                        {opt.imageUrl && (
                            <img src={opt.imageUrl} alt="" className="ff-option-img" />
                        )}
                        <span className="ff-option-letter" aria-hidden>
                            {String.fromCharCode(65 + i)}
                        </span>
                        <span className="ff-option-label">{opt.label}</span>
                        <span
                            className={`ff-option-checkbox${isChecked ? " ff-option-checkbox--checked" : ""}`}
                            aria-hidden
                        >
                            {isChecked ? "✓" : ""}
                        </span>
                    </button>
                )
            })}
        </div>
    )
}
