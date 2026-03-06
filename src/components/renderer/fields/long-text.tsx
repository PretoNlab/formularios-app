"use client"

import type { FieldProps } from "./field-props"

/**
 * LongTextField — multi-line textarea.
 * Shift+Enter advances to the next question; bare Enter adds a newline.
 */
export function LongTextField({ question, value, onChange, onSubmit }: FieldProps) {
    return (
        <div className="ff-longtext-wrapper">
            <textarea
                autoFocus
                className="ff-input ff-textarea"
                placeholder={question.properties.placeholder ?? "Digite sua resposta..."}
                maxLength={question.properties.maxLength}
                value={(value as string) ?? ""}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === "Enter" && e.shiftKey) {
                        e.preventDefault()
                        onSubmit()
                    }
                }}
                rows={4}
            />
            <p className="ff-textarea-hint">
                Shift + Enter <kbd>↵</kbd> para confirmar
            </p>
        </div>
    )
}
