# git-happens

Team **git-happens** — our entry for the Tectonic hackathon.

## Team
- Alexander Coenegrachts
- Jiří Winter
- Wolfgang Riegler
- Nicolas Dedrie

## Getting started
KBC Travel Assistant demo: the KBC app spots a booked trip in your card payments and walks you
through travel insurance → destination → budget → foreign currency → eSIM.
React + TypeScript + Tailwind on Vite 6 (runs on Node 20+).

```bash
npm install
cp .env.example .env.local   # optional: add OPENAI_API_KEY for the live AI budget tip
npm run dev                  # http://localhost:5173 — use a wide window for the presenter panel
npm run check                # sanity check of the trip detection rules
npm run build                # must pass before merging to main
```

Without an OpenAI key the budget screen shows a canned tip, so the demo never breaks.

- Pitch script and jury Q&A: [`docs/pitch.md`](docs/pitch.md)
- Decisions: [`docs/decisions.md`](docs/decisions.md)
- Persona data: `src/data/transactions.ts` · detection rules: `src/lib/detectTrip.ts` · AI endpoint: `server/budgetTip.ts`
