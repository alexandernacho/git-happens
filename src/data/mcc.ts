// ISO 18245 merchant category codes that signal travel.
// Airline-specific (3000–3350) and hotel-specific (3501–3999) ranges plus the generic codes.

export type TravelKind = 'flight' | 'lodging' | 'travel-agency' | 'car-rental'

export function travelKind(mcc: number | undefined): TravelKind | null {
  if (mcc === undefined) return null
  if (mcc === 4511 || (mcc >= 3000 && mcc <= 3350)) return 'flight'
  if (mcc === 7011 || (mcc >= 3501 && mcc <= 3999)) return 'lodging'
  if (mcc === 4722) return 'travel-agency'
  if (mcc === 7512 || (mcc >= 3351 && mcc <= 3500)) return 'car-rental'
  return null
}

export const mccLabels: Record<number, string> = {
  4511: 'Airlines',
  7011: 'Hotels & lodging',
  4722: 'Travel agencies',
  7512: 'Car rental',
  5411: 'Groceries',
  5812: 'Restaurants',
  5814: 'Fast food',
  4112: 'Rail',
  4111: 'Local transport',
  5815: 'Digital media',
  4814: 'Telecom',
  7997: 'Sports clubs',
  7832: 'Cinema',
  5942: 'Books',
  5691: 'Clothing',
  5912: 'Pharmacy',
  7991: 'Tourist attractions',
}
