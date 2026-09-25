import { z } from 'zod'

/**
 * Item within a proposed prescription draft.
 */
export const prescriptionItemSchema = z.object({
  id: z.string().min(1, 'Item ID is required'),
  medicationCode: z.string().min(1, 'Medication code is required'),
  medicationName: z.string().min(1, 'Medication name is required'),
  dosage: z.string().min(1, 'Dosage is required'),
  route: z.string().min(1, 'Route is required'),
  frequency: z.string().min(1, 'Frequency is required'),
  duration: z.string().optional(),
  instructions: z.string().optional(),
})

export type PrescriptionItem = z.infer<typeof prescriptionItemSchema>

/**
 * Physician-authored proposed prescription.
 * Invariant: Must remain strictly separate from AI-generated output.
 * Invariant: Must never be invented or fabricated when absent.
 */
export const prescriptionDraftSchema = z.object({
  id: z.string().min(1, 'Prescription draft ID is required'),
  patientId: z.string().min(1, 'Patient ID is required'),
  authorPhysicianId: z.string().min(1, 'Author physician ID is required'),
  items: z.array(prescriptionItemSchema).min(1, 'Prescription draft must contain at least one medication item'),
  status: z.enum(['draft', 'pending_review']),
  createdAt: z.string().min(1, 'Creation timestamp is required'),
  notes: z.string().optional(),
})

export type PrescriptionDraft = z.infer<typeof prescriptionDraftSchema>
