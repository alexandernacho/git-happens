import { useEffect, useState } from 'react'
import type { Destination } from '../data/destinations'
import type { TripBudget } from './budget'

export type BudgetTipRequest = {
  city: string
  country: string
  currency: string
  days: number
  daily: number
  basis: string
  breakdown: TripBudget['breakdown']
}

type Tip = { text: string; source: 'ai' | 'fallback' } | null

// Shown when the API is unreachable, slow, or has no key: the demo must never hang on stage.
const fallbackTips: Record<string, string> = {
  nyc: 'Tap your contactless card on the subway: fares stop after a set number of rides per week. Lunch specials keep food costs down, and remember that tips of 18–20% come on top of restaurant prices.',
  lon: 'Tap your card on the Tube: daily fares are capped automatically. Most big museums are free, so spend your activities budget on one West End show.',
  tyo: 'Konbini breakfasts and lunch sets keep food costs low, so your budget stretches further than you think. Carry some cash: smaller restaurants and shrines may not take cards.',
  bcn: 'Eat your main meal at lunch: the menú del día is far cheaper than dinner. Book Sagrada Família online in advance to skip the queue.',
}

export function useBudgetTip(destination: Destination, budget: TripBudget): Tip {
  const [tip, setTip] = useState<Tip>(null)

  // `budget` must be memoized by the caller, otherwise this refetches on every render.
  useEffect(() => {
    let cancelled = false
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 7000)
    const body: BudgetTipRequest = {
      city: destination.city,
      country: destination.country,
      currency: destination.currency,
      days: budget.days,
      daily: budget.daily,
      basis: budget.basis,
      breakdown: budget.breakdown,
    }
    setTip(null)
    fetch('/api/budget-tip', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((data: { tip: string }) => !cancelled && setTip({ text: data.tip, source: 'ai' }))
      .catch(() => !cancelled && setTip({ text: fallbackTips[destination.id], source: 'fallback' }))
      .finally(() => clearTimeout(timer))

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [destination, budget])

  return tip
}
