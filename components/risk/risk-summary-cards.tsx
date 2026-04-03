import { Users, TrendingDown, AlertTriangle, Clock } from "lucide-react"
import { cn } from "@/lib/cn"
import type { RiskSummary } from "@/types"

interface RiskSummaryCardsProps {
  summary: RiskSummary
  totalClients: number
}

interface StatCardProps {
  label: string
  value: number
  description?: string
  icon: React.ReactNode
  valueClass: string
}

function StatCard({ label, value, description, icon, valueClass }: StatCardProps) {
  return (
    <div className="bg-card border border-border rounded-lg px-4 py-3 flex flex-col gap-1">
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <span className={cn("text-2xl font-bold font-mono tabular-nums", valueClass)}>
        {value}
      </span>
      {description && (
        <p className="text-[11px] text-muted-foreground leading-tight">{description}</p>
      )}
    </div>
  )
}

export function RiskSummaryCards({ summary, totalClients }: RiskSummaryCardsProps) {
  const pct = (n: number) =>
    totalClients > 0 ? Math.round((n / totalClients) * 100) : 0

  const cards: StatCardProps[] = [
    {
      label: "Active clients",
      value: summary.totalActive,
      icon: <Users className="size-3.5 text-muted-foreground" />,
      valueClass: "text-foreground",
    },
    {
      label: "High risk",
      value: summary.highRisk,
      description: summary.highRisk > 0 ? `${pct(summary.highRisk)}% of portfolio — action required` : undefined,
      icon: <TrendingDown className="size-3.5 text-red-500" />,
      valueClass: summary.highRisk > 0 ? "text-red-600" : "text-muted-foreground",
    },
    {
      label: "Medium risk",
      value: summary.mediumRisk,
      description: summary.mediumRisk > 0 ? `${pct(summary.mediumRisk)}% of portfolio — monitor closely` : undefined,
      icon: <AlertTriangle className="size-3.5 text-amber-500" />,
      valueClass: summary.mediumRisk > 0 ? "text-amber-600" : "text-muted-foreground",
    },
    {
      label: "Missing scores",
      value: summary.noScoreSubmitted,
      description: summary.noScoreSubmitted > 0 ? "No submission yet this week" : undefined,
      icon: <Clock className="size-3.5 text-muted-foreground" />,
      valueClass: summary.noScoreSubmitted > 0 ? "text-amber-600" : "text-muted-foreground",
    },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {cards.map((card) => (
        <StatCard key={card.label} {...card} />
      ))}
    </div>
  )
}
