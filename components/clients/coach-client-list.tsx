"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronDown, ChevronRight, PenLine, ArrowRight } from "lucide-react"
import { LineChart, Line } from "recharts"
import { Button } from "@/components/ui/button"
import { ScoreBadge } from "@/components/scores/score-badge"
import { ScoreDialog } from "@/components/scores/score-dialog"
import { cn } from "@/lib/cn"
import type { WeeklyScore } from "@/generated/prisma/client"
import type { TrendDirection } from "@/types"

const SCORE_HEX: Record<number, string> = {
  1: "#dc2626",
  2: "#ea580c",
  3: "#d97706",
  4: "#65a30d",
  5: "#16a34a",
}

export interface CoachClient {
  id: string
  slug: string
  name: string
  currentWeekScore: WeeklyScore | null
  trend: TrendDirection
  weekTrend: number[]
}

interface CoachClientListProps {
  clients: CoachClient[]
  editable: boolean
  weekLabel: string
}

type CoachBand = "needsScoring" | "scored"

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

interface CoachRowProps {
  client: CoachClient
  band: CoachBand
  editable: boolean
}

function CoachRow({ client, band, editable }: CoachRowProps) {
  const router = useRouter()
  const [dialogOpen, setDialogOpen] = useState(false)
  const isPending = band === "needsScoring"
  const score = client.currentWeekScore
  const sparkData = client.weekTrend.map((v, i) => ({ i, v }))
  const lastVal = client.weekTrend[client.weekTrend.length - 1]
  const lineColor = lastVal ? (SCORE_HEX[lastVal] ?? "#94a3b8") : "#94a3b8"
  const firstAction = score?.actions?.split("\n")[0]?.trim() ?? null

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={() => router.push(`/clients/${client.slug}`)}
        onKeyDown={(e) => e.key === "Enter" && router.push(`/clients/${client.slug}`)}
        className={cn(
          "group flex items-stretch border-b border-border/30 border-l-4 last:border-b-0 transition-colors cursor-pointer",
          isPending
            ? "border-l-muted-foreground/30 bg-card hover:bg-muted/20"
            : "border-l-green-500 bg-card hover:bg-accent/30"
        )}
      >
        {/* Name ─────────────────────────────────────────── */}
        <div className="flex-2 min-w-0 px-4 py-2.5 flex flex-col justify-center border-r border-border/20">
          <p className={cn(
            "text-sm font-semibold leading-tight truncate transition-colors",
            isPending
              ? "text-muted-foreground group-hover:text-foreground"
              : "text-foreground group-hover:text-primary"
          )}>
            {client.name}
          </p>
          <p className="text-[11px] text-muted-foreground/50 mt-0.5 capitalize">
            {client.trend === "up" ? "↑ trending up" : client.trend === "down" ? "↓ trending down" : "→ stable"}
          </p>
        </div>

        {/* C / P ────────────────────────────────────────── */}
        <div className="flex items-center gap-1.5 px-3 py-2.5 shrink-0 border-r border-border/20">
          <span className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-wide">C</span>
          {score ? (
            <ScoreBadge score={score.currentScore} className="size-5 text-[10px] rounded" />
          ) : (
            <span className="inline-flex w-5 items-center justify-center text-xs text-muted-foreground/30 font-mono">—</span>
          )}
          <span className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-wide ml-1">P</span>
          {score ? (
            <ScoreBadge score={score.predictiveScore} className="size-5 text-[10px] rounded" />
          ) : (
            <span className="inline-flex w-5 items-center justify-center text-xs text-muted-foreground/30 font-mono">—</span>
          )}
        </div>

        {/* Sparkline ────────────────────────────────────── */}
        <div className="w-[88px] shrink-0 flex items-center px-2 border-r border-border/20">
          {sparkData.length > 1 ? (
            <LineChart width={80} height={24} data={sparkData} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
              <Line
                type="monotone"
                dataKey="v"
                stroke={lineColor}
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          ) : (
            <div className="h-6 w-full" />
          )}
        </div>

        {/* Actions / Score button ───────────────────────── */}
        <div className="flex-3 min-w-0 flex items-center gap-3 px-4 py-2">
          <div className="flex-1 min-w-0">
            {!isPending && firstAction && (
              <p className="text-[11px] text-muted-foreground/70 italic truncate">{firstAction}</p>
            )}
            {!isPending && !firstAction && score && score.predictiveScore < 5 && (
              <p className="text-[11px] text-red-400/60 italic">No actions entered</p>
            )}
            {isPending && (
              <span className="text-[11px] text-muted-foreground/50 italic">Not scored yet</span>
            )}
          </div>
          {editable && (
            <Button
              size="sm"
              variant={isPending ? "default" : "outline"}
              className="h-7 px-2.5 text-xs shrink-0 gap-1"
              onClick={(e) => {
                e.stopPropagation()
                setDialogOpen(true)
              }}
            >
              <PenLine className="size-3" />
              {isPending ? "Score" : "Edit"}
            </Button>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              router.push(`/clients/${client.slug}`)
            }}
            className="inline-flex shrink-0 size-7 items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="View client"
          >
            <ArrowRight className="size-3.5" />
          </button>
        </div>
      </div>

      <ScoreDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        clientId={client.id}
        clientName={client.name}
        existingScore={client.currentWeekScore}
      />
    </>
  )
}

export function CoachClientList({ clients, editable, weekLabel }: CoachClientListProps) {
  const needsScoring = clients
    .filter((c) => c.currentWeekScore === null)
    .sort((a, b) => a.name.localeCompare(b.name))

  const scored = clients
    .filter((c) => c.currentWeekScore !== null)
    .sort((a, b) => {
      const aP = a.currentWeekScore?.predictiveScore ?? 6
      const bP = b.currentWeekScore?.predictiveScore ?? 6
      return aP - bP
    })

  const [openBands, setOpenBands] = useState<Record<CoachBand, boolean>>({
    needsScoring: true,
    scored: true,
  })

  const toggle = (id: CoachBand) =>
    setOpenBands((prev) => ({ ...prev, [id]: !prev[id] }))

  if (clients.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border py-14 text-center">
        <p className="text-sm font-medium text-foreground">No clients assigned</p>
        <p className="text-xs text-muted-foreground mt-1">
          Contact an admin to be assigned to client accounts.
        </p>
      </div>
    )
  }

  const bands: { id: CoachBand; label: string; description: string; dotClass: string; clients: CoachClient[] }[] = [
    {
      id: "needsScoring",
      label: "Needs Scoring",
      description: weekLabel,
      dotClass: "bg-muted-foreground/40",
      clients: needsScoring,
    },
    {
      id: "scored",
      label: "Scored",
      description: "Sorted by risk — lowest predictive first",
      dotClass: "bg-green-500",
      clients: scored,
    },
  ]

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-2">
          <h2 className="text-base font-semibold tracking-tight">My Clients</h2>
          <span className="text-xs text-muted-foreground">
            {scored.length}/{clients.length} scored
          </span>
        </div>
        <button
          type="button"
          onClick={() => {
            const allOpen = openBands.needsScoring && openBands.scored
            setOpenBands({ needsScoring: !allOpen, scored: !allOpen })
          }}
          className="text-[11px] text-muted-foreground/60 hover:text-muted-foreground transition-colors"
        >
          {openBands.needsScoring && openBands.scored ? "Collapse all" : "Expand all"}
        </button>
      </div>

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
                    {band.id === "needsScoring" ? "All clients scored this week" : "No clients scored yet"}
                  </p>
                ) : (
                  band.clients.map((client) => (
                    <CoachRow key={client.id} client={client} band={band.id} editable={editable} />
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
