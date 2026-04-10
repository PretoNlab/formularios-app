"use client"

import React from "react"
import type { FieldProps } from "./field-props"

/**
 * Matrix field — a grid of radio buttons for rating multiple items
 * on the same set of columns (e.g. "Very Bad → Very Good").
 *
 * Stores value as Record<string, string> where keys are row labels
 * and values are the selected column label.
 */
export function MatrixField({ question, value, onChange }: FieldProps) {
    const rows = question.properties.matrixRows ?? []
    const columns = question.properties.matrixColumns ?? []
    const answers = (value && typeof value === "object" && !Array.isArray(value) && !("fileUrl" in value))
        ? value as Record<string, string>
        : {} as Record<string, string>

    const handleChange = (row: string, col: string) => {
        const next = { ...answers, [row]: col }
        onChange(next as unknown as string)
    }

    if (rows.length === 0 || columns.length === 0) {
        return <p style={{ color: "var(--ff-muted)", fontSize: "0.9rem" }}>Configure as linhas e colunas da matrix.</p>
    }

    return (
        <div className="ff-matrix">
            <table className="ff-matrix-table">
                <thead>
                    <tr>
                        <th />
                        {columns.map((col) => (
                            <th key={col}>{col}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row) => (
                        <tr key={row}>
                            <td>{row}</td>
                            {columns.map((col) => (
                                <td key={col} data-label={col}>
                                    <input
                                        type="radio"
                                        className="ff-matrix-radio"
                                        name={`matrix-${question.id}-${row}`}
                                        checked={answers[row] === col}
                                        onChange={() => handleChange(row, col)}
                                    />
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}
