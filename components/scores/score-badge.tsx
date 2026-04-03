import { cn } from "@/lib/cn"

interface ScoreBadgeProps {
  score: number
  className?: string
}

const SCORE_STYLES: Record<number, string> = {
  1: "bg-score-1 text-white",
  2: "bg-score-2 text-white",
  3: "bg-score-3 text-white",
  4: "bg-score-4 text-white",
  5: "bg-score-5 text-white",
}

const SCORE_LABELS: Record<number, string> = {
  1: "Critical",
  2: "Danger",
  3: "Watch",
  4: "Good",
  5: "Excellent",
}

export function ScoreBadge({ score, className }: ScoreBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center size-7 rounded-md font-mono font-bold text-sm",
        SCORE_STYLES[score],
        className
      )}
      title={SCORE_LABELS[score]}
      aria-label={`Score ${score}: ${SCORE_LABELS[score]}`}
    >
      {score}
    </span>
  )
}
