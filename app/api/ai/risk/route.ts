import { NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { prisma } from "@/lib/prisma"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { getCurrentWeekStart, getWeekStart, formatWeekLabel, toISODateString } from "@/lib/week"

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// ─── Shared auth helper ───────────────────────────────────────────────────────

async function requireAdmin() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { role: true } })
  if (!dbUser || dbUser.role !== "admin") return null
  return user
}

// ─── GET /api/ai/risk?week=2026-03-30 ─────────────────────────────────────────
// Returns the most recent saved report for the given week (or current week).

export async function GET(request: Request) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const weekParam = searchParams.get("week")
  const weekStart = weekParam
    ? getWeekStart(new Date(`${weekParam}T00:00:00.000Z`))
    : getCurrentWeekStart()

  const report = await prisma.aiReport.findFirst({
    where: { weekStart },
    orderBy: { generatedAt: "desc" },
    select: { id: true, content: true, generatedAt: true },
  })

  if (!report) return NextResponse.json(null)
  return NextResponse.json(report)
}

// ─── POST /api/ai/risk ────────────────────────────────────────────────────────
// Generates a new portfolio report, streams it to the client, and persists it.

export async function POST(request: Request) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const weekParam = searchParams.get("week")
  const weekStart = weekParam
    ? getWeekStart(new Date(`${weekParam}T00:00:00.000Z`))
    : getCurrentWeekStart()
  const weekLabel = formatWeekLabel(weekStart)

  const [scores, allClients] = await Promise.all([
    prisma.weeklyScore.findMany({
      where: { weekStart },
      include: { client: true, coach: true },
      orderBy: { predictiveScore: "asc" },
    }),
    prisma.client.findMany({ where: { isActive: true }, select: { id: true } }),
  ])

  const tableRows = scores
    .map(
      (s) =>
        `${s.client.name} | ${s.coach.fullName} | C:${s.currentScore} | P:${s.predictiveScore} | ${s.actions ?? "No action recorded"}`
    )
    .join("\n")

  const noScoreCount = allClients.length - scores.length

  const userPrompt = `Week of ${weekLabel}. ${noScoreCount} client(s) have not submitted scores this week.

Client health data (sorted by predictive score ascending — most at risk first):
Client | Coach | Current | Predictive | Actions committed
${tableRows || "(no scores submitted this week)"}

Provide a leadership briefing covering:
1. Executive summary of the portfolio this week
2. Clients requiring immediate attention (predictive score 1-2) and why
3. Clients to monitor (predictive score 3) and recommended actions
4. Overall portfolio trajectory and any patterns worth noting`

  const systemPrompt = `You are a senior client portfolio analyst writing a weekly briefing for company leadership. 

Formatting rules (strictly observed):
- Use markdown section headings with # or ## — never wrap headings in asterisks
- Write in clear, professional business prose — no bullet point emojis, no decorative symbols
- No bold markdown (**text**) except for genuine emphasis within a sentence
- No emojis anywhere in the response
- Be direct and specific — name the clients, state the risks plainly
- Maximum 450 words total`

  const stream = await anthropic.messages.stream({
    model: "claude-sonnet-4-5",
    max_tokens: 900,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  })

  const encoder = new TextEncoder()
  const weekISO = toISODateString(weekStart)

  const readable = new ReadableStream({
    async start(controller) {
      let fullContent = ""

      for await (const chunk of stream) {
        if (
          chunk.type === "content_block_delta" &&
          chunk.delta.type === "text_delta"
        ) {
          fullContent += chunk.delta.text
          controller.enqueue(encoder.encode(chunk.delta.text))
        }
      }

      // Persist the completed report before closing the stream
      try {
        const id = `air_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
        await prisma.aiReport.create({
          data: {
            id,
            weekStart,
            content: fullContent,
            generatedBy: user.id,
          },
        })
        // Send the report ID as a trailing marker so the client can request the saved date
        controller.enqueue(encoder.encode(`\n\n<!--REPORT_ID:${id}:${new Date().toISOString()}-->`))
      } catch (err) {
        console.error("[ai-report] Failed to persist report:", err)
      }

      controller.close()
    },
  })

  return new NextResponse(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Week-ISO": weekISO,
    },
  })
}
