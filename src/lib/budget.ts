import type { Destination } from '../data/destinations'
import type { Transaction } from '../data/transactions'
import type { PastTrip } from './detectTrip'

export type TripBudget = {
  daily: number
  days: number
  spending: number // daily × days
  prepaid: number // flights + hotel already paid
  total: number
  breakdown: { label: string; amount: number }[] // per day
  basis: string // one line explaining where the number comes from
}

const roundTo5 = (n: number) => Math.round(n / 5) * 5

// Daily budget from the customer's own behaviour: what they spent per day on their last trip,
// scaled by how expensive the new destination is. Without a past trip, fall back to how much
// they spend on food and going out at home.
export function planBudget(
  destination: Destination,
  days: number,
  prepaid: number,
  pastTrip: PastTrip | null,
  history: Transaction[],
): TripBudget {
  let daily: number
  let basis: string
  if (pastTrip) {
    daily = roundTo5((pastTrip.dailySpend * destination.costIndex) / pastTrip.destination.costIndex)
    const pct = Math.round((destination.costIndex / pastTrip.destination.costIndex - 1) * 100)
    basis =
      `In ${pastTrip.destination.city} you spent about €${Math.round(pastTrip.dailySpend)} a day. ` +
      (pct === 0 ? `${destination.city} costs about the same.` : `${destination.city} is about ${Math.abs(pct)}% ${pct > 0 ? 'more' : 'less'} expensive.`)
  } else {
    const leisure = history.filter((t) => [5812, 5814, 7832, 7991].includes(t.mcc ?? 0) && t.amount < 0)
    const perDay = -leisure.reduce((s, t) => s + t.amount, 0) / 180
    daily = roundTo5(Math.max(60, perDay * 6 * destination.costIndex))
    basis = `Based on how much you spend on food and going out at home.`
  }

  const spending = daily * days
  return {
    daily,
    days,
    spending,
    prepaid,
    total: spending + prepaid,
    breakdown: [
      { label: 'Food & drinks', amount: roundTo5(daily * 0.5) },
      { label: 'Activities', amount: roundTo5(daily * 0.3) },
      { label: 'Local transport', amount: daily - roundTo5(daily * 0.5) - roundTo5(daily * 0.3) },
    ],
    basis,
  }
}
