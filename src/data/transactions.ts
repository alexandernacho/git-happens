export type Transaction = {
  id: string
  date: string // ISO date, yyyy-mm-dd
  description: string // as printed on the statement
  amount: number // EUR, negative = money out
  mcc?: number // ISO 18245 merchant category code, card payments only
  country?: string // ISO 3166 alpha-2 of the merchant, card payments only
}

// Synthetic persona: Sofie, 29, lives in Leuven. Six months of history, generated with a
// fixed seed so every run of the demo looks the same. Dates are relative to today.
//   - normal Belgian life: salary, rent, groceries, NMBS, restaurants, subscriptions
//   - a past weekend in Barcelona (~4 months ago), including card spend abroad
//   - two days ago: a flight BRU→JFK and a New York hotel → the trip we detect

const HISTORY_DAYS = 180

function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function isoDaysAgo(today: Date, n: number): string {
  const d = new Date(today)
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

export function generatePersona(today = new Date(), seed = 42): Transaction[] {
  const rand = mulberry32(seed)
  const pick = <T,>(xs: T[]) => xs[Math.floor(rand() * xs.length)]
  const between = (min: number, max: number) => Math.round((min + rand() * (max - min)) * 100) / 100
  const out: Transaction[] = []
  const add = (daysAgo: number, description: string, amount: number, mcc?: number, country = mcc ? 'BE' : undefined) =>
    out.push({ id: `t${out.length}`, date: isoDaysAgo(today, daysAgo), description, amount, mcc, country })

  const groceries = ['DELHAIZE LEUVEN', 'COLRUYT HEVERLEE', 'ALDI KESSEL-LO', 'CARREFOUR MARKET LEUVEN']
  const restaurants = ['DE WERF LEUVEN', 'LOUVAIN BURGER CO', 'TRATTORIA OUDE MARKT', 'PHO LEUVEN', 'BRASSERIE LADEUZE']
  const lunch = ['PANOS LEUVEN', 'EXKI LEUVEN STATION', 'STARBUCKS LEUVEN']

  // The Barcelona weekend: days 118–121 ago.
  const barcelona = new Set([118, 119, 120, 121])

  for (let day = HISTORY_DAYS; day >= 1; day--) {
    const date = new Date(today)
    date.setDate(date.getDate() - day)
    const dom = date.getDate()
    const dow = date.getDay() // 0 = Sunday

    if (dom === 25) add(day, 'SALARIS ACME NV', 2840)
    if (dom === 1) add(day, 'HUUR APPARTEMENT J. PEETERS', -950)
    if (dom === 5) add(day, 'SPOTIFY', -11.99, 5815, 'SE')
    if (dom === 8) add(day, 'PROXIMUS', -45.5, 4814)
    if (dom === 12) add(day, 'BASIC-FIT', -29.99, 7997, 'NL')

    if (barcelona.has(day)) {
      add(day, pick(['RESTAURANTE LA PEPITA BCN', 'BAR CAÑETE BARCELONA', 'TAPAS 24 BARCELONA']), -between(28, 64), 5812, 'ES')
      add(day, pick(['TMB METRO BARCELONA', 'CABIFY BARCELONA']), -between(5, 18), 4111, 'ES')
      if (day === 120) add(day, 'SAGRADA FAMILIA TICKETS', -33, 7991, 'ES')
      if (day === 119) add(day, 'MERCAT BOQUERIA', -between(18, 30), 5411, 'ES')
      continue
    }

    if (dow === 2 || dow === 6) add(day, pick(groceries), -between(24, 88), 5411)
    if (dow >= 1 && dow <= 5) {
      if (rand() < 0.55) add(day, 'NMBS/SNCB LEUVEN', -between(4.2, 12.4), 4112)
      if (rand() < 0.3) add(day, pick(lunch), -between(6, 14), 5814)
    }
    if ((dow === 5 || dow === 6) && rand() < 0.6) add(day, pick(restaurants), -between(22, 58), 5812)
    if (rand() < 0.05) add(day, 'KINEPOLIS LEUVEN', -between(12, 26), 7832)
    if (rand() < 0.04) add(day, pick(['ZARA LEUVEN', 'COS LEUVEN']), -between(35, 90), 5691)
    if (rand() < 0.03) add(day, 'STANDAARD BOEKHANDEL', -between(12, 30), 5942)
  }

  // Barcelona bookings, made ~6 weeks before that trip.
  add(165, 'RYANAIR CRL-BCN', -148.3, 4511, 'IE')
  add(164, 'AIRBNB * BARCELONA', -312, 7011, 'IE')

  // The trip we detect: booked two days ago.
  add(2, 'BRUSSELS AIRLINES BRU-JFK', -742, 4511)
  add(2, 'BOOKING.COM*HOTEL NEW YORK', -968, 4722, 'NL')

  return out.sort((a, b) => b.date.localeCompare(a.date) || Number(b.id.slice(1)) - Number(a.id.slice(1)))
}

export const transactions = generatePersona()

export const balance = 3412.56
