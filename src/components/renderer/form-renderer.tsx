"use client"

import React, { useCallback, useEffect, useRef, useState } from "react"
import { preload } from "react-dom"
import type {
    AnswerValue,
    Form,
    Question,
    QuestionType,
    RendererState,
} from "@/lib/types/form"
import { getThemeCSSVariables } from "@/config/themes"
import { RichText } from "@/components/ui/rich-text"

// ─── Helpers ──────────────────────────────────────────────────────────────────

import type { LogicCondition, LogicRule } from "@/lib/types/form"

function isSafeUrl(url: string | null | undefined): boolean {
    if (!url) return false
    if (url.startsWith("/")) return true
    try {
        return new URL(url).protocol === "https:"
    } catch { return false }
}

function evaluateCondition(condition: LogicCondition, answers: Record<string, AnswerValue>): boolean {
    const answerVal = answers[condition.questionId]
    switch (condition.operator) {
        case "equals":      return answerVal == condition.value
        case "not_equals":  return answerVal != condition.value
        case "contains":    return typeof answerVal === "string" && answerVal.includes(String(condition.value))
        case "not_contains":return typeof answerVal === "string" && !answerVal.includes(String(condition.value))
        case "greater_than":return Number(answerVal) > Number(condition.value)
        case "less_than":   return Number(answerVal) < Number(condition.value)
        case "is_empty":    return answerVal == null || answerVal === ""
        case "is_not_empty":return answerVal != null && answerVal !== ""
        default:            return false
    }
}

function evaluateRule(rule: LogicRule, answers: Record<string, AnswerValue>): boolean {
    const conditions = rule.conditions?.length ? rule.conditions : [rule.condition]
    const op = rule.conditionOperator ?? "and"
    return op === "and"
        ? conditions.every((c) => evaluateCondition(c, answers))
        : conditions.some((c) => evaluateCondition(c, answers))
}

function computeHiddenQuestions(questions: Question[], answers: Record<string, AnswerValue>): Set<string> {
    const hidden = new Set<string>()
    for (const q of questions) {
        for (const rule of q.logicRules ?? []) {
            if (evaluateRule(rule, answers) && rule.action.type === "hide_question" && rule.action.targetQuestionId) {
                hidden.add(rule.action.targetQuestionId)
            }
        }
    }
    return hidden
}

function resolveNextIndex(
    current: number,
    questions: Question[],
    answers: Record<string, AnswerValue>,
    hidden: Set<string>
): number {
    const q = questions[current]
    if (q?.logicRules?.length) {
        for (const rule of q.logicRules) {
            if (evaluateRule(rule, answers)) {
                if (rule.action.type === "end_form") return questions.length
                if (rule.action.type === "jump_to" && rule.action.targetQuestionId) {
                    const idx = questions.findIndex((x) => x.id === rule.action.targetQuestionId)
                    if (idx !== -1) return idx
                }
            }
        }
    }
    // advance past hidden questions
    let next = current + 1
    while (next < questions.length && hidden.has(questions[next].id)) next++
    return next
}

// ─── Individual Question Renderers ────────────────────────────────────────────

interface InputProps {
    question: Question
    value: AnswerValue
    formId?: string
    onChange: (v: AnswerValue) => void
    onSubmit: () => void
}

function ShortTextInput({ question, value, onChange, onSubmit }: InputProps) {
    return (
        <input
            autoFocus
            className="ff-input"
            type="text"
            placeholder={question.properties.placeholder ?? "Digite sua resposta..."}
            maxLength={question.properties.maxLength}
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSubmit()}
        />
    )
}

function LongTextInput({ question, value, onChange, onSubmit }: InputProps) {
    return (
        <textarea
            autoFocus
            className="ff-input ff-textarea"
            placeholder={question.properties.placeholder ?? "Digite sua resposta..."}
            maxLength={question.properties.maxLength}
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
                if (e.key === "Enter" && e.shiftKey) onSubmit()
            }}
            rows={4}
        />
    )
}

function EmailInput({ question, value, onChange, onSubmit }: InputProps) {
    return (
        <input
            autoFocus
            className="ff-input"
            type="email"
            placeholder={question.properties.placeholder ?? "nome@exemplo.com"}
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSubmit()}
        />
    )
}

function NumberInput({ question, value, onChange, onSubmit }: InputProps) {
    return (
        <input
            autoFocus
            className="ff-input"
            type="number"
            placeholder={question.properties.placeholder ?? "0"}
            min={question.properties.min}
            max={question.properties.max}
            step={question.properties.step ?? 1}
            value={(value as number) ?? ""}
            onChange={(e) =>
                onChange(e.target.value === "" ? null : Number(e.target.value))
            }
            onKeyDown={(e) => e.key === "Enter" && onSubmit()}
        />
    )
}

