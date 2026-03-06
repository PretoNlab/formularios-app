"use client"

import type { FieldProps } from "./field-props"

/**
 * ScaleField — numeric scale from `scaleMin` to `scaleMax` (default 1–10).
 * Each number is a button; clicking sets the value and calls `onSubmit`.
 * Optional min/max labels describe the extremes.
 */
export function ScaleField({ question, value, onChange, onSubmit }: FieldProps) {
    const {
        scaleMin = 1,
        scaleMax = 10,
        scaleMinLabel = "",
        scaleMaxLabel = "",
    } = question.properties
    const current = value as number | null

    const steps = Array.from(
        { length: scaleMax - scaleMin + 1 },
        (_, i) => scaleMin + i
    )

    return (
        <div className="ff-scale">
            <div className="ff-scale-buttons" role="radiogroup">
                {steps.map((n) => (
                    <button
                        key={n}
                        role="radio"
                        aria-checked={current === n}
                        aria-label={String(n)}
                        className={`ff-scale-btn${current === n ? " ff-scale-btn--active" : ""}`}
                        onClick={() => {
                            onChange(n)
                            setTimeout(onSubmit, 300)
                        }}
                    >
                        {n}
                    </button>
                ))}
            </div>

            {(scaleMinLabel || scaleMaxLabel) && (
                <div className="ff-scale-labels" aria-hidden>
                    <span>{scaleMinLabel}</span>
                    <span>{scaleMaxLabel}</span>
                </div>
            )}
        </div>
    )
}
