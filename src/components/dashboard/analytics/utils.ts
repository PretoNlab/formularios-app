export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return s > 0 ? `${m}m ${s}s` : `${m}m`
}

/**
 * Rounds a single percentage for display (0–1 input → "38%").
 * For multiple options, use `lrmPercentages` to guarantee the sum is exactly 100%.
 */
export function pct(n: number): string {
  return `${Math.round(n * 100)}%`
}

/**
 * Largest Remainder Method — distributes 100% across a list of fractions
 * such that the displayed integers always sum to exactly 100.
 * Input: array of fractions (0–1). Output: array of integer percentages.
 */
export function lrmPercentages(fractions: number[]): number[] {
  const floored = fractions.map((f) => Math.floor(f * 100))
  const remainders = fractions.map((f, i) => ({ i, r: f * 100 - floored[i] }))
  const total = floored.reduce((a, b) => a + b, 0)
  const missing = 100 - total
  remainders
    .sort((a, b) => b.r - a.r)
    .slice(0, missing)
    .forEach(({ i }) => { floored[i]++ })
  return floored
}
