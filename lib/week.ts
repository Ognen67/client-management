const MONTHS = [
  "Jan","Feb","Mar","Apr","May","Jun",
  "Jul","Aug","Sep","Oct","Nov","Dec",
] as const

/**
 * All date computations use UTC so that pg's @db.Date ↔ JS Date conversion
 * is always consistent regardless of server/client timezone.
 * (pg reads date columns as UTC midnight; we must also write UTC midnight.)
 */

/** Normalises any date value to a JS Date at UTC midnight of its calendar day. */
function toUTCMidnight(date: Date | string): Date {
  if (typeof date === "string") {
    // "2026-03-30" → treat as UTC; "2026-03-30T..." → parse as-is
    return date.includes("T") ? new Date(date) : new Date(`${date}T00:00:00.000Z`)
  }
  return date
}

/** Returns Monday of the given UTC date's week, at UTC midnight. */
export function getWeekStart(date: Date): Date {
  const d = toUTCMidnight(date)
  const day = d.getUTCDay() // 0=Sun, 1=Mon … 6=Sat
  const daysBack = day === 0 ? 6 : day - 1
  return new Date(Date.UTC(
    d.getUTCFullYear(),
    d.getUTCMonth(),
    d.getUTCDate() - daysBack,
  ))
}

/** Monday of the CURRENT week, at UTC midnight — safe to pass to Prisma @db.Date. */
export function getCurrentWeekStart(): Date {
  return getWeekStart(new Date())
}

/** UTC date string "2026-03-30" — use for comparisons, never for display. */
export function toISODateString(date: Date): string {
  return date.toISOString().substring(0, 10)
}

/** "Mar 30, 2026" — always uses UTC components, never local timezone. */
export function formatWeekLabel(date: Date | string): string {
  const d = toUTCMidnight(date)
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`
}

/** True if `a` and `b` fall in the same Monday–Sunday week (UTC). */
export function isSameWeek(a: Date | string, b: Date | string): boolean {
  return (
    toISODateString(getWeekStart(toUTCMidnight(a))) ===
    toISODateString(getWeekStart(toUTCMidnight(b)))
  )
}

/** Current week is always open for scoring until Sunday midnight UTC. */
export function isCurrentWeekEditable(): boolean {
  const now = new Date()
  const weekStart = getCurrentWeekStart()
  // Sunday = weekStart + 6 days, end of day UTC
  const weekEnd = new Date(Date.UTC(
    weekStart.getUTCFullYear(),
    weekStart.getUTCMonth(),
    weekStart.getUTCDate() + 6,
    23, 59, 59, 999,
  ))
  return now <= weekEnd
}

/** How many full weeks ago was `weekStart` (0 = this week). */
export function getWeeksAgo(weekStart: Date | string): number {
  const ws = getWeekStart(toUTCMidnight(weekStart))
  const now = getCurrentWeekStart()
  return Math.round((now.getTime() - ws.getTime()) / (7 * 24 * 60 * 60 * 1000))
}