function PhoneInput({ question, value, onChange, onSubmit }: InputProps) {
    const rawVal = (value as string) ?? ""
    let code = "+55"
    let num = rawVal

        if (rawVal.includes(" ")) {
        const parts = rawVal.split(" ")
        if (parts[0].startsWith("+")) {
            code = parts[0]
            num = parts.slice(1).join(" ")
        }
    }

    const PHONE_LIMITS: Record<string, number> = {
        "+55": 11,
        "+1": 10,
        "+351": 9,
        "+44": 11,
        "+34": 9,
        "+49": 11,
    }

    const handleCodeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newCode = e.target.value
        const limit = PHONE_LIMITS[newCode] ?? 15
        const cleaned = num.replace(/\D/g, "").slice(0, limit)
        if (!cleaned) {
            onChange(null)
        } else {
            onChange(`${newCode} ${cleaned}`)
        }
    }

    const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const limit = PHONE_LIMITS[code] ?? 15
        const cleaned = e.target.value.replace(/\D/g, "").slice(0, limit)
        if (!cleaned) {
            onChange(null)
        } else {
            onChange(`${code} ${cleaned}`)
        }
    }

    return (
        <div className="ff-phone-container">
            <select
                className="ff-input ff-phone-code"
                value={code}
                onChange={handleCodeChange}
            >
                <option value="+55">🇧🇷 +55</option>
                <option value="+1">🇺🇸 +1</option>
                <option value="+351">🇵🇹 +351</option>
                <option value="+44">🇬🇧 +44</option>
                <option value="+34">🇪🇸 +34</option>
                <option value="+49">🇩🇪 +49</option>
            </select>
            <input
                autoFocus
                className="ff-input ff-phone-input"
                type="tel"
                inputMode="numeric"
                placeholder={question.properties.placeholder ?? "(00) 00000-0000"}
                value={num}
                onChange={handleNumberChange}
                onKeyDown={(e) => e.key === "Enter" && onSubmit()}
            />
        </div>
    )
}

function WhatsAppInput({ question, value, onChange, onSubmit }: InputProps) {
    function mask(raw: string): string {
        const d = raw.replace(/\D/g, "").slice(0, 11)
        if (d.length <= 2) return d
        if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`
        if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
        return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
    }
    return (
        <input
            autoFocus
            className="ff-input"
            type="tel"
            inputMode="numeric"
            placeholder={question.properties.placeholder ?? "(00) 00000-0000"}
            value={(value as string) ?? ""}
            onChange={(e) => onChange(mask(e.target.value))}
            onKeyDown={(e) => e.key === "Enter" && onSubmit()}
        />
    )
}

function CpfInput({ question, value, onChange, onSubmit }: InputProps) {
    function mask(raw: string): string {
        const d = raw.replace(/\D/g, "").slice(0, 11)
        if (d.length <= 3) return d
        if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`
        if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`
        return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`
    }
    return (
        <input
            autoFocus
            className="ff-input"
            type="text"
            inputMode="numeric"
            placeholder={question.properties.placeholder ?? "000.000.000-00"}
            value={(value as string) ?? ""}
            onChange={(e) => onChange(mask(e.target.value))}
            onKeyDown={(e) => e.key === "Enter" && onSubmit()}
        />
    )
}

function CnpjInput({ question, value, onChange, onSubmit }: InputProps) {
    function mask(raw: string): string {
        const d = raw.replace(/\D/g, "").slice(0, 14)
        if (d.length <= 2) return d
        if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`
        if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`
        if (d.length <= 12) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`
        return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`
    }
    return (
        <input
            autoFocus
            className="ff-input"
            type="text"
            inputMode="numeric"
            placeholder={question.properties.placeholder ?? "00.000.000/0000-00"}
            value={(value as string) ?? ""}
            onChange={(e) => onChange(mask(e.target.value))}
            onKeyDown={(e) => e.key === "Enter" && onSubmit()}
        />
    )
}

function DateInput({ question, value, onChange, onSubmit }: InputProps) {
    return (
        <input
            autoFocus
            className="ff-input"
            type="date"
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSubmit()}
        />
    )
}

function UrlInput({ question, value, onChange, onSubmit }: InputProps) {
    return (
        <input
            autoFocus
            className="ff-input"
            type="url"
            placeholder={question.properties.placeholder ?? "https://"}
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSubmit()}
        />
    )
}

