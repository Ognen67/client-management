"use client"

import Link from "next/link"
import { ScoreBadge } from "@/components/scores/score-badge"
import { cn } from "@/lib/cn"
import type { TriageClient } from "@/types"

export type RiskBand = "actNow" | "watch" | "onTrack" | "pending"

const BAND_BORDER: Record<RiskBand, string> = {
  actNow:  "border-l-red-500",
  watch:   "border-l-amber-400",
  onTrack: "border-l-green-500",
  pending: "border-l-border",
}

interface TriageRowProps {
  client: TriageClient
  band: RiskBand
}

export function TriageRow({ client, band }: TriageRowProps) {
  const isPending = band === "pending"
  const firstAction = client.actions?.split("\n")[0]?.trim() ?? null
  const showMissingAction =
    !firstAction &&
    !isPending &&
    client.predictiveScore !== null &&
    client.predictiveScore < 5

  return (
    <Link
      href={`/clients/${client.slug}`}
      className={cn(
        "group flex items-stretch border-b border-border/30 border-l-4 last:border-b-0 transition-colors",
        BAND_BORDER[band],
        isPending
          ? "bg-card opacity-60 hover:opacity-90 hover:bg-muted/30"
          : "bg-card hover:bg-accent/40"
      )}
    >
      {/* Name + Coach ─────────────────────────────────────── */}
      <div className="flex-2 min-w-0 px-4 py-2.5 flex flex-col justify-center border-r border-border/20">
        <p
          className={cn(
            "text-sm font-semibold leading-tight truncate",
            isPending
              ? "text-muted-foreground"
              : "text-foreground group-hover:text-primary transition-colors"
          )}
        >
          {client.name}
        </p>
        <p className="text-[11px] text-muted-foreground/60 truncate mt-0.5">
          {client.coachName}
        </p>
      </div>

      {/* C / P badges ─────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 px-3 py-2.5 shrink-0 border-r border-border/20">
        <span className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-wide">
          C
        </span>
        {client.currentScore !== null ? (
          <ScoreBadge score={client.currentScore} className="size-5 text-[10px] rounded" />
        ) : (
          <span className="inline-flex w-5 items-center justify-center text-xs text-muted-foreground/30 font-mono">
            —
          </span>
        )}
        <span className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-wide ml-1">
          P
        </span>
        {client.predictiveScore !== null ? (
          <ScoreBadge score={client.predictiveScore} className="size-5 text-[10px] rounded" />
        ) : (
          <span className="inline-flex w-5 items-center justify-center text-xs text-muted-foreground/30 font-mono">
            —
          </span>
        )}
      </div>

      {/* Actions ──────────────────────────────────────────── */}
      <div className="flex-3 min-w-0 flex items-center justify-between gap-3 px-4 py-2.5">
        {isPending ? (
          <>
            <span className="text-[11px] text-muted-foreground/50 italic">
              No score submitted
            </span>
            <span className="shrink-0 inline-flex items-center rounded-full border border-border px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              Pending
            </span>
          </>
        ) : firstAction ? (
          <p className="text-[11px] text-muted-foreground/70 italic truncate">
            {firstAction}
          </p>
        ) : showMissingAction ? (
          <p className="text-[11px] text-red-400/60 italic">No actions entered</p>
        ) : null}
      </div>
    </Link>
  )
}
