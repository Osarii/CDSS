import type {
  ClinicalContext,
  ClinicalFinding,
  PrescriptionDraft,
  ClinicalAssessmentSummary,
  PharmacyReviewInput,
  PharmacyReview,
} from '../../domain'
import {
  clinicalAssessmentSummarySchema,
  pharmacyReviewSchema,
} from '../../domain'
import type {
  ClinicalAssistantProvider,
  PharmacyAssistantProvider,
  RemoteAIProviderConfig,
} from './types'

/**
 * Default timeout for n8n AI webhook requests (10 seconds).
 */
const DEFAULT_TIMEOUT_MS = 10000

/**
 * Resolves non-secret n8n Gemini Clinical Assistant webhook URL from config or environment.
 */
export function getGeminiWebhookUrl(config?: RemoteAIProviderConfig): string {
  if (config?.geminiWebhookUrl) {
    return config.geminiWebhookUrl
  }
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_N8N_GEMINI_WEBHOOK_URL) {
    return import.meta.env.VITE_N8N_GEMINI_WEBHOOK_URL
  }
  return ''
}

/**
 * Resolves non-secret n8n Qwen Pharmacy Assistant webhook URL from config or environment.
 */
export function getQwenWebhookUrl(config?: RemoteAIProviderConfig): string {
  if (config?.qwenWebhookUrl) {
    return config.qwenWebhookUrl
  }
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_N8N_QWEN_WEBHOOK_URL) {
    return import.meta.env.VITE_N8N_QWEN_WEBHOOK_URL
  }
  return ''
}

/**
 * Helper to fetch from n8n webhooks with timeout, HTTP status checking, invalid JSON handling, and Zod domain validation.
 */
async function fetchAndValidateRemoteAI<T>(params: {
  url: string
  payload: unknown
  schema: { parse: (data: unknown) => T }
  roleName: string
  timeoutMs?: number
  customHeaders?: Record<string, string>
}): Promise<T> {
  const { url, payload, schema, roleName, timeoutMs = DEFAULT_TIMEOUT_MS, customHeaders } = params

  if (!url) {
    throw new Error(
      `Remote AI provider for ${roleName} is not configured. Missing n8n webhook URL.`
    )
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    let response: Response
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...customHeaders,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      })
    } catch (netError: unknown) {
      if (netError instanceof Error && netError.name === 'AbortError') {
        throw new Error(
          `Remote AI provider request for ${roleName} timed out after ${timeoutMs}ms.`,
          { cause: netError }
        )
      }
      const msg = netError instanceof Error ? netError.message : String(netError)
      throw new Error(
        `Remote AI service for ${roleName} is unavailable or unreachable: ${msg}`,
        { cause: netError }
      )
    }

    if (!response.ok) {
      throw new Error(
        `Remote AI provider for ${roleName} returned HTTP ${response.status}: ${response.statusText}`
      )
    }

    let json: unknown
    try {
      json = await response.json()
    } catch (jsonErr: unknown) {
      throw new Error(
        `Remote AI provider for ${roleName} returned invalid JSON response.`,
        { cause: jsonErr }
      )
    }

    try {
      return schema.parse(json)
    } catch (zodError: unknown) {
      const detail = zodError instanceof Error ? zodError.message : String(zodError)
      throw new Error(
        `Remote AI provider for ${roleName} returned data that failed domain schema validation: ${detail}`,
        { cause: zodError }
      )
    }
  } finally {
    clearTimeout(timeoutId)
  }
}

/**
 * Remote Provider implementation for Gemini Clinical Assistant via n8n webhook.
 *
 * Receives permitted ClinicalContext + deterministic findings + proposed prescription.
 * Safety invariant: Cannot create, author, or approve a prescription.
 * Safety invariant: Communicates ONLY through n8n webhook (never calls Gemini SDK/API directly).
 */
export class RemoteClinicalAssistantProvider implements ClinicalAssistantProvider {
  private config?: RemoteAIProviderConfig

  constructor(config?: RemoteAIProviderConfig) {
    this.config = config
  }

  async generateAssessment(
    context: ClinicalContext,
    deterministicFindings: ClinicalFinding[],
    proposedPrescription?: PrescriptionDraft
  ): Promise<ClinicalAssessmentSummary> {
    const url = getGeminiWebhookUrl(this.config)
    const payload = {
      context,
      deterministicFindings,
      proposedPrescription,
    }

    return fetchAndValidateRemoteAI<ClinicalAssessmentSummary>({
      url,
      payload,
      schema: clinicalAssessmentSummarySchema,
      roleName: 'Clinical Assistant (Gemini via n8n)',
      timeoutMs: this.config?.timeoutMs,
      customHeaders: this.config?.headers,
    })
  }
}

/**
 * Remote Provider implementation for Qwen Pharmacy Assistant via n8n webhook.
 *
 * Receives ONLY controlled PharmacyReviewInput (containing proposed prescription, active meds, allergies, etc.).
 * Safety invariant: Full raw ClinicalContext is NEVER sent to this provider.
 * Safety invariant: Communicates ONLY through n8n webhook (never calls Qwen API directly).
 */
export class RemotePharmacyAssistantProvider implements PharmacyAssistantProvider {
  private config?: RemoteAIProviderConfig

  constructor(config?: RemoteAIProviderConfig) {
    this.config = config
  }

  async reviewPrescription(input: PharmacyReviewInput): Promise<PharmacyReview> {
    const url = getQwenWebhookUrl(this.config)
    const payload = {
      input,
    }

    return fetchAndValidateRemoteAI<PharmacyReview>({
      url,
      payload,
      schema: pharmacyReviewSchema,
      roleName: 'Pharmacy Assistant (Qwen via n8n)',
      timeoutMs: this.config?.timeoutMs,
      customHeaders: this.config?.headers,
    })
  }
}
