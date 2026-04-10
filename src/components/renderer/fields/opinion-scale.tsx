"use client"

import React from "react"
import type { FieldProps } from "./field-props"

/**
 * Opinion Scale field — a horizontal segmented scale with labels.
 *
 * Similar to Scale but uses a connected segmented control style,
 * ideal for Likert-type agreement scales.
 *
 * Stores value as a number.
 */
export function OpinionScaleField({ question, value, onChange, onSubmit }: FieldProps) {
    const min = question.properties.scaleMin ?? 1
    const max = question.properties.scaleMax ?? 5
    const minLabel = question.properties.scaleMinLabel ?? ""
    const maxLabel = question.properties.scaleMaxLabel ?? ""
    const current = value as number | null

    return (
        <div className="ff-opinion-scale">
            <div className="ff-opinion-scale-buttons">
                {Array.from({ length: max - min + 1 }, (_, i) => min + i).map((n) => (
                    <button
                        key={n}
                        className={`ff-opinion-scale-btn ${current === n ? "ff-opinion-scale-btn--active" : ""}`}
                        onClick={() => {
                            onChange(n)
                            setTimeout(onSubmit, 300)
                        }}
                    >
                        {n}
                    </button>
                ))}
            </div>
            {(minLabel || maxLabel) && (
                <div className="ff-opinion-scale-labels">
                    <span>{minLabel}</span>
                    <span>{maxLabel}</span>
                </div>
            )}
        </div>
    )
}
