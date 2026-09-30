// Sanity check for the detection rules: `npm run check`.
import assert from 'node:assert/strict'
import { generatePersona } from '../src/data/transactions.ts'
import { planBudget } from '../src/lib/budget.ts'
import { detectTrip } from '../src/lib/detectTrip.ts'

const history = generatePersona()
const trip = detectTrip(history)
assert.equal(trip.detected, true)
assert.equal(trip.destination?.city, 'New York')
assert.equal(trip.destination?.currency, 'USD')
assert.equal(trip.evidence.length, 2)
assert.equal(trip.pastTrip?.destination.city, 'Barcelona')

const budget = planBudget(trip.destination!, 7, trip.bookedTotal, trip.pastTrip, history)
assert.ok(budget.daily > trip.pastTrip!.dailySpend, 'New York should cost more per day than Barcelona')

const withoutTravel = history.filter((t) => ![4511, 7011, 4722].includes(t.mcc ?? 0))
assert.equal(detectTrip(withoutTravel).detected, false)

console.log(`✓ ${trip.scanned} transactions scanned in ${trip.durationMs.toFixed(2)} ms`)
console.log(`✓ trip to ${trip.destination!.city} (confidence ${trip.confidence}), budget €${budget.daily}/day`)
