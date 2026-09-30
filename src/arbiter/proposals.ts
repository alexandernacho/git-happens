import { DEFAULT_POLICY } from './policy'
import { addDays, parseEventDate, toMs } from './time'
import type { ClassifiedTransaction, Customer, Proposal, ScenarioAction, ScenarioConfig } from './types'

export interface ProposalResult {
  proposals: Proposal[]
  /** Why the transaction or an action produced no proposal, for the pipeline UI. */
  skipped: string[]
}

/** Turns a classified transaction into one proposal per eligible action of its scenario. Never contacts anyone. */
export function createProposals(
  ct: ClassifiedTransaction,
  customer: Customer,
  scenarios: ScenarioConfig[],
  minConfidence = DEFAULT_POLICY.minConfidence,
): ProposalResult {
  if (ct.scenario === 'none') return { proposals: [], skipped: ['no scenario'] }

  const config = scenarios.find((s) => s.id === ct.scenario)
  if (!config) return { proposals: [], skipped: [`unknown scenario "${ct.scenario}"`] }

  const confidence = ct.probabilities[ct.scenario] ?? 0
  if (confidence < minConfidence) return { proposals: [], skipped: [`low confidence ${confidence}`] }

  const result: ProposalResult = { proposals: [], skipped: [] }
  for (const action of config.actions) {
    const notEligible = eligibility(action, customer)
    if (notEligible) result.skipped.push(`${action.id}: ${notEligible}`)
    else result.proposals.push(toProposal(ct, customer, config, action, confidence))
  }
  return result
}

function eligibility(action: ScenarioAction, customer: Customer): string | undefined {
  const has = new Set(customer.products)
  const missing = action.requires?.hasProducts?.find((p) => !has.has(p))
  if (missing) return `not eligible: needs ${missing}`
  const owned = action.requires?.lacksProducts?.find((p) => has.has(p))
  if (owned) return `not eligible: already has ${owned}`
}

function toProposal(
  ct: ClassifiedTransaction,
  customer: Customer,
  config: ScenarioConfig,
  action: ScenarioAction,
  confidence: number,
): Proposal {
  const tx = ct.transaction
  let notBefore = tx.ts
  let expires = addDays(tx.ts, action.expiresAfterDays)

  if (action.timing.type === 'after') {
    notBefore = addDays(tx.ts, action.timing.days)
  } else if (action.timing.type === 'before_event') {
    const eventDate = ct.eventDate ?? parseEventDate(tx.description, tx.ts)
    if (eventDate) {
      const target = addDays(eventDate, -action.timing.days)
      if (toMs(target) > toMs(tx.ts)) notBefore = target
      expires = eventDate
    }
  }

  return {
    id: `${customer.id}:${config.id}/${action.id}:${tx.id}`,
    customerId: customer.id,
    scenario: config.id,
    actionId: action.id,
    kind: action.kind,
    label: action.label,
    product: action.product,
    channel: ct.channel,
    confidence,
    createdAt: tx.ts,
    notBefore,
    expires,
    evidence: [tx.id],
  }
}
