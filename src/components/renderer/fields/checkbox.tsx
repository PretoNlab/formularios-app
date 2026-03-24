"use client"

import { useMemo, useState } from "react"
import type { FieldProps } from "./field-props"

export function CheckboxField({ question, value, onChange }: FieldProps) {
    const rawOptions = question.properties.options ?? []
    const allowOther = question.properties.allowOther ?? false
    const randomize = question.properties.randomizeOptions ?? false

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const options = useMemo(() => {
        if (!randomize) return rawOptions
        return [...rawOptions].sort(() => Math.random() - 0.5)
    // Depend on stable option IDs so order is fixed for the lifetime of the component
    }, [randomize, rawOptions.map((o) => o.id).join(",")])

    const selected: string[] = Array.isArray(value) ? (value as string[]) : []
    const [otherText, setOtherText] = useState(() => {
        const entry = selected.find((s) => s.startsWith("__other__"))
        return entry ? entry.slice(9) : ""
    })
    const isOtherSelected = selected.some((s) => s.startsWith("__other__"))

    const toggle = (label: string) => {
        const next = selected.includes(label)
            ? selected.filter((s) => s !== label)
            : [...selected, label]
        onChange(next)
    }

    const toggleOther = () => {
        if (isOtherSelected) {
            onChange(selected.filter((s) => !s.startsWith("__other__")))
        } else {
            onChange([...selected, `__other__${otherText}`])
        }
    }

    return (
        <div className="ff-options" role="group">
            {options.map((opt, i) => {
                const isChecked = selected.includes(opt.label)
                return (
                    <button
                        key={opt.id}
                        role="checkbox"
                        aria-checked={isChecked}
                        className={`ff-option${isChecked ? " ff-option--selected" : ""}`}
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
                <div className={`ff-option${isOtherSelected ? " ff-option--selected" : ""} flex-col !items-start gap-2`}>
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
