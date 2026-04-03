import { z } from "zod"

const scoreInt = z.number().int().min(1).max(5)

export const scoreSchema = z
  .object({
    clientId: z.string().min(1),
    currentScore: scoreInt,
    predictiveScore: scoreInt,
    actions: z.string().max(2000).optional(),
    notes: z.string().max(1000).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.predictiveScore < 5 && !data.actions?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["actions"],
        message: "Actions are required when predictive score is below 5",
      })
    }
  })

export type ScoreInput = z.infer<typeof scoreSchema>

export const scoreQuerySchema = z.object({
  clientId: z.string().min(1),
  limit: z.coerce.number().int().min(1).max(52).default(12),
})

export const aiSummarySchema = z.object({
  clientId: z.string().min(1),
  weekISO: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
})
