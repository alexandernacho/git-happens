import type { Destination } from './data/destinations'

export type Step = 'home' | 'detected' | 'insurance' | 'destination' | 'budget' | 'currency' | 'esim' | 'ready'

export const stepLabels: Record<Step, string> = {
  home: 'Home',
  detected: 'Trip detected',
  insurance: 'Travel insurance',
  destination: 'Destination',
  budget: 'Budget',
  currency: 'Currency',
  esim: 'eSIM',
  ready: 'Trip ready',
}

// Inside the EU there is no currency to exchange and roaming is free, so those steps are skipped.
export function flowSteps(destination: Destination): Step[] {
  const all: Step[] = ['detected', 'insurance', 'destination', 'budget', 'currency', 'esim', 'ready']
  return all.filter((s) => !(destination.inEU && (s === 'currency' || s === 'esim')))
}

export type TripPlan = { destinationId: string; depart: string; return: string }

export type Choices = {
  insurance: 'single' | 'annual' | null
  budgetPot: number | null // EUR set aside
  cash: { eur: number; pickup: string } | null
  esim: EsimPlan | null
}

export type EsimPlan = { id: string; data: string; validity: string; price: number }

export const emptyChoices: Choices = { insurance: null, budgetPot: null, cash: null, esim: null }

export function tripDays(plan: TripPlan): number {
  return Math.max(1, Math.round((Date.parse(plan.return) - Date.parse(plan.depart)) / 86_400_000))
}

export function isoInDays(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}
