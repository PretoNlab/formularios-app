"use client"

import { useState } from "react"
import type { FieldProps } from "./field-props"

type RatingStyle = "stars" | "hearts" | "thumbs" | "numbers"

const EMPTY_ICONS: Record<RatingStyle, string> = {
    stars: "☆",
    hearts: "♡",
    thumbs: "👍",
    numbers: "",
}

const FILLED_ICONS: Record<RatingStyle, string> = {
    stars: "★",
    hearts: "♥",
    thumbs: "👍",
    numbers: "",
}

/**
 * RatingField — icon-based rating (stars, hearts, thumbs, or numbers).
 * Hovering highlights icons up to the hovered one.
 * Clicking sets the value and calls `onSubmit` after a short delay.
 */
export function RatingField({ question, value, onChange, onSubmit }: FieldProps) {
    const max = question.properties.ratingMax ?? 5
    const style: RatingStyle = (question.properties.ratingStyle as RatingStyle) ?? "stars"
    const current = (value as number) ?? 0
    const [hovered, setHovered] = useState(0)

    const emptyIcon = EMPTY_ICONS[style]
    const filledIcon = FILLED_ICONS[style]

    return (
        <div
            className="ff-rating"
            role="radiogroup"
            aria-label={`Avaliação de 1 a ${max}`}
            onMouseLeave={() => setHovered(0)}
        >
            {Array.from({ length: max }, (_, i) => i + 1).map((n) => {
                const isActive = n <= (hovered || current)
                return (
                    <button
                        key={n}
                        role="radio"
                        aria-checked={n === current}
                        aria-label={`${n} de ${max}`}
                        className={`ff-rating-btn${isActive ? " ff-rating-btn--active" : ""}`}
                        onMouseEnter={() => setHovered(n)}
                        onClick={() => {
                            onChange(n)
                            setTimeout(onSubmit, 350)
                        }}
                    >
                        {style === "numbers" ? n : isActive ? filledIcon : emptyIcon}
                    </button>
                )
            })}
        </div>
    )
}