function MultipleChoiceInput({ question, value, onChange, onSubmit }: InputProps) {
    const options = question.properties.options ?? []
    const allowOther = question.properties.allowOther ?? false
    const selected = (value as string) ?? null
    const isOtherSelected = selected?.startsWith("__other__") ?? false
    const [otherText, setOtherText] = useState(isOtherSelected ? selected!.slice(9) : "")

    return (
        <div className="ff-options">
            {options.map((opt, i) => (
                <button
                    key={opt.id}
                    className={`ff-option ${selected === opt.label ? "ff-option--selected" : ""}`}
                    onClick={() => {
                        onChange(opt.label)
                        setTimeout(onSubmit, 250)
                    }}
                >
                    <span className="ff-option-letter">{String.fromCharCode(65 + i)}</span>
                    <span>{opt.label}</span>
                </button>
            ))}
            {allowOther && (
                <div className={`ff-option ${isOtherSelected ? "ff-option--selected" : ""}`} style={{ flexDirection: "column", alignItems: "stretch", gap: 8 }}>
                    <div
                        style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer", width: "100%" }}
                        onClick={() => {
                            if (!isOtherSelected) onChange(`__other__${otherText}`)
                        }}
                    >
                        <span className="ff-option-letter">{String.fromCharCode(65 + options.length)}</span>
                        <span>Outro</span>
                    </div>
                    {isOtherSelected && (
                        <input
                            autoFocus
                            placeholder="Especifique..."
                            value={otherText}
                            onChange={(e) => {
                                setOtherText(e.target.value)
                                onChange(`__other__${e.target.value}`)
                            }}
                            style={{
                                width: "100%",
                                background: "transparent",
                                border: "none",
                                borderBottom: "1px solid currentColor",
                                outline: "none",
                                fontSize: 14,
                                paddingBottom: 4,
                                color: "inherit",
                            }}
                        />
                    )}
                </div>
            )}
        </div>
    )
}

function CheckboxInput({ question, value, onChange }: InputProps) {
    const options = question.properties.options ?? []
    const allowOther = question.properties.allowOther ?? false
    const selected: string[] = Array.isArray(value) ? (value as string[]) : []
    const otherEntry = selected.find((s) => s.startsWith("__other__"))
    const isOtherSelected = !!otherEntry
    const [otherText, setOtherText] = useState(otherEntry ? otherEntry.slice(9) : "")

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
        <div className="ff-options">
            {options.map((opt, i) => (
                <button
                    key={opt.id}
                    className={`ff-option ${selected.includes(opt.label) ? "ff-option--selected" : ""}`}
                    onClick={() => toggle(opt.label)}
                >
                    <span className="ff-option-letter">{String.fromCharCode(65 + i)}</span>
                    <span>{opt.label}</span>
                    {selected.includes(opt.label) && (
                        <span className="ff-option-check">✓</span>
                    )}
                </button>
            ))}
            {allowOther && (
                <div className={`ff-option ${isOtherSelected ? "ff-option--selected" : ""}`} style={{ flexDirection: "column", alignItems: "stretch", gap: 8 }}>
                    <div
                        style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer", width: "100%" }}
                        onClick={toggleOther}
                    >
                        <span className="ff-option-letter">{String.fromCharCode(65 + options.length)}</span>
                        <span>Outro</span>
                        {isOtherSelected && <span className="ff-option-check">✓</span>}
                    </div>
                    {isOtherSelected && (
                        <input
                            autoFocus
                            placeholder="Especifique..."
                            value={otherText}
                            onChange={(e) => {
                                setOtherText(e.target.value)
                                const next = selected.filter((s) => !s.startsWith("__other__"))
                                onChange([...next, `__other__${e.target.value}`])
                            }}
                            style={{
                                width: "100%",
                                background: "transparent",
                                border: "none",
                                borderBottom: "1px solid currentColor",
                                outline: "none",
                                fontSize: 14,
                                paddingBottom: 4,
                                color: "inherit",
                            }}
                        />
                    )}
                </div>
            )}
        </div>
    )
}

function DropdownInput({ question, value, onChange, onSubmit }: InputProps) {
    const options = question.properties.options ?? []
    return (
        <select
            autoFocus
            className="ff-input ff-select"
            value={(value as string) ?? ""}
            onChange={(e) => {
                onChange(e.target.value)
                setTimeout(onSubmit, 250)
            }}
        >
            <option value="" disabled>
                Escolha uma opção...
            </option>
            {options.map((opt) => (
                <option key={opt.id} value={opt.label}>
                    {opt.label}
                </option>
            ))}
        </select>
    )
}

function YesNoInput({ onChange, onSubmit }: InputProps) {
    return (
        <div className="ff-yesno">
            <button
                className="ff-yesno-btn ff-yesno-yes"
                onClick={() => {
                    onChange(true)
                    setTimeout(onSubmit, 250)
                }}
            >
                <span className="ff-yesno-icon">👍</span>
                <span>Sim</span>
            </button>
            <button
                className="ff-yesno-btn ff-yesno-no"
                onClick={() => {
                    onChange(false)
                    setTimeout(onSubmit, 250)
                }}
            >
                <span className="ff-yesno-icon">👎</span>
                <span>Não</span>
            </button>
        </div>
    )
}

