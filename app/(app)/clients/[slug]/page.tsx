import { notFound, redirect } from "next/navigation"
import { requireAuth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import {
  getCurrentWeekStart,
  getWeekStart,
  isSameWeek,
  toISODateString,
} from "@/lib/week"
import { ScoreHistoryTable } from "@/components/scores/score-history-table"
import { ClientDetailHeader } from "@/components/clients/client-detail-header"
import { ClientWeekStrip } from "@/components/clients/client-week-strip"
import { WeekDetailPanel } from "@/components/clients/week-detail-panel"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

interface ClientDetailPageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ week?: string }>
}

export default async function ClientDetailPage({
  params,
  searchParams,
}: ClientDetailPageProps) {
  const user = await requireAuth()
  const { slug } = await params
  const { week: weekParam } = await searchParams

  const currentWeekStart = getCurrentWeekStart()
  const currentWeekISO = toISODateString(currentWeekStart)

  const selectedWeekStart = weekParam
    ? getWeekStart(new Date(`${weekParam}T00:00:00.000Z`))
    : currentWeekStart
  const selectedWeekISO = toISODateString(selectedWeekStart)
  const isCurrentWeek = selectedWeekISO === currentWeekISO

  const client = await prisma.client.findUnique({
    where: { slug, isActive: true },
    include: {
      coaches: { include: { coach: true } },
      weeklyScores: {
        orderBy: { weekStart: "desc" },
        take: 24,
      },
    },
  })

  if (!client) notFound()

  const isAdmin = user.role === "admin"
  const coaches = client.coaches
  const weeklyScores = client.weeklyScores
  const isAssignedCoach = coaches.some((cc) => cc.coachId === user.id)

  if (!isAdmin && !isAssignedCoach) redirect("/dashboard")

  const currentWeekScore =
    weeklyScores.find((s) => isSameWeek(new Date(s.weekStart), currentWeekStart)) ??
    null

  const selectedWeekScore =
    weeklyScores.find((s) => isSameWeek(new Date(s.weekStart), selectedWeekStart)) ??
    null

  const coachName =
    coaches.find((cc) => cc.coachId === user.id)?.coach.fullName ??
    coaches[0]?.coach.fullName ??
    "Unassigned"

  return (
    <div className="flex flex-col gap-6 max-w-full">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/clients">Clients</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{client.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Slim header — title, coach, current risk status */}
      <ClientDetailHeader
        clientName={client.name}
        coachName={coachName}
        predictiveScore={currentWeekScore?.predictiveScore ?? null}
      />

      {/* Score timeline strip with prev/next week navigation */}
      <ClientWeekStrip
        slug={client.slug}
        scores={weeklyScores}
        selectedWeekISO={selectedWeekISO}
      />

      <Separator />

      {/* Selected week detail — scores, actions, notes, AI insight, edit button */}
      <WeekDetailPanel
        clientId={client.id}
        clientName={client.name}
        clientSlug={client.slug}
        selectedWeekISO={selectedWeekISO}
        isCurrentWeek={isCurrentWeek}
        canEdit={isAssignedCoach && !isAdmin}
        weekScore={selectedWeekScore}
      />

      {/* <Separator /> */}

      {/* Full tabular history */}
      {/* <div className="flex flex-col gap-3">
        <h2 className="text-base font-semibold">Score History</h2>
        <ScoreHistoryTable scores={weeklyScores} />
      </div> */}
    </div>
  )
}
