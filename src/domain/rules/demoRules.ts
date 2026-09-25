import type { RuleProperties } from 'json-rules-engine'
import type { RuleDefinition } from './schema'
import type { ClinicalContext } from '../clinical-context/types'

/**
 * CRITICAL PROTOTYPE SAFETY NOTICE:
 * The rules defined below (DEMO-ALG-001, DEMO-DDI-001, DEMO-REN-001) are strictly
 * synthetic demonstration logic designed for testing the rule engine, required data gating,
 * and finding builder pipelines.
 *
 * Their specific conditions, numerical thresholds (e.g. eGFR <= 50), and medication pairings
 * are synthetic demonstration logic and are NOT validated clinical guidance or authoritative
 * clinical recommendations.
 */
export interface DemoRule {
  definition: RuleDefinition
  engineRule: RuleProperties
  getSupportingDataKeys?: (context: ClinicalContext) => string[]
}

/**
 * DEMO-ALG-001: Prototype Beta-Lactam Allergy Warning
 *
 * Synthetic prototype demonstration rule for pipeline verification: Flags active prescriptions
 * of beta-lactam antibiotics (e.g. amoxicillin-clavulanate) in patients with documented penicillin allergy.
 * This is synthetic demonstration logic and is NOT validated clinical guidance.
 */
export const DEMO_ALG_001: DemoRule = {
  definition: {
    id: 'DEMO-ALG-001',
    version: '1.0.0',
    name: 'DEMO: Beta-Lactam / Penicillin Allergy Warning',
    description:
      'Synthetic prototype rule for pipeline demonstration: Alerts when a patient with documented penicillin hypersensitivity has an active prescription for a beta-lactam antibiotic (e.g. amoxicillin-clavulanate). This is synthetic demonstration logic and NOT validated clinical guidance.',
    severity: 'critical',
    enabled: true,
    requiredDataKeys: [],
  },
  engineRule: {
    name: 'DEMO-ALG-001',
    conditions: {
      all: [
        {
          fact: 'allergies',
          operator: 'contains',
          value: 'penicillin',
        },
        {
          fact: 'medications',
          operator: 'contains',
          value: 'amoxicillin-clavulanate',
        },
      ],
    },
    event: {
      type: 'DEMO-ALG-001_TRIGGERED',
      params: {
        ruleId: 'DEMO-ALG-001',
        title: 'DEMO: Beta-Lactam / Penicillin Allergy Warning',
        detail:
          'Synthetic prototype alert: Patient has documented Penicillin allergy and active Amoxicillin-Clavulanate prescription. Synthetic demonstration logic; not validated clinical guidance.',
      },
    },
  },
  getSupportingDataKeys: (context: ClinicalContext): string[] => {
    const keys: string[] = []
    const matchingAllergy = context.allergies.find((a) =>
      a.substance.toLowerCase().includes('penicillin')
    )
    if (matchingAllergy) {
      keys.push(matchingAllergy.id)
    }

    const matchingMed = context.medications.find((m) =>
      m.name.toLowerCase().includes('amoxicillin')
    )
    if (matchingMed) {
      keys.push(matchingMed.id)
    }

    return keys
  },
}

/**
 * DEMO-DDI-001: Prototype Amiodarone and Spironolactone Interaction
 *
 * Synthetic prototype demonstration rule for pipeline verification: Flags concurrent administration
 * of amiodarone and spironolactone with potassium monitoring.
 * This is synthetic demonstration logic and is NOT validated clinical guidance.
 */
export const DEMO_DDI_001: DemoRule = {
  definition: {
    id: 'DEMO-DDI-001',
    version: '1.0.0',
    name: 'DEMO: Amiodarone and Spironolactone Interaction',
    description:
      'Synthetic prototype rule for pipeline demonstration: Alerts on concurrent amiodarone and spironolactone therapy requiring potassium monitoring. This is synthetic demonstration logic and NOT validated clinical guidance.',
    severity: 'warning',
    enabled: true,
    requiredDataKeys: ['potassium'],
  },
  engineRule: {
    name: 'DEMO-DDI-001',
    conditions: {
      all: [
        {
          fact: 'medications',
          operator: 'contains',
          value: 'amiodarone',
        },
        {
          fact: 'medications',
          operator: 'contains',
          value: 'spironolactone',
        },
      ],
    },
    event: {
      type: 'DEMO-DDI-001_TRIGGERED',
      params: {
        ruleId: 'DEMO-DDI-001',
        title: 'DEMO: Amiodarone and Spironolactone Interaction',
        detail:
          'Synthetic prototype alert: Co-administration of Amiodarone and Spironolactone requires close potassium and cardiac monitoring. Synthetic demonstration logic; not validated clinical guidance.',
      },
    },
  },
  getSupportingDataKeys: (context: ClinicalContext): string[] => {
    const keys: string[] = []
    const spiroMed = context.medications.find((m) =>
      m.name.toLowerCase().includes('spironolactone')
    )
    if (spiroMed) {
      keys.push(spiroMed.id)
    }

    const amioMed = context.medications.find((m) =>
      m.name.toLowerCase().includes('amiodarone')
    )
    if (amioMed) {
      keys.push(amioMed.id)
    }

    if (context.dataPoints['potassium']) {
      keys.push('potassium')
    }

    return keys
  },
}

/**
 * DEMO-REN-001: Prototype Impaired Renal Function Dosing Alert
 *
 * Synthetic prototype demonstration rule for pipeline verification: Evaluates arbitrary threshold
 * eGFR <= 50 mL/min/1.73m2 with serum creatinine.
 * This numerical threshold and medication pairing are synthetic demonstration logic and are NOT
 * an authoritative clinical recommendation or validated medical guidance.
 */
export const DEMO_REN_001: DemoRule = {
  definition: {
    id: 'DEMO-REN-001',
    version: '1.0.0',
    name: 'DEMO: Impaired Renal Function Dosing Alert',
    description:
      'Synthetic prototype rule for pipeline demonstration: Tests arbitrary threshold eGFR <= 50 mL/min/1.73m2 with serum creatinine. This threshold is synthetic demonstration logic and is NOT an authoritative clinical recommendation.',
    severity: 'warning',
    enabled: true,
    requiredDataKeys: ['serum_creatinine', 'egfr'],
  },
  engineRule: {
    name: 'DEMO-REN-001',
    conditions: {
      all: [
        {
          fact: 'egfr',
          operator: 'lessThanInclusive',
          value: 50,
        },
      ],
    },
    event: {
      type: 'DEMO-REN-001_TRIGGERED',
      params: {
        ruleId: 'DEMO-REN-001',
        title: 'DEMO: Impaired Renal Function Dosing Alert',
        detail:
          'Synthetic prototype alert: Patient eGFR <= 50 mL/min/1.73m2 indicates impaired renal clearance requiring dosage review. Synthetic demonstration logic; not an authoritative clinical recommendation.',
      },
    },
  },
  getSupportingDataKeys: (): string[] => {
    return ['egfr', 'serum_creatinine']
  },
}

/**
 * Canonical registry of synthetic demo rules v1.
 */
export const DEMO_RULES: readonly DemoRule[] = [
  DEMO_ALG_001,
  DEMO_DDI_001,
  DEMO_REN_001,
] as const