function RatingInput({ question, value, onChange, onSubmit }: InputProps) {
    const max = question.properties.ratingMax ?? 5
    const style = question.properties.ratingStyle ?? "stars"
    const current = (value as number) ?? 0

    const icons: Record<string, [string, string]> = {
        stars: ["☆", "★"],
        hearts: ["♡", "♥"],
        thumbs: ["👍", "👍"],
        numbers: ["", ""],
    }

    const [empty, filled] = icons[style] ?? ["☆", "★"]

    return (
        <div className="ff-rating">
            {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
                <button
                    key={n}
                    className={`ff-rating-btn ${n <= current ? "ff-rating-btn--active" : ""}`}
                    onClick={() => {
                        onChange(n)
                        setTimeout(onSubmit, 300)
                    }}
                >
                    {style === "numbers" ? n : n <= current ? filled : empty}
                </button>
            ))}
        </div>
    )
}

function ScaleInput({ question, value, onChange, onSubmit }: InputProps) {
    const min = question.properties.scaleMin ?? 1
    const max = question.properties.scaleMax ?? 10
    const minLabel = question.properties.scaleMinLabel ?? ""
    const maxLabel = question.properties.scaleMaxLabel ?? ""
    const current = value as number | null

    return (
        <div className="ff-scale">
            <div className="ff-scale-buttons">
                {Array.from({ length: max - min + 1 }, (_, i) => min + i).map((n) => (
                    <button
                        key={n}
                        className={`ff-scale-btn ${current === n ? "ff-scale-btn--active" : ""}`}
                        onClick={() => {
                            onChange(n)
                            setTimeout(onSubmit, 300)
                        }}
                    >
                        {n}
                    </button>
                ))}
            </div>
            <div className="ff-scale-labels">
                <span>{minLabel}</span>
                <span>{maxLabel}</span>
            </div>
        </div>
    )
}

function NpsInput({ question, value, onChange, onSubmit }: InputProps) {
    return (
        <ScaleInput
            question={{ ...question, properties: { scaleMin: 0, scaleMax: 10, ...question.properties } }}
            value={value}
            onChange={onChange}
            onSubmit={onSubmit}
        />
    )
}

function WelcomeInput({ question, onChange, onSubmit }: InputProps) {
    return (
        <button className="ff-cta-btn" onClick={() => { onChange(true); onSubmit() }}>
            {question.properties.buttonText ?? "Começar"}
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                <path d="M3 8h10M8 3l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        </button>
    )
}

function StatementInput({ question, onChange, onSubmit }: InputProps) {
    return (
        <button className="ff-cta-btn" onClick={() => { onChange(true); onSubmit() }}>
            {question.properties.buttonText ?? "Continuar"}
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                <path d="M3 8h10M8 3l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        </button>
    )
}

function ThankYouInput({ question }: InputProps) {
    return (
        <div className="ff-thankyou">
            <div className="ff-thankyou-icon">🎉</div>
            <p className="ff-thankyou-text">
                {question.properties.buttonText ?? "Obrigado por responder!"}
            </p>
        </div>
    )
}

function DownloadInput({ question, onChange }: InputProps) {
    const url = question.properties.downloadUrl ?? "#"
    const text = question.properties.buttonText ?? "Baixar arquivo"
    const size = question.properties.downloadButtonSize ?? "default"
    const align = question.properties.downloadButtonAlign ?? "center"

    const sizeClasses = {
        sm: "px-3 py-1.5 text-sm",
        default: "px-4 py-2 text-base",
        lg: "px-8 py-4 text-lg",
    }

    const alignClasses = {
        left: "justify-start",
        center: "justify-center",
        right: "justify-end",
        full: "w-full justify-center",
    }
    
    // Check if wide button is requested
    const isFull = align === "full"

    return (
        <div className={`flex ${alignClasses[align]} mt-2 mb-4`}>
            <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => onChange(true)}
                className={`inline-flex items-center rounded-md font-semibold transition-colors bg-[var(--ff-accent)] text-[var(--ff-bg)] hover:opacity-90 shadow-sm ${sizeClasses[size]} ${isFull ? "w-full text-center" : ""}`}
            >
                <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                {text}
            </a>
        </div>
    )
}

