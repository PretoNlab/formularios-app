"use client"

import { ScaleField } from "./scale"
import type { FieldProps } from "./field-props"

/**
 * NpsField — Net Promoter Score question (0–10).
 * Reuses `ScaleField` with the NPS-specific defaults applied, but lets
 * the question's `properties` override labels so the builder can customise them.
 */
export function NpsField({ question, value, onChange, onSubmit }: FieldProps) {
    const mergedQuestion = {
        ...question,
        properties: {
            scaleMin: 0,
            scaleMax: 10,
            scaleMinLabel: "Nada provável",
            scaleMaxLabel: "Muito provável",
            ...question.properties,
        },
    }

    return (
        <ScaleField
            question={mergedQuestion}
            value={value}
            onChange={onChange}
            onSubmit={onSubmit}
        />
    )
}
