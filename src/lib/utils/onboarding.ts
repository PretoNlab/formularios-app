export const ONBOARDING_KEYS = {
  WELCOME: "formularios_onboarded_v2",
  CHECKLIST_DISMISSED: "formularios_checklist_v1",
  BUILDER_TOUR: "formularios_builder_tour_v2",
  SHARE_COMPLETED: "formularios_share_completed_v1",
  FIRST_RESPONSE_SEEN: "formularios_first_response_seen_v1",
  LOGIC_HINT_DISMISSED: "formularios_logic_hint_dismissed_v1",
  postPublish: (formId: string) => `formularios_post_publish_${formId}`,
} as const

interface ThemeShape {
  id?: string
  backgroundImage?: string
  customCSS?: string
  logo?: { url?: string }
}

interface SettingsShape {
  notifyOnResponse?: boolean
}

export function isThemeCustomized(theme: ThemeShape | null | undefined): boolean {
  if (!theme) return false
  if (theme.id && theme.id !== "midnight") return true
  if (theme.logo?.url) return true
  if (theme.backgroundImage) return true
  if (theme.customCSS) return true
  return false
}

export function hasEmailNotifications(settings: SettingsShape | null | undefined): boolean {
  return settings?.notifyOnResponse === true
}

export function readFlag(key: string): boolean {
  if (typeof window === "undefined") return false
  return !!window.localStorage.getItem(key)
}

export function setFlag(key: string): void {
  if (typeof window === "undefined") return
  window.localStorage.setItem(key, "1")
}
