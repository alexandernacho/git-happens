export type Transaction = {
  id: string
  date: string // ISO date, yyyy-mm-dd
  description: string // as printed on the statement
  amount: number // EUR, negative = money out
  mcc?: number // ISO 18245 merchant category code, card payments only
}

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

// Placeholder history for the home screen. Replaced by the generated persona data.
export const transactions: Transaction[] = [
  { id: 't1', date: daysAgo(1), description: 'DELHAIZE LEUVEN', amount: -47.82, mcc: 5411 },
  { id: 't2', date: daysAgo(2), description: 'BOOKING.COM*HOTEL NEW YORK', amount: -968.0, mcc: 7011 },
  { id: 't3', date: daysAgo(2), description: 'BRUSSELS AIRLINES BRU-JFK', amount: -742.0, mcc: 3136 },
  { id: 't4', date: daysAgo(4), description: 'NMBS/SNCB LEUVEN', amount: -12.4, mcc: 4112 },
  { id: 't5', date: daysAgo(5), description: 'SPOTIFY', amount: -11.99, mcc: 5815 },
  { id: 't6', date: daysAgo(7), description: 'SALARIS ACME NV', amount: 2840.0 },
]

export const balance = 3412.56
