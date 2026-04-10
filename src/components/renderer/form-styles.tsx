"use client"

import { useEffect } from "react"
import { preload } from "react-dom"

// ─── Font Loader & Style Injector ─────────────────────────────────────────────

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

// ─── Complete Scoped CSS ──────────────────────────────────────────────────────

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

/* ── Matrix field ── */
.ff-matrix { width: 100%; overflow-x: auto; }
.ff-matrix-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}
.ff-matrix-table th,
.ff-matrix-table td {
  padding: 10px 12px;
  text-align: center;
  border-bottom: 1px solid color-mix(in srgb, var(--ff-muted) 25%, transparent);
}
.ff-matrix-table th {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--ff-muted);
  white-space: nowrap;
}
.ff-matrix-table td:first-child,
.ff-matrix-table th:first-child {
  text-align: left;
  font-weight: 500;
  color: var(--ff-text);
  min-width: 120px;
}
.ff-matrix-radio {
  appearance: none;
  width: 20px; height: 20px;
  border: 2px solid var(--ff-muted);
  border-radius: 50%;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
  position: relative;
}
.ff-matrix-radio:hover { border-color: var(--ff-accent); }
.ff-matrix-radio:checked {
  border-color: var(--ff-accent);
  background: var(--ff-accent);
}
.ff-matrix-radio:checked::after {
  content: '';
  position: absolute;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  width: 8px; height: 8px;
  background: var(--ff-bg);
  border-radius: 50%;
}
/* Mobile stacking */
@media (max-width: 600px) {
  .ff-matrix-table { display: block; }
  .ff-matrix-table thead { display: none; }
  .ff-matrix-table tbody,
  .ff-matrix-table tr { display: block; width: 100%; }
  .ff-matrix-table tr {
    margin-bottom: 16px;
    border: 1px solid color-mix(in srgb, var(--ff-muted) 25%, transparent);
    border-radius: var(--ff-radius);
    padding: 12px;
  }
  .ff-matrix-table td {
    display: flex;
    align-items: center;
    justify-content: space-between;
    text-align: right;
    border-bottom: none;
    padding: 6px 0;
  }
  .ff-matrix-table td:first-child {
    font-weight: 700;
    font-size: 0.95rem;
    margin-bottom: 8px;
    display: block;
    text-align: left;
  }
  .ff-matrix-table td::before {
    content: attr(data-label);
    font-size: 0.8rem;
    color: var(--ff-muted);
    text-align: left;
  }
  .ff-matrix-table td:first-child::before {
    content: '';
  }
}

/* ── Ranking field ── */
.ff-ranking { display: flex; flex-direction: column; gap: 8px; }
.ff-ranking-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: transparent;
  border: 2px solid var(--ff-muted);
  border-radius: var(--ff-radius);
  color: var(--ff-text);
  font-size: 0.95rem;
  cursor: grab;
  transition: border-color 0.15s, background 0.15s, box-shadow 0.15s;
  user-select: none;
}
.ff-ranking-item:hover { border-color: var(--ff-accent); }
.ff-ranking-item--dragging {
  border-color: var(--ff-accent);
  background: color-mix(in srgb, var(--ff-accent) 8%, transparent);
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
  cursor: grabbing;
}
.ff-ranking-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px; height: 28px;
  background: var(--ff-accent);
  color: var(--ff-bg);
  border-radius: 50%;
  font-size: 0.8rem;
  font-weight: 700;
  flex-shrink: 0;
}
.ff-ranking-handle {
  color: var(--ff-muted);
  font-size: 1.2rem;
  flex-shrink: 0;
  cursor: grab;
}
.ff-ranking-arrows {
  margin-left: auto;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.ff-ranking-arrow-btn {
  background: transparent;
  border: 1px solid var(--ff-muted);
  border-radius: 4px;
  color: var(--ff-muted);
  width: 24px; height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 0.7rem;
  transition: border-color 0.15s, color 0.15s;
  padding: 0;
}
.ff-ranking-arrow-btn:hover { border-color: var(--ff-accent); color: var(--ff-accent); }
.ff-ranking-arrow-btn:disabled { opacity: 0.3; cursor: not-allowed; }

/* ── Opinion Scale ── */
.ff-opinion-scale { display: flex; flex-direction: column; gap: 12px; width: 100%; }
.ff-opinion-scale-buttons { display: flex; gap: 0; width: 100%; }
.ff-opinion-scale-btn {
  flex: 1;
  height: 48px;
  display: flex; align-items: center; justify-content: center;
  border: 2px solid var(--ff-muted);
  border-right: none;
  background: transparent;
  color: var(--ff-text);
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
}
.ff-opinion-scale-btn:first-child {
  border-radius: var(--ff-radius) 0 0 var(--ff-radius);
}
.ff-opinion-scale-btn:last-child {
  border-right: 2px solid var(--ff-muted);
  border-radius: 0 var(--ff-radius) var(--ff-radius) 0;
}
.ff-opinion-scale-btn:hover {
  background: color-mix(in srgb, var(--ff-accent) 10%, transparent);
  border-color: var(--ff-accent);
}
.ff-opinion-scale-btn--active {
  background: var(--ff-accent);
  border-color: var(--ff-accent);
  color: var(--ff-bg);
}
.ff-opinion-scale-btn--active + .ff-opinion-scale-btn {
  border-left-color: var(--ff-accent);
}
.ff-opinion-scale-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.78rem;
  color: var(--ff-muted);
}
@media (max-width: 600px) {
  .ff-opinion-scale-buttons { flex-wrap: wrap; }
  .ff-opinion-scale-btn {
    flex: 0 0 calc(20% - 0px);
    border-right: 2px solid var(--ff-muted);
    border-radius: 0 !important;
    margin-bottom: -2px;
  }
}
`
