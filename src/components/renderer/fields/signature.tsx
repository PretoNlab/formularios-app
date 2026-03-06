"use client"

import { useEffect, useRef } from "react"
import type { FieldProps } from "./field-props"

/**
 * SignatureField — canvas-based freehand signature pad.
 * Supports mouse and touch/pointer events.
 * The answer value is a data-URL PNG string (or null when cleared).
 */
export function SignatureField({ value, onChange }: FieldProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const isDrawing = useRef(false)

    // Restore existing signature when the field re-mounts (e.g. navigating back)
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas || !value) return
        const img = new Image()
        img.onload = () => canvas.getContext("2d")?.drawImage(img, 0, 0)
        img.src = value as string
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext("2d")!

        ctx.strokeStyle = "var(--ff-accent, #6c63ff)"
        ctx.lineWidth = 2
        ctx.lineCap = "round"
        ctx.lineJoin = "round"

        const getPos = (e: PointerEvent) => {
            const rect = canvas.getBoundingClientRect()
            const scaleX = canvas.width / rect.width
            const scaleY = canvas.height / rect.height
            return {
                x: (e.clientX - rect.left) * scaleX,
                y: (e.clientY - rect.top) * scaleY,
            }
        }

        const start = (e: PointerEvent) => {
            isDrawing.current = true
            const { x, y } = getPos(e)
            ctx.beginPath()
            ctx.moveTo(x, y)
            canvas.setPointerCapture(e.pointerId)
        }

        const draw = (e: PointerEvent) => {
            if (!isDrawing.current) return
            const { x, y } = getPos(e)
            ctx.lineTo(x, y)
            ctx.stroke()
        }

        const stop = () => {
            if (!isDrawing.current) return
            isDrawing.current = false
            onChange(canvas.toDataURL("image/png"))
        }

        canvas.addEventListener("pointerdown", start)
        canvas.addEventListener("pointermove", draw)
        canvas.addEventListener("pointerup", stop)
        canvas.addEventListener("pointercancel", stop)

        return () => {
            canvas.removeEventListener("pointerdown", start)
            canvas.removeEventListener("pointermove", draw)
            canvas.removeEventListener("pointerup", stop)
            canvas.removeEventListener("pointercancel", stop)
        }
    }, [onChange])

    const clear = () => {
        const canvas = canvasRef.current
        if (!canvas) return
        canvas.getContext("2d")!.clearRect(0, 0, canvas.width, canvas.height)
        onChange(null)
    }

    return (
        <div className="ff-signature">
            <canvas
                ref={canvasRef}
                className="ff-signature-canvas"
                width={480}
                height={160}
                aria-label="Área de assinatura"
                style={{ touchAction: "none" }}
            />
            <div className="ff-signature-footer">
                {value && (
                    <span className="ff-signature-saved" aria-live="polite">
                        ✓ Assinatura registrada
                    </span>
                )}
                <button className="ff-signature-clear" onClick={clear} type="button">
                    Limpar
                </button>
            </div>
        </div>
    )
}
