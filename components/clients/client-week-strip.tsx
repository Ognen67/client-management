"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight, Maximize2, Minimize2 } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  toISODateString,
  formatWeekLabel,
  getCurrentWeekStart,
  getWeekStart,
} from "@/lib/week"
import { cn } from "@/lib/cn"
import type { WeeklyScore } from "@/generated/prisma/client"

interface ClientWeekStripProps {
  slug: string
  scores: WeeklyScore[]
  selectedWeekISO: string
}

const WINDOW_SIZE = 12

const SCORE_BG: Record<number, string> = {
  1: "bg-score-1",
  2: "bg-score-2",
  3: "bg-score-3",
  4: "bg-score-4",
  5: "bg-score-5",
}

const SCORE_TEXT: Record<number, string> = {
  1: "text-white",
  2: "text-white",
  3: "text-gray-900",
  4: "text-gray-900",
  5: "text-white",
}

const SCORE_LABEL: Record<number, string> = {
  1: "Critical",
  2: "Danger",
  3: "Watch",
  4: "Good",
  5: "Excellent",
}

const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
const MONTHS_FULL = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

function shortLabel(iso: string): string {
  const d = new Date(`${iso}T00:00:00.000Z`)
  return `${MONTHS_SHORT[d.getUTCMonth()]} ${d.getUTCDate()}`
}

interface MonthGroup { label: string; isos: string[] }

