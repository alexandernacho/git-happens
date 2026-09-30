import type { IncomingMessage, ServerResponse } from 'node:http'
import { choice, noul, TypeSafeClient } from '@typesafe-ai/sdk'
import type { Plugin } from 'vite'
import { mccLabels } from '../src/data/mcc.ts'
import { jevCriteria, NO_SCENARIO } from '../src/data/scenarios.ts'
import type { Transaction } from '../src/data/transactions.ts'

// POST /api/route-transaction { transaction } → RouteResult. One Jev request per transaction:
//   - `scenario`: a Choice over every Jev-decided scenario plus "none". Its probabilities rank them,
//     and "none" (routine spending) decides whether anything fires.
//   - `lifeEvent`: a Noul. Is this a new need or life event, or an opportunity on a routine bill?
//     It sets how loud the nudge is: a push for life events, a feed card for opportunities.
// Both questions go in one request, so they cost one round trip. Code decides what to do with them.
//
// The thresholds are starting points, not tuned values. Tune them on labelled transactions.
const PUSH_THRESHOLD = 0.3
const MIN_PROBABILITY = 0.3
const SHORTLIST = 3

type Env = { TYPESAFE_API_KEY?: string; TYPESAFE_MODEL?: string }

export type Candidate = { id: string; probability: number }

export type RouteResult = {
  pick: string | null // scenario id to act on, or null when nothing should fire
  channel: 'push' | 'feed' | null // push for life events, in-app feed card for opportunities
  shortlist: Candidate[] // top scenarios, "none" excluded, for a second (verify) request later
  none: number // probability Jev gave to "routine spending"
  lifeEvent: number // probability the payment signals a new need or life event
  model: string
  ms: number
}

const CRITERIA = jevCriteria()

export function createClient(env: Env): TypeSafeClient | null {
  return env.TYPESAFE_API_KEY
    ? new TypeSafeClient({ apiKey: env.TYPESAFE_API_KEY, defaultModel: env.TYPESAFE_MODEL, timeout: 6000, retry: { maxRetries: 1 } })
    : null
}

export async function routeTransaction(client: TypeSafeClient, t: Transaction): Promise<RouteResult> {
  const started = performance.now()
  const response = await client.systemOne({
    state: {
      transaction: {
        description: t.description, // as printed on the statement
        amountEur: Math.abs(t.amount),
        direction: t.amount < 0 ? 'money out' : 'money in',
        merchantCategory: t.mcc !== undefined ? (mccLabels[t.mcc] ?? `MCC ${t.mcc}`) : null,
        merchantCountry: t.country ?? null,
      },
    },
    questions: {
      scenario: choice(
        'A Belgian bank customer just made the payment in `transaction`. Which situation does it signal, if any?',
        CRITERIA,
      ),
      lifeEvent: noul(
        'Does `transaction` signal a new need or life event the bank could help with now, rather than routine everyday spending?',
      ),
    },
  })

  const { scenario, lifeEvent } = response.answers
  const shortlist = Object.entries(scenario.probabilities)
    .filter(([id]) => id !== NO_SCENARIO.id)
    .map(([id, probability]) => ({ id, probability }))
    .sort((a, b) => b.probability - a.probability)
    .slice(0, SHORTLIST)

  const top = shortlist[0]
  const fires = scenario.choice !== NO_SCENARIO.id && top.probability >= MIN_PROBABILITY

  return {
    pick: fires ? top.id : null,
    channel: fires ? (lifeEvent.noul >= PUSH_THRESHOLD ? 'push' : 'feed') : null,
    shortlist,
    none: scenario.probabilities[NO_SCENARIO.id] ?? 0,
    lifeEvent: lifeEvent.noul,
    model: response.model,
    ms: Math.round(performance.now() - started),
  }
}

// Runs inside the Vite dev/preview server, like /api/budget-tip, so the key never reaches the
// browser. Without a key, or on any failure, it returns 503 and the app carries on without it.
export function scenarioRouterPlugin(env: Env): Plugin {
  const client = createClient(env)

  const handler = async (req: IncomingMessage, res: ServerResponse) => {
    const reply = (status: number, body: object) => {
      res.statusCode = status
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify(body))
    }
    if (req.method !== 'POST') return reply(405, { error: 'POST only' })
    if (!client) return reply(503, { error: 'TYPESAFE_API_KEY not set' })

    try {
      const { transaction } = JSON.parse(await readBody(req)) as { transaction: Transaction }
      reply(200, await routeTransaction(client, transaction))
    } catch (err) {
      console.warn('[route-transaction]', err instanceof Error ? err.message : err)
      reply(503, { error: 'Jev unavailable' })
    }
  }

  return {
    name: 'scenario-router-api',
    configureServer(server) {
      server.middlewares.use('/api/route-transaction', handler)
    },
    configurePreviewServer(server) {
      server.middlewares.use('/api/route-transaction', handler)
    },
  }
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = ''
    req.on('data', (chunk) => (data += chunk))
    req.on('end', () => resolve(data))
    req.on('error', reject)
  })
}
