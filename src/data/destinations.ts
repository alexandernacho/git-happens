export type Destination = {
  id: string
  city: string
  country: string
  countryCode: string // ISO 3166 alpha-2
  flag: string
  airports: string[] // IATA codes that map to this city
  currency: 'EUR' | 'USD' | 'GBP' | 'JPY'
  eurRate: number // 1 EUR in local currency (demo snapshot)
  inEU: boolean // EU roaming rules apply, no eSIM needed
  costIndex: number // daily cost of a holiday, relative to Barcelona = 1
  timezone: string
}

export const destinations: Destination[] = [
  { id: 'nyc', countryCode: 'US', city: 'New York', country: 'United States', flag: '🇺🇸', airports: ['JFK', 'EWR', 'LGA'], currency: 'USD', eurRate: 1.17, inEU: false, costIndex: 1.45, timezone: 'America/New_York' },
  { id: 'lon', countryCode: 'GB', city: 'London', country: 'United Kingdom', flag: '🇬🇧', airports: ['LHR', 'LGW', 'STN', 'LCY'], currency: 'GBP', eurRate: 0.86, inEU: false, costIndex: 1.3, timezone: 'Europe/London' },
  { id: 'tyo', countryCode: 'JP', city: 'Tokyo', country: 'Japan', flag: '🇯🇵', airports: ['NRT', 'HND'], currency: 'JPY', eurRate: 172, inEU: false, costIndex: 1.05, timezone: 'Asia/Tokyo' },
  { id: 'bcn', countryCode: 'ES', city: 'Barcelona', country: 'Spain', flag: '🇪🇸', airports: ['BCN'], currency: 'EUR', eurRate: 1, inEU: true, costIndex: 1, timezone: 'Europe/Madrid' },
]

export function destinationById(id: string): Destination {
  const d = destinations.find((x) => x.id === id)
  if (!d) throw new Error(`Unknown destination ${id}`)
  return d
}
