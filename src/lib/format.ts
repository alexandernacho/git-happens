const eur = new Intl.NumberFormat('nl-BE', { style: 'currency', currency: 'EUR' })

export function formatEur(amount: number): string {
  return eur.format(amount)
}

export function formatDay(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}
