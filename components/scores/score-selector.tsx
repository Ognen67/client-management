"use client"

import { cn } from "@/lib/cn"

interface ScoreSelectorProps {
  value: number | null
  onChange: (score: number) => void
  disabled?: boolean
  label: string
}

const SCORE_LABELS: Record<number, string> = {
  1: "Churn risk",
  2: "Danger",
  3: "Friction",
  4: "Off track",
  5: "Excellent",
}

const SCORE_STYLES: Record<number, { base: string; active: string }> = {
  1: {
    base: "border-red-200 text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/30",
    active: "bg-red-600 text-white border-red-600 dark:bg-red-600 dark:border-red-600 dark:text-white",
  },
  2: {
    base: "border-orange-200 text-orange-700 hover:bg-orange-50 dark:border-orange-900 dark:text-orange-400 dark:hover:bg-orange-950/30",
    active: "bg-orange-500 text-white border-orange-500 dark:bg-orange-500 dark:border-orange-500 dark:text-white",
  },
  3: {
    base: "border-amber-200 text-amber-700 hover:bg-amber-50 dark:border-amber-900 dark:text-amber-400 dark:hover:bg-amber-950/30",
    active: "bg-amber-400 text-gray-900 border-amber-400 dark:bg-amber-400 dark:border-amber-400 dark:text-gray-900",
  },
  4: {
    base: "border-lime-200 text-lime-700 hover:bg-lime-50 dark:border-lime-900 dark:text-lime-400 dark:hover:bg-lime-950/30",
    active: "bg-lime-400 text-gray-900 border-lime-400 dark:bg-lime-400 dark:border-lime-400 dark:text-gray-900",
  },
  5: {
    base: "border-green-200 text-green-700 hover:bg-green-50 dark:border-green-900 dark:text-green-400 dark:hover:bg-green-950/30",
    active: "bg-green-500 text-white border-green-500 dark:bg-green-500 dark:border-green-500 dark:text-white",
  },
}

export function ScoreSelector({
  value,
  onChange,
  disabled,
  label,
}: ScoreSelectorProps) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <div className="flex gap-2" role="group" aria-label={label}>
        {[1, 2, 3, 4, 5].map((score) => {
          const isSelected = value === score
          const styles = SCORE_STYLES[score]
          return (
            <button
              key={score}
              type="button"
              onClick={() => onChange(score)}
              disabled={disabled}
              aria-pressed={isSelected}
              aria-label={`${score} — ${SCORE_LABELS[score]}`}
              className={cn(
                "flex-1 h-12 rounded-lg border-2 font-mono font-bold text-lg transition-all",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                isSelected ? styles.active : styles.base
              )}
            >
              {score}
            </button>
          )
        })}
      </div>
      <p className={cn("text-xs text-muted-foreground h-4", value === null && "invisible")}>
        {value !== null ? SCORE_LABELS[value] : "\u00A0"}
      </p>
    </div>
  )
}
