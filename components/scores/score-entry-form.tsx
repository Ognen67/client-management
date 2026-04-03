"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { scoreSchema, type ScoreInput } from "@/schemas/score.schema"
import { ScoreSelector } from "@/components/scores/score-selector"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Spinner } from "@/components/ui/spinner"
import { AlertTriangle, CalendarDays } from "lucide-react"
import { formatWeekLabel, getCurrentWeekStart } from "@/lib/week"
import type { WeeklyScore } from "@/generated/prisma/client"

interface ScoreEntryFormProps {
  clientId: string
  clientName: string
  existingScore?: WeeklyScore | null
  onSubmit: (data: ScoreInput) => Promise<void>
  isSubmitting: boolean
  submitError?: string | null
}

export function ScoreEntryForm({
  clientId,
  clientName,
  existingScore,
  onSubmit,
  isSubmitting,
  submitError,
}: ScoreEntryFormProps) {
  const weekLabel = formatWeekLabel(getCurrentWeekStart())

  const {
    handleSubmit,
    watch,
    setValue,
    register,
    formState: { errors },
  } = useForm<ScoreInput>({
    resolver: zodResolver(scoreSchema),
    defaultValues: {
      clientId,
      currentScore: existingScore?.currentScore ?? undefined,
      predictiveScore: existingScore?.predictiveScore ?? undefined,
      actions: existingScore?.actions ?? "",
      notes: existingScore?.notes ?? "",
    },
  })

  const predictiveScore = watch("predictiveScore")
  const currentScore = watch("currentScore")
  const actionsRequired = predictiveScore !== undefined && predictiveScore < 5

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      <div className="flex items-center gap-2 text-sm text-muted-foreground pb-1 border-b border-border">
        <CalendarDays className="size-3.5" />
        <span>Week of {weekLabel}</span>
      </div>

      <div className="flex flex-col gap-1.5">
        <ScoreSelector
          label="Current Score"
          value={currentScore ?? null}
          onChange={(v) => setValue("currentScore", v, { shouldValidate: true })}
          disabled={isSubmitting}
        />
        {errors.currentScore && (
          <p className="text-xs text-destructive">{errors.currentScore.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <ScoreSelector
          label="Predictive Score"
          value={predictiveScore ?? null}
          onChange={(v) =>
            setValue("predictiveScore", v, { shouldValidate: true })
          }
          disabled={isSubmitting}
        />
        {errors.predictiveScore && (
          <p className="text-xs text-destructive">
            {errors.predictiveScore.message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-1.5">
          {actionsRequired && (
            <AlertTriangle className="size-3.5 text-amber-500 shrink-0" />
          )}
          <Label htmlFor="actions" className="text-sm font-medium">
            Actions{" "}
            {actionsRequired ? (
              <span className="text-amber-600 font-semibold">required</span>
            ) : (
              <span className="text-muted-foreground font-normal">(optional)</span>
            )}
          </Label>
        </div>
        <Textarea
          id="actions"
          {...register("actions")}
          placeholder="What will you do to move this to a 5 next week?"
          rows={3}
          disabled={isSubmitting}
          aria-invalid={!!errors.actions}
          className="resize-none text-sm"
        />
        {errors.actions && (
          <p className="text-xs text-destructive">{errors.actions.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="notes" className="text-sm font-medium">
          Notes{" "}
          <span className="text-muted-foreground font-normal">(optional)</span>
        </Label>
        <Textarea
          id="notes"
          {...register("notes")}
          placeholder="Any additional context..."
          rows={2}
          disabled={isSubmitting}
          className="resize-none text-sm"
        />
        {errors.notes && (
          <p className="text-xs text-destructive">{errors.notes.message}</p>
        )}
      </div>

      {submitError && (
        <Alert variant="destructive">
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      )}

      <Button type="submit" disabled={isSubmitting} className="w-full h-10">
        {isSubmitting && <Spinner data-icon="inline-start" />}
        {existingScore ? "Update Scores" : "Submit Scores"}
      </Button>
    </form>
  )
}
