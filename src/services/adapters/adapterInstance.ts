/**
 * Singleton adapter instance for UI consumption.
 * All UI hooks must import from here — never instantiate adapters directly in components.
 */
import { JsonServerAdapter } from './JsonServerAdapter'
import type { ClinicalDataAdapter } from './ClinicalDataAdapter'

export const clinicalAdapter: ClinicalDataAdapter = new JsonServerAdapter({
  baseUrl: 'http://localhost:3001',
})
