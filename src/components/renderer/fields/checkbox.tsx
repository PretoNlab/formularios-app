"use client"

import { useMemo, useState } from "react"
import type { FieldProps } from "./field-props"

export function CheckboxField({ question, value, onChange }: FieldProps) {
    const rawOptions = question.properties.options ?? []
    const allowOther = question.properties.allowOther ?? false
    const randomize = question.properties.randomizeOptions ?? false
    const minSelections = question.properties.minSelections
    const maxSelections = question.properties.maxSelections

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const options = useMemo(() => {
        if (!randomize) return rawOptions
        return [...rawOptions].sort(() => Math.random() - 0.5)
    // Depend on question.id so we recompute when navigating between questions,
    // and on stable option IDs so order is fixed for the lifetime of the component
    }, [question.id, randomize, rawOptions.map((o) => o.id).join(",")])


    const selected: string[] = Array.isArray(value) ? (value as string[]) : []
    const [otherText, setOtherText] = useState(() => {
        const entry = selected.find((s) => s.startsWith("__other__"))
        return entry ? entry.slice(9) : ""
    })
    const isOtherSelected = selected.some((s) => s.startsWith("__other__"))

    // True when adding another selection would exceed the max
    const atMax = maxSelections !== undefined && selected.length >= maxSelections

    const toggle = (label: string) => {
        if (selected.includes(label)) {
            // Always allow deselection
            onChange(selected.filter((s) => s !== label))
        } else {
            // Block if at max
            if (atMax) return
            onChange([...selected, label])
        }
    }

    const toggleOther = () => {
        if (isOtherSelected) {
            onChange(selected.filter((s) => !s.startsWith("__other__")))
        } else {
            if (atMax) return
            onChange([...selected, `__other__${otherText}`])
        }
    }

    // Build the selection hint to show below the options
    const hintText = (() => {
        if (maxSelections !== undefined && minSelections !== undefined) {
            return `Escolha entre ${minSelections} e ${maxSelections} opções`
        }
        if (maxSelections !== undefined) {
            return `Escolha no máximo ${maxSelections} opção${maxSelections !== 1 ? "s" : ""}`
        }
        if (minSelections !== undefined) {
            return `Escolha pelo menos ${minSelections} opção${minSelections !== 1 ? "s" : ""}`
        }
        return null
    })()

    return (
        <div className="ff-options" role="group">
            {hintText && (
                <p className="ff-checkbox-hint">
                    {hintText}
                    {maxSelections !== undefined && (
                        <span className="ff-checkbox-count"> ({selected.length}/{maxSelections})</span>
                    )}
                </p>
            )}

            {options.map((opt, i) => {
                const isChecked = selected.includes(opt.label)
                // Dim options that can't be selected (at max and not already checked)
                const isDisabled = !isChecked && atMax
                return (
                    <button
                        key={opt.id}
                        role="checkbox"
                        aria-checked={isChecked}
                        aria-disabled={isDisabled}
                        className={`ff-option${isChecked ? " ff-option--selected" : ""}${isDisabled ? " ff-option--disabled" : ""}`}
                        onClick={() => toggle(opt.label)}
                    >
                        {opt.imageUrl && <img src={opt.imageUrl} alt="" className="ff-option-img" />}
                        <span className="ff-option-letter" aria-hidden>{String.fromCharCode(65 + i)}</span>
                        <span className="ff-option-label">{opt.label}</span>
                        <span className={`ff-option-checkbox${isChecked ? " ff-option-checkbox--checked" : ""}`} aria-hidden>
                            {isChecked ? "✓" : ""}
                        </span>
                    </button>
                )
            })}

            {allowOther && (
                <div className={`ff-option${isOtherSelected ? " ff-option--selected" : ""}${!isOtherSelected && atMax ? " ff-option--disabled" : ""} flex-col !items-start gap-2`}>
                    <div className="flex w-full items-center gap-3 cursor-pointer" onClick={toggleOther}>
                        <span className="ff-option-letter" aria-hidden>{String.fromCharCode(65 + options.length)}</span>
                        <span className="ff-option-label">Outro</span>
                        <span className={`ff-option-checkbox${isOtherSelected ? " ff-option-checkbox--checked" : ""}`} aria-hidden>
                            {isOtherSelected ? "✓" : ""}
                        </span>
                    </div>
                    {isOtherSelected && (
                        <input
                            autoFocus
                            className="w-full bg-transparent border-b border-current outline-none text-sm pb-1 placeholder:opacity-50"
                            placeholder="Especifique..."
                            value={otherText}
                            onChange={(e) => {
                                setOtherText(e.target.value)
                                const next = selected.filter((s) => !s.startsWith("__other__"))
                                onChange([...next, `__other__${e.target.value}`])
                            }}
                        />
                    )}
                </div>
            )}
        </div>
    )
}
