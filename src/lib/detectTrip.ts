import { destinations, type Destination } from '../data/destinations'
import { travelKind, type TravelKind } from '../data/mcc'
import type { Transaction } from '../data/transactions'
import { daysBetween } from './format'

const LOOKBACK_DAYS = 45 // bookings older than this are trips already taken (or long past)
const HOME_AIRPORTS = ['BRU', 'CRL', 'ANR', 'LGG', 'OST']
const WEIGHTS: Record<TravelKind, number> = { flight: 0.55, lodging: 0.35, 'travel-agency': 0.35, 'car-rental': 0.1 }

export type Evidence = { transaction: Transaction; kind: TravelKind; reason: string }

export type PastTrip = { destination: Destination; days: number; spendAbroad: number; dailySpend: number }

export type TripDetection = {
  detected: boolean
  destination: Destination | null
  confidence: number // 0..1
  evidence: Evidence[]
  bookedTotal: number // EUR already paid for flights/lodging
  pastTrip: PastTrip | null
  scanned: number
  durationMs: number
}

// Where does this booking go? Route in the descriptor ("BRU-JFK") first, then a city name.
export function resolveDestination(description: string): Destination | null {
  const route = description.match(/\b([A-Z]{3})-([A-Z]{3})\b/)
  if (route) {
    const arrival = HOME_AIRPORTS.includes(route[2]) ? route[1] : route[2]
    const byAirport = destinations.find((d) => d.airports.includes(arrival))
    if (byAirport) return byAirport
  }
  const upper = description.toUpperCase()
  return destinations.find((d) => upper.includes(d.city.toUpperCase())) ?? null
}

export function detectTrip(transactions: Transaction[], today = new Date()): TripDetection {
  const started = performance.now()
  const todayIso = today.toISOString().slice(0, 10)

  const travel = transactions
    .map((t) => ({ t, kind: travelKind(t.mcc) }))
    .filter((x): x is { t: Transaction; kind: TravelKind } => x.kind !== null && x.t.amount < 0)

  const recent = travel.filter((x) => daysBetween(x.t.date, todayIso) <= LOOKBACK_DAYS)

  // Group recent bookings by destination and take the strongest group.
  const groups = new Map<string, { destination: Destination; evidence: Evidence[] }>()
  for (const { t, kind } of recent) {
    const destination = resolveDestination(t.description)
    if (!destination) continue
    const group = groups.get(destination.id) ?? { destination, evidence: [] }
    const days = daysBetween(t.date, todayIso)
    group.evidence.push({
      transaction: t,
      kind,
      reason: `${kind === 'flight' ? 'Flight' : kind === 'car-rental' ? 'Car rental' : 'Accommodation'} to ${destination.city}, booked ${days === 0 ? 'today' : `${days} day${days === 1 ? '' : 's'} ago`} (MCC ${t.mcc})`,
    })
    groups.set(destination.id, group)
  }

  let best: { destination: Destination; evidence: Evidence[]; confidence: number } | null = null
  for (const g of groups.values()) {
    const kinds = new Set(g.evidence.map((e) => (e.kind === 'travel-agency' ? 'lodging' : e.kind)))
    const score = [...kinds].reduce((sum, k) => sum + WEIGHTS[k as TravelKind], 0) + (kinds.size > 1 ? 0.07 : 0)
    const confidence = Math.min(0.97, score)
    if (!best || confidence > best.confidence) best = { ...g, confidence }
  }

  const result: TripDetection = {
    detected: !!best && best.confidence >= 0.5,
    destination: best?.destination ?? null,
    confidence: best?.confidence ?? 0,
    evidence: best?.evidence ?? [],
    bookedTotal: best ? -best.evidence.reduce((s, e) => s + e.transaction.amount, 0) : 0,
    pastTrip: findPastTrip(transactions, travel.filter((x) => !recent.includes(x)).map((x) => x.t)),
    scanned: transactions.length,
    durationMs: 0,
  }
  result.durationMs = performance.now() - started
  return result
}

// A trip that already happened: an older booking, followed by card spend in that country.
function findPastTrip(all: Transaction[], olderBookings: Transaction[]): PastTrip | null {
  for (const booking of olderBookings) {
    const destination = resolveDestination(booking.description)
    if (!destination) continue
    const abroad = all.filter(
      (t) => t.country === destination.countryCode && t.date > booking.date && travelKind(t.mcc) === null,
    )
    if (abroad.length === 0) continue
    const dates = abroad.map((t) => t.date).sort()
    const days = daysBetween(dates[0], dates[dates.length - 1]) + 1
    const spendAbroad = -abroad.reduce((s, t) => s + t.amount, 0)
    return { destination, days, spendAbroad, dailySpend: spendAbroad / days }
  }
  return null
}
