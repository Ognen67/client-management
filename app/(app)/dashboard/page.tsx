import { requireAuth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import {
  getCurrentWeekStart,
  getWeekStart,
  isSameWeek,
  toISODateString,
  formatWeekLabel,
  isCurrentWeekEditable,
} from "@/lib/week"
import { NuqsAdapter } from "nuqs/adapters/next/app"
import { CoachClientList } from "@/components/clients/coach-client-list"
import { WeekNavigator } from "@/components/risk/week-navigator"
import { RiskSummaryCards } from "@/components/risk/risk-summary-cards"
import { PortfolioHeader } from "@/components/risk/portfolio-header"
import { TriageSwimlanes } from "@/components/risk/triage-swimlanes"
import { PortfolioHeatmap } from "@/components/risk/portfolio-heatmap"
import { getRiskLevel } from "@/lib/risk"
import type { TrendDirection, RiskSummary, TriageClient, HeatmapScoreMap } from "@/types"
import type { WeeklyScore } from "@/generated/prisma/client"
import { AlertTriangle, CheckCircle2, Clock, TrendingDown } from "lucide-react"
import { cn } from "@/lib/cn"

function computeTrend(scores: WeeklyScore[]): TrendDirection {
  if (scores.length < 2) return "flat"
  const sorted = [...scores].sort(
    (a, b) => new Date(b.weekStart).getTime() - new Date(a.weekStart).getTime()
  )
  const recent = sorted.slice(0, 3).map((s) => s.predictiveScore)
  const first = recent[recent.length - 1]
  const last = recent[0]
  if (last > first) return "up"
  if (last < first) return "down"
  return "flat"
}

interface DashboardPageProps {
  searchParams: Promise<{ week?: string }>
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const user = await requireAuth()
  const isAdmin = user.role === "admin"

  // ─── ADMIN: Portfolio Health view ────────────────────────────────────────
  if (isAdmin) {
    const params = await searchParams
    const weekStart = params.week
      ? getWeekStart(new Date(`${params.week}T00:00:00.000Z`))
      : getCurrentWeekStart()
    const weekISO = toISODateString(weekStart)
    const weekLabel = formatWeekLabel(weekStart)
    const isCurrentWeek = weekISO === toISODateString(getCurrentWeekStart())

    const twentyFourWeeksAgo = new Date(weekStart.getTime() - 23 * 7 * 24 * 60 * 60 * 1000)
    const fiveWeeksAgo = new Date(weekStart.getTime() - 4 * 7 * 24 * 60 * 60 * 1000)

    const [allClients, currentWeekScores, historicalScores] = await Promise.all([
      prisma.client.findMany({
        where: { isActive: true },
        include: { coaches: { include: { coach: true } } },
        orderBy: { name: "asc" },
      }),
      prisma.weeklyScore.findMany({
        where: { weekStart },
        include: { client: true, coach: true },
      }),
      prisma.weeklyScore.findMany({
        where: { weekStart: { gte: twentyFourWeeksAgo, lte: weekStart } },
        orderBy: { weekStart: "asc" },
      }),
    ])

    const scoresByClientId = new Map(currentWeekScores.map((s) => [s.clientId, s]))

    const triageClients: TriageClient[] = allClients.map((client) => {
      const score = scoresByClientId.get(client.id) ?? null
      const coachName = client.coaches[0]?.coach.fullName ?? "Unassigned"
      const coachId = client.coaches[0]?.coachId ?? ""
      const weekTrend = historicalScores
        .filter(
          (s) =>
            s.clientId === client.id &&
            s.weekStart.getTime() >= fiveWeeksAgo.getTime() &&
            s.weekStart.getTime() <= weekStart.getTime()
        )
        .sort((a, b) => a.weekStart.getTime() - b.weekStart.getTime())
        .map((s) => s.predictiveScore)

      return {
        id: client.id,
        slug: client.slug,
        name: client.name,
        coachName,
        coachId,
        currentScore: score?.currentScore ?? null,
        predictiveScore: score?.predictiveScore ?? null,
        actions: score?.actions ?? null,
        weekTrend,
      }
    })

    const summary: RiskSummary = {
      totalActive: allClients.length,
      highRisk: currentWeekScores.filter((s) => s.predictiveScore <= 2).length,
      mediumRisk: currentWeekScores.filter((s) => s.predictiveScore === 3).length,
      noScoreSubmitted: allClients.filter((c) => !scoresByClientId.has(c.id)).length,
    }

    const weekStarts: string[] = []
    for (let i = 23; i >= 0; i--) {
      const d = new Date(weekStart.getTime() - i * 7 * 24 * 60 * 60 * 1000)
      weekStarts.push(toISODateString(d))
    }

    const heatmapScoreMap: HeatmapScoreMap = {}
    for (const client of allClients) heatmapScoreMap[client.id] = {}
    for (const s of historicalScores) {
      const iso = toISODateString(s.weekStart)
      if (heatmapScoreMap[s.clientId] && weekStarts.includes(iso)) {
        heatmapScoreMap[s.clientId][iso] = {
          current: s.currentScore,
          predictive: s.predictiveScore,
        }
      }
    }

    return (
      <NuqsAdapter>
        <div className="flex flex-col gap-8 w-full min-w-0">
          <PortfolioHeader
            weekLabel={weekLabel}
            weekISO={weekISO}
            isCurrentWeek={isCurrentWeek}
          />
          <RiskSummaryCards summary={summary} totalClients={allClients.length} />
          <TriageSwimlanes clients={triageClients} />
          <PortfolioHeatmap
            clients={allClients.map((c) => ({ id: c.id, name: c.name, slug: c.slug }))}
            weekStarts={weekStarts}
            currentWeekISO={weekISO}
            scoreMap={heatmapScoreMap}
          />
        </div>
      </NuqsAdapter>
    )
  }

  // ─── COACH: My Dashboard view ─────────────────────────────────────────────
  const params = await searchParams
  const currentWeekStart = getCurrentWeekStart()
  const currentWeekISO = toISODateString(currentWeekStart)
  const weekStart = params.week
    ? getWeekStart(new Date(`${params.week}T00:00:00.000Z`))
    : currentWeekStart
  const weekISO = toISODateString(weekStart)
  const weekLabel = formatWeekLabel(weekStart)
  const isCurrentWeek = weekISO === currentWeekISO
  const lastWeekStart = new Date(weekStart.getTime() - 7 * 24 * 60 * 60 * 1000)

  const [clientCoaches, lastWeekActions] = await Promise.all([
    prisma.clientCoach.findMany({
      where: { coachId: user.id },
      include: {
        client: {
          include: {
            weeklyScores: {
              where: {
                coachId: user.id,
                weekStart: { lte: weekStart },
              },
              orderBy: { weekStart: "desc" },
              take: 5,
            },
          },
        },
      },
    }),
    // Action reminders only relevant for the current week view
    isCurrentWeek
      ? prisma.weeklyScore.findMany({
          where: {
            coachId: user.id,
            weekStart: lastWeekStart,
            actions: { not: null },
            predictiveScore: { lt: 5 },
          },
          include: { client: true },
          orderBy: { predictiveScore: "asc" },
        })
      : Promise.resolve([]),
  ])

  const clients = clientCoaches
    .filter((cc) => cc.client.isActive)
    .map((cc) => {
      const { client } = cc
      const currentWeekScore =
        client.weeklyScores.find((s) =>
          isSameWeek(new Date(s.weekStart), weekStart)
        ) ?? null
      const historicalScores = client.weeklyScores.filter(
        (s) => !isSameWeek(new Date(s.weekStart), weekStart)
      )
      const weekTrend = [...historicalScores]
        .sort((a, b) => new Date(a.weekStart).getTime() - new Date(b.weekStart).getTime())
        .map((s) => s.predictiveScore)
      return {
        id: client.id,
        slug: client.slug,
        name: client.name,
        currentWeekScore,
        trend: computeTrend(historicalScores),
        weekTrend,
      }
    })

  const scoredCount = clients.filter((c) => c.currentWeekScore !== null).length
  const notScoredCount = clients.length - scoredCount
  const atRiskCount = clients.filter((c) => {
    const level = getRiskLevel(c.currentWeekScore?.predictiveScore ?? null)
    return level === "HIGH" || level === "MEDIUM"
  }).length
  const completionPct =
    clients.length > 0 ? Math.round((scoredCount / clients.length) * 100) : 0

  return (
    <NuqsAdapter>
      <div className="flex flex-col gap-6 w-full min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">My Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Week of {weekLabel}</p>
          </div>
          <div className="flex items-center gap-3">
            {isCurrentWeek && (
              <div className="flex items-center gap-2">
                <div className="h-2 w-32 rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      completionPct === 100
                        ? "bg-green-500"
                        : completionPct > 50
                        ? "bg-primary"
                        : "bg-amber-400"
                    )}
                    style={{ width: `${completionPct}%` }}
                  />
                </div>
                <span className="text-sm font-medium tabular-nums text-muted-foreground">
                  {scoredCount}/{clients.length} scored
                </span>
              </div>
            )}
            <WeekNavigator weekISO={weekISO} isCurrentWeek={isCurrentWeek} />
          </div>
        </div>

        {/* Historical week notice */}
        {!isCurrentWeek && (
          <div className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3.5 py-2.5">
            <Clock className="size-4 text-muted-foreground shrink-0" />
            <span className="text-sm text-muted-foreground">
              Viewing historical week — scores are read-only
            </span>
          </div>
        )}

        {clients.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Total clients", value: clients.length, icon: null, style: "text-foreground" },
              { label: "Scored", value: scoredCount, icon: <CheckCircle2 className="size-3.5 text-green-500" />, style: "text-green-700" },
              { label: "Need scoring", value: notScoredCount, icon: <Clock className="size-3.5 text-muted-foreground" />, style: notScoredCount > 0 ? "text-amber-600" : "text-muted-foreground" },
              { label: "At risk", value: atRiskCount, icon: <TrendingDown className="size-3.5 text-red-500" />, style: atRiskCount > 0 ? "text-red-600" : "text-muted-foreground" },
            ].map((stat) => (
              <div key={stat.label} className="bg-card border border-border rounded-lg px-4 py-3 flex flex-col gap-1">
                <div className="flex items-center gap-1.5">
                  {stat.icon}
                  <span className="text-xs text-muted-foreground">{stat.label}</span>
                </div>
                <span className={cn("text-2xl font-bold font-mono tabular-nums", stat.style)}>
                  {stat.value}
                </span>
              </div>
            ))}
          </div>
        )}

        {clients.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-16 text-center">
            <p className="text-sm font-medium text-foreground">No clients assigned</p>
            <p className="text-xs text-muted-foreground mt-1">
              Contact an admin to be assigned to client accounts.
            </p>
          </div>
        ) : (
          <CoachClientList
            clients={clients}
            editable={isCurrentWeek && isCurrentWeekEditable()}
            weekLabel={weekLabel}
          />
        )}
      </div>
    </NuqsAdapter>
  )
}
