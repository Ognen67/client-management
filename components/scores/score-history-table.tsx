"use client"

import { useState, useRef, useEffect } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { ScoreBadge } from "@/components/scores/score-badge"
import { formatWeekLabel, toISODateString } from "@/lib/week"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/cn"
import type { WeeklyScore } from "@/generated/prisma/client"

interface ScoreHistoryTableProps {
  scores: WeeklyScore[]
}

export function ScoreHistoryTable({ scores }: ScoreHistoryTableProps) {
  const sorted = [...scores].sort(
    (a, b) => new Date(b.weekStart).getTime() - new Date(a.weekStart).getTime()
  )

  const weekISOs = sorted.map((s) => toISODateString(s.weekStart))
  const [focusedISO, setFocusedISO] = useState(weekISOs[0] ?? "")
  const rowRefs = useRef<Record<string, HTMLTableRowElement | null>>({})

  const focusedIdx = weekISOs.indexOf(focusedISO)
  const hasPrev = focusedIdx < weekISOs.length - 1
  const hasNext = focusedIdx > 0

  useEffect(() => {
    if (focusedISO && rowRefs.current[focusedISO]) {
      rowRefs.current[focusedISO]?.scrollIntoView({ behavior: "smooth", block: "nearest" })
    }
  }, [focusedISO])

  if (sorted.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">
        No score history yet.
      </p>
    )
  }

  const focusedScore = sorted[focusedIdx]

  return (
    <div className="rounded-lg border border-border overflow-clip">
      {/* Header: label left, week navigator right */}
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-border bg-muted/20">
        <span className="text-xs text-muted-foreground">
          {sorted.length} weeks recorded
        </span>

        {/* Week navigator — right side */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={!hasPrev}
            onClick={() => setFocusedISO(weekISOs[focusedIdx + 1])}
            className="inline-flex size-6 items-center justify-center rounded border border-transparent hover:border-border hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Previous week"
          >
            <ChevronLeft className="size-3.5 text-muted-foreground" />
          </button>
          <span className="text-xs font-medium tabular-nums min-w-[128px] text-center select-none">
            {focusedScore ? formatWeekLabel(focusedScore.weekStart) : "—"}
          </span>
          <button
            type="button"
            disabled={!hasNext}
            onClick={() => setFocusedISO(weekISOs[focusedIdx - 1])}
            className="inline-flex size-6 items-center justify-center rounded border border-transparent hover:border-border hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Next week"
          >
            <ChevronRight className="size-3.5 text-muted-foreground" />
          </button>
        </div>
      </div>

      <div className="max-h-[420px] overflow-y-auto">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-background">
            <TableRow>
              <TableHead className="text-xs w-[130px]">Week</TableHead>
              <TableHead className="text-xs text-center w-[72px]">Current</TableHead>
              <TableHead className="text-xs text-center w-[80px]">Predictive</TableHead>
              <TableHead className="text-xs">Actions / Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((score) => {
              const iso = toISODateString(score.weekStart)
              const isFocused = iso === focusedISO
              const hasDetail = score.actions || score.notes

              return (
                <TableRow
                  key={score.id}
                  ref={(el) => { rowRefs.current[iso] = el }}
                  onClick={() => setFocusedISO(iso)}
                  className={cn(
                    "cursor-pointer transition-colors duration-100 group",
                    isFocused
                      ? "bg-primary/5 hover:bg-primary/8"
                      : "hover:bg-muted/50"
                  )}
                >
                  <TableCell className={cn("text-sm font-medium transition-colors", isFocused ? "text-primary" : "group-hover:text-foreground")}>
                    {formatWeekLabel(score.weekStart)}
                  </TableCell>

                  <TableCell className="text-center">
                    <Tooltip>
                      <TooltipTrigger>
                        <span className="inline-block">
                          <ScoreBadge score={score.currentScore} />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent
                        side="top"
                        className="bg-background border border-border text-foreground shadow-md text-xs"
                      >
                        Current score: {score.currentScore}
                      </TooltipContent>
                    </Tooltip>
                  </TableCell>

                  <TableCell className="text-center">
                    <Tooltip>
                      <TooltipTrigger>
                        <span className="inline-block">
                          <ScoreBadge score={score.predictiveScore} />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent
                        side="top"
                        className="bg-background border border-border text-foreground shadow-md text-xs"
                      >
                        Predictive score: {score.predictiveScore}
                      </TooltipContent>
                    </Tooltip>
                  </TableCell>

                  <TableCell className="max-w-xs">
                    {hasDetail ? (
                      <Tooltip>
                        <TooltipTrigger>
                          <span className="block text-xs text-muted-foreground truncate cursor-default">
                            {score.actions ?? score.notes}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent
                          side="top"
                          align="start"
                          className="bg-background border border-border text-foreground shadow-md max-w-sm p-3"
                        >
                          <div className="flex flex-col gap-2.5">
                            {score.actions && (
                              <div>
                                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                                  Actions
                                </p>
                                <p className="text-xs leading-relaxed whitespace-pre-wrap">
                                  {score.actions}
                                </p>
                              </div>
                            )}
                            {score.notes && (
                              <div>
                                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                                  Notes
                                </p>
                                <p className="text-xs leading-relaxed whitespace-pre-wrap">
                                  {score.notes}
                                </p>
                              </div>
                            )}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <span className="text-xs italic text-muted-foreground/40">—</span>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
