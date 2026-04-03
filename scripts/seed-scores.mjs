/**
 * seed-scores.mjs
 *
 * Seeds 24 weeks of weekly score data for all clients.
 * Also creates 5 new clients if they don't exist yet, and assigns them to coaches.
 *
 * Usage:
 *   node scripts/seed-scores.mjs
 *
 * Data layout: each "scores" array has 24 entries, index 0 = oldest (23 weeks ago),
 * index 23 = current week.  { c: currentScore, p: predictiveScore }
 */

import pg from "pg"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"
import { createRequire } from "module"

const __dirname = dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)

require("dotenv").config({ path: resolve(__dirname, "../.env"), override: true })

// ─── New clients to create if they don't exist ────────────────────────────────

const NEW_CLIENTS = [
  { name: "Ironpeak Ventures",   slug: "ironpeak-ventures" },
  { name: "Celaro Systems",      slug: "celaro-systems" },
  { name: "Wavefront Analytics", slug: "wavefront-analytics" },
  { name: "Brightline Group",    slug: "brightline-group" },
  { name: "Kestrel Dynamics",    slug: "kestrel-dynamics" },
]

// ─── Score data — 24 weeks per client ────────────────────────────────────────
//
// Index 0  = 23 weeks ago (oldest)
// Index 23 = this week (most recent)
// actions map: { weekIndex: "action text" }
//
// Risk profiles:
//   Ironpeak Ventures   — progressive decline → currently critical (P=1)
//   Celaro Systems      — stuck at watch/high-risk boundary (P=2-3)
//   Brightline Group    — dramatic turnaround story (P=1→5)
//   Kestrel Dynamics    — volatile, unpredictable (P oscillates 2-5)
//   Wavefront Analytics — consistently excellent (P=4-5)
//
const SCORE_DATA = [
  // ── Existing clients (extended to 24 weeks) ──────────────────────────────

  {
    clientName: "Meridian Dynamics",
    // Narrative: struggling for 12 weeks, then slow recovery
    scores: [
      { c: 2, p: 2 }, { c: 2, p: 1 }, { c: 1, p: 1 }, { c: 2, p: 2 }, { c: 2, p: 2 }, { c: 1, p: 2 },
      { c: 2, p: 2 }, { c: 2, p: 2 }, { c: 3, p: 2 }, { c: 2, p: 2 }, { c: 2, p: 2 }, { c: 3, p: 2 },
      // recent 12 weeks (same as before)
      { c: 2, p: 2 }, { c: 2, p: 2 }, { c: 3, p: 2 }, { c: 3, p: 3 }, { c: 2, p: 2 }, { c: 3, p: 3 },
      { c: 3, p: 3 }, { c: 4, p: 3 }, { c: 4, p: 4 }, { c: 3, p: 3 }, { c: 4, p: 4 }, { c: 4, p: 4 },
    ],
    actions: {
      1:  "Renewal risk flagged. Exec sponsor engaged.",
      2:  "Critical escalation — CEO meeting requested.",
      5:  "Delivery failure reported. SLA breach imminent.",
      8:  "Recovery plan drafted. Weekly check-ins started.",
      12: "Escalate to senior leadership — renewal at risk. Weekly check-ins scheduled.",
      13: "Quarterly review scheduled. Address delivery delays.",
      16: "Executive sponsor meeting arranged.",
      17: "New project roadmap delivered.",
    },
  },

  {
    clientName: "Apex Solutions Ltd",
    // Narrative: model client — consistently excellent
    scores: [
      { c: 5, p: 5 }, { c: 5, p: 5 }, { c: 5, p: 4 }, { c: 5, p: 5 }, { c: 4, p: 5 }, { c: 5, p: 5 },
      { c: 5, p: 5 }, { c: 4, p: 4 }, { c: 5, p: 5 }, { c: 5, p: 5 }, { c: 5, p: 4 }, { c: 4, p: 5 },
      { c: 5, p: 5 }, { c: 5, p: 5 }, { c: 5, p: 4 }, { c: 4, p: 4 }, { c: 5, p: 5 }, { c: 5, p: 5 },
      { c: 4, p: 4 }, { c: 5, p: 5 }, { c: 5, p: 5 }, { c: 5, p: 5 }, { c: 5, p: 4 }, { c: 4, p: 4 },
    ],
    actions: {},
  },

  {
    clientName: "Thornfield Group",
    // Narrative: stable with a mid-period scope-creep dip, recovered
    scores: [
      { c: 4, p: 4 }, { c: 5, p: 4 }, { c: 4, p: 5 }, { c: 5, p: 5 }, { c: 4, p: 4 }, { c: 4, p: 4 },
      { c: 5, p: 5 }, { c: 4, p: 4 }, { c: 4, p: 4 }, { c: 5, p: 4 }, { c: 4, p: 5 }, { c: 4, p: 4 },
      { c: 4, p: 4 }, { c: 4, p: 4 }, { c: 4, p: 4 }, { c: 5, p: 5 }, { c: 5, p: 5 }, { c: 4, p: 4 },
      { c: 4, p: 4 }, { c: 3, p: 3 }, { c: 3, p: 3 }, { c: 4, p: 4 }, { c: 4, p: 4 }, { c: 4, p: 4 },
    ],
    actions: {
      19: "Scope creep discussion raised. Prioritisation workshop planned.",
      20: "Workshop completed. Team re-aligned.",
    },
  },

  {
    clientName: "NovaBridge Partners",
    // Narrative: strong start, contract crisis, partial recovery
    scores: [
      { c: 5, p: 5 }, { c: 5, p: 5 }, { c: 4, p: 4 }, { c: 4, p: 5 }, { c: 5, p: 5 }, { c: 4, p: 4 },
      { c: 4, p: 4 }, { c: 5, p: 5 }, { c: 5, p: 4 }, { c: 4, p: 4 }, { c: 5, p: 5 }, { c: 4, p: 4 },
      { c: 4, p: 4 }, { c: 4, p: 4 }, { c: 5, p: 5 }, { c: 5, p: 5 }, { c: 5, p: 5 }, { c: 4, p: 4 },
      { c: 3, p: 3 }, { c: 2, p: 2 }, { c: 2, p: 1 }, { c: 3, p: 2 }, { c: 3, p: 3 }, { c: 4, p: 3 },
    ],
    actions: {
      18: "Contract renegotiation opened unexpectedly. Legal review commenced.",
      19: "Escalated to senior partnership team. Weekly syncs in place.",
      20: "Contract deadlocked. Executive intervention scheduled.",
      21: "Interim agreement reached. Full resolution expected Q2.",
      23: "Follow-up actions from executive meeting outstanding.",
    },
  },

  {
    clientName: "Solstice Consulting",
    // Narrative: cautious start, steady growth, now excellent
    scores: [
      { c: 3, p: 3 }, { c: 3, p: 3 }, { c: 3, p: 3 }, { c: 4, p: 3 }, { c: 3, p: 4 }, { c: 4, p: 4 },
      { c: 4, p: 4 }, { c: 4, p: 4 }, { c: 4, p: 4 }, { c: 4, p: 4 }, { c: 5, p: 4 }, { c: 4, p: 4 },
      { c: 3, p: 3 }, { c: 4, p: 3 }, { c: 4, p: 4 }, { c: 4, p: 4 }, { c: 5, p: 5 }, { c: 5, p: 5 },
      { c: 5, p: 5 }, { c: 5, p: 5 }, { c: 4, p: 4 }, { c: 5, p: 5 }, { c: 5, p: 5 }, { c: 5, p: 5 },
    ],
    actions: {
      0: "New service line onboarding in progress. Capacity check required.",
    },
  },

  {
    clientName: "Cascade Digital",
    // Narrative: excellent start, digital transformation crisis, full recovery
    scores: [
      { c: 5, p: 5 }, { c: 5, p: 5 }, { c: 5, p: 5 }, { c: 4, p: 5 }, { c: 5, p: 4 }, { c: 5, p: 5 },
      { c: 5, p: 5 }, { c: 5, p: 5 }, { c: 4, p: 5 }, { c: 5, p: 5 }, { c: 5, p: 5 }, { c: 5, p: 5 },
      { c: 5, p: 5 }, { c: 5, p: 5 }, { c: 5, p: 4 }, { c: 4, p: 4 }, { c: 4, p: 3 }, { c: 3, p: 3 },
      { c: 3, p: 2 }, { c: 2, p: 2 }, { c: 3, p: 3 }, { c: 4, p: 4 }, { c: 4, p: 4 }, { c: 5, p: 4 },
    ],
    actions: {
      16: "Digital transformation project delayed. Revised timeline agreed.",
      17: "Key developer resource pulled. Mitigation plan created.",
      18: "Project at risk — escalated to programme director.",
      19: "Emergency resourcing approved. Project back on revised track.",
    },
  },

  // ── NEW clients ──────────────────────────────────────────────────────────

  {
    clientName: "Ironpeak Ventures",
    // Narrative: progressive decline — was a top client, now critical. Most at-risk.
    scores: [
      { c: 5, p: 5 }, { c: 5, p: 5 }, { c: 5, p: 4 }, { c: 4, p: 5 }, { c: 5, p: 4 }, { c: 4, p: 4 },
      { c: 4, p: 4 }, { c: 4, p: 3 }, { c: 3, p: 4 }, { c: 4, p: 3 }, { c: 3, p: 3 }, { c: 3, p: 3 },
      { c: 3, p: 2 }, { c: 2, p: 3 }, { c: 3, p: 2 }, { c: 2, p: 2 }, { c: 2, p: 2 }, { c: 2, p: 2 },
      { c: 3, p: 2 }, { c: 2, p: 1 }, { c: 1, p: 2 }, { c: 2, p: 1 }, { c: 1, p: 1 }, { c: 1, p: 1 },
    ],
    actions: {
      11: "Stakeholder alignment review scheduled.",
      12: "Account review with VP of CS.",
      14: "Emergency account meeting. New POC assigned.",
      15: "Executive sponsor escalated to Group Director.",
      17: "Formal risk notice issued to client leadership.",
      18: "Remediation plan presented. Client uncommitted.",
      19: "Contract renewal at risk. CEO-level escalation required.",
      20: "CEO meeting held. Remediation plan agreed in principle.",
      21: "Remediation plan failing. Legal review commenced on renewal terms.",
      22: "Final warning issued. Emergency cross-functional mobilisation.",
      23: "Account on life support. Weekly board-level updates commenced.",
    },
  },

  {
    clientName: "Celaro Systems",
    // Narrative: persistent watch/risk — never improves, never fully breaks
    scores: [
      { c: 3, p: 3 }, { c: 3, p: 2 }, { c: 2, p: 3 }, { c: 3, p: 3 }, { c: 3, p: 3 }, { c: 2, p: 3 },
      { c: 3, p: 2 }, { c: 3, p: 3 }, { c: 2, p: 3 }, { c: 3, p: 3 }, { c: 3, p: 2 }, { c: 2, p: 3 },
      { c: 3, p: 3 }, { c: 3, p: 2 }, { c: 2, p: 3 }, { c: 3, p: 3 }, { c: 2, p: 2 }, { c: 3, p: 3 },
      { c: 3, p: 2 }, { c: 2, p: 3 }, { c: 3, p: 3 }, { c: 2, p: 2 }, { c: 3, p: 3 }, { c: 3, p: 2 },
    ],
    actions: {
      1:  "Performance improvement discussion scheduled.",
      6:  "Quarterly business review delivered. No material improvement noted.",
      10: "Dedicated support package offered — client declined.",
      13: "Engagement health review — systemic issues identified.",
      16: "Internal escalation raised. Account at risk of churn.",
      18: "Recovery plan v2 presented. Awaiting client sign-off.",
      21: "Client unresponsive to outreach for 2 weeks.",
      23: "Account flagged for churn risk at leadership meeting.",
    },
  },

  {
    clientName: "Wavefront Analytics",
    // Narrative: textbook healthy client — strong and consistent
    scores: [
      { c: 4, p: 4 }, { c: 5, p: 5 }, { c: 5, p: 5 }, { c: 4, p: 5 }, { c: 5, p: 5 }, { c: 5, p: 5 },
      { c: 5, p: 4 }, { c: 5, p: 5 }, { c: 5, p: 5 }, { c: 4, p: 5 }, { c: 5, p: 5 }, { c: 5, p: 5 },
      { c: 5, p: 4 }, { c: 4, p: 5 }, { c: 5, p: 5 }, { c: 5, p: 5 }, { c: 4, p: 4 }, { c: 5, p: 5 },
      { c: 5, p: 5 }, { c: 5, p: 5 }, { c: 4, p: 5 }, { c: 5, p: 5 }, { c: 5, p: 5 }, { c: 4, p: 5 },
    ],
    actions: {},
  },

  {
    clientName: "Brightline Group",
    // Narrative: dramatic turnaround — was critical, now one of the best
    scores: [
      { c: 1, p: 1 }, { c: 2, p: 1 }, { c: 1, p: 2 }, { c: 2, p: 1 }, { c: 1, p: 2 }, { c: 2, p: 2 },
      { c: 2, p: 2 }, { c: 2, p: 1 }, { c: 1, p: 2 }, { c: 2, p: 2 }, { c: 3, p: 2 }, { c: 2, p: 3 },
      { c: 3, p: 3 }, { c: 3, p: 2 }, { c: 3, p: 3 }, { c: 3, p: 3 }, { c: 3, p: 4 }, { c: 4, p: 4 },
      { c: 4, p: 3 }, { c: 4, p: 4 }, { c: 4, p: 4 }, { c: 5, p: 4 }, { c: 5, p: 5 }, { c: 4, p: 5 },
    ],
    actions: {
      0:  "Critical account. New dedicated team assigned. Daily standups started.",
      1:  "Root cause analysis complete. Delivery model overhauled.",
      2:  "Client threatening to leave. Emergency exec summit arranged.",
      3:  "Summit outcome: 90-day rescue plan agreed and signed.",
      4:  "Week 1 of rescue plan. Slow progress.",
      5:  "Week 2 of rescue plan. First deliverable shipped on time.",
      7:  "Key exec departure on client side. Relationship rebuild required.",
      8:  "New client exec onboarded. Cautiously positive.",
      10: "Month 3 of rescue plan. Confidence building.",
      11: "Client NPS improved from -40 to +10. Positive signal.",
      13: "Recovery plan extended for 30 days at client request.",
    },
  },

  {
    clientName: "Kestrel Dynamics",
    // Narrative: volatile and unpredictable — large swings every few weeks
    scores: [
      { c: 5, p: 4 }, { c: 3, p: 5 }, { c: 4, p: 2 }, { c: 5, p: 4 }, { c: 4, p: 5 }, { c: 3, p: 2 },
      { c: 5, p: 4 }, { c: 2, p: 5 }, { c: 5, p: 3 }, { c: 4, p: 2 }, { c: 5, p: 4 }, { c: 3, p: 5 },
      { c: 4, p: 2 }, { c: 5, p: 4 }, { c: 2, p: 5 }, { c: 4, p: 3 }, { c: 5, p: 2 }, { c: 3, p: 4 },
      { c: 5, p: 2 }, { c: 4, p: 5 }, { c: 2, p: 3 }, { c: 5, p: 2 }, { c: 3, p: 4 }, { c: 4, p: 2 },
    ],
    actions: {
      2:  "Unexpected spike in support tickets. Root cause unknown.",
      5:  "Volatility in satisfaction scores. Governance review scheduled.",
      8:  "Recurring pattern of inconsistency flagged to client.",
      9:  "Internal team structure change on client side.",
      12: "Dependency on single stakeholder identified as risk.",
      13: "Multi-stakeholder engagement plan activated.",
      16: "Score variance flagged at QBR. Client acknowledges internal instability.",
      18: "Internal reorganisation at client — third in 6 months.",
      20: "New CTO appointed. Re-engagement started.",
      21: "CTO onboarded. Score volatility continues.",
      23: "Volatility persists. Account stability remains a concern.",
    },
  },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getMondayUTC(date) {
  const d = new Date(date)
  const day = d.getUTCDay()
  const daysBack = day === 0 ? 6 : day - 1
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - daysBack))
}

