import { requireAuth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import {
  getCurrentWeekStart,
  getWeekStart,
  isCurrentWeekEditable,
  toISODateString,
  formatWeekLabel,
} from "@/lib/week"
import { ClientList } from "@/components/clients/client-list"
import { NuqsAdapter } from "nuqs/adapters/next/app"

interface ClientsPageProps {
  searchParams: Promise<{ week?: string }>
}

export default async function ClientsPage({ searchParams }: ClientsPageProps) {
  const user = await requireAuth()
  const params = await searchParams
  const currentWeekStart = getCurrentWeekStart()
  const weekStart = params.week
    ? getWeekStart(new Date(`${params.week}T00:00:00.000Z`))
    : currentWeekStart
  const weekISO = toISODateString(weekStart)
  const weekLabel = formatWeekLabel(weekStart)
  const isCurrentWeek = weekISO === toISODateString(currentWeekStart)
  const isAdmin = user.role === "admin"
  const editable = isCurrentWeek && isCurrentWeekEditable()

  if (isAdmin) {
    const [clientsRaw, coaches] = await Promise.all([
      prisma.client.findMany({
        where: { isActive: true },
        include: {
          weeklyScores: { where: { weekStart }, take: 1 },
          coaches: {
            include: { coach: { select: { id: true, fullName: true } } },
          },
        },
        orderBy: { name: "asc" },
      }),
      prisma.user.findMany({
        where: { role: "coach" },
        select: { id: true, fullName: true },
        orderBy: { fullName: "asc" },
      }),
    ])

    const clients = clientsRaw.map((c) => ({
      id: c.id,
      slug: c.slug,
      name: c.name,
      coachName: c.coaches[0]?.coach.fullName ?? "Unassigned",
      coachId: c.coaches[0]?.coach.id ?? null,
      currentWeekScore: c.weeklyScores[0] ?? null,
      updatedAt: c.updatedAt,
      canScore: false,
    }))

    return (
      <NuqsAdapter>
        <div className="flex flex-col gap-6 max-w-full">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold tracking-tight">Clients</h1>
            <p className="text-sm text-muted-foreground">
              {clients.length} active client{clients.length !== 1 ? "s" : ""}
              {" · all coaches · "}{weekLabel}
            </p>
          </div>
          <ClientList
            clients={clients}
            coaches={coaches}
            weekISO={weekISO}
            isCurrentWeek={isCurrentWeek}
          />
        </div>
      </NuqsAdapter>
    )
  }

  // Coach view
  const assignments = await prisma.clientCoach.findMany({
    where: { coachId: user.id },
    include: {
      client: {
        include: {
          weeklyScores: { where: { weekStart }, take: 1 },
        },
      },
    },
  })

  const coachAssignedIds = new Set(assignments.map((r) => r.clientId))
  const clients = assignments
    .filter((r) => r.client.isActive)
    .map((r) => ({
      id: r.client.id,
      slug: r.client.slug,
      name: r.client.name,
      currentWeekScore: r.client.weeklyScores[0] ?? null,
      updatedAt: r.client.updatedAt,
      canScore: editable && coachAssignedIds.has(r.client.id),
    }))
    .sort((a, b) => a.name.localeCompare(b.name))

  return (
    <NuqsAdapter>
      <div className="flex flex-col gap-6 max-w-full">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">Clients</h1>
          <p className="text-sm text-muted-foreground">
            {clients.length} active client{clients.length !== 1 ? "s" : ""}
            {" · your portfolio · "}{weekLabel}
          </p>
        </div>
        <ClientList
          clients={clients}
          weekISO={weekISO}
          isCurrentWeek={isCurrentWeek}
        />
      </div>
    </NuqsAdapter>
  )
}
