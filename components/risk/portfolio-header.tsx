"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Sparkles } from "lucide-react"
import { WeekNavigator } from "@/components/risk/week-navigator"
import { AiReportSheet } from "@/components/risk/ai-report-sheet"

interface PortfolioHeaderProps {
  weekLabel: string
  weekISO: string
  isCurrentWeek: boolean
}

export function PortfolioHeader({
  weekLabel,
  weekISO,
  isCurrentWeek,
}: PortfolioHeaderProps) {
  const [sheetOpen, setSheetOpen] = useState(false)

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <h1 className="text-2xl font-bold tracking-tight">Portfolio Health</h1>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground tabular-nums">
              Week of {weekLabel}
            </span>
            {!isCurrentWeek && (
              <span className="inline-flex items-center rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                Historical
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <WeekNavigator weekISO={weekISO} isCurrentWeek={isCurrentWeek} />
          <div className="w-px h-5 bg-border" />
          <Button
            variant="outline"
            size="sm"
            className="gap-2 h-9 font-medium"
            onClick={() => setSheetOpen(true)}
          >
            <Sparkles className="size-4" />
            Generate AI Report
          </Button>
        </div>
      </div>

      <AiReportSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        weekLabel={weekLabel}
        weekISO={weekISO}
      />
    </>
  )
}
