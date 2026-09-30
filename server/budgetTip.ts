import type { IncomingMessage, ServerResponse } from 'node:http'
import OpenAI from 'openai'
import type { Plugin } from 'vite'

// POST /api/budget-tip → { tip }. Runs inside the Vite dev/preview server so the API key
// stays on the laptop and never reaches the browser bundle. Any failure returns 503 and the
// app shows its canned tip instead.

type Env = { OPENAI_API_KEY?: string; OPENAI_MODEL?: string }

export function budgetTipPlugin(env: Env): Plugin {
  const client = env.OPENAI_API_KEY ? new OpenAI({ apiKey: env.OPENAI_API_KEY, timeout: 6000, maxRetries: 0 }) : null
  const model = env.OPENAI_MODEL || 'gpt-4.1-mini'

  const handler = async (req: IncomingMessage, res: ServerResponse) => {
    const reply = (status: number, body: object) => {
      res.statusCode = status
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify(body))
    }
    if (req.method !== 'POST') return reply(405, { error: 'POST only' })
    if (!client) return reply(503, { error: 'OPENAI_API_KEY not set' })

    try {
      const trip = JSON.parse(await readBody(req))
      const response = await client.responses.create({
        model,
        instructions:
          'You are the travel assistant inside the KBC banking app (Belgium). Write one practical, friendly money tip ' +
          'for this customer\'s trip, in English, max 2 short sentences, no greeting, no markdown. Make it specific to the ' +
          'destination and to their daily budget. Never recommend other banks or financial products.',
        input: JSON.stringify(trip),
        max_output_tokens: 150,
      })
      const tip = response.output_text.trim()
      if (!tip) return reply(502, { error: 'empty answer' })
      reply(200, { tip })
    } catch (err) {
      console.warn('[budget-tip]', err instanceof Error ? err.message : err)
      reply(503, { error: 'AI unavailable' })
    }
  }

  return {
    name: 'budget-tip-api',
    configureServer(server) {
      server.middlewares.use('/api/budget-tip', handler)
    },
    configurePreviewServer(server) {
      server.middlewares.use('/api/budget-tip', handler)
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
