"use client"

import { useState } from "react"
import Link from "next/link"
import { useQueryState } from "nuqs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ScoreBadge } from "@/components/scores/score-badge"
import { ScoreDialog } from "@/components/scores/score-dialog"
import { WeekNavigator } from "@/components/risk/week-navigator"
import { getRiskLevel, RISK_STYLES, RISK_LABELS } from "@/lib/risk"
import { formatWeekLabel } from "@/lib/week"
import { cn } from "@/lib/cn"
import { Search, PenLine, Clock } from "lucide-react"
import type { WeeklyScore } from "@/generated/prisma/client"

export interface ClientListItem {
  id: string
  slug: string
  name: string
  coachName?: string
  coachId?: string | null
  currentWeekScore: WeeklyScore | null
  updatedAt: Date
  canScore: boolean
}

export interface CoachOption {
  id: string
  fullName: string
}

interface ClientListProps {
  clients: ClientListItem[]
  coaches?: CoachOption[]
  weekISO: string
  isCurrentWeek: boolean
}

type RiskFilter = "high" | "medium" | "low" | null

const RISK_FILTER_OPTIONS: { value: RiskFilter; label: string }[] = [
  { value: null, label: "All" },
  { value: "high", label: "High Risk" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Healthy" },
]

export function ClientList({ clients, coaches, weekISO, isCurrentWeek }: ClientListProps) {
  const [search, setSearch] = useQueryState("q", { defaultValue: "" })
  const [riskFilter, setRiskFilter] = useQueryState<RiskFilter>("risk", {
    defaultValue: null,
    parse: (v): RiskFilter => {
      if (v === "high" || v === "medium" || v === "low") return v
      return null
    },
  })
  const [coachFilter, setCoachFilter] = useQueryState("coach", {
    defaultValue: "",
  })
  const [scoreDialogClientId, setScoreDialogClientId] = useState<string | null>(null)

  const isAdminView = Boolean(coaches && coaches.length > 0)

  const filtered = clients.filter((c) => {
    const matchesSearch = c.name
      .toLowerCase()
      .includes((search ?? "").toLowerCase())
    if (!matchesSearch) return false

    if (riskFilter) {
      const level = getRiskLevel(
        c.currentWeekScore?.predictiveScore ?? null
      ).toLowerCase()
      if (level !== riskFilter) return false
    }

    if (coachFilter && c.coachId !== coachFilter) return false

    return true
  })

  const activeDialog = scoreDialogClientId
    ? clients.find((c) => c.id === scoreDialogClientId) ?? null
    : null

  return (
    <>
      <div className="flex flex-col gap-4">
        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row gap-3 flex-wrap items-center">
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search clients..."
              value={search ?? ""}
              onChange={(e) => setSearch(e.target.value || null)}
              className="pl-9 h-9"
            />
          </div>

          {isAdminView && coaches && (
            <Select
              value={coachFilter ?? ""}
              onValueChange={(v) => setCoachFilter(v === "all" ? null : v)}
            >
              <SelectTrigger className="h-9 w-[180px] text-sm">
                <SelectValue placeholder="All coaches" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All coaches</SelectItem>
                {coaches.map((coach) => (
                  <SelectItem key={coach.id} value={coach.id}>
                    {coach.fullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <div className="flex gap-1.5">
            {RISK_FILTER_OPTIONS.map((f) => (
              <Button
                key={String(f.value)}
                size="sm"
                variant={riskFilter === f.value ? "default" : "outline"}
                onClick={() => setRiskFilter(f.value)}
                className="h-9 text-xs font-medium"
              >
                {f.label}
              </Button>
            ))}
          </div>

          {/* Week navigator — right-most */}
          <div className="ml-auto shrink-0">
            <WeekNavigator weekISO={weekISO} isCurrentWeek={isCurrentWeek} />
          </div>
        </div>

        {/* Historical week notice */}
        {!isCurrentWeek && (
          <div className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3.5 py-2.5">
            <Clock className="size-4 text-muted-foreground shrink-0" />
            <span className="text-sm text-muted-foreground">
              Viewing historical week — scores shown are read-only
            </span>
          </div>
        )}

        {/* Table */}
        <div className="rounded-lg border border-border overflow-hidden bg-card">
          <Table className="table-fixed w-full">
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="font-semibold text-xs uppercase tracking-wide w-[200px]">
                  Client
                </TableHead>
                {isAdminView && (
                  <TableHead className="font-semibold text-xs uppercase tracking-wide w-[140px] hidden sm:table-cell">
                    Coach
                  </TableHead>
                )}
                <TableHead className="text-center font-semibold text-xs uppercase tracking-wide w-[72px]">
                  Current
                </TableHead>
                <TableHead className="text-center font-semibold text-xs uppercase tracking-wide w-[80px]">
                  Predictive
                </TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wide w-[96px]">
                  Risk
                </TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wide hidden md:table-cell w-[260px]">
                  Last Actions
                </TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wide w-[100px] hidden sm:table-cell">
                  Week
                </TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wide w-[100px] hidden sm:table-cell">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={isAdminView ? 8 : 7}
                    className="text-center text-muted-foreground py-12 text-sm"
                  >
                    No clients match your filter
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((client) => {
                  const riskLevel = getRiskLevel(
                    client.currentWeekScore?.predictiveScore ?? null
                  )
                  return (
                    <TableRow
                      key={client.id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <TableCell>
                        <Link
                          href={`/clients/${client.slug}`}
                          className="font-medium text-sm hover:underline text-foreground"
                        >
                          {client.name}
                        </Link>
                      </TableCell>
                      {isAdminView && (
                        <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">
                          {client.coachName ?? "—"}
                        </TableCell>
                      )}
                      <TableCell className="text-center">
                        {client.currentWeekScore ? (
                          <ScoreBadge
                            score={client.currentWeekScore.currentScore}
                          />
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {client.currentWeekScore ? (
                          <ScoreBadge
                            score={client.currentWeekScore.predictiveScore}
                          />
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide border",
                            RISK_STYLES[riskLevel]
                          )}
                        >
                          {RISK_LABELS[riskLevel]}
                        </span>
                      </TableCell>
                      <TableCell className="hidden md:table-cell max-w-xs">
                        {client.currentWeekScore?.actions ? (
                          <p className="text-xs text-muted-foreground truncate">
                            {client.currentWeekScore.actions}
                          </p>
                        ) : (
                          <span className="text-xs text-muted-foreground/50">—</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-xs text-muted-foreground tabular-nums">
                        {client.currentWeekScore
                          ? formatWeekLabel(client.currentWeekScore.weekStart)
                          : "—"}
                      </TableCell>
                      <TableCell>
                        {client.canScore && isCurrentWeek && (
                          <Button
                            size="sm"
                            variant={client.currentWeekScore ? "outline" : "default"}
                            className="h-7 px-2.5 text-xs gap-1"
                            onClick={() => setScoreDialogClientId(client.id)}
                          >
                            <PenLine className="size-3" />
                            {client.currentWeekScore ? "Edit" : "Score"}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {activeDialog && (
        <ScoreDialog
          open={true}
          onOpenChange={(open) => { if (!open) setScoreDialogClientId(null) }}
          clientId={activeDialog.id}
          clientName={activeDialog.name}
          existingScore={activeDialog.currentWeekScore}
        />
      )}
    </>
  )
}
