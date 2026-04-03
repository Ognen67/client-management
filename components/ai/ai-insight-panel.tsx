"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Sparkles, Clock } from "lucide-react"

interface AiInsightPanelProps {
  clientId: string
  weekISO?: string
}

function formatGeneratedAt(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date))
}

export function AiInsightPanel({ clientId, weekISO }: AiInsightPanelProps) {
  const [content, setContent] = useState("")
  const [generatedAt, setGeneratedAt] = useState<Date | null>(null)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load persisted insight on mount / when week changes
  useEffect(() => {
    if (!weekISO) { setFetching(false); return }

    setFetching(true)
    setContent("")
    setGeneratedAt(null)
    setError(null)

    const params = new URLSearchParams({ clientId, weekISO })
    fetch(`/api/ai/summary?${params}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.aiSummary) {
          setContent(data.aiSummary)
          setGeneratedAt(data.generatedAt ? new Date(data.generatedAt) : null)
        }
      })
      .catch(() => {})
      .finally(() => setFetching(false))
  }, [clientId, weekISO])

  async function generateInsight() {
    setError(null)
    setContent("")
    setGeneratedAt(null)
    setLoading(true)

    try {
      const res = await fetch("/api/ai/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, ...(weekISO ? { weekISO } : {}) }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? "Failed to generate insight")
      }

      if (!res.body) throw new Error("No response body")

      const reader = res.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        setContent((prev) => prev + decoder.decode(value, { stream: true }))
      }

      setGeneratedAt(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium">AI Health Insight</h3>
          {generatedAt && !loading && (
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground/60">
              <Clock className="size-3" />
              {formatGeneratedAt(generatedAt)}
            </span>
          )}
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={generateInsight}
          disabled={loading || fetching}
          className="gap-2 text-xs h-8"
        >
          <Sparkles className="size-3.5" />
          {loading ? "Generating..." : content ? "Regenerate" : "Generate Insight"}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription className="text-xs">{error}</AlertDescription>
        </Alert>
      )}

      {(loading && !content) || fetching ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      ) : content ? (
        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">
            {content}
          </p>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          Generate an AI-powered health summary based on this client&apos;s last 8 weeks of scores and actions.
        </p>
      )}
    </div>
  )
}
