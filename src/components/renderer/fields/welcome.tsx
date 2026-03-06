"use client"

import type { FieldProps } from "./field-props"

/**
 * WelcomeField — opening screen shown before the first question.
 * Renders a prominent CTA button that starts the form.
 */
export function WelcomeField({ question, onChange, onSubmit }: FieldProps) {
    const label = question.properties.buttonText ?? "Começar"

    return (
        <div className="ff-welcome">
            <button
                className="ff-cta-btn"
                onClick={() => {
                    onChange(true)
                    onSubmit()
                }}
            >
                {label}
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                    <path
                        d="M3 8h10M8 3l5 5-5 5"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            </button>
        </div>
    )
}
