import type { Transaction as AppTransaction } from '../data/transactions'
import { Arbiter } from './arbiter'
import { fromRoute, type RouteLike } from './fromRouter'
import { createProposals } from './proposals'
import type { Customer, Decision, Feedback, IsoTime, ScenarioConfig } from './types'

export const lotte: Customer = {
  id: 'lotte',
  name: 'Lotte',
  products: ['current_account', 'kbc_card', 'home_insurance'],
}

export type Step =
  /** `route` is a canned Jev answer; scripts/arbiter-demo.ts swaps in live ones when a key is set. */
  | { type: 'tx'; tx: AppTransaction; time: string; route: RouteLike }
  | { type: 'tick'; at: IsoTime }
  | { type: 'feedback'; fb: Feedback }

const none = (p: number): RouteLike => ({ pick: null, channel: null, shortlist: [], none: p })

// The stage script in docs/demo-plan.md.
export const lotteScript: Step[] = [
  {
    type: 'tx',
    tx: { id: 't-1001', date: '2026-10-02', description: 'DELHAIZE GENT', amount: -38.4, mcc: 5411, country: 'BE' },
    time: '12:30',
    route: none(0.96),
  },
  {
    type: 'tx',
    tx: { id: 't-1042', date: '2026-10-03', description: 'RYANAIR FR8412 BRU-BCN 14NOV', amount: -142, mcc: 4511, country: 'IE' },
    time: '14:12',
    route: {
      pick: 'travel-insurance',
      channel: 'push',
      shortlist: [
        { id: 'travel-insurance', probability: 0.52 },
        { id: 'card-abroad-check', probability: 0.39 },
      ],
      none: 0.05,
    },
  },
  {
    type: 'tx',
    tx: { id: 't-1107', date: '2026-10-30', description: 'TOM&CO GENT', amount: -64.9, mcc: 5995, country: 'BE' },
    time: '16:05',
    route: { pick: 'pet-insurance', channel: 'push', shortlist: [{ id: 'pet-insurance', probability: 0.55 }], none: 0.4 },
  },
  {
    type: 'tx',
    tx: { id: 't-1133', date: '2026-11-03', description: 'DIERENARTSPRAKTIJK DE WOLF', amount: -95, mcc: 742, country: 'BE' },
    time: '22:40',
    route: { pick: 'pet-insurance', channel: 'push', shortlist: [{ id: 'pet-insurance', probability: 0.6 }], none: 0.35 },
  },
  { type: 'tick', at: '2026-11-04T08:00' },
  {
    type: 'feedback',
    fb: { customerId: 'lotte', scenario: 'travel', actionId: 'travel-insurance', answer: 'not_now', at: '2026-11-04T09:15' },
  },
  { type: 'tick', at: '2026-11-07T08:00' },
  { type: 'tick', at: '2026-11-11T08:00' },
]

export interface Event {
  step: Step
  /** Why the transaction or some of its actions produced no proposal. */
  skipped: string[]
  decisions: Decision[]
}

/** Runs steps through the router adapter, proposal creation and the arbiter. Each transaction is followed by a tick at its own time. */
export function run(steps: Step[], customer: Customer, situations: ScenarioConfig[], arbiter = new Arbiter()): Event[] {
  return steps.map((step): Event => {
    if (step.type === 'tick') return { step, skipped: [], decisions: arbiter.tick(step.at) }
    if (step.type === 'feedback') return { step, skipped: [], decisions: arbiter.feedback(step.fb) }

    const ct = fromRoute(step.tx, step.route, customer.id, step.time)
    const { proposals, skipped } = createProposals(ct, customer, situations)
    if (!proposals.length) return { step, skipped, decisions: [] }
    const submitted = proposals.flatMap((p) => arbiter.submit(p))
    return { step, skipped, decisions: [...submitted, ...arbiter.tick(ct.transaction.ts)] }
  })
}
