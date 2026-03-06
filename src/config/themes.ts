import type { ThemeConfig } from "@/lib/types/form"

export const PRESET_THEMES: ThemeConfig[] = [
  {
    id: "midnight",
    colors: { bg: "#0f0f1a", card: "#1a1a2e", accent: "#6c63ff", text: "#e8e8f0", muted: "#6b6b8d", inputBg: "#12122a" },
    font: { heading: "Fraunces", body: "DM Sans" },
    borderRadius: "12px",
  },
  {
    id: "ocean",
    colors: { bg: "#0a192f", card: "#112240", accent: "#64ffda", text: "#ccd6f6", muted: "#8892b0", inputBg: "#0d1f3c" },
    font: { heading: "Playfair Display", body: "Source Sans 3" },
    borderRadius: "12px",
  },
  {
    id: "sunset",
    colors: { bg: "#1a1a2e", card: "#25253e", accent: "#ff6b6b", text: "#f0e6e6", muted: "#8b7e7e", inputBg: "#1e1e32" },
    font: { heading: "Sora", body: "Inter" },
    borderRadius: "16px",
  },
  {
    id: "forest",
    colors: { bg: "#1a2e1a", card: "#1e3a1e", accent: "#69db7c", text: "#d4e8d4", muted: "#7a9f7a", inputBg: "#162e16" },
    font: { heading: "Bitter", body: "Nunito" },
    borderRadius: "8px",
  },
  {
    id: "cream",
    colors: { bg: "#faf8f5", card: "#ffffff", accent: "#d4622b", text: "#2d2d2d", muted: "#8a8a8a", inputBg: "#f5f0ea" },
    font: { heading: "Fraunces", body: "DM Sans" },
    borderRadius: "12px",
  },
  {
    id: "lavender",
    colors: { bg: "#f5f0ff", card: "#ffffff", accent: "#7c3aed", text: "#2e1065", muted: "#9381b5", inputBg: "#ede5ff" },
    font: { heading: "Outfit", body: "Plus Jakarta Sans" },
    borderRadius: "14px",
  },
  {
    id: "minimal",
    colors: { bg: "#ffffff", card: "#fafafa", accent: "#000000", text: "#111111", muted: "#888888", inputBg: "#f5f5f5" },
    font: { heading: "Space Grotesk", body: "IBM Plex Sans" },
    borderRadius: "4px",
  },
  {
    id: "neon",
    colors: { bg: "#0a0a0a", card: "#141414", accent: "#00ff88", text: "#ffffff", muted: "#666666", inputBg: "#111111" },
    font: { heading: "Orbitron", body: "Rajdhani" },
    borderRadius: "2px",
  },
]

export const DEFAULT_THEME = PRESET_THEMES[0]

export function getThemeById(id: string): ThemeConfig {
  return PRESET_THEMES.find(t => t.id === id) || DEFAULT_THEME
}

export function getThemeCSSVariables(theme: ThemeConfig): Record<string, string> {
  return {
    "--ff-bg": theme.colors.bg,
    "--ff-card": theme.colors.card,
    "--ff-accent": theme.colors.accent,
    "--ff-text": theme.colors.text,
    "--ff-muted": theme.colors.muted,
    "--ff-input-bg": theme.colors.inputBg || theme.colors.card,
    "--ff-radius": theme.borderRadius,
    "--ff-font-heading": theme.font.heading,
    "--ff-font-body": theme.font.body,
  }
}
