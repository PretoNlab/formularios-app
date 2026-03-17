"use client"

import type { FieldProps } from "./field-props"

/**
 * MultipleChoiceField — single-select option list.
 * Selecting an option immediately calls `onSubmit` after a short delay
 * so the user can see the selection before the transition.
 */
export function MultipleChoiceField({ question, value, onChange, onSubmit }: FieldProps) {
    const options = question.properties.options ?? []
    const selected = (value as string) ?? null

    return (
        <div className="ff-options" role="radiogroup">
            {options.map((opt, i) => {
                const isSelected = selected === opt.label
                return (
                    <button
                        key={opt.id}
                        role="radio"
                        aria-checked={isSelected}
                        className={`ff-option${isSelected ? " ff-option--selected" : ""}`}
                        onClick={() => {
                            onChange(opt.label)
                            setTimeout(onSubmit, 280)
                        }}
                    >
                        {opt.imageUrl && (
                            <img src={opt.imageUrl} alt="" className="ff-option-img" />
                        )}
                        <span className="ff-option-letter" aria-hidden>
                            {String.fromCharCode(65 + i)}
                        </span>
                        <span className="ff-option-label">{opt.label}</span>
                        {isSelected && <span className="ff-option-check" aria-hidden>✓</span>}
                    </button>
                )
            })}
        </div>
    )
}
