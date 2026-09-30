import { scenarios as catalogue } from '../data/scenarios'
import type { ScenarioAction, ScenarioConfig } from './types'

// The scenario catalogue (src/data/scenarios.ts) says *what* a transaction can trigger.
// This file adds what the arbiter needs on top: is it a sale or a service, who qualifies,
// and when it may go out. Scenarios not listed here are services, sent now, valid 30 days.
type Policy = Partial<Omit<ScenarioAction, 'id' | 'label'>>

const POLICY: Record<string, Policy> = {
  // Travel
  'card-abroad-check': { timing: { type: 'before_event', days: 7 } },
  'travel-insurance': {
    kind: 'offer',
    product: 'KBC Travel Insurance',
    requires: { lacksProducts: ['travel_insurance'] },
    timing: { type: 'before_event', days: 10 },
  },

  // Payments
  'duplicate-payment': { expiresAfterDays: 7 },
  'low-balance': { expiresAfterDays: 3 },
  'card-limit': { expiresAfterDays: 7 },
  'upcoming-payment-reminder': { expiresAfterDays: 3 },
  'foreign-payment-info': { expiresAfterDays: 14 },
  'reimbursement-check': { timing: { type: 'after', days: 7 }, expiresAfterDays: 21 },
  'parking-4411': { kind: 'offer', product: 'Parking via KBC Mobile' },
  'public-transport-tickets': { kind: 'offer', product: 'Tickets via KBC Mobile' },
  'cinema-tickets': { kind: 'offer', product: 'Cinema tickets via KBC Mobile' },

  // Documents
  'store-warranty': { expiresAfterDays: 14 },

  // Insurance: claims need the policy, offers need its absence
  'home-insurance-review': { requires: { hasProducts: ['home_insurance'] } },
  'home-damage-claim': { requires: { hasProducts: ['home_insurance'] } },
  'storm-damage': { requires: { hasProducts: ['home_insurance'] }, expiresAfterDays: 14 },
  'vehicle-claim': { requires: { hasProducts: ['car_insurance'] } },
  'hospitalisation-claim': { requires: { hasProducts: ['hospitalisation_insurance'] } },
  'pet-insurance': { kind: 'offer', product: 'KBC Pet Insurance', requires: { lacksProducts: ['pet_insurance'] } },
  'car-insurance': { kind: 'offer', product: 'KBC Car Insurance', requires: { lacksProducts: ['car_insurance'] } },
  'family-insurance': {
    kind: 'offer',
    product: 'KBC Family Insurance',
    requires: { lacksProducts: ['family_insurance'] },
    expiresAfterDays: 45,
  },
  'cheaper-insurance': { kind: 'offer', product: 'KBC insurance review' },

  // Energy
  'cheaper-energy-supplier': { kind: 'offer', product: 'Energy comparison in KBC Mobile' },
  'greener-home': { kind: 'offer', product: 'KBC green home solutions' },

  // Vouchers and benefits
  'service-voucher-reminder': { timing: { type: 'after', days: 25 }, expiresAfterDays: 40 },
  'kbc-deals-cashback': { kind: 'offer', product: 'KBC Deals', expiresAfterDays: 14 },

  // Personal finance
  'unusual-spending': { expiresAfterDays: 7 },
  'seasonal-savings': {
    kind: 'offer',
    product: 'KBC Christmas savings pot',
    requires: { lacksProducts: ['christmas_pot'] },
    expiresAfterDays: 45,
  },
}

/** Situation id for a catalogue scenario: its life event if it has one, otherwise itself. */
export function situationOf(scenarioId: string): string {
  return catalogue.find((s) => s.id === scenarioId)?.lifeEvent ?? scenarioId
}

function toAction(s: (typeof catalogue)[number]): ScenarioAction {
  return {
    id: s.id,
    kind: 'service',
    label: s.kbc.replace(/\.$/, ''),
    timing: { type: 'now' },
    expiresAfterDays: 30,
    ...POLICY[s.id],
  }
}

/** Every catalogue scenario, grouped into situations by life event. */
export function buildSituations(): ScenarioConfig[] {
  const byId = new Map<string, ScenarioConfig>()
  for (const s of catalogue) {
    const id = situationOf(s.id)
    const situation = byId.get(id) ?? { id, description: '', actions: [] }
    situation.description = situation.description ? `${situation.description} / ${s.trigger}` : s.trigger
    situation.actions.push(toAction(s))
    byId.set(id, situation)
  }
  return [...byId.values()]
}

export const situations = buildSituations()
