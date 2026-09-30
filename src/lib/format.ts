const eur = new Intl.NumberFormat('nl-BE', { style: 'currency', currency: 'EUR' })
const eurRound = new Intl.NumberFormat('nl-BE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })

export function formatEur(amount: number, round = false): string {
  return (round ? eurRound : eur).format(amount)
}

export function formatMoney(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount)
}

export function formatDay(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

// Whole calendar days between two ISO dates (b - a), independent of the time of day.
export function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000)
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}
