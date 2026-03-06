/**
 * Generates a URL-friendly slug from a title string.
 * Normalizes accented characters, removes special chars, and appends a
 * random 6-character suffix to avoid collisions without a DB round-trip.
 *
 * Example: "Pesquisa de Satisfação" → "pesquisa-de-satisfacao-x7k3mq"
 */
export function generateSlug(title: string): string {
  const base = title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip accent marks
    .replace(/[^a-z0-9\s-]/g, "")   // keep only alphanum, spaces, hyphens
    .trim()
    .replace(/\s+/g, "-")            // spaces → hyphens
    .replace(/-+/g, "-")             // collapse consecutive hyphens
    .slice(0, 48)                    // max 48 chars for the base

  const suffix = Math.random().toString(36).slice(2, 8) // 6 random alphanumeric chars
  const prefix = base || "formulario"

  return `${prefix}-${suffix}`
}
