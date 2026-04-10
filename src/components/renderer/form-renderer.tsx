"use client"

import React, { useCallback, useEffect, useRef, useState } from "react"
import type {
    AnswerValue,
    Form,
    RendererState,
} from "@/lib/types/form"
import { getThemeCSSVariables } from "@/config/themes"
import { RichText } from "@/components/ui/rich-text"
import { FIELD_COMPONENTS } from "@/components/renderer/fields"
import { FormStyles } from "@/components/renderer/form-styles"
import { computeHiddenQuestions, resolveNextIndex } from "@/lib/logic-engine"

// Re-export FormStyles so existing imports keep working
export { FormStyles } from "@/components/renderer/form-styles"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isSafeUrl(url: string | null | undefined): boolean {
    if (!url) return false
    if (url.startsWith("/")) return true
    try {
        return new URL(url).protocol === "https:"
    } catch { return false }
}

// ─── Progress Bar ──────────────────────────────────────────────────────────────

function ProgressBar({ current, total }: { current: number; total: number }) {
    const pct = total === 0 ? 0 : Math.min(100, Math.round((current / total) * 100))
    return (
        <div className="ff-progress" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
            <div className="ff-progress-track">
                <div className="ff-progress-fill" style={{ width: `${pct}%` }} />
            </div>
            <span className="ff-progress-label">{pct}%</span>
        </div>
    )
}

// ─── Navigation ───────────────────────────────────────────────────────────────

interface NavProps {
    canGoBack: boolean
    onBack: () => void
    onNext: () => void
    isLayoutType: boolean
    isSubmitting: boolean
}

function Nav({ canGoBack, onBack, onNext, isLayoutType, isSubmitting }: NavProps) {
    if (isLayoutType) return null
    return (
        <div className="ff-nav">
            {canGoBack && (
                <button className="ff-nav-back" onClick={onBack} aria-label="Voltar">
                    ↑
                </button>
            )}
            <button
                className="ff-nav-ok"
                onClick={onNext}
                disabled={isSubmitting}
            >
                {isSubmitting ? (
                    <span className="ff-spinner" />
                ) : (
                    <>
                        OK <span className="ff-nav-enter">↵</span>
                    </>
                )}
            </button>
        </div>
    )
}

// ─── Main FormRenderer ─────────────────────────────────────────────────────────

export interface FormRendererProps {
    /** The full form definition including questions and theme */
    form: Form
    /** Called with the final answers Record when the form completes */
    onSubmit?: (answers: Record<string, AnswerValue>) => Promise<void>
    /** Called each time the user advances a question (partial response tracking) */
    onProgress?: (questionId: string, value: AnswerValue) => void
    /** Override the initial renderer state (useful for resuming partial responses) */
    initialState?: Partial<RendererState>
    /** Class name added to the root wrapper */
    className?: string
    /** When true, shows an offline-queued notice on the completion screen */
    pendingSync?: boolean
}

