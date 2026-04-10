"use client"

import React, { useEffect } from "react"
import type { FieldProps } from "./field-props"

/**
 * Ranking field — reorder items by preference using arrow buttons.
 *
 * Stores value as string[] representing the ordered list of labels.
 */
export function RankingField({ question, value, onChange }: FieldProps) {
    const options = question.properties.options ?? []

    // Initialize with option labels in original order if no value yet
    const items: string[] = Array.isArray(value) && value.length > 0
        ? value as string[]
        : options.map((o) => o.label)

    // Emit the initial order on mount so the answer is always saved
    useEffect(() => {
        if ((!value || (Array.isArray(value) && value.length === 0)) && options.length > 0) {
            onChange(options.map((o) => o.label))
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const moveUp = (index: number) => {
        if (index === 0) return
        const next = [...items]
        ;[next[index - 1], next[index]] = [next[index], next[index - 1]]
        onChange(next)
    }

    const moveDown = (index: number) => {
        if (index === items.length - 1) return
        const next = [...items]
        ;[next[index], next[index + 1]] = [next[index + 1], next[index]]
        onChange(next)
    }

    if (options.length === 0) {
        return <p style={{ color: "var(--ff-muted)", fontSize: "0.9rem" }}>Adicione opções para ordenar.</p>
    }

    return (
        <div className="ff-ranking">
            {items.map((item, i) => (
                <div key={item} className="ff-ranking-item">
                    <span className="ff-ranking-number">{i + 1}</span>
                    <span className="ff-ranking-handle">⠿</span>
                    <span>{item}</span>
                    <div className="ff-ranking-arrows">
                        <button
                            type="button"
                            className="ff-ranking-arrow-btn"
                            disabled={i === 0}
                            onClick={() => moveUp(i)}
                            aria-label={`Mover ${item} para cima`}
                        >
                            ▲
                        </button>
                        <button
                            type="button"
                            className="ff-ranking-arrow-btn"
                            disabled={i === items.length - 1}
                            onClick={() => moveDown(i)}
                            aria-label={`Mover ${item} para baixo`}
                        >
                            ▼
                        </button>
                    </div>
                </div>
            ))}
        </div>
    )
}
