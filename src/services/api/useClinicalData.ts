/**
 * TanStack Query hooks for clinical data.
 * All UI components must consume data through these hooks — never read db.json directly.
 */
import { useQuery } from '@tanstack/react-query'
import { clinicalAdapter } from '../adapters/adapterInstance'
import { evaluateDemoRules } from '@/domain/rules/evaluator'

export const QUERY_KEYS = {
  scenarios: ['scenarios'] as const,
  scenario: (id: string) => ['scenarios', id] as const,
  patients: ['patients'] as const,
  patient: (id: string) => ['patients', id] as const,
  scenarioContext: (id: string) => ['scenarioContext', id] as const,
  scenarioEvaluation: (id: string) => ['scenarioEvaluation', id] as const,
}

/** All synthetic scenarios */
export function useScenarios() {
  return useQuery({
    queryKey: QUERY_KEYS.scenarios,
    queryFn: () => clinicalAdapter.getScenarios(),
    staleTime: 30_000,
  })
}

/** A single scenario by ID */
export function useScenario(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.scenario(id),
    queryFn: () => clinicalAdapter.getScenarioById(id),
    enabled: !!id,
    staleTime: 30_000,
  })
}

/** All patients */
export function usePatients() {
  return useQuery({
    queryKey: QUERY_KEYS.patients,
    queryFn: () => clinicalAdapter.getPatients(),
    staleTime: 30_000,
  })
}

/**
 * Full rule evaluation for a scenario:
 * builds ClinicalContext and runs all DEMO rules.
 * Returns findings + per-rule results (triggered/blocked/not_triggered).
 */
export function useScenarioEvaluation(scenarioId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.scenarioEvaluation(scenarioId),
    queryFn: async () => {
      const context = await clinicalAdapter.getScenarioContext(scenarioId)
      const evaluation = await evaluateDemoRules(context)
      return { context, evaluation }
    },
    enabled: !!scenarioId,
    staleTime: 60_000,
  })
}

/**
 * Aggregated dashboard summary across all scenarios.
 * Runs evaluations for every loaded scenario and aggregates counts.
 */
export function useDashboardSummary() {
  const { data: scenarios, isLoading: scenariosLoading, error: scenariosError } = useScenarios()

  const firstScenarioId = scenarios?.[0]?.id ?? ''

  const {
    data: evaluation,
    isLoading: evalLoading,
    error: evalError,
  } = useScenarioEvaluation(firstScenarioId)

  const isLoading = scenariosLoading || (!!firstScenarioId && evalLoading)
  const error = scenariosError ?? evalError

  const criticalCount =
    evaluation?.evaluation.findings.filter((f) => f.severity === 'critical').length ?? 0
  const warningCount =
    evaluation?.evaluation.findings.filter((f) => f.severity === 'warning').length ?? 0
  const blockedCount =
    evaluation?.evaluation.results.filter((r) => r.status === 'blocked').length ?? 0
  const triggeredCount =
    evaluation?.evaluation.results.filter((r) => r.status === 'triggered').length ?? 0

  return {
    scenarios: scenarios ?? [],
    evaluation,
    criticalCount,
    warningCount,
    blockedCount,
    triggeredCount,
    isLoading,
    error,
  }
}
