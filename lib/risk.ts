import type { RiskLevel } from "@/types"

export function getRiskLevel(predictiveScore: number | null): RiskLevel {
  if (predictiveScore === null) return "PENDING"
  if (predictiveScore <= 2) return "HIGH"
  if (predictiveScore === 3) return "MEDIUM"
  return "LOW"
}

export const RISK_STYLES: Record<RiskLevel, string> = {
  HIGH: "text-red-600 bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-900 dark:text-red-400",
  MEDIUM: "text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-900 dark:text-amber-400",
  LOW: "text-green-600 bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-900 dark:text-green-400",
  PENDING: "text-muted-foreground bg-muted border-border",
}

export const RISK_LABELS: Record<RiskLevel, string> = {
  HIGH: "High Risk",
  MEDIUM: "Medium Risk",
  LOW: "Healthy",
  PENDING: "No Score",
}
