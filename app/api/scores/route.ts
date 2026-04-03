import { NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { scoreSchema, scoreQuerySchema } from "@/schemas/score.schema"
import { getCurrentWeekStart } from "@/lib/week"

async function getAuthenticatedUser() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  return prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, role: true },
  })
}

export async function POST(request: NextRequest) {
  const authUser = await getAuthenticatedUser()
  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (authUser.role === "admin") {
    return NextResponse.json(
      { error: "Admins cannot submit scores" },
      { status: 403 }
    )
  }

  const body = await request.json().catch(() => null)
  const parsed = scoreSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation error", details: parsed.error.flatten() },
      { status: 422 }
    )
  }

  const { clientId, currentScore, predictiveScore, actions, notes } = parsed.data

  const assignment = await prisma.clientCoach.findUnique({
    where: { clientId_coachId: { clientId, coachId: authUser.id } },
  })

  if (!assignment) {
    return NextResponse.json(
      { error: "Client not assigned to you" },
      { status: 403 }
    )
  }

  const weekStart = getCurrentWeekStart()

  const score = await prisma.weeklyScore.upsert({
    where: { clientId_weekStart: { clientId, weekStart } },
    create: {
      clientId,
      coachId: authUser.id,
      weekStart,
      currentScore,
      predictiveScore,
      actions: actions ?? null,
      notes: notes ?? null,
    },
    update: {
      currentScore,
      predictiveScore,
      actions: actions ?? null,
      notes: notes ?? null,
    },
  })

  // Invalidate server component caches so dashboard and clients list
  // immediately reflect the new score without needing a hard reload.
  revalidatePath("/dashboard")
  revalidatePath("/clients")
  revalidatePath("/clients/[slug]", "page")

  return NextResponse.json({ score })
}

export async function GET(request: NextRequest) {
  const authUser = await getAuthenticatedUser()
  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const parsed = scoreQuerySchema.safeParse({
    clientId: searchParams.get("clientId"),
    limit: searchParams.get("limit") ?? "12",
  })

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation error", details: parsed.error.flatten() },
      { status: 422 }
    )
  }

  const { clientId, limit } = parsed.data

  if (authUser.role !== "admin") {
    const assignment = await prisma.clientCoach.findUnique({
      where: { clientId_coachId: { clientId, coachId: authUser.id } },
    })
    if (!assignment) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
  }

  const scores = await prisma.weeklyScore.findMany({
    where: { clientId },
    orderBy: { weekStart: "desc" },
    take: limit,
  })

  return NextResponse.json({ scores })
}
