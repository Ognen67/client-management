import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { prisma } from "@/lib/prisma"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { aiSummarySchema } from "@/schemas/score.schema"
import { formatWeekLabel } from "@/lib/week"

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// ── GET /api/ai/summary?clientId=&weekISO= ───────────────────────────────────
export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const clientId = searchParams.get("clientId")
  const weekISO = searchParams.get("weekISO")

  if (!clientId || !weekISO) {
    return NextResponse.json({ error: "Missing clientId or weekISO" }, { status: 400 })
  }

  const score = await prisma.weeklyScore.findUnique({
    where: {
      clientId_weekStart: {
        clientId,
        weekStart: new Date(`${weekISO}T00:00:00.000Z`),
      },
    },
    select: { aiSummary: true, aiSummaryGeneratedAt: true },
  })

  if (!score?.aiSummary) {
    return NextResponse.json({ aiSummary: null, generatedAt: null })
  }

  return NextResponse.json({
    aiSummary: score.aiSummary,
    generatedAt: score.aiSummaryGeneratedAt,
  })
}

// ── POST /api/ai/summary ─────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, role: true },
  })

  if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const body = await request.json().catch(() => null)
  const parsed = aiSummarySchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: "Validation error" }, { status: 422 })
  }

  const { clientId, weekISO } = parsed.data

  if (dbUser.role !== "admin") {
    const assignment = await prisma.clientCoach.findUnique({
      where: { clientId_coachId: { clientId, coachId: dbUser.id } },
    })
    if (!assignment) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
  }

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { name: true },
  })

  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 })

  const scores = await prisma.weeklyScore.findMany({
    where: {
      clientId,
      ...(weekISO ? { weekStart: { lte: new Date(`${weekISO}T00:00:00.000Z`) } } : {}),
    },
    orderBy: { weekStart: "desc" },
    take: 8,
  })

  if (scores.length === 0) {
    return NextResponse.json({ error: "No scores found for this client" }, { status: 404 })
  }

  // The week we are summarising — most recent score week or the explicit weekISO
  const targetWeekISO =
    weekISO ?? scores[0].weekStart.toISOString().slice(0, 10)

  const tableRows = scores
    .map(
      (s) =>
        `${formatWeekLabel(s.weekStart)} | ${s.currentScore} | ${s.predictiveScore} | ${s.actions ?? "—"}`
    )
    .join("\n")

  const userPrompt = `Client: ${client.name}

Last ${scores.length} weeks of health scores (1=churn risk, 5=excellent):
Week | Current | Predictive | Actions
${tableRows}

Write a short plain-text report with four sections, each on its own line with a label followed by a colon:

Trend: one or two sentences on the direction of scores.
Risk factors: the main risks, or "None identified" if scores are strong.
Recommended actions: two or three specific things the coach should do this week.
Overall status: one of Healthy, Watch, At Risk, or Critical.

No markdown. No asterisks. No hash symbols. Plain sentences only.`

  const stream = await anthropic.messages.stream({
    model: "claude-sonnet-4-5",
    max_tokens: 400,
    system:
      "You are a client health analyst for a professional services firm. Write in plain prose only. Do not use any markdown formatting — no asterisks, no hash symbols, no bold, no italics, no bullet dashes, no numbered lists with dots. Use short paragraphs separated by line breaks instead. Be direct, concise, and actionable. Maximum 150 words.",
    messages: [{ role: "user", content: userPrompt }],
  })

  const encoder = new TextEncoder()
  const chunks: string[] = []

  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        if (
          chunk.type === "content_block_delta" &&
          chunk.delta.type === "text_delta"
        ) {
          chunks.push(chunk.delta.text)
          controller.enqueue(encoder.encode(chunk.delta.text))
        }
      }

      controller.close()

      // Persist after stream completes
      const fullContent = chunks.join("")
      const generatedAt = new Date()

      await prisma.weeklyScore.updateMany({
        where: {
          clientId,
          weekStart: new Date(`${targetWeekISO}T00:00:00.000Z`),
        },
        data: {
          aiSummary: fullContent,
          aiSummaryGeneratedAt: generatedAt,
        },
      })
    },
  })

  return new NextResponse(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  })
}