function toISO(date) {
  return date.toISOString().slice(0, 10)
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const dbUrl = process.env.DIRECT_URL || process.env.DATABASE_URL
  if (!dbUrl) throw new Error("Neither DIRECT_URL nor DATABASE_URL is set in .env")

  console.log("Connecting to:", dbUrl.replace(/:[^@]+@/, ":***@"))

  const sslConfig = dbUrl.includes("supabase.com") ? { rejectUnauthorized: false } : false
  const pool = new pg.Pool({ connectionString: dbUrl, ssl: sslConfig })
  const client = await pool.connect()
  await client.query("SET search_path TO public")

  try {
    // ── Phase 1: create new clients ─────────────────────────────────────────
    console.log("\n── Creating new clients ───────────────────────────────────")
    for (const nc of NEW_CLIENTS) {
      const { rowCount } = await client.query(
        `INSERT INTO public.clients (id, name, slug, is_active, created_at, updated_at)
         VALUES (gen_random_uuid(), $1, $2, true, now(), now())
         ON CONFLICT (slug) DO NOTHING`,
        [nc.name, nc.slug]
      )
      console.log(rowCount > 0 ? `  ✓ Created: ${nc.name}` : `  — Already exists: ${nc.name}`)
    }

    // ── Phase 2: load all clients + coaches ─────────────────────────────────
    const { rows: allClients } = await client.query(
      "SELECT id, name, slug FROM public.clients WHERE is_active = true ORDER BY name"
    )
    const { rows: allCoaches } = await client.query(
      "SELECT id, full_name FROM public.users WHERE role = 'coach' ORDER BY full_name"
    )

    if (allCoaches.length === 0) {
      throw new Error("No coaches found — create at least one coach user first")
    }

    console.log(`\n  Found ${allClients.length} clients, ${allCoaches.length} coaches`)

    // ── Phase 3: assign new clients to coaches (round-robin) ─────────────────
    console.log("\n── Assigning coaches to new clients ──────────────────────")
    for (let i = 0; i < NEW_CLIENTS.length; i++) {
      const nc = allClients.find((c) => c.slug === NEW_CLIENTS[i].slug)
      if (!nc) { console.log(`  ⚠  Not found in DB: ${NEW_CLIENTS[i].name}`); continue }
      const coach = allCoaches[i % allCoaches.length]
      const { rowCount } = await client.query(
        `INSERT INTO public.client_coaches (client_id, coach_id)
         VALUES ($1, $2)
         ON CONFLICT DO NOTHING`,
        [nc.id, coach.id]
      )
      console.log(
        rowCount > 0
          ? `  ✓ ${nc.name} → ${coach.full_name}`
          : `  — ${nc.name} already assigned`
      )
    }

    // ── Phase 4: load coach assignments ──────────────────────────────────────
    const { rows: assignments } = await client.query(
      "SELECT client_id, coach_id FROM public.client_coaches"
    )
    const coachByClient = new Map(assignments.map((r) => [r.client_id, r.coach_id]))

    // ── Phase 5: compute 24 week starts ──────────────────────────────────────
    const currentWeekStart = getMondayUTC(new Date())
    const weekStarts = []
    for (let i = 23; i >= 0; i--) {
      weekStarts.push(new Date(currentWeekStart.getTime() - i * 7 * 24 * 60 * 60 * 1000))
    }

    console.log("\n── Week range ─────────────────────────────────────────────")
    console.log(`  Oldest : ${toISO(weekStarts[0])}  (week index 0)`)
    console.log(`  Newest : ${toISO(weekStarts[23])} (week index 23 — current)`)

    // ── Phase 6: upsert scores ────────────────────────────────────────────────
    console.log("\n── Seeding scores ─────────────────────────────────────────")
    let inserted = 0
    let skipped = 0

    for (const entry of SCORE_DATA) {
      const dbClient = allClients.find(
        (c) => c.name.toLowerCase() === entry.clientName.toLowerCase()
      )
      if (!dbClient) {
        console.log(`  ⚠  Not found in DB: "${entry.clientName}" — skipping`)
        skipped++
        continue
      }

      const coachId = coachByClient.get(dbClient.id)
      if (!coachId) {
        console.log(`  ⚠  No coach for "${entry.clientName}" — skipping`)
        skipped++
        continue
      }

      if (entry.scores.length !== 24) {
        console.log(`  ⚠  "${entry.clientName}" has ${entry.scores.length} score entries — expected 24`)
        skipped++
        continue
      }

      console.log(`  → ${entry.clientName}`)
      for (let i = 0; i < 24; i++) {
        const { c: currentScore, p: predictiveScore } = entry.scores[i]
        const actions = entry.actions?.[i] ?? null
        await client.query(
          `INSERT INTO public.weekly_scores
             (id, client_id, coach_id, week_start, current_score, predictive_score, actions, created_at, updated_at)
           VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, now(), now())
           ON CONFLICT (client_id, week_start)
           DO UPDATE SET
             current_score    = EXCLUDED.current_score,
             predictive_score = EXCLUDED.predictive_score,
             actions          = EXCLUDED.actions,
             updated_at       = now()`,
          [dbClient.id, coachId, toISO(weekStarts[i]), currentScore, predictiveScore, actions]
        )
        inserted++
      }
    }

    console.log(`\n✓ Done. ${inserted} rows upserted, ${skipped} clients skipped.\n`)
  } finally {
    client.release()
    await pool.end()
  }
}

main().catch((err) => {
  console.error("✗ Seed failed:", err.message)
  process.exit(1)
})
