import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { getCurrentWeekStart } from "@/lib/week"

export async function GET() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, role: true },
  })

  if (!dbUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  const weekStart = getCurrentWeekStart()

  if (dbUser.role === "admin") {
    const clients = await prisma.client.findMany({
      where: { isActive: true },
      include: {
        weeklyScores: {
          where: { weekStart },
          take: 1,
        },
      },
      orderBy: { name: "asc" },
    })
    return NextResponse.json({ clients })
  }

  const assignments = await prisma.clientCoach.findMany({
    where: { coachId: dbUser.id },
    include: {
      client: {
        include: {
          weeklyScores: {
            where: { weekStart },
            take: 1,
          },
        },
      },
    },
  })

  const clients = assignments
    .filter((r) => r.client.isActive)
    .map((r) => r.client)
    .sort((a, b) => a.name.localeCompare(b.name))

  return NextResponse.json({ clients })
}
