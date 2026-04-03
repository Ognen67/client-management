"use client"

import { useState, useCallback, useEffect } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Sparkles, ClipboardCopy, Check, X } from "lucide-react"

// Trailing marker injected by the server after saving: <!--REPORT_ID:xxx:ISO-->
const TRAILING_MARKER_RE = /\n*<!--REPORT_ID:[^:]+:([^-]+)-->\s*$/

function stripMarker(text: string): string {
  return text.replace(TRAILING_MARKER_RE, "")
}

function extractGeneratedAt(text: string): string | null {
  const match = TRAILING_MARKER_RE.exec(text)
  return match ? match[1] : null
}

function formatGeneratedAt(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

interface SavedReport {
  content: string
  generatedAt: string
}

interface AiReportSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  weekLabel: string
  weekISO: string
}

export function AiReportSheet({
  open,
  onOpenChange,
  weekLabel,
  weekISO,
}: AiReportSheetProps) {
  const [content, setContent] = useState("")
  const [generatedAt, setGeneratedAt] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [generated, setGenerated] = useState(false)
  const [copied, setCopied] = useState(false)

  // Load the most recent persisted report when the sheet opens
  useEffect(() => {
    if (!open) return
    if (content) return // already has content from this session

    setFetching(true)
    fetch(`/api/ai/risk?week=${weekISO}`)
      .then(async (res) => {
        if (!res.ok) return
        const data = (await res.json()) as SavedReport | null
        if (data?.content) {
          setContent(data.content)
          setGeneratedAt(data.generatedAt)
          setGenerated(true)
        }
      })
      .catch(() => {/* no-op — empty state is fine */})
      .finally(() => setFetching(false))
  }, [open, weekISO, content])

  const generate = useCallback(async () => {
    setError(null)
    setContent("")
    setGeneratedAt(null)
    setLoading(true)
    setGenerated(false)

    try {
      const res = await fetch(`/api/ai/risk?week=${weekISO}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(data.error ?? "Failed to generate risk report")
      }

      if (!res.body) throw new Error("No response body")

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let raw = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        raw += decoder.decode(value, { stream: true })
        // Show content without the trailing marker as we stream
        setContent(stripMarker(raw))
      }

      // Extract saved timestamp from marker
      const savedAt = extractGeneratedAt(raw)
      if (savedAt) setGeneratedAt(savedAt)
      setGenerated(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }, [weekISO])

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const displayContent = stripMarker(content)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="w-full sm:w-[540px] sm:max-w-[540px] flex flex-col gap-0 p-0"
      >
        {/* Header */}
        <SheetHeader className="flex-row items-start justify-between p-5 pb-4 border-b border-border gap-4 space-y-0">
          <div className="flex flex-col gap-0.5">
            <SheetTitle className="text-base font-semibold leading-snug">
              AI Portfolio Report
            </SheetTitle>
            <SheetDescription className="text-xs text-muted-foreground">
              Week of {weekLabel} · Leadership analysis
            </SheetDescription>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {generated && displayContent && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1.5 text-xs"
                onClick={copyToClipboard}
              >
                {copied ? (
                  <Check className="size-3.5 text-green-500" />
                ) : (
                  <ClipboardCopy className="size-3.5" />
                )}
                {copied ? "Copied" : "Copy"}
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="size-7 p-0"
              onClick={() => onOpenChange(false)}
            >
              <X className="size-4" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
        </SheetHeader>

        {/* Generate button row */}
        <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-border bg-muted/20">
          <Button
            size="sm"
            variant={generated ? "outline" : "default"}
            onClick={generate}
            disabled={loading || fetching}
            className="gap-2 h-8 text-xs font-medium"
          >
            <Sparkles className="size-3.5" />
            {loading
              ? "Generating…"
              : generated
              ? "Regenerate"
              : "Generate Report"}
          </Button>

          {loading && (
            <span className="text-xs text-muted-foreground animate-pulse">
              Analysing portfolio…
            </span>
          )}

          {generatedAt && !loading && (
            <span className="text-[11px] text-muted-foreground/60 tabular-nums ml-auto">
              Generated {formatGeneratedAt(generatedAt)}
            </span>
          )}
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto p-5">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription className="text-xs">{error}</AlertDescription>
            </Alert>
          )}

          {(loading || fetching) && !displayContent && (
            <div className="flex flex-col gap-3">
              {[0.6, 0.9, 0.75, 0.85, 0.55, 0.8, 0.65].map((w, i) => (
                <Skeleton
                  key={i}
                  className="h-3.5 rounded"
                  style={{ width: `${w * 100}%` }}
                />
              ))}
            </div>
          )}

          {displayContent && (
            <div className="text-sm leading-relaxed text-foreground">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({ children }) => (
                    <h1 className="text-lg font-bold mt-6 mb-3 first:mt-0 text-foreground tracking-tight">
                      {children}
                    </h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-base font-semibold mt-5 mb-2 text-foreground tracking-tight">
                      {children}
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-sm font-semibold mt-4 mb-1.5 text-foreground">
                      {children}
                    </h3>
                  ),
                  p: ({ children }) => (
                    <p className="mb-3 text-sm leading-relaxed text-foreground/90 last:mb-0">
                      {children}
                    </p>
                  ),
                  ul: ({ children }) => (
                    <ul className="mb-3 ml-4 flex flex-col gap-1 list-disc">{children}</ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="mb-3 ml-4 flex flex-col gap-1 list-decimal">{children}</ol>
                  ),
                  li: ({ children }) => (
                    <li className="text-sm text-foreground/90 leading-relaxed pl-1">{children}</li>
                  ),
                  strong: ({ children }) => (
                    <strong className="font-semibold text-foreground">{children}</strong>
                  ),
                  em: ({ children }) => (
                    <em className="italic text-foreground/80">{children}</em>
                  ),
                  code: ({ children }) => (
                    <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded text-foreground/90">
                      {children}
                    </code>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-2 border-border pl-3 my-3 text-muted-foreground italic">
                      {children}
                    </blockquote>
                  ),
                  hr: () => <hr className="border-border my-4" />,
                }}
              >
                {displayContent}
              </ReactMarkdown>
            </div>
          )}

          {!loading && !fetching && !displayContent && !error && (
            <div className="flex flex-col items-center justify-center h-40 gap-3 text-center">
              <Sparkles className="size-8 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground/60 max-w-[240px] leading-snug">
                Click "Generate Report" to produce a leadership-ready portfolio analysis.
              </p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