function groupByMonth(isos: string[]): MonthGroup[] {
  const groups: MonthGroup[] = []
  let cur: MonthGroup | null = null
  for (const iso of isos) {
    const d = new Date(`${iso}T00:00:00.000Z`)
    const label = `${MONTHS_FULL[d.getUTCMonth()]} ${d.getUTCFullYear()}`
    if (!cur || cur.label !== label) { cur = { label, isos: [iso] }; groups.push(cur) }
    else cur.isos.push(iso)
  }
  return groups
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

// Pad an array to a target length with null
type ISOCell = string | null
function padToSize(chunk: string[], size: number): ISOCell[] {
  const out: ISOCell[] = [...chunk]
  while (out.length < size) out.push(null)
  return out
}

export function ClientWeekStrip({ slug, scores, selectedWeekISO }: ClientWeekStripProps) {
  const router = useRouter()

  const sorted = [...scores].sort(
    (a, b) => new Date(a.weekStart).getTime() - new Date(b.weekStart).getTime()
  )
  const scoreByISO = new Map(sorted.map((s) => [toISODateString(s.weekStart), s]))

  // ── Build full week range: oldest scored week → current week ─────────────
  const currentWeekStart = getCurrentWeekStart()
  const currentWeekISO = toISODateString(currentWeekStart)
  const allISOs: string[] = (() => {
    if (sorted.length === 0) return [currentWeekISO]
    const first = getWeekStart(new Date(sorted[0].weekStart))
    const result: string[] = []
    const d = new Date(first)
    while (d <= currentWeekStart) {
      result.push(toISODateString(d))
      d.setUTCDate(d.getUTCDate() + 7)
    }
    return result
  })()

  const selectedIdx = allISOs.indexOf(selectedWeekISO)

  const initOffset = (): number => {
    if (selectedIdx < 0 || allISOs.length <= WINDOW_SIZE) return 0
    const distFromEnd = allISOs.length - 1 - selectedIdx
    return Math.max(0, Math.min(distFromEnd, allISOs.length - WINDOW_SIZE))
  }

  const [offset, setOffset] = useState(initOffset)
  const [expanded, setExpanded] = useState(false)
  const maxOffset = Math.max(0, allISOs.length - WINDOW_SIZE)

  const winEnd = allISOs.length - offset
  const winStart = Math.max(0, winEnd - WINDOW_SIZE)
  const visibleISOs = allISOs.slice(winStart, winEnd)

  const windowLabel =
    visibleISOs.length >= 2
      ? `${shortLabel(visibleISOs[0])} – ${shortLabel(visibleISOs[visibleISOs.length - 1])}`
      : ""

  const navigateTo = (iso: string) => {
    router.push(`/clients/${slug}?week=${iso}`, { scroll: false })
    const idx = allISOs.indexOf(iso)
    if (idx >= 0) {
      const curEnd = allISOs.length - offset
      const curStart = curEnd - WINDOW_SIZE
      if (idx < curStart || idx >= curEnd) {
        const distFromEnd = allISOs.length - 1 - idx
        setOffset(Math.max(0, Math.min(distFromEnd, maxOffset)))
      }
    }
  }

  // Expanded chunks — last chunk padded to WINDOW_SIZE for alignment
  const rawChunks = chunkArray(allISOs, WINDOW_SIZE)
  const expandedChunks: ISOCell[][] = rawChunks.map((chunk, i) =>
    i === rawChunks.length - 1 ? padToSize(chunk, WINDOW_SIZE) : (chunk as ISOCell[])
  )

  const navBtn =
    "inline-flex size-6 items-center justify-center rounded border border-transparent hover:border-border hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"

  // ── Cell renderer ────────────────────────────────────────────────────────

  const renderCell = (iso: ISOCell, key: string) => {
    if (iso === null) {
      return <td key={key} className="border-b border-border/20 bg-muted/5" />
    }

    const score = scoreByISO.get(iso)
    const current = score?.currentScore ?? null
    const predictive = score?.predictiveScore ?? null
    const isSelected = iso === selectedWeekISO
    const hasScore = current !== null && predictive !== null

    return (
      <td
        key={key}
        className={cn(
          "border-b border-border/30",
          isSelected && "bg-primary/5"
        )}
      >
        <Tooltip>
          <TooltipTrigger
            render={
              <button
                type="button"
                onClick={() => navigateTo(iso)}
                className={cn(
                  "flex items-center gap-0.5 mx-auto cursor-pointer rounded px-0.5 py-1.5 transition-all w-full justify-center",
                  isSelected
                    ? "bg-primary/10 scale-100"
                    : "hover:scale-105 hover:bg-muted/20"
                )}
                aria-label={`${shortLabel(iso)}${hasScore ? `: C${current} P${predictive}` : ": no score"}`}
              />
            }
          >
            {!hasScore ? (
              <span className="text-[9px] text-muted-foreground/40 font-medium leading-tight text-center whitespace-nowrap">
                No<br />score
              </span>
            ) : (
              <>
                <div className={cn("size-5 rounded-sm text-[9px] font-bold flex items-center justify-center shrink-0", SCORE_BG[current!], SCORE_TEXT[current!])}>
                  {current}
                </div>
                <div className={cn("size-5 rounded-sm text-[9px] font-bold flex items-center justify-center shrink-0", SCORE_BG[predictive!], SCORE_TEXT[predictive!])}>
                  {predictive}
                </div>
              </>
            )}
          </TooltipTrigger>

          <TooltipContent side="top" variant="light" className="text-xs p-2.5">
            <div className="flex flex-col gap-1.5">
              <span className="font-semibold text-foreground">
                {formatWeekLabel(new Date(`${iso}T00:00:00.000Z`))}
              </span>
              {hasScore ? (
                <>
                  <div className="flex items-center gap-3 pt-0.5">
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] font-medium text-muted-foreground">C:</span>
                      <span className="font-bold">{current}</span>
                      <span className="text-muted-foreground/60 text-[10px]">({SCORE_LABEL[current]})</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] font-medium text-muted-foreground">P:</span>
                      <span className="font-bold">{predictive}</span>
                      <span className="text-muted-foreground/60 text-[10px]">({SCORE_LABEL[predictive]})</span>
                    </div>
                  </div>
                  {score?.actions && (
                    <p className="text-[11px] text-muted-foreground/70 italic max-w-[200px] truncate mt-0.5">
                      {score.actions.split("\n")[0]}
                    </p>
                  )}
                </>
              ) : (
                <span className="text-muted-foreground/60 text-[11px]">No score submitted</span>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </td>
    )
  }

  // ── Head renderer ────────────────────────────────────────────────────────

  const renderHead = (isos: ISOCell[], showMonthRow: boolean) => {
    const realISOs = isos.filter((iso): iso is string => iso !== null)
    const groups = showMonthRow ? groupByMonth(realISOs) : []
    const padCount = isos.length - realISOs.length

    return (
      <thead>
        {showMonthRow && (
          <tr>
            {groups.map((group) => (
              <th
                key={group.label}
                colSpan={group.isos.length}
                className="px-1 py-1 text-left border-b border-r border-border/30 bg-muted/20 overflow-hidden"
              >
                <span className="block text-[9px] font-semibold uppercase tracking-widest text-muted-foreground/60 truncate">
                  {group.label}
                </span>
              </th>
            ))}
            {padCount > 0 && (
              <th colSpan={padCount} className="border-b border-border/30 bg-muted/10" />
            )}
          </tr>
        )}
        <tr>
          {isos.map((iso, idx) =>
            iso === null ? (
              <th key={`pad-${idx}`} className="border-b border-border bg-muted/5" />
            ) : (
              <th
                key={iso}
                className={cn(
                  "px-0.5 py-1.5 text-center border-b border-border",
                  iso === selectedWeekISO && "bg-primary/5"
                )}
              >
                <span className={cn(
                  "text-[9px] font-mono tabular-nums whitespace-nowrap",
                  iso === selectedWeekISO ? "text-primary font-bold" : "text-muted-foreground/50"
                )}>
                  {shortLabel(iso)}
                </span>
              </th>
            )
          )}
        </tr>
      </thead>
    )
  }

  // ────────────────────────────────────────────────────────────────────────

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      {/* Control bar */}
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-border bg-muted/20">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
            aria-label={expanded ? "Collapse" : "Expand all weeks"}
          >
            {expanded ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}
            <span className="hidden sm:inline">{expanded ? "Collapse" : "Expand all weeks"}</span>
          </button>
          <span className="text-[10px] text-muted-foreground/40 hidden sm:inline">
            C = Current · P = Predictive
          </span>
        </div>

        {/* Window nav — collapsed only, jumps 12 weeks */}
        {!expanded && allISOs.length > WINDOW_SIZE && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={offset >= maxOffset}
              onClick={() => setOffset((o) => Math.min(o + WINDOW_SIZE, maxOffset))}
              className={navBtn}
              aria-label="Back 12 weeks"
            >
              <ChevronLeft className="size-3.5 text-muted-foreground" />
            </button>
            <span className="text-xs text-muted-foreground tabular-nums min-w-[140px] text-center select-none">
              {windowLabel}
            </span>
            <button
              type="button"
              disabled={offset <= 0}
              onClick={() => setOffset((o) => Math.max(o - WINDOW_SIZE, 0))}
              className={navBtn}
              aria-label="Forward 12 weeks"
            >
              <ChevronRight className="size-3.5 text-muted-foreground" />
            </button>
          </div>
        )}

        {expanded && (
          <span className="text-xs text-muted-foreground tabular-nums">
            {allISOs.length} weeks
          </span>
        )}
      </div>

      {/* ── Collapsed: 12-week window ── */}
      {!expanded && (
        <table className="w-full table-fixed border-collapse">
          {renderHead(visibleISOs as ISOCell[], false)}
          <tbody>
            <tr>{visibleISOs.map((iso) => renderCell(iso, iso))}</tr>
          </tbody>
        </table>
      )}

      {/* ── Expanded: rows of 12, all padded to equal width ── */}
      {expanded && (
        <div className="flex flex-col divide-y divide-border/30">
          {expandedChunks.map((chunk, i) => (
            <table key={i} className="w-full table-fixed border-collapse">
              {renderHead(chunk, true)}
              <tbody>
                <tr>{chunk.map((iso, j) => renderCell(iso, iso ?? `pad-${i}-${j}`))}</tr>
              </tbody>
            </table>
          ))}
        </div>
      )}
    </div>
  )
}
