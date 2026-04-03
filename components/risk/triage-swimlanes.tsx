"use client"

import { useState } from "react"
import { ChevronDown, ChevronRight } from "lucide-react"
import { cn } from "@/lib/cn"
import { TriageRow, type RiskBand } from "@/components/risk/triage-row"
import type { TriageClient } from "@/types"

interface TriageSwimlanesProps {
  clients: TriageClient[]
  weekLabel?: string
}

interface Band {
  id: RiskBand
  label: string
  description: string
  dotClass: string
  clients: TriageClient[]
}

interface BandDividerProps {
  label: string
  description: string
  count: number
  dotClass: string
  isOpen: boolean
  onToggle: () => void
}

function BandDivider({ label, description, count, dotClass, isOpen, onToggle }: BandDividerProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="sticky top-0 z-10 w-full flex items-center gap-2 px-3 py-1.5 bg-background/95 backdrop-blur-sm border-b border-border/40 hover:bg-muted/30 transition-colors group text-left"
    >
      <div className="h-px w-5 shrink-0 bg-border/70" />
      <div className={cn("size-1.5 rounded-full shrink-0", dotClass)} />
      <span className="text-[11px] font-semibold text-foreground shrink-0">{label}</span>
      <span className="text-[11px] text-muted-foreground/70 shrink-0">— {description}</span>
      <div className="h-px flex-1 bg-border/50" />
      <span className="text-[10px] text-muted-foreground/50 tabular-nums shrink-0 mr-1">
        [{count} {count === 1 ? "client" : "clients"}]
      </span>
      {isOpen ? (
        <ChevronDown className="size-3 text-muted-foreground/50 shrink-0 group-hover:text-muted-foreground transition-colors" />
      ) : (
        <ChevronRight className="size-3 text-muted-foreground/50 shrink-0 group-hover:text-muted-foreground transition-colors" />
      )}
    </button>
  )
}

export function TriageSwimlanes({ clients, weekLabel }: TriageSwimlanesProps) {
  const actNow = clients
    .filter((c) => c.predictiveScore !== null && c.predictiveScore <= 2)
    .sort((a, b) => (a.predictiveScore ?? 0) - (b.predictiveScore ?? 0))

  const watch = clients
    .filter((c) => c.predictiveScore === 3)
    .sort((a, b) => a.name.localeCompare(b.name))

  const onTrack = clients
    .filter((c) => c.predictiveScore !== null && c.predictiveScore >= 4)
    .sort((a, b) => (a.predictiveScore ?? 0) - (b.predictiveScore ?? 0))

  const pending = clients
    .filter((c) => c.predictiveScore === null)
    .sort((a, b) => a.name.localeCompare(b.name))

  const bands: Band[] = [
    {
      id: "actNow",
      label: "Act Now",
      description: "Predictive ≤ 2",
      dotClass: "bg-red-500",
      clients: actNow,
    },
    {
      id: "watch",
      label: "Watch",
      description: "Predictive = 3",
      dotClass: "bg-amber-400",
      clients: watch,
    },
    {
      id: "onTrack",
      label: "On Track",
      description: "Predictive ≥ 4",
      dotClass: "bg-green-500",
      clients: onTrack,
    },
    {
      id: "pending",
      label: "Pending Submission",
      description: "No score this week",
      dotClass: "bg-muted-foreground/40",
      clients: pending,
    },
  ]

  const [openBands, setOpenBands] = useState<Record<RiskBand, boolean>>({
    actNow: true,
    watch: true,
    onTrack: false,
    pending: false,
  })

  const toggle = (id: RiskBand) =>
    setOpenBands((prev) => ({ ...prev, [id]: !prev[id] }))

  const hasAnyScored = actNow.length + watch.length + onTrack.length > 0

  if (!hasAnyScored && pending.length === 0) {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-baseline gap-2">
          <h2 className="text-base font-semibold tracking-tight">Risk Radar</h2>
        </div>
        <div className="rounded-lg border border-dashed border-border py-14 text-center">
          <p className="text-sm font-medium text-foreground">
            No scores submitted yet for this week
          </p>
          {weekLabel && (
            <p className="text-xs text-muted-foreground mt-1">{weekLabel}</p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-2">
          <h2 className="text-base font-semibold tracking-tight">Risk Radar</h2>
          <span className="text-xs text-muted-foreground">
            {clients.length} clients — sorted by risk
          </span>
        </div>
        <button
          type="button"
          onClick={() => {
            const allOpen = bands.every((b) => openBands[b.id])
            const next = !allOpen
            setOpenBands({ actNow: next, watch: next, onTrack: next, pending: next })
          }}
          className="text-[11px] text-muted-foreground/60 hover:text-muted-foreground transition-colors"
        >
          {bands.every((b) => openBands[b.id]) ? "Collapse all" : "Expand all"}
        </button>
      </div>

      {/* overflow-clip preserves rounded corners without blocking sticky */}
      <div className="rounded-lg border border-border overflow-clip">
        {bands.map((band) => (
          <div key={band.id}>
            <BandDivider
              label={band.label}
              description={band.description}
              count={band.clients.length}
              dotClass={band.dotClass}
              isOpen={openBands[band.id]}
              onToggle={() => toggle(band.id)}
            />

            {openBands[band.id] && (
              <>
                {band.clients.length === 0 ? (
                  <p className="px-4 py-2 text-[11px] text-muted-foreground/40 italic border-b border-border/20 last:border-b-0">
                    No clients in this category
                  </p>
                ) : (
                  band.clients.map((client) => (
                    <TriageRow key={client.id} client={client} band={band.id} />
                  ))
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
