"use client"

import { useState } from "react"
import Link from "next/link"
import { Clock, ChevronLeft, PenLine } from "lucide-react"
import { ScoreBadge } from "@/components/scores/score-badge"
import { ScoreDialog } from "@/components/scores/score-dialog"
import { AiInsightPanel } from "@/components/ai/ai-insight-panel"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { formatWeekLabel, isCurrentWeekEditable } from "@/lib/week"
import type { WeeklyScore } from "@/generated/prisma/client"

interface WeekDetailPanelProps {
  clientId: string
  clientName: string
  clientSlug: string
  selectedWeekISO: string
  isCurrentWeek: boolean
  canEdit: boolean
  weekScore: WeeklyScore | null
}

export function WeekDetailPanel({
  clientId,
  clientName,
  clientSlug,
  selectedWeekISO,
  isCurrentWeek,
  canEdit,
  weekScore,
}: WeekDetailPanelProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const editable = isCurrentWeekEditable()
  const isHistorical = !isCurrentWeek
  const weekStart = new Date(`${selectedWeekISO}T00:00:00.000Z`)

  return (
    <>
      <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-5">
        {/* Panel header */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {isHistorical && (
              <Clock className="size-4 text-muted-foreground shrink-0" />
            )}
            <span className="text-sm font-semibold text-foreground">
              Week of {formatWeekLabel(weekStart)}
            </span>
            {isHistorical && (
              <span className="inline-flex items-center rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                Historical
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {canEdit && isCurrentWeek && editable && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setDialogOpen(true)}
                className="gap-1.5 h-7 text-xs"
              >
                <PenLine className="size-3" />
                {weekScore ? "Edit scores" : "Enter scores"}
              </Button>
            )}
            {isHistorical && (
              <Link
                href={`/clients/${clientSlug}`}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronLeft className="size-3.5" />
                Current week
              </Link>
            )}
          </div>
        </div>

        {weekScore ? (
          <div className="flex flex-col gap-4">
            {/* Score badges */}
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Current
                </span>
                <ScoreBadge score={weekScore.currentScore} className="size-9 text-sm" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Predictive
                </span>
                <ScoreBadge score={weekScore.predictiveScore} className="size-9 text-sm" />
              </div>
            </div>

            {/* Actions */}
            {weekScore.actions && (
              <div className="flex flex-col gap-1">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Actions
                </p>
                <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
                  {weekScore.actions}
                </p>
              </div>
            )}

            {/* Notes */}
            {weekScore.notes && (
              <div className="flex flex-col gap-1">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Notes
                </p>
                <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
                  {weekScore.notes}
                </p>
              </div>
            )}

            <Separator />
            <AiInsightPanel clientId={clientId} weekISO={selectedWeekISO} />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">
            No score was submitted for this week.
            {canEdit && isCurrentWeek && editable && " Use the button above to add scores."}
          </p>
        )}
      </div>

      <ScoreDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        clientId={clientId}
        clientName={clientName}
        existingScore={weekScore}
      />
    </>
  )
}
