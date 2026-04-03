import type { Client, User, WeeklyScore, UserRole } from "@/generated/prisma/client"

export type { UserRole }

export type SafeUser = Omit<User, "createdAt" | "updatedAt"> & {
  createdAt: string
  updatedAt: string
}

export type ClientWithScores = Client & {
  weeklyScores: WeeklyScore[]
  coaches: Array<{ coach: User }>
}

export type WeeklyScoreWithRelations = WeeklyScore & {
  client: Client
  coach: User
}

export type ClientWithCurrentScore = Client & {
  currentScore: WeeklyScore | null
  coach: User | null
}

export type RiskLevel = "HIGH" | "MEDIUM" | "LOW" | "PENDING"

export type TrendDirection = "up" | "down" | "flat"

export interface ClientDashboardItem {
  id: string
  name: string
  currentWeekScore: WeeklyScore | null
  trend: TrendDirection
  isEditable: boolean
}

export interface RiskSummary {
  totalActive: number
  highRisk: number
  mediumRisk: number
  noScoreSubmitted: number
}

export interface AtRiskClient {
  id: string
  slug: string
  name: string
  coachName: string
  currentScore: number
  predictiveScore: number
  actionsSubmitted: boolean
  weekTrend: number[]
}

/** A client entry in the triage view — covers ALL clients, not just at-risk */
export interface TriageClient {
  id: string
  slug: string
  name: string
  coachName: string
  coachId: string
  currentScore: number | null
  predictiveScore: number | null
  actions: string | null
  weekTrend: number[]
}

/** Nested map: clientId → week ISO string → score pair */
export type HeatmapScoreMap = Record<
  string,
  Record<string, { current: number; predictive: number }>
>