export function FormRenderer({
    form,
    onSubmit,
    onProgress,
    initialState,
    className = "",
    pendingSync = false,
}: FormRendererProps) {
    const questions = [...form.questions].sort((a, b) => a.order - b.order)
    const { settings, theme } = form

    const [state, setState] = useState<RendererState>({
        currentQuestionIndex: 0,
        answers: {},
        startedAt: new Date().toISOString(),
        isSubmitting: false,
        isComplete: false,
        visitedQuestions: new Set(),
        ...initialState,
    })

    // Direction for the slide animation
    const [direction, setDirection] = useState<"up" | "down">("up")
    const [animating, setAnimating] = useState(false)
    const animTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const currentQ = questions[state.currentQuestionIndex]
    const isLastQuestion = state.currentQuestionIndex >= questions.length - 1
    const isLayoutQ =
        currentQ?.type === "welcome" ||
        currentQ?.type === "statement" ||
        currentQ?.type === "thank_you"

    // ── Answer helpers ──
    const currentAnswer = currentQ ? state.answers[currentQ.id] ?? null : null

    const setAnswer = useCallback(
        (v: AnswerValue) => {
            if (!currentQ) return
            setState((s) => ({
                ...s,
                answers: { ...s.answers, [currentQ.id]: v },
            }))
        },
        [currentQ]
    )

    // ── Validation ──
    const isValid = useCallback(() => {
        if (!currentQ) return true
        const val = state.answers[currentQ.id]
        // Block navigation while a file upload is in progress (required or not)
        if (val === "__uploading__") return false
        if (!currentQ.required) return true
        if (val == null || val === "") return false
        if (Array.isArray(val) && val.length === 0) return false
        // "Outro" selecionado mas sem texto especificado
        if (typeof val === "string" && val === "__other__") return false
        if (Array.isArray(val) && val.some((v) => typeof v === "string" && v === "__other__")) return false
        return true
    }, [currentQ, state.answers])

    // ── Navigate forward ──
    const goNext = useCallback(async () => {
        if (!isValid()) return
        if (state.isComplete) return

        const hidden = computeHiddenQuestions(questions, state.answers)
        const nextIdx = resolveNextIndex(state.currentQuestionIndex, questions, state.answers, hidden)

        const nextQuestion = questions[nextIdx]
        const isNextThankYou = nextQuestion?.type === "thank_you"

        if (nextIdx >= questions.length || isLastQuestion || isNextThankYou) {
            setState((s) => ({ ...s, isSubmitting: true }))
            try {
                await onSubmit?.(state.answers)
            } finally {
                setState((s) => ({
                    ...s,
                    isSubmitting: false,
                    isComplete: true,
                    ...(isNextThankYou ? { currentQuestionIndex: nextIdx } : {}),
                }))
            }
            return
        }

        if (currentQ && onProgress) {
            onProgress(currentQ.id, state.answers[currentQ.id] ?? null)
        }

        setDirection("up")
        setAnimating(true)
        if (animTimerRef.current) clearTimeout(animTimerRef.current)
        animTimerRef.current = setTimeout(() => {
            setState((s) => ({
                ...s,
                currentQuestionIndex: nextIdx,
                visitedQuestions: new Set([...(s.visitedQuestions as Set<string>), currentQ?.id ?? ""]),
            }))
            setAnimating(false)
        }, 220)
    }, [currentQ, isLastQuestion, isValid, onProgress, onSubmit, questions,
        state.isComplete, state.answers, state.currentQuestionIndex])

    // ── Navigate back ──
    const goBack = useCallback(() => {
        if (state.currentQuestionIndex === 0) return
        const hidden = computeHiddenQuestions(questions, state.answers)
        let prevIdx = state.currentQuestionIndex - 1
        while (prevIdx > 0 && hidden.has(questions[prevIdx].id)) prevIdx--
        setDirection("down")
        setAnimating(true)
        if (animTimerRef.current) clearTimeout(animTimerRef.current)
        animTimerRef.current = setTimeout(() => {
            setState((s) => ({ ...s, currentQuestionIndex: prevIdx }))
            setAnimating(false)
        }, 220)
    }, [questions, state.currentQuestionIndex, state.answers])

    // ── Keyboard shortcut: Enter to advance ──
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Enter" && !e.shiftKey && !isLayoutQ) {
                const tag = (e.target as HTMLElement).tagName
                if (tag === "TEXTAREA" || tag === "SELECT") return
                e.preventDefault()
                goNext()
            }
        }
        window.addEventListener("keydown", handler)
        return () => window.removeEventListener("keydown", handler)
    }, [goNext, isLayoutQ])

    // ── Cleanup animation timer on unmount ──
    useEffect(() => {
        return () => {
            if (animTimerRef.current) clearTimeout(animTimerRef.current)
        }
    }, [])

    // ── CSS variables from theme ──
    const cssVars = getThemeCSSVariables(theme)

    // ── Completed screen ──
    if (state.isComplete && !questions.find((q) => q.type === "thank_you")) {
        return (
            <div className={`ff-root ${className}`} style={cssVars as React.CSSProperties}>
                <FormStyles headingFont={theme.font.heading} bodyFont={theme.font.body} />
                <div className="ff-screen ff-screen--enter">
                    <div className="ff-card">
                        <div className="ff-thankyou">
                            <div className="ff-thankyou-icon">{pendingSync ? "📡" : "🎉"}</div>
                            <h2 className="ff-question-title">{pendingSync ? "Salvo!" : "Obrigado!"}</h2>
                            <p className="ff-thankyou-text">
                                {pendingSync
                                    ? "Você está offline. Sua resposta foi salva e será enviada automaticamente quando você tiver conexão."
                                    : settings.closeMessage || "Sua resposta foi registrada com sucesso."}
                            </p>
                            {isSafeUrl(settings.downloadUrl) && (
                                <a
                                    href={settings.downloadUrl!}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="ff-download-btn"
                                >
                                    ⬇ {settings.downloadLabel || "Baixar material"}
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    if (!currentQ) return null

    const Renderer = FIELD_COMPONENTS[currentQ.type]
    const questionNumber =
        settings.showQuestionNumbers && !isLayoutQ
            ? questions
                .slice(0, state.currentQuestionIndex + 1)
                .filter((q) => q.type !== "welcome" && q.type !== "thank_you" && q.type !== "statement")
                .length
            : null

    const slideClass = animating
        ? direction === "up"
            ? "ff-screen--exit-up"
            : "ff-screen--exit-down"
        : "ff-screen--enter"

    return (
        <div className={`ff-root ${className}`} style={cssVars as React.CSSProperties}>
            <FormStyles headingFont={theme.font.heading} bodyFont={theme.font.body} />

            {settings.showProgressBar && !state.isComplete && (() => {
                const LAYOUT = new Set(["welcome", "statement", "thank_you"])
                const inputTotal = questions.filter((q) => !LAYOUT.has(q.type)).length
                const inputAnswered = questions
                    .slice(0, state.currentQuestionIndex + 1)
                    .filter((q) => !LAYOUT.has(q.type)).length
                return inputTotal > 0
                    ? <ProgressBar current={inputAnswered} total={inputTotal} />
                    : null
            })()}

            {/* Logotipo da Marca */}
            {theme.logo?.url && (
                <div 
                    className={`ff-logo-container ${
                        theme.logo.position === "left" ? "ff-logo-left" : 
                        theme.logo.position === "right" ? "ff-logo-right" : "ff-logo-center"
                    }`}
                >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={theme.logo.url} alt="Logo" className="ff-logo-img" />
                </div>
            )}

            <div className={`ff-screen ${slideClass}`}>
                <div className="ff-card" style={currentQ.properties.contentAlign ? { textAlign: currentQ.properties.contentAlign } : undefined}>
                    {questionNumber != null && (
                        <div className="ff-question-number">
                            {questionNumber} <span className="ff-question-arrow">→</span>
                        </div>
                    )}

                    <h2 className="ff-question-title">
                        <RichText text={currentQ.title} />
                        {currentQ.required && (
                            <span className="ff-required" aria-label="Obrigatório">
                                *
                            </span>
                        )}
                    </h2>

                    {currentQ.description && (
                        <p className="ff-question-desc"><RichText text={currentQ.description} /></p>
                    )}

                    {currentQ.properties.videoUrl ? (
                        <video
                            src={currentQ.properties.videoUrl}
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="ff-question-image"
                            style={{
                                display: "block",
                                maxWidth: "100%",
                                borderRadius: "8px",
                                marginTop: "0",
                                marginBottom: "24px",
                                marginLeft: currentQ.properties.contentAlign === "center" || currentQ.properties.contentAlign === "right" ? "auto" : "0",
                                marginRight: currentQ.properties.contentAlign === "center" || currentQ.properties.contentAlign === "left" || !currentQ.properties.contentAlign ? "auto" : "0",
                            }}
                        />
                    ) : currentQ.properties.imageUrl ? (
                        <img
                            src={currentQ.properties.imageUrl}
                            alt=""
                            className="ff-question-image"
                            style={{
                                display: "block",
                                maxWidth: "100%",
                                borderRadius: "8px",
                                marginTop: "0",
                                marginBottom: "24px",
                                marginLeft: currentQ.properties.contentAlign === "center" || currentQ.properties.contentAlign === "right" ? "auto" : "0",
                                marginRight: currentQ.properties.contentAlign === "center" || currentQ.properties.contentAlign === "left" || !currentQ.properties.contentAlign ? "auto" : "0",
                            }}
                        />
                    ) : null}

                    <div className="ff-answer-area">
                        <Renderer
                            question={currentQ}
                            value={currentAnswer}
                            onChange={setAnswer}
                            onSubmit={goNext}
                        />
                    </div>

                    {state.isComplete && isSafeUrl(settings.downloadUrl) && (
                        <a
                            href={settings.downloadUrl!}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ff-download-btn"
                        >
                            ⬇ {settings.downloadLabel || "Baixar material"}
                        </a>
                    )}

                    <Nav
                        canGoBack={state.currentQuestionIndex > 0}
                        onBack={goBack}
                        onNext={goNext}
                        isLayoutType={isLayoutQ && currentQ.type !== "statement"}
                        isSubmitting={state.isSubmitting}
                    />

                    {!isLayoutQ && currentQ.type !== "multiple_choice" && currentQ.type !== "yes_no" && (
                        <p className="ff-hint">
                            Pressione <kbd>Enter</kbd> ↵ para confirmar
                        </p>
                    )}
                </div>
            </div>
        </div>
    )
}
