import { z } from 'zod'

export const auditEventSchema = z.object({
  id: z.string(),
  action: z.string(),
  userId: z.string(),
  timestamp: z.string(),
  payloadSummary: z.string().optional(),
})

export type AuditEvent = z.infer<typeof auditEventSchema>
