// Routes labelled sample transactions through Jev: `npm run check:router`.
// Needs TYPESAFE_API_KEY in the environment or in .env.local. Prints one line per sample and
// the share of samples that fired the expected scenario (or correctly fired nothing).
import { loadEnv } from 'vite'
import type { Transaction } from '../src/data/transactions.ts'
import { createClient, routeTransaction } from '../server/scenarioRouter.ts'

type Sample = Omit<Transaction, 'id' | 'date'> & { expect: string[] } // [] = nothing should fire

const samples: Sample[] = [
  { description: 'RYANAIR FR8124 BRU-BCN', amount: -187.4, mcc: 4511, country: 'IE', expect: ['travel-insurance', 'card-abroad-check'] },
  { description: 'BOOKING.COM HOTEL LISBOA', amount: -412, mcc: 7011, country: 'NL', expect: ['travel-insurance', 'card-abroad-check'] },
  { description: 'MEDIAMARKT GENT', amount: -899, mcc: 5732, country: 'BE', expect: ['store-warranty'] },
  { description: 'VANDENBROUCKE DAKWERKEN BV', amount: -1450, expect: ['storm-damage', 'home-damage-claim'] },
  { description: 'CARGLASS BELGIUM', amount: -320, mcc: 7531, country: 'BE', expect: ['vehicle-claim'] },
  { description: 'DIERENARTSPRAKTIJK DE WOLF', amount: -95, mcc: 742, country: 'BE', expect: ['pet-insurance'] },
  { description: 'AZ SINT-JAN BRUGGE FACTUUR', amount: -1240, expect: ['hospitalisation-claim'] },
  { description: 'ENGIE ELECTRABEL VOORSCHOT', amount: -168, expect: ['cheaper-energy-supplier'] },
  { description: 'PLUXEE DIENSTENCHEQUES', amount: -270, expect: ['service-voucher-reminder'] },
  { description: 'HUURWAARBORG NIEUW APPARTEMENT GENT', amount: -2100, expect: ['update-address', 'home-insurance-review'] },
  { description: 'DELHAIZE LEUVEN', amount: -54.3, mcc: 5411, country: 'BE', expect: [] },
  { description: 'SPOTIFY', amount: -11.99, mcc: 5815, country: 'SE', expect: [] },
]

const env = { ...process.env, ...loadEnv('development', process.cwd(), 'TYPESAFE_') }
const client = createClient(env)
if (!client) {
  console.error('TYPESAFE_API_KEY not set: add it to .env.local or export it.')
  process.exit(1)
}

let correct = 0
for (const [i, s] of samples.entries()) {
  const r = await routeTransaction(client, { ...s, id: `s${i}`, date: '2026-09-30' })
  const ok = s.expect.length === 0 ? r.pick === null : s.expect.includes(r.pick ?? '')
  if (ok) correct++
  const top = r.shortlist.map((c) => `${c.id} ${c.probability.toFixed(2)}`).join(', ')
  console.log(`${ok ? '✓' : '✗'} ${s.description.padEnd(36)} → ${(r.pick ?? '—').padEnd(26)} ${(r.channel ?? '').padEnd(4)}  life event ${r.lifeEvent.toFixed(2)}  none ${r.none.toFixed(2)}  ${r.ms} ms  [${top}]`)
}
console.log(`\n${correct}/${samples.length} as expected`)
