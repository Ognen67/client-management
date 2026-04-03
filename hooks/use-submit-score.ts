"use client"

import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import type { ScoreInput } from "@/schemas/score.schema"

interface UseSubmitScoreOptions {
  onSuccess?: () => void
}

export function useSubmitScore({ onSuccess }: UseSubmitScoreOptions = {}) {
  const mutation = useMutation({
    mutationFn: async (data: ScoreInput) => {
      const res = await fetch("/api/scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? "Failed to submit score")
      }

      return res.json()
    },
    onSuccess: () => {
      toast.success("Scores submitted successfully")
      onSuccess?.()
    },
    onError: (err: Error) => {
      toast.error(err.message)
    },
  })

  return {
    submit: mutation.mutateAsync,
    isSubmitting: mutation.isPending,
    error: mutation.error?.message ?? null,
    resetError: mutation.reset,
  }
}
