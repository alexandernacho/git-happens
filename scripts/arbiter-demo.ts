// Replays Lotte's stage script through the Jev router adapter and the arbiter: `npm run arbiter`.
// With TYPESAFE_API_KEY (env or .env.local) each transaction is routed by Jev live; without it the
// script uses canned Jev answers. Prints every arbiter decision.
import { loadEnv } from 'vite'
import { createClient, routeTransaction } from '../server/scenarioRouter.ts'
import { Arbiter } from '../src/arbiter/arbiter.ts'
import { situations } from '../src/arbiter/catalogue.ts'
import { lotte, lotteScript, run, type Step } from '../src/arbiter/demo.ts'

const env = { ...process.env, ...loadEnv('development', process.cwd(), 'TYPESAFE_') }
const client = createClient(env)

const steps: Step[] = []
for (const step of lotteScript) {
  if (step.type !== 'tx' || !client) {
    steps.push(step)
    continue
  }
  try {
    steps.push({ ...step, route: await routeTransaction(client, step.tx) })
  } catch (err) {
    console.warn(`Jev failed for ${step.tx.id}, using the canned answer:`, err instanceof Error ? err.message : err)
    steps.push(step)
  }
}
console.log(client ? 'Routing with Jev (live)\n' : 'No TYPESAFE_API_KEY: using canned Jev answers\n')

const label = (step: Step): string => {
  if (step.type === 'tick') return `${step.at}  ⏱  tick`
  if (step.type === 'feedback') return `${step.fb.at}  💬 ${step.fb.actionId}: customer says "${step.fb.answer}"`
  const top = step.route.shortlist.map((c) => `${c.id} ${c.probability.toFixed(2)}`).join(', ')
  return `${step.tx.date}T${step.time}  💳 ${step.tx.description} €${-step.tx.amount}  →  Jev: ${step.route.pick ?? 'none'} [${top}]`
}

const ICON = { send: '📨', hold: '⏸ ', merge: '🔗', drop: '🗑 ' }

const arbiter = new Arbiter()
for (const event of run(steps, lotte, situations, arbiter)) {
  console.log(label(event.step))
  for (const why of event.skipped) console.log(`      ·  skipped: ${why}`)
  for (const d of event.decisions) {
    const action = d.action ? ` [${d.action}]` : ''
    console.log(`      ${ICON[d.decision]} ${d.decision.toUpperCase()}${action} ${d.scenario}/${d.actionId} (${d.confidence}): ${d.detail}`)
  }
}
console.log('\nstats', arbiter.stats())
