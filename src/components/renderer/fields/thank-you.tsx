"use client"

import type { FieldProps } from "./field-props"

/**
 * ThankYouField — final screen displayed after the form is submitted.
 * No input is collected; it is purely a completion acknowledgement.
 */
export function ThankYouField({ question }: FieldProps) {
    return (
        <div className="ff-thankyou" aria-live="polite">
            <div className="ff-thankyou-icon" aria-hidden>
                🎉
            </div>
            <p className="ff-thankyou-text">
                {question.properties.buttonText ?? "Obrigado por responder!"}
            </p>
        </div>
    )
}
