"use client"

import type { FieldProps } from "./field-props"

/**
 * YesNoField — pair of large Yes / No buttons.
 * Selecting either one immediately calls `onSubmit` after a short delay.
 */
export function YesNoField({ onChange, onSubmit }: FieldProps) {
    const choose = (answer: boolean) => {
        onChange(answer)
        setTimeout(onSubmit, 280)
    }

    return (
        <div className="ff-yesno" role="group">
            <button
                className="ff-yesno-btn ff-yesno-yes"
                onClick={() => choose(true)}
                aria-label="Sim"
            >
                <span className="ff-yesno-icon" aria-hidden>👍</span>
                <span>Sim</span>
            </button>

            <button
                className="ff-yesno-btn ff-yesno-no"
                onClick={() => choose(false)}
                aria-label="Não"
            >
                <span className="ff-yesno-icon" aria-hidden>👎</span>
                <span>Não</span>
            </button>
        </div>
    )
}
