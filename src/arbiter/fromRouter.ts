import { scenarios as catalogue } from '../data/scenarios'
import type { Transaction as AppTransaction } from '../data/transactions'
import { situationOf } from './catalogue'
import type { Channel, ClassifiedTransaction, Transaction } from './types'

/**
 * The parts of the Jev router's RouteResult (server/scenarioRouter.ts) the arbiter uses.
 * Declared here instead of imported so the browser bundle never pulls in server code.
 */
export type RouteLike = {
  pick: string | null
  channel: Channel | null
  shortlist: { id: string; probability: number }[]
  none?: number
}

/** Confidence given to an MCC match when Jev is unavailable: just enough to act. */
export const FALLBACK_CONFIDENCE = 0.7

/** The app's transaction (date only, no customer) → the arbiter's (time of day, customer). */
export function toArbiterTransaction(t: AppTransaction, customerId: string, time = '12:00'): Transaction {
  return {
    id: t.id,
    customerId,
    ts: `${t.date}T${time}`,
    amount: t.amount,
    counterparty: t.description,
    description: t.description,
    mcc: t.mcc,
    country: t.country,
  }
}

/**
 * Jev picks one catalogue scenario. The arbiter works per situation, so the probabilities of
 * scenarios in the same situation add up: a flight split 0.52 travel-insurance / 0.39
 * card-abroad-check is a 0.91 "travel" situation, and both actions get proposed.
 */
export function fromRoute(t: AppTransaction, route: RouteLike, customerId: string, time?: string): ClassifiedTransaction {
  const transaction = toArbiterTransaction(t, customerId, time)
  const probabilities: Record<string, number> = { none: route.none ?? 0 }
  for (const c of route.shortlist) {
    const id = situationOf(c.id)
    probabilities[id] = round2((probabilities[id] ?? 0) + c.probability)
  }
  return {
    transaction,
    scenario: route.pick ? situationOf(route.pick) : 'none',
    probabilities,
    channel: route.channel ?? undefined,
  }
}

/** When Jev is down: the first Jev scenario whose MCC hints match the payment, if any. */
export function fromMcc(t: AppTransaction, customerId: string, time?: string): ClassifiedTransaction {
  const transaction = toArbiterTransaction(t, customerId, time)
  const hit = t.mcc === undefined ? undefined : catalogue.find((s) => s.decider === 'jev' && s.mcc?.includes(t.mcc!))
  if (!hit) return { transaction, scenario: 'none', probabilities: { none: 1 } }
  const id = situationOf(hit.id)
  return { transaction, scenario: id, probabilities: { [id]: FALLBACK_CONFIDENCE, none: round2(1 - FALLBACK_CONFIDENCE) } }
}

/**
 * Browser helper: ask the Jev router (POST /api/route-transaction), fall back to MCC hints when it
 * answers 503 (no key, Jev down) or the network fails.
 */
export async function classify(t: AppTransaction, customerId: string, time?: string): Promise<ClassifiedTransaction> {
  try {
    const res = await fetch('/api/route-transaction', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transaction: t }),
    })
    if (res.ok) return fromRoute(t, (await res.json()) as RouteLike, customerId, time)
  } catch {
    // fall through to the MCC fallback
  }
  return fromMcc(t, customerId, time)
}

const round2 = (n: number) => Math.round(n * 100) / 100
