// Shared contract between classification (in), the arbiter, and actions (out).
// Times are Brussels local time as ISO strings without a zone, e.g. '2026-10-03T14:12'.
export type IsoTime = string

// ── In: from classification (see fromRouter.ts for the Jev router adapter) ───

export interface Transaction {
  id: string
  customerId: string
  ts: IsoTime
  amount: number // negative = money out
  counterparty: string
  description: string
  mcc?: number
  country?: string
}

/** From the Jev router: push for life events, in-app feed card for opportunities. */
export type Channel = 'push' | 'feed'

export interface ClassifiedTransaction {
  transaction: Transaction
  /** Situation id (see catalogue.ts), or 'none'. */
  scenario: string
  /** Probability per situation id, including 'none'. */
  probabilities: Record<string, number>
  /** Date of the event the payment is for (e.g. flight date), if the classifier found one. */
  eventDate?: IsoTime
  channel?: Channel
}

export interface Customer {
  id: string
  name: string
  products: string[]
}

// ── Scenarios: what Kate knows (built from src/data/scenarios.ts in catalogue.ts) ──

export type Timing =
  | { type: 'now' }
  /** Send `days` before the event date; send now if no date is known. */
  | { type: 'before_event'; days: number }
  /** Send `days` after the transaction, e.g. a reminder to reorder. */
  | { type: 'after'; days: number }

/** 'offer' sells something and counts toward the contact limit; 'service' helps and is never rate-limited. */
export type ActionType = 'offer' | 'service'

export interface ScenarioAction {
  /** Scenario id from the catalogue, e.g. 'travel-insurance'. */
  id: string
  kind: ActionType
  /** What Kate does, worded as in KBC's public list of Kate's capabilities. */
  label: string
  product?: string
  requires?: { hasProducts?: string[]; lacksProducts?: string[] }
  timing: Timing
  /** Used when there is no event date to expire on. */
  expiresAfterDays: number
}

/**
 * A situation a transaction can fall into, and what Kate can do about it. Catalogue scenarios that
 * share a life event (travel: card-abroad-check + travel-insurance) form one situation.
 */
export interface ScenarioConfig {
  id: string
  description: string
  actions: ScenarioAction[]
}

export interface Proposal {
  id: string
  customerId: string
  scenario: string
  actionId: string
  kind: ActionType
  label: string
  product?: string
  channel?: Channel
  confidence: number
  createdAt: IsoTime
  notBefore: IsoTime
  expires: IsoTime
  /** Transaction ids that support this proposal. */
  evidence: string[]
}

// ── Out: to actions ────────────────────────────────────────────────────────

export type DecisionKind = 'send' | 'hold' | 'merge' | 'drop'
/** How a decision reaches the customer. */
export type ActionKind = 'offer' | 'service' | 'question' | 'log'
export type HoldReason = 'not_yet' | 'need_evidence' | 'quiet_hours' | 'contact_limit' | 'awaiting_answer'
export type DropReason = 'low_confidence' | 'expired' | 'declined' | 'converted'

export interface Decision {
  at: IsoTime
  customerId: string
  proposalId: string
  scenario: string
  actionId: string
  decision: DecisionKind
  /** Set when decision is 'send' (offer | service | question) or a low-confidence 'drop' (log). */
  action?: ActionKind
  reason: HoldReason | DropReason | 'merged' | 'ready'
  /** Human-readable, for the UI and 'Why am I seeing this?'. */
  detail: string
  confidence: number
  proposal: Proposal
}

// ── In: from actions, the customer's answer ────────────────────────────────

export interface Feedback {
  customerId: string
  scenario: string
  actionId: string
  answer: 'yes' | 'no' | 'not_now'
  at: IsoTime
}