function FileUploadInput({ question, value, onChange, formId }: InputProps) {
    const ref = useRef<HTMLInputElement>(null)
    const fileData = (value && typeof value === "object" && "fileUrl" in value)
        ? value as { fileUrl: string; fileName: string }
        : null
    const [uploading, setUploading] = useState(false)
    const [uploadError, setUploadError] = useState<string | null>(null)

    const { allowedFileTypes, maxFileSize } = question.properties
    const accept = allowedFileTypes?.join(",") ?? undefined

    const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (maxFileSize && file.size > maxFileSize * 1024 * 1024) {
            setUploadError(`O arquivo excede o tamanho máximo de ${maxFileSize} MB.`)
            return
        }

        if (allowedFileTypes && allowedFileTypes.length > 0) {
            const isAllowed = allowedFileTypes.some(type => {
                if (type.endsWith('/*')) {
                    return file.type.startsWith(type.replace('/*', '/'))
                }
                if (type.includes(',')) {
                    return type.split(',').some(t => t.trim() === file.type)
                }
                return type === file.type
            })

            if (!isAllowed && file.type !== "") {
                setUploadError("Tipo de arquivo não permitido.")
                return
            }
        }

        setUploadError(null)
        setUploading(true)
        onChange("__uploading__")

        const data = new FormData()
        data.append("file", file)
        if (formId) data.append("formId", formId)

        try {
            const res = await fetch("/api/upload/response-file", { method: "POST", body: data })
            const json = await res.json() as { url?: string; fileName?: string; error?: string }
            if (!res.ok || !json.url) {
                setUploadError(json.error ?? "Falha ao enviar arquivo.")
                onChange(null)
            } else {
                onChange({ fileUrl: json.url, fileName: json.fileName ?? file.name })
            }
        } catch {
            setUploadError("Erro de conexão. Tente novamente.")
            onChange(null)
        } finally {
            setUploading(false)
            if (ref.current) ref.current.value = ""
        }
    }

    return (
        <div className="ff-upload" onClick={() => !uploading && ref.current?.click()}>
            <input ref={ref} type="file" accept={accept} style={{ display: "none" }} onChange={handleChange} disabled={uploading} />
            {uploading ? (
                <div className="ff-upload-preview">
                    <span className="ff-upload-uploading">⏳ Enviando arquivo...</span>
                </div>
            ) : fileData ? (
                <div className="ff-upload-preview">
                    <span>📎 {fileData.fileName}</span>
                    <button className="ff-upload-clear" onClick={(e) => { e.stopPropagation(); onChange(null) }}>✕</button>
                </div>
            ) : (
                <>
                    <div className="ff-upload-icon">📁</div>
                    <p>Clique ou arraste um arquivo aqui</p>
                    {((allowedFileTypes?.length ?? 0) > 0 || maxFileSize) && (
                        <p className="ff-upload-hint" style={{ fontSize: "0.8rem", marginTop: "8px", opacity: 0.7 }}>
                            {(allowedFileTypes?.length ?? 0) > 0 && (
                                <>Formatos: {allowedFileTypes!.map((t) =>
                                    t === "image/*" ? "Imagens" :
                                    t === "video/*" ? "Vídeos" :
                                    t === "audio/*" ? "Áudio" :
                                    t === "application/pdf" ? "PDF" :
                                    t.includes("word") ? "Word" : t
                                ).join(", ")}</>
                            )}
                            {maxFileSize ? (allowedFileTypes?.length ? ` • Máx ${maxFileSize} MB` : `Máx ${maxFileSize} MB`) : ""}
                        </p>
                    )}
                    {uploadError && <p className="ff-upload-error" style={{ color: "#ef4444", marginTop: "8px", fontSize: "0.9rem" }}>{uploadError}</p>}
                </>
            )}
        </div>
    )
}

function SignatureInput({ value, onChange }: InputProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const drawing = useRef(false)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext("2d")!
        ctx.strokeStyle = "var(--ff-accent)"
        ctx.lineWidth = 2
        ctx.lineCap = "round"

        const start = (e: PointerEvent) => {
            drawing.current = true
            ctx.beginPath()
            ctx.moveTo(e.offsetX, e.offsetY)
        }
        const draw = (e: PointerEvent) => {
            if (!drawing.current) return
            ctx.lineTo(e.offsetX, e.offsetY)
            ctx.stroke()
        }
        const stop = () => {
            drawing.current = false
            onChange(canvas.toDataURL())
        }

        canvas.addEventListener("pointerdown", start, { passive: true })
        canvas.addEventListener("pointermove", draw, { passive: true })
        canvas.addEventListener("pointerup", stop, { passive: true })
        return () => {
            canvas.removeEventListener("pointerdown", start)
            canvas.removeEventListener("pointermove", draw)
            canvas.removeEventListener("pointerup", stop)
        }
    }, [onChange])

    const clear = () => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext("2d")!
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        onChange(null)
    }

    return (
        <div className="ff-signature">
            <canvas ref={canvasRef} className="ff-signature-canvas" width={480} height={160} />
            <button className="ff-signature-clear" onClick={clear}>Limpar</button>
        </div>
    )
}

// ─── Question Type → Component Map ────────────────────────────────────────────

