"use client"

import { useQueryState } from "nuqs"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { getWeekStart, toISODateString, getCurrentWeekStart } from "@/lib/week"

interface WeekNavigatorProps {
  weekISO: string
  isCurrentWeek: boolean
}

function offsetWeek(iso: string, delta: number): string {
  const d = new Date(`${iso}T00:00:00.000Z`)
  d.setUTCDate(d.getUTCDate() + delta * 7)
  return toISODateString(getWeekStart(d))
}

export function WeekNavigator({ weekISO, isCurrentWeek }: WeekNavigatorProps) {
  // shallow: false forces Next.js to re-render server components when the week param changes
  const [, setWeek] = useQueryState("week", { shallow: false })

  const goTo = (iso: string) => {
    const currentISO = toISODateString(getCurrentWeekStart())
    setWeek(iso === currentISO ? null : iso)
  }

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="sm"
        className="size-8 p-0 rounded-lg text-muted-foreground hover:text-foreground"
        onClick={() => goTo(offsetWeek(weekISO, -1))}
        aria-label="Previous week"
      >
        <ChevronLeft className="size-4" />
      </Button>

      {!isCurrentWeek && (
        <Button
          variant="outline"
          size="sm"
          className="h-7 px-2.5 text-xs font-medium rounded-lg"
          onClick={() => setWeek(null)}
        >
          Today
        </Button>
      )}

      <Button
        variant="ghost"
        size="sm"
        className="size-8 p-0 rounded-lg text-muted-foreground hover:text-foreground disabled:opacity-30"
        onClick={() => goTo(offsetWeek(weekISO, 1))}
        disabled={isCurrentWeek}
        aria-label="Next week"
      >
        <ChevronRight className="size-4" />
      </Button>
    </div>
  )
}
