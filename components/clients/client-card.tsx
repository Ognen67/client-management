"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ScoreBadge } from "@/components/scores/score-badge"
import { ScoreDialog } from "@/components/scores/score-dialog"
import { getRiskLevel, RISK_STYLES, RISK_LABELS } from "@/lib/risk"
import { isCurrentWeekEditable, formatWeekLabel, getCurrentWeekStart } from "@/lib/week"
import { cn } from "@/lib/cn"
import { TrendingUp, TrendingDown, Minus, PenLine, Lock, ArrowRight } from "lucide-react"
import type { WeeklyScore } from "@/generated/prisma/client"
import type { TrendDirection } from "@/types"

interface ClientCardProps {
  clientId: string
  clientSlug: string
  clientName: string
  currentWeekScore: WeeklyScore | null
  trend: TrendDirection
  readOnly?: boolean
}

function TrendIcon({ direction }: { direction: TrendDirection }) {
  if (direction === "up")
    return <TrendingUp className="size-3.5 text-green-500" />
  if (direction === "down")
    return <TrendingDown className="size-3.5 text-red-400" />
  return <Minus className="size-3.5 text-muted-foreground" />
}

const CARD_RISK_STYLES: Record<string, string> = {
  HIGH:    "border-red-200 bg-red-50/30",
  MEDIUM:  "border-amber-200 bg-amber-50/20",
  LOW:     "border-border bg-card",
  PENDING: "border-dashed border-muted-foreground/30 bg-card",
}

export function ClientCard({
  clientId,
  clientSlug,
  clientName,
  currentWeekScore,
  trend,
  readOnly = false,
}: ClientCardProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const editable = isCurrentWeekEditable()
  const hasScore = currentWeekScore !== null
  const riskLevel = getRiskLevel(currentWeekScore?.predictiveScore ?? null)
  const weekLabel = formatWeekLabel(getCurrentWeekStart())

  return (
    <>
      <Card
        className={cn(
          "flex flex-col transition-all duration-200 hover:shadow-md group",
          CARD_RISK_STYLES[riskLevel]
        )}
      >
        {/* Header row */}
        <div className="flex items-start justify-between gap-2 px-4 pt-4 pb-2">
          <div className="min-w-0">
            <Link
              href={`/clients/${clientSlug}`}
              className="font-semibold text-sm leading-tight hover:underline text-foreground truncate block"
            >
              {clientName}
            </Link>
            <p className="text-[11px] text-muted-foreground mt-0.5">{weekLabel}</p>
          </div>
          <span
            className={cn(
              "shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide border",
              RISK_STYLES[riskLevel]
            )}
          >
            {RISK_LABELS[riskLevel]}
          </span>
        </div>

        <CardContent className="px-4 pb-4 flex flex-col gap-3">
          {hasScore ? (
            <>
              {/* Scores row */}
              <div className="flex items-center gap-5 py-1">
                <div className="flex flex-col items-center gap-1">
                  <ScoreBadge score={currentWeekScore.currentScore} />
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">
                    Now
                  </span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <ScoreBadge score={currentWeekScore.predictiveScore} />
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">
                    Next
                  </span>
                </div>
                <div className="flex flex-col items-center gap-1 ml-auto">
                  <TrendIcon direction={trend} />
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">
                    Trend
                  </span>
                </div>
              </div>

              {/* Action committed — show if predictive < 5 */}
              {currentWeekScore.actions && (
                <div className="bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                  <p className="text-[10px] font-semibold text-amber-700 uppercase tracking-wide mb-1">
                    Action committed
                  </p>
                  <p className="text-xs text-amber-800 line-clamp-2 leading-relaxed">
                    {currentWeekScore.actions}
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center gap-2 py-2">
              <div className="size-2 rounded-full bg-muted-foreground/40 animate-pulse" />
              <span className="text-xs text-muted-foreground font-medium">
                Not scored this week
              </span>
            </div>
          )}

          {/* Footer actions */}
          <div className="flex items-center gap-2 pt-1 border-t border-border/60">
            {!readOnly && editable ? (
              <Button
                size="sm"
                variant={hasScore ? "outline" : "default"}
                className="flex-1 gap-1.5 h-8 text-xs font-medium"
                onClick={() => setDialogOpen(true)}
              >
                <PenLine className="size-3" />
                {hasScore ? "Edit scores" : "Score this client"}
              </Button>
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Lock className="size-3" />
                <span>Week closed</span>
              </div>
            )}
            <Link
              href={`/clients/${clientSlug}`}
              className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <ArrowRight className="size-3.5" />
              <span className="sr-only">View client</span>
            </Link>
          </div>
        </CardContent>
      </Card>

      <ScoreDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        clientId={clientId}
        clientName={clientName}
        existingScore={currentWeekScore}
      />
    </>
  )
}
