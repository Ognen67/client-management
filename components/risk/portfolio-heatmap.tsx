"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { formatWeekLabel } from "@/lib/week"
import { cn } from "@/lib/cn"
import type { HeatmapScoreMap } from "@/types"

interface HeatmapClient {
  id: string
  name: string
  slug: string
}

interface PortfolioHeatmapProps {
  clients: HeatmapClient[]
  /** All available ISO date strings, oldest first. The component windows 12 at a time. */
  weekStarts: string[]
  currentWeekISO: string
  scoreMap: HeatmapScoreMap
  hideTitle?: boolean
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

function shortWeekLabel(iso: string): string {
  const d = new Date(`${iso}T00:00:00.000Z`)
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`
}

export function PortfolioHeatmap({
  clients,
  weekStarts,
  currentWeekISO,
  scoreMap,
  hideTitle = false,
}: PortfolioHeatmapProps) {
  const router = useRouter()

  const [offset, setOffset] = useState(0)
  const maxOffset = Math.max(0, weekStarts.length - WINDOW_SIZE)
  const hasPrev = offset < maxOffset
  const hasNext = offset > 0

  const end = weekStarts.length - offset
  const start = Math.max(0, end - WINDOW_SIZE)
  const visibleWeeks = weekStarts.slice(start, end)

  const windowLabel =
    visibleWeeks.length >= 2
      ? `${shortWeekLabel(visibleWeeks[0])} – ${shortWeekLabel(visibleWeeks[visibleWeeks.length - 1])}`
      : ""

  return (
    <div className="flex flex-col gap-3">
      {!hideTitle && (
        <div className="flex items-baseline gap-2">
          <h2 className="text-base font-semibold tracking-tight">Score History</h2>
          <span className="text-xs text-muted-foreground">
            {weekStarts.length} weeks · current / predictive
          </span>
        </div>
      )}

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {/* Week window navigator */}
        <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-border bg-muted/20">
          <span className="text-xs text-muted-foreground tabular-nums">
            {weekStarts.length > WINDOW_SIZE
              ? `Showing ${visibleWeeks.length} of ${weekStarts.length} weeks`
              : `${weekStarts.length} weeks`}
          </span>

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={!hasPrev}
              onClick={() => setOffset((o) => Math.min(o + 1, maxOffset))}
              className="inline-flex size-6 items-center justify-center rounded border border-transparent hover:border-border hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Older weeks"
            >
              <ChevronLeft className="size-3.5 text-muted-foreground" />
            </button>
            <span className="text-xs font-medium tabular-nums min-w-[140px] text-center select-none">
              {windowLabel}
            </span>
            <button
              type="button"
              disabled={!hasNext}
              onClick={() => setOffset((o) => Math.max(o - 1, 0))}
              className="inline-flex size-6 items-center justify-center rounded border border-transparent hover:border-border hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Newer weeks"
            >
              <ChevronRight className="size-3.5 text-muted-foreground" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 bg-card min-w-[140px] max-w-[180px] px-3 py-2 text-left border-b border-border">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                    Client
                  </span>
                </th>
                {visibleWeeks.map((iso) => (
                  <th
                    key={iso}
                    className={cn(
                      "px-0.5 py-2 text-center border-b border-border min-w-[44px]",
                      iso === currentWeekISO && "bg-primary/5"
                    )}
                  >
                    <span
                      className={cn(
                        "text-[9px] font-mono tabular-nums whitespace-nowrap",
                        iso === currentWeekISO
                          ? "text-primary font-bold"
                          : "text-muted-foreground/50"
                      )}
                    >
                      {shortWeekLabel(iso)}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {clients.map((client, rowIdx) => {
                const baseRowBg = rowIdx % 2 === 0 ? "bg-card" : "bg-muted/20"
                return (
                  <tr
                    key={client.id}
                    className={cn(
                      "group cursor-pointer transition-colors duration-100",
                      baseRowBg,
                      "hover:bg-accent/50"
                    )}
                  >
                    {/* Client name — sticky */}
                    <td
                      className={cn(
                        "sticky left-0 z-10 px-3 py-2 border-b border-border/40 transition-colors duration-100",
                        baseRowBg,
                        "group-hover:bg-accent/50"
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => router.push(`/clients/${client.slug}`)}
                        className="text-xs font-medium text-foreground/80 hover:text-primary transition-colors truncate block max-w-[160px] text-left"
                      >
                        {client.name}
                      </button>
                    </td>

                    {/* Score cells — current on top, predictive on bottom */}
                    {visibleWeeks.map((iso) => {
                      const entry = scoreMap[client.id]?.[iso]

                      return (
                        <td
                          key={iso}
                          className={cn(
                            "px-0.5 py-1.5 border-b border-border/40 text-center",
                            iso === currentWeekISO && "bg-primary/5 group-hover:bg-primary/10"
                          )}
                        >
                          {entry ? (
                            <Tooltip>
                              <TooltipTrigger
                                render={
                                  <button
                                    type="button"
                                    onClick={() => router.push(`/clients/${client.slug}?week=${iso}`)}
                                    className="flex flex-row items-center gap-[2px] mx-auto cursor-pointer hover:scale-105 transition-transform"
                                    aria-label={`${client.name} — ${shortWeekLabel(iso)}: C${entry.current} P${entry.predictive}`}
                                  />
                                }
                              >
                                <div
                                  className={cn(
                                    "size-5 rounded-sm text-[9px] font-bold flex items-center justify-center",
                                    SCORE_BG[entry.current],
                                    SCORE_TEXT[entry.current]
                                  )}
                                >
                                  {entry.current}
                                </div>
                                <div
                                  className={cn(
                                    "size-5 rounded-sm text-[9px] font-bold flex items-center justify-center",
                                    SCORE_BG[entry.predictive],
                                    SCORE_TEXT[entry.predictive]
                                  )}
                                >
                                  {entry.predictive}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="top" variant="light" className="text-xs p-2.5">
                                <div className="flex flex-col gap-1.5">
                                  <span className="font-semibold text-foreground">{client.name}</span>
                                  <span className="text-muted-foreground text-[11px]">
                                    {formatWeekLabel(iso)}
                                  </span>
                                  <div className="flex items-center gap-3 pt-0.5">
                                    <div className="flex items-center gap-1">
                                      <span className="text-[10px] font-medium text-muted-foreground">C:</span>
                                      <span className="font-bold">{entry.current}</span>
                                      <span className="text-muted-foreground/60 text-[10px]">
                                        ({SCORE_LABEL[entry.current]})
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <span className="text-[10px] font-medium text-muted-foreground">P:</span>
                                      <span className="font-bold">{entry.predictive}</span>
                                      <span className="text-muted-foreground/60 text-[10px]">
                                        ({SCORE_LABEL[entry.predictive]})
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <Tooltip>
                              <TooltipTrigger
                                render={
                                  <button
                                    type="button"
                                    onClick={() => router.push(`/clients/${client.slug}?week=${iso}`)}
                                    className="flex flex-col items-center gap-[2px] mx-auto cursor-pointer rounded hover:bg-muted/20 transition-colors px-0.5 py-0.5"
                                    aria-label={`${client.name} — ${shortWeekLabel(iso)}: no score`}
                                  />
                                }
                              >
                                <div className="size-5 rounded-sm bg-muted/15" />
                                <div className="size-5 rounded-sm bg-muted/15 flex items-center justify-center">
                                  <span className="text-[8px] text-muted-foreground/20">—</span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="top" variant="light" className="text-xs p-2.5">
                                <div className="flex flex-col gap-1">
                                  <span className="font-semibold text-foreground">{client.name}</span>
                                  <span className="text-muted-foreground text-[11px]">{formatWeekLabel(iso)}</span>
                                  <span className="text-muted-foreground/60 text-[11px]">No score submitted</span>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 px-3 py-2 border-t border-border bg-muted/20 flex-wrap">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
            Score
          </span>
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <div
                key={n}
                className={cn(
                  "size-4 rounded-sm text-[9px] font-bold flex items-center justify-center",
                  SCORE_BG[n],
                  SCORE_TEXT[n]
                )}
              >
                {n}
              </div>
            ))}
            <span className="text-[10px] text-muted-foreground/50 ml-1">1=critical · 5=healthy</span>
          </div>
          <span className="text-[10px] text-muted-foreground/40">
            ↑ Current &nbsp;↓ Predictive
          </span>
          <span className="ml-auto text-[10px] text-muted-foreground/40">Click any cell to view client</span>
        </div>
      </div>
    </div>
  )
}
