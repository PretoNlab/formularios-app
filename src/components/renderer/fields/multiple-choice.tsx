"use client"

import { useMemo, useState } from "react"
import type { FieldProps } from "./field-props"

export function MultipleChoiceField({ question, value, onChange, onSubmit }: FieldProps) {
    const rawOptions = question.properties.options ?? []
    const allowOther = question.properties.allowOther ?? false
    const randomize = question.properties.randomizeOptions ?? false

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const options = useMemo(() => {
        if (!randomize) return rawOptions
        return [...rawOptions].sort(() => Math.random() - 0.5)
    // Depend on stable option IDs so order is fixed for the lifetime of the component
    }, [randomize, rawOptions.map((o) => o.id).join(",")])

    const selected = (value as string) ?? null
    const [otherText, setOtherText] = useState(selected?.startsWith("__other__") ? selected.slice(9) : "")
    const isOtherSelected = selected?.startsWith("__other__") ?? false

    return (
        <div className="ff-options" role="radiogroup">
            {options.map((opt, i) => {
                const isSelected = selected === opt.label
                return (
                    <button
                        key={opt.id}
                        role="radio"
                        aria-checked={isSelected}
                        className={`ff-option${isSelected ? " ff-option--selected" : ""}`}
                        onClick={() => {
                            onChange(opt.label)
                            setTimeout(onSubmit, 280)
                        }}
                    >
                        {opt.imageUrl && <img src={opt.imageUrl} alt="" className="ff-option-img" />}
                        <span className="ff-option-letter" aria-hidden>{String.fromCharCode(65 + i)}</span>
                        <span className="ff-option-label">{opt.label}</span>
                        {isSelected && <span className="ff-option-check" aria-hidden>✓</span>}
                    </button>
                )
            })}

            {allowOther && (
                <div className={`ff-option${isOtherSelected ? " ff-option--selected" : ""} flex-col !items-start gap-2`}>
                    <div
                        className="flex w-full items-center gap-3 cursor-pointer"
                        onClick={() => {
                            if (!isOtherSelected) onChange(`__other__${otherText}`)
                        }}
                    >
                        <span className="ff-option-letter" aria-hidden>{String.fromCharCode(65 + options.length)}</span>
                        <span className="ff-option-label">Outro</span>
                        {isOtherSelected && <span className="ff-option-check" aria-hidden>✓</span>}
                    </div>
                    {isOtherSelected && (
                        <input
                            autoFocus
                            className="w-full bg-transparent border-b border-current outline-none text-sm pb-1 placeholder:opacity-50"
                            placeholder="Especifique..."
                            value={otherText}
                            onChange={(e) => {
                                setOtherText(e.target.value)
                                onChange(`__other__${e.target.value}`)
                            }}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") setTimeout(onSubmit, 100)
                            }}
                        />
                    )}
                </div>
            )}
        </div>
    )
}
