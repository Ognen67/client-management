"use client"

import { useMemo } from "react"
import { getCurrentWeekStart, formatWeekLabel } from "@/lib/week"

export function useCurrentWeek() {
  return useMemo(() => {
    const weekStart = getCurrentWeekStart()
    return {
      weekStart,
      weekLabel: formatWeekLabel(weekStart),
    }
  }, [])
}
