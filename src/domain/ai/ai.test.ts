import { describe, it, expect } from 'vitest'
import { SYN_001, SYN_004 } from '../../data/scenarios'
import { buildClinicalFinding } from '../findings/builder'
import type { ClinicalFinding } from '../findings/schema'
import type { PrescriptionDraft } from '../prescription/schema'
import { prescriptionDraftSchema } from '../prescription/schema'
import {
  pharmacyReviewInputSchema,
  clinicalAssessmentSummarySchema,
  pharmacyReviewSchema,
  reviewComparisonSchema,
} from './schema'
import { buildPharmacyReviewInput } from './inputFilter'
import { compareReviews } from './comparison'
import {
  MockClinicalAssistantProvider,
  MockPharmacyAssistantProvider,
} from '../../services/ai/mockProviders'
import { executeDualAIRoles } from '../../services/ai/orchestrator'

describe('SAMED Dual AI Roles v1', () => {
  const samplePrescriptionDraft: PrescriptionDraft = {
    id: 'rx-draft-001',
    patientId: 'pat-syn-001',
    authorPhysicianId: 'dr-garcia-102',
    items: [
      {
        id: 'rx-item-1',
        medicationCode: 'MET-850',
        medicationName: 'Metformin',
        dosage: '850mg',
        route: 'oral',
        frequency: 'every 12 hours',
        duration: '30 days',
        instructions: 'Take with meals',
      },
    ],
    status: 'draft',
    createdAt: '2026-09-25T14:00:00.000Z',
    notes: 'Physician authored outpatient prescription renewal',
  }

  const sampleFinding: ClinicalFinding = buildClinicalFinding({
    id: 'finding-syn-001-mock',
    patientId: 'pat-syn-001',
    ruleId: 'DEMO-DDI-001',
    ruleVersion: '1.0.0',
    severity: 'critical',
    title: 'High Risk Drug Interaction',
    detail: 'Concurrent administration creates potential adverse effects.',
    supportingDataKeys: ['potassium'],
    missingDataKeys: [],
    timestamp: '2026-09-25T14:00:00.000Z',
  })

  describe('1. Narrower Input Boundary & Context Leak Prevention', () => {
    it('proves pharmacy input is intentionally narrower than ClinicalContext', () => {
      const context = SYN_001.clinicalContext
      const pharmacyInput = buildPharmacyReviewInput({
        context,
        proposedPrescription: samplePrescriptionDraft,
        deterministicFindings: [sampleFinding],
      })

      // Validates against strictly typed schema
      const parsed = pharmacyReviewInputSchema.parse(pharmacyInput)
      expect(parsed).toBeDefined()

      // ClinicalContext has fields: patient (full obj), medications, medicationExposures, allergies, conditions, observations, dataPoints, timestamp
      // PharmacyReviewInput should only contain medication-relevant fields:
      const allowedKeys = [
        'patientId',
        'proposedPrescription',
        'relevantDiagnoses',
        'allergies',
        'currentMedications',
        'relevantObservations',
        'deterministicFindings',
        'unavailableData',
      ]

      const pharmacyInputKeys = Object.keys(pharmacyInput)
      expect(pharmacyInputKeys.sort()).toEqual(allowedKeys.sort())

      // Patient demographics like age/gender/syntheticIdentifier are excluded
      expect(pharmacyInput.patientId).toBe(context.patient.id)
      expect((pharmacyInput as Record<string, unknown>).patient).toBeUndefined()
    })

    it('proves full ClinicalContext cannot leak into Pharmacy Assistant input', () => {
      const context = SYN_001.clinicalContext
      const pharmacyInput = buildPharmacyReviewInput({
        context,
        proposedPrescription: samplePrescriptionDraft,
        deterministicFindings: [sampleFinding],
      })

      // Raw ClinicalContext dictionaries and temporal exposure collections must not exist on input
      expect((pharmacyInput as Record<string, unknown>).dataPoints).toBeUndefined()
      expect((pharmacyInput as Record<string, unknown>).medicationExposures).toBeUndefined()
      expect((pharmacyInput as Record<string, unknown>).timestamp).toBeUndefined()

      // Passing raw ClinicalContext directly to pharmacyReviewInputSchema must fail validation
      const invalidParseResult = pharmacyReviewInputSchema.safeParse(context)
      expect(invalidParseResult.success).toBe(false)
    })
  })

  describe('2. Explicit Preservation of Missing/Unavailable States', () => {
    it('proves missing/unavailable states remain explicit and are never coerced to normal', async () => {
      // SYN_004 has serum_creatinine and egfr in MISSING status
      const context = SYN_004.clinicalContext
      expect(context.dataPoints.serum_creatinine.status).toBe('MISSING')
      expect(context.dataPoints.egfr.status).toBe('MISSING')

      const draftForSyn004: PrescriptionDraft = {
        ...samplePrescriptionDraft,
        patientId: context.patient.id,
      }

      const pharmacyInput = buildPharmacyReviewInput({
        context,
        proposedPrescription: draftForSyn004,
        deterministicFindings: [],
      })

      // Explicitly preserved in PharmacyReviewInput.unavailableData
      const missingKeys = pharmacyInput.unavailableData.map((d) => d.key)
      expect(missingKeys).toContain('serum_creatinine')
      expect(missingKeys).toContain('egfr')

      const creatinineGap = pharmacyInput.unavailableData.find((d) => d.key === 'serum_creatinine')
      expect(creatinineGap?.status).toBe('MISSING')

      // Execute dual AI roles and verify assistants preserve the exact status
      const result = await executeDualAIRoles({
        context,
        proposedPrescription: draftForSyn004,
        deterministicFindings: [],
      })

      // Clinical Assistant explicitly retains the gap
      const clinicalGaps = result.clinicalSummary.dataAvailabilityGaps
      expect(clinicalGaps.some((g) => g.key === 'serum_creatinine' && g.status === 'MISSING')).toBe(true)

      // Pharmacy Assistant marks evaluation as BLOCKED_BY_MISSING_DATA due to missing renal labs
      expect(result.pharmacyReview.status).toBe('BLOCKED_BY_MISSING_DATA')
      expect(
        result.pharmacyReview.requiredDataGaps.some(
          (g) => g.key === 'serum_creatinine' && g.status === 'MISSING'
        )
      ).toBe(true)
    })
  })

  describe('3. Assistant Disagreements & ReviewComparison Layer', () => {
    it('proves assistants may independently disagree and ReviewComparison preserves the disagreement', async () => {
      const context = SYN_001.clinicalContext

      // Custom clinical provider that finds no issues
      const lenientClinicalProvider = new MockClinicalAssistantProvider({
        overrideSummary: 'Patient appears stable with controlled chronic illnesses.',
        extraConsiderations: ['No acute distress observed in clinical record.'],
      })

      // Custom pharmacy provider that recommends review due to cautious pharmacological perspective
      const cautiousPharmacyProvider = new MockPharmacyAssistantProvider({
        forceStatus: 'REVIEW_RECOMMENDED',
        overrideSummary: 'Renal dosing threshold and polypharmacy warrant pharmacist review.',
        extraPharmacologicalConsiderations: [
          'Metformin dosage should be re-evaluated against latest estimated GFR trends.',
        ],
      })

      const result = await executeDualAIRoles({
        context,
        proposedPrescription: samplePrescriptionDraft,
        deterministicFindings: [sampleFinding],
        options: {
          clinicalProvider: lenientClinicalProvider,
          pharmacyProvider: cautiousPharmacyProvider,
        },
      })

      // Confirm independent outputs
      expect(result.clinicalSummary.role).toBe('clinical_assistant')
      expect(result.pharmacyReview.role).toBe('pharmacy_assistant')
      expect(result.pharmacyReview.status).toBe('REVIEW_RECOMMENDED')

      // Check comparison layer
      const comparison = result.comparison
      const parsedComparison = reviewComparisonSchema.parse(comparison)
      expect(parsedComparison).toBeDefined()

      // Proves comparison identifies assistant-only considerations
      expect(comparison.clinicalAssistantOnlyConsiderations.length).toBeGreaterThan(0)
      expect(comparison.pharmacyAssistantOnlyConsiderations.length).toBeGreaterThan(0)

      // Proves comparison exposes unresolved discrepancies without choosing a winner
      expect(comparison.unresolvedDiscrepancies.length).toBeGreaterThan(0)

      // Invariant: ReviewComparison must never decide which AI is correct
      expect((comparison as Record<string, unknown>).winner).toBeUndefined()
      expect((comparison as Record<string, unknown>).correctAssistant).toBeUndefined()
      expect((comparison as Record<string, unknown>).finalDecision).toBeUndefined()
    })

    it('proves compareReviews handles missing data disagreements neutrally', () => {
      const clinicalSummary = clinicalAssessmentSummarySchema.parse({
        id: 'cs-test-1',
        patientId: 'pat-syn-001',
        summary: 'Clinical summary with partial gaps',
        clinicalConsiderations: ['Hypertension monitoring required'],
        dataAvailabilityGaps: [
          { key: 'uric_acid', status: 'STALE' },
        ],
        deterministicFindingsReferenced: [],
        generatedAt: '2026-09-25T14:00:00.000Z',
        role: 'clinical_assistant',
      })

      const pharmacyReview = pharmacyReviewSchema.parse({
        id: 'pr-test-1',
        patientId: 'pat-syn-001',
        prescriptionDraftId: 'rx-draft-001',
        status: 'BLOCKED_BY_MISSING_DATA',
        summary: 'Pharmacy review blocked',
        pharmacologicalConsiderations: ['Renal monitoring required'],
        requiredDataGaps: [
          { key: 'serum_creatinine', status: 'MISSING' },
        ],
        deterministicFindingsReferenced: [],
        reviewedAt: '2026-09-25T14:00:00.000Z',
        role: 'pharmacy_assistant',
      })

      const comparison = compareReviews(clinicalSummary, pharmacyReview)

      // Identifies differences in reported gaps
      expect(comparison.missingDataDisagreements.length).toBe(2)
      expect(
        comparison.missingDataDisagreements.some((d) => d.includes('serum_creatinine'))
      ).toBe(true)
      expect(
        comparison.missingDataDisagreements.some((d) => d.includes('uric_acid'))
      ).toBe(true)
    })
  })

  describe('4. Single Source of Truth: Deterministic Findings Invariant', () => {
    it('proves AI output cannot overwrite or downgrade deterministic findings', async () => {
      const context = SYN_001.clinicalContext

      // Pharmacy assistant claiming everything is completely fine
      const permissivePharmacyProvider = new MockPharmacyAssistantProvider({
        forceStatus: 'NO_ADDITIONAL_CONCERNS',
        overrideSummary: 'All clear, no contraindications detected by AI.',
      })

      // Deterministic finding is CRITICAL
      const criticalFinding = buildClinicalFinding({
        id: 'finding-crit-1',
        patientId: 'pat-syn-001',
        ruleId: 'DEMO-ALG-001',
        ruleVersion: '1.0.0',
        severity: 'critical',
        title: 'Severe Beta-Lactam Anaphylaxis Risk',
        detail: 'Documented penicillin allergy contradicts amoxicillin prescription.',
        supportingDataKeys: ['allergy_penicillin'],
        missingDataKeys: [],
        timestamp: '2026-09-25T14:00:00.000Z',
      })

      const result = await executeDualAIRoles({
        context,
        proposedPrescription: samplePrescriptionDraft,
        deterministicFindings: [criticalFinding],
        options: {
          pharmacyProvider: permissivePharmacyProvider,
        },
      })

      // The returned deterministic findings remain strictly preserved
      expect(result.deterministicFindings).toHaveLength(1)
      expect(result.deterministicFindings[0].id).toBe('finding-crit-1')
      expect(result.deterministicFindings[0].severity).toBe('critical')
      expect(result.deterministicFindings[0].isDeterministic).toBe(true)

      // Even though pharmacy AI reported NO_ADDITIONAL_CONCERNS, it cannot alter deterministic truth
      expect(result.pharmacyReview.status).toBe('NO_ADDITIONAL_CONCERNS')
      expect(result.deterministicFindings[0].severity).toBe('critical')
    })
  })

  describe('5. PrescriptionDraft Authenticity & Fabrication Prevention', () => {
    it('proves no prescription can be fabricated when absent', async () => {
      const context = SYN_001.clinicalContext

      // Attempting to build pharmacy input without a physician-authored draft must throw
      expect(() => {
        buildPharmacyReviewInput({
          context,
          proposedPrescription: undefined as unknown as PrescriptionDraft,
          deterministicFindings: [],
        })
      }).toThrow(/required and cannot be fabricated/)

      // Attempting to execute dual AI roles without a prescription draft must throw
      await expect(
        executeDualAIRoles({
          context,
          proposedPrescription: undefined as unknown as PrescriptionDraft,
          deterministicFindings: [],
        })
      ).rejects.toThrow(/PrescriptionDraft/)
    })

    it('proves PrescriptionDraft schema enforces physician author and medication items', () => {
      // Must have at least one medication item and a physician author
      const invalidDraft = {
        id: 'rx-draft-invalid',
        patientId: 'pat-syn-001',
        authorPhysicianId: '', // invalid: empty
        items: [], // invalid: empty items
        status: 'draft',
        createdAt: '2026-09-25T14:00:00.000Z',
      }

      const parseResult = prescriptionDraftSchema.safeParse(invalidDraft)
      expect(parseResult.success).toBe(false)
    })
  })
})
