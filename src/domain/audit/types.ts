export interface AuditEvent {
  id: string
  action: string
  userId: string
  timestamp: string
  payloadSummary?: string
}