const RENDERERS: Record<QuestionType, React.ComponentType<InputProps>> = {
    short_text: ShortTextInput,
    long_text: LongTextInput,
    email: EmailInput,
    number: NumberInput,
    phone: PhoneInput,
    whatsapp: WhatsAppInput,
    cpf: CpfInput,
    cnpj: CnpjInput,
    date: DateInput,
    url: UrlInput,
    multiple_choice: MultipleChoiceInput,
    checkbox: CheckboxInput,
    dropdown: DropdownInput,
    yes_no: YesNoInput,
    rating: RatingInput,
    scale: ScaleInput,
    nps: NpsInput,
    welcome: WelcomeInput,
    statement: StatementInput,
    thank_you: ThankYouInput,
    download: DownloadInput,
    file_upload: FileUploadInput,
    signature: SignatureInput,
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

    const Renderer = RENDERERS[currentQ.type]
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
                            formId={form.id}
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

// ─── Scoped Styles ─────────────────────────────────────────────────────────────
// Injected once into the document head so the component is self-contained.

export function FormStyles({ headingFont, bodyFont }: { headingFont: string; bodyFont: string }) {
    useEffect(() => {
        const id = "ff-renderer-styles"
        if (!document.getElementById(id)) {
            const style = document.createElement("style")
            style.id = id
            style.textContent = FF_CSS
            document.head.appendChild(style)
        }
        return () => { document.getElementById("ff-renderer-styles")?.remove() }
    }, [])

    const families = [headingFont, bodyFont]
        .map((f) => `family=${encodeURIComponent(f)}:wght@400;600;700`)
        .join("&")
    const fontHref = `https://fonts.googleapis.com/css2?${families}&display=swap`
    preload(fontHref, { as: "style" })

    useEffect(() => {
        const id = "ff-font-stylesheet"
        if (!document.getElementById(id)) {
            const link = document.createElement("link")
            link.id = id
            link.rel = "stylesheet"
            link.href = fontHref
            document.head.appendChild(link)
        }
        return () => { document.getElementById("ff-font-stylesheet")?.remove() }
    }, [fontHref])

    return null
}

const FF_CSS = `
/* ── Root & layout ── */
.ff-root {
  min-height: 100dvh;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: var(--ff-bg);
  color: var(--ff-text);
  font-family: var(--ff-font-body), system-ui, sans-serif;
  padding: 24px 16px;
  box-sizing: border-box;
  position: relative;
  overflow: hidden;
}

/* ── Screen transitions ── */
.ff-screen {
  width: 100%;
  max-width: 640px;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.ff-screen--enter {
  animation: ff-slide-up 0.25s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}
.ff-screen--exit-up {
  animation: ff-exit-up 0.22s cubic-bezier(0.4, 0, 1, 1) forwards;
}
.ff-screen--exit-down {
  animation: ff-exit-down 0.22s cubic-bezier(0.4, 0, 1, 1) forwards;
}
@keyframes ff-slide-up {
  from { opacity: 0; transform: translateY(40px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes ff-exit-up {
  from { opacity: 1; transform: translateY(0); }
  to   { opacity: 0; transform: translateY(-40px); }
}
@keyframes ff-exit-down {
  from { opacity: 1; transform: translateY(0); }
  to   { opacity: 0; transform: translateY(40px); }
}

/* ── Card ── */
.ff-card {
  width: 100%;
  padding: 40px 48px;
  background: var(--ff-card);
  border-radius: var(--ff-radius);
  box-shadow: 0 8px 40px rgba(0,0,0,0.18);
  box-sizing: border-box;
  overflow-wrap: anywhere;
  word-break: break-word;
}
@media (max-width: 600px) {
  .ff-card { padding: 28px 20px; }
}

/* ── Question number ── */
.ff-question-number {
  font-size: 13px;
  font-weight: 700;
  color: var(--ff-accent);
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 4px;
  letter-spacing: 0.5px;
}
.ff-question-arrow { opacity: 0.6; }

/* ── Question title & description ── */
.ff-question-title {
  font-family: var(--ff-font-heading), system-ui, sans-serif;
  font-size: clamp(1.2rem, 3vw, 1.65rem);
  font-weight: 700;
  margin: 0 0 8px;
  line-height: 1.3;
  color: var(--ff-text);
  overflow-wrap: anywhere;
  word-break: break-word;
}
.ff-required { color: var(--ff-accent); margin-left: 4px; }

.ff-question-desc {
  font-size: 0.95rem;
  color: var(--ff-muted);
  margin: 0 0 20px;
  line-height: 1.55;
  overflow-wrap: anywhere;
  word-break: break-word;
}
.ff-question-image {
  width: 100%;
  max-height: 220px;
  object-fit: cover;
  border-radius: calc(var(--ff-radius) / 2);
  margin-bottom: 20px;
}

/* ── Logo ── */
.ff-logo-container {
  width: 100%;
  max-width: 640px;
  margin-bottom: 32px;
  display: flex;
}
.ff-logo-left { justify-content: flex-start; }
.ff-logo-center { justify-content: center; }
.ff-logo-right { justify-content: flex-end; }

.ff-logo-img {
  max-height: 80px;
  object-fit: contain;
}

/* ── Answer area ── */
.ff-answer-area { margin: 20px 0; }

/* ── Inputs ── */
.ff-input {
  width: 100%;
  background: var(--ff-input-bg);
  border: 0;
  border-bottom: 2px solid var(--ff-muted);
  color: var(--ff-text);
  font-family: var(--ff-font-body), system-ui, sans-serif;
  font-size: 1rem;
  padding: 10px 4px;
  outline: none;
  transition: border-color 0.2s;
  box-sizing: border-box;
  border-radius: 0;
}
.ff-input:focus { border-bottom-color: var(--ff-accent); }
.ff-textarea { resize: vertical; min-height: 90px; }
.ff-select {
  cursor: pointer;
  border-radius: var(--ff-radius);
  padding: 10px 12px;
  border: 2px solid var(--ff-muted);
}
.ff-select:focus { border-color: var(--ff-accent); }

/* ── Options (multiple choice / checkbox) ── */
.ff-options { display: flex; flex-direction: column; gap: 10px; }
.ff-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: transparent;
  border: 2px solid var(--ff-muted);
  border-radius: var(--ff-radius);
  color: var(--ff-text);
  font-size: 0.95rem;
  cursor: pointer;
  text-align: left;
  transition: border-color 0.15s, background 0.15s;
  position: relative;
}
.ff-option:hover { border-color: var(--ff-accent); }
.ff-option--selected {
  border-color: var(--ff-accent);
  background: color-mix(in srgb, var(--ff-accent) 12%, transparent);
}
.ff-option-letter {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px; height: 24px;
  border: 1.5px solid currentColor;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 700;
  flex-shrink: 0;
  opacity: 0.7;
}
.ff-option-check {
  margin-left: auto;
  color: var(--ff-accent);
  font-weight: 700;
}

/* ── Yes / No ── */
.ff-yesno { display: flex; gap: 16px; }
.ff-yesno-btn {
  flex: 1;
  padding: 18px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  border: 2px solid var(--ff-muted);
  border-radius: var(--ff-radius);
  background: transparent;
  color: var(--ff-text);
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
}
.ff-yesno-btn:hover { border-color: var(--ff-accent); }
.ff-yesno-icon { font-size: 1.8rem; }

/* ── Rating ── */
.ff-rating { display: flex; gap: 8px; flex-wrap: wrap; }
.ff-rating-btn {
  background: transparent;
  border: none;
  font-size: 1.8rem;
  cursor: pointer;
  color: var(--ff-muted);
  transition: color 0.15s, transform 0.1s;
  padding: 0;
}
.ff-rating-btn:hover,
.ff-rating-btn--active { color: var(--ff-accent); transform: scale(1.15); }

/* ── Scale ── */
.ff-scale { display: flex; flex-direction: column; gap: 8px; width: 100%; }
.ff-scale-buttons { display: flex; gap: 6px; flex-wrap: wrap; }
.ff-scale-btn {
  min-width: 40px; height: 40px;
  display: flex; align-items: center; justify-content: center;
  border: 2px solid var(--ff-muted);
  border-radius: calc(var(--ff-radius) / 2);
  background: transparent;
  color: var(--ff-text);
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s, color 0.15s;
}
.ff-scale-btn:hover { border-color: var(--ff-accent); }
.ff-scale-btn--active {
  border-color: var(--ff-accent);
  background: var(--ff-accent);
  color: var(--ff-bg);
}
.ff-scale-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.78rem;
  color: var(--ff-muted);
}

/* ── CTA button (welcome / statement) ── */
.ff-cta-btn {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 14px 28px;
  background: var(--ff-accent);
  color: var(--ff-bg);
  border: none;
  border-radius: var(--ff-radius);
  font-family: var(--ff-font-body), system-ui, sans-serif;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.2s, transform 0.15s;
  box-shadow: 0 4px 16px color-mix(in srgb, var(--ff-accent) 35%, transparent);
}
.ff-cta-btn:hover { opacity: 0.9; transform: translateY(-1px); }

/* ── Thank you ── */
.ff-thankyou { text-align: center; padding: 24px 0; }
.ff-thankyou-icon { font-size: 3rem; margin-bottom: 16px; }
.ff-thankyou-text { color: var(--ff-muted); font-size: 1.05rem; margin: 0; }
.ff-download-btn {
  display: inline-flex; align-items: center; gap: 8px;
  margin-top: 24px; padding: 12px 24px; border-radius: 8px;
  background: var(--ff-accent); color: var(--ff-bg);
  font-size: 0.95rem; font-weight: 600; text-decoration: none;
  transition: opacity 0.15s;
}
.ff-download-btn:hover { opacity: 0.85; }

/* ── File upload ── */
.ff-upload {
  border: 2px dashed var(--ff-muted);
  border-radius: var(--ff-radius);
  padding: 40px 20px;
  text-align: center;
  cursor: pointer;
  color: var(--ff-muted);
  transition: border-color 0.2s;
}
.ff-upload:hover { border-color: var(--ff-accent); color: var(--ff-text); }
.ff-upload-icon { font-size: 2rem; margin-bottom: 8px; }
.ff-upload-preview {
  display: flex; align-items: center; justify-content: center; gap: 12px;
  color: var(--ff-text);
}
.ff-upload-clear {
  background: transparent; border: none; cursor: pointer;
  color: var(--ff-muted); font-size: 1rem;
}

/* ── Signature ── */
.ff-signature { display: flex; flex-direction: column; gap: 8px; }
.ff-signature-canvas {
  border: 2px solid var(--ff-muted);
  border-radius: var(--ff-radius);
  cursor: crosshair;
  width: 100%; height: auto;
  background: var(--ff-input-bg);
  touch-action: none;
}
.ff-signature-clear {
  align-self: flex-end;
  background: transparent;
  border: 1px solid var(--ff-muted);
  color: var(--ff-muted);
  border-radius: 4px;
  padding: 4px 12px;
  font-size: 0.82rem;
  cursor: pointer;
}
.ff-signature-clear:hover { border-color: var(--ff-accent); color: var(--ff-accent); }

/* ── Navigation ── */
.ff-nav {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 20px;
}
.ff-nav-back {
  width: 36px; height: 36px;
  display: flex; align-items: center; justify-content: center;
  background: transparent;
  border: 1.5px solid var(--ff-muted);
  border-radius: calc(var(--ff-radius) / 2);
  color: var(--ff-muted);
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s;
}
.ff-nav-back:hover { border-color: var(--ff-accent); color: var(--ff-accent); }
.ff-nav-ok {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: var(--ff-accent);
  border: none;
  border-radius: calc(var(--ff-radius) / 1.5);
  color: var(--ff-bg);
  font-weight: 700;
  font-size: 0.95rem;
  cursor: pointer;
  transition: opacity 0.2s, transform 0.15s;
}
.ff-nav-ok:hover:not(:disabled) { opacity: 0.88; transform: translateY(-1px); }
.ff-nav-ok:disabled { opacity: 0.5; cursor: not-allowed; }
.ff-nav-enter {
  font-size: 0.75rem;
  opacity: 0.7;
  background: color-mix(in srgb, var(--ff-bg) 25%, transparent);
  border-radius: 3px;
  padding: 1px 5px;
}

/* ── Keyboard hint ── */
.ff-hint {
  font-size: 0.75rem;
  color: var(--ff-muted);
  margin: 10px 0 0;
}
kbd {
  font-size: 0.7rem;
  background: color-mix(in srgb, var(--ff-muted) 18%, transparent);
  border-radius: 3px;
  padding: 1px 5px;
}

/* ── Progress bar ── */
.ff-progress {
  position: absolute;
  top: 0; left: 0; right: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 20px;
  z-index: 10;
  background: color-mix(in srgb, var(--ff-bg) 80%, transparent);
  backdrop-filter: blur(6px);
}
.ff-progress-track {
  flex: 1;
  height: 3px;
  background: color-mix(in srgb, var(--ff-muted) 30%, transparent);
  border-radius: 999px;
  overflow: hidden;
}
.ff-progress-fill {
  height: 100%;
  background: var(--ff-accent);
  border-radius: 999px;
  transition: width 0.35s cubic-bezier(0.22, 1, 0.36, 1);
}
.ff-progress-label {
  font-size: 0.72rem;
  color: var(--ff-muted);
  min-width: 28px;
  text-align: right;
}

/* ── Spinner ── */
.ff-spinner {
  display: inline-block;
  width: 16px; height: 16px;
  border: 2px solid transparent;
  border-top-color: currentColor;
  border-radius: 50%;
  animation: ff-spin 0.65s linear infinite;
}
@keyframes ff-spin {
  to { transform: rotate(360deg); }
}

/* ── RichText & Improvements ── */
.ff-question-title strong, .ff-question-desc strong {
  font-weight: 900;
  color: inherit;
}
.ff-phone-container {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
}
.ff-phone-code {
  width: 110px;
  flex-shrink: 0;
  cursor: pointer;
  padding-left: 8px; padding-right: 8px;
}
.ff-phone-input {
  flex-grow: 1;
}
`
