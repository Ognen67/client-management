"use client"

import { getRiskLevel, RISK_STYLES, RISK_LABELS } from "@/lib/risk"
import { formatWeekLabel, getCurrentWeekStart } from "@/lib/week"
import { cn } from "@/lib/cn"
import { User, CalendarDays } from "lucide-react"

interface ClientDetailHeaderProps {
  clientName: string
  coachName: string
  predictiveScore: number | null
}

export function ClientDetailHeader({
  clientName,
  coachName,
  predictiveScore,
}: ClientDetailHeaderProps) {
  const riskLevel = getRiskLevel(predictiveScore)
  const weekLabel = formatWeekLabel(getCurrentWeekStart())

  return (
    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-bold tracking-tight">{clientName}</h1>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <User className="size-3.5" />
            {coachName}
          </span>
          <span className="flex items-center gap-1.5">
            <CalendarDays className="size-3.5" />
            Week of {weekLabel}
          </span>
        </div>
      </div>
      <span
        className={cn(
          "self-start inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide border",
          RISK_STYLES[riskLevel]
        )}
      >
        {RISK_LABELS[riskLevel]}
      </span>
    </div>
  )
}
