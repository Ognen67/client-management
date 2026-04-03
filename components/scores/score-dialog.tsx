"use client"

import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScoreEntryForm } from "@/components/scores/score-entry-form"
import { useSubmitScore } from "@/hooks/use-submit-score"
import type { WeeklyScore } from "@/generated/prisma/client"

interface ScoreDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  clientId: string
  clientName: string
  existingScore: WeeklyScore | null
}

export function ScoreDialog({
  open,
  onOpenChange,
  clientId,
  clientName,
  existingScore,
}: ScoreDialogProps) {
  const router = useRouter()

  const { submit, isSubmitting, error, resetError } = useSubmitScore({
    onSuccess: () => {
      onOpenChange(false)
      router.refresh()
    },
  })

  function handleOpenChange(value: boolean) {
    if (!isSubmitting) {
      resetError()
      onOpenChange(value)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">
            {existingScore ? "Edit" : "Enter"} Weekly Score — {clientName}
          </DialogTitle>
        </DialogHeader>
        <ScoreEntryForm
          clientId={clientId}
          clientName={clientName}
          existingScore={existingScore}
          onSubmit={submit}
          isSubmitting={isSubmitting}
          submitError={error}
        />
      </DialogContent>
    </Dialog>
  )
}
