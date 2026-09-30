# Technical description

State of `main` at `5ab1bf5` (2026-09-30), after PRs #2, #4, #7, #9 and #12 (which also brought in the Jev router from #11).

## 1. What the repository contains

Three parts that together answer KBC's challenge: *understand what a customer needs from their transactions and respond at the right moment.*

| Part | What it does | Where | Status |
|---|---|---|---|
| **Travel Assistant app** | Phone-frame React demo: spots a booked trip in card payments, then walks the customer through insurance → destination → budget → currency → eSIM. | `src/App.tsx`, `src/screens/`, `src/lib/` | Working, used in `docs/pitch.md` |
| **Scenario catalogue + Jev router** | 33 KBC scenarios a transaction can trigger. A server endpoint asks Jev (TypeSafe) which scenario a payment fits. | `src/data/scenarios.ts`, `server/scenarioRouter.ts` | Working, needs `TYPESAFE_API_KEY` |
| **Arbiter** | Turns the router's answer into proposals and decides per customer whether to **send, hold, merge or drop**, following a contact policy. | `src/arbiter/` | Working and tested; not used by the UI yet |

**The UI does not use the Jev router or the arbiter yet** (see §8, gap 1). Today they form two separate pipelines.

## 2. Stack and commands

- **Frontend:** React 19, TypeScript 6, Tailwind 4, Vite 6 (kept at 6 so it runs on the team's Node 20).
- **Server:** no separate backend. API endpoints are Vite plugins (`configureServer` / `configurePreviewServer`), so API keys stay on the presenter's laptop. They only exist under `npm run dev` or `npm run preview`.
- **AI:**
  - **OpenAI** (`openai` SDK, default `gpt-4.1-mini`) writes the budget tip.
  - **TypeSafe Jev** (`@typesafe-ai/sdk`) routes each transaction to a scenario.
- **Tests:** vitest 3 for the arbiter. Plain `node:assert` scripts for the detection rules and the router.

```bash
npm run dev            # app on http://localhost:5173 (wide window shows the presenter panel)
npm run build          # tsc -b + vite build; must pass before merging
npm test               # vitest: 25 arbiter tests, including the full stage script
npm run check          # detection rules sanity check (no key needed)
npm run check:router   # 12 labelled payments through Jev (needs TYPESAFE_API_KEY)
npm run arbiter        # replays the arbiter stage script; live Jev if a key is set
```

Keys go in `.env.local`, which git ignores; the template is `.env.example`:
- `OPENAI_API_KEY`, `OPENAI_MODEL`
- `TYPESAFE_API_KEY`, `TYPESAFE_MODEL`

Every AI call has a fallback, so the demo runs without any key.

## 3. Repository map

```
server/
  budgetTip.ts          POST /api/budget-tip        → OpenAI, 2-sentence tip (503 → canned tip)
  scenarioRouter.ts     POST /api/route-transaction → Jev Choice + Noul (503 without key)
src/
  App.tsx               step state machine, wires screens + presenter panel
  flow.ts               steps, trip plan, customer choices; skips currency/eSIM inside the EU
  screens/              8 screens: Home, TripDetected, Insurance, Destination, Budget, Currency, Esim, TripReady
  components/           PhoneFrame, KbcHeader, FlowScreen, Button, PresenterPanel
  data/
    transactions.ts     synthetic persona "Sofie" (Leuven), 180 days, seeded, dates relative to today
    mcc.ts              ISO 18245 codes → travel kind + labels
    destinations.ts     NYC, London, Tokyo, Barcelona: currency, EU flag, cost index, airports
    scenarios.ts        the scenario catalogue (33 entries)
  lib/
    detectTrip.ts       rule-based trip detection + past-trip finder
    budget.ts           personal daily budget from past-trip spend × cost index
    useBudgetTip.ts     fetches /api/budget-tip, 7 s timeout, canned fallback per city
  arbiter/              catalogue bridge, router adapter, proposals, arbiter queue, policy, tests
scripts/                check-detection.ts, check-router.ts, arbiter-demo.ts
docs/                   decisions.md, pitch.md, demo-plan.md, kate-capabilities.md, this file
```

## 4. Travel Assistant app

**Data.** `generatePersona()` builds 251 transactions for "Sofie, 29, Leuven" with a fixed seed (`mulberry32(42)`):
- **Everyday life:** salary, rent, groceries, rail, restaurants and subscriptions.
- **A past trip:** a Barcelona weekend about 4 months ago, including card spend in Spain.
- **The trip to detect:** a Brussels Airlines BRU–JFK flight and a Booking.com New York hotel, both paid 2 days ago.

Dates are relative to today, so the demo never goes stale.

**Detection** (`detectTrip.ts`) uses rules only:
1. It keeps outgoing payments whose merchant category code (MCC) is a travel code (`mcc.ts`), from the last 45 days.
2. It finds the destination from the route in the description (`BRU-JFK`, ignoring Belgian airports) or from a city name.
3. It groups payments per destination. The score is the sum of the weights of the booking types present (flight 0.55, lodging or agency 0.35, car 0.1), plus 0.07 when there's more than one type, capped at 0.97. At 0.5 or more the trip counts as detected.
4. `findPastTrip` treats an older booking followed by card spend in that country as a past trip, and uses it for the budget.

Result on the persona: New York, confidence 0.97, 2 pieces of evidence, run in about 0.5 ms.

**Budget** (`budget.ts`): daily budget = what she spent per day on her last trip × the new destination's cost index ÷ the old one's, rounded to €5. It's split into food 50%, activities 30% and local transport. Without a past trip, it's estimated from leisure spending at home.

**AI tip:** the endpoint gets the city, the budget and how it was calculated. The instructions ask for 2 sentences, no markdown, and never recommending other banks. The browser aborts the call after 7 s and the server's call after 6 s; on failure a canned tip per city is shown.

**Flow** (`flow.ts`, `App.tsx`): a linear list of steps kept in React state, with no router or store. Inside the EU the currency and eSIM steps are skipped.

**Presenter panel** (`PresenterPanel.tsx`): shown on screens at least 1280 px wide.
- **Evidence and confidence:** the payments that triggered detection and the resulting confidence.
- **Speed:** the time per customer, measured live over 300 runs and multiplied by 2.3 million customers.
- **Remote control:** jump to any step, or restart the demo.

## 5. Scenario catalogue (`src/data/scenarios.ts`)

- **Scope:** 33 of the ~150 Kate capabilities that KBC lists publicly, keeping only those a payment can trigger. The rest are listed in `docs/kate-capabilities.md`.
- **Fields per entry:**
  - `id` and `category`.
  - `kbc`: KBC's own wording.
  - `trigger`: what the payment looks like when it signals the need.
  - `decider`: who decides whether it fires (see below).
  - `lifeEvent` (optional): e.g. `travel`, `moving`, `new-pet`.
  - `mcc` (optional): merchant category codes that make the scenario likely.
- **Who decides** (`decider`):
  - `'rules'`, 12 scenarios: amounts, repeats, balances and dates (duplicate payment, low balance, card limit…).
  - `'jev'`, 21 scenarios: where the meaning of the payment matters, e.g. "VANDENBROUCKE DAKWERKEN" is a roofer.
- **`jevCriteria()`** turns the Jev scenarios' `trigger` texts into the option list for Jev's Choice question, plus a `none` option for routine spending.

## 6. Jev router (`server/scenarioRouter.ts`)

`POST /api/route-transaction { transaction }` sends **one** TypeSafe request with two questions:
- `scenario`, a **Choice** over the 21 Jev scenarios plus `none`.
- `lifeEvent`, a **Noul** (yes/no probability): is this a new need or life event?

Jev sees the description, the amount, whether money goes in or out, the MCC label and the merchant country.

**Output (`RouteResult`):**
- `pick`: fires only when Jev didn't choose `none` and the top probability is at least 0.3.
- `channel`: `push` when the life-event probability is at least 0.3, otherwise `feed`.
- `shortlist`: the top 3 scenarios.
- `none`, `lifeEvent`, `model` and `ms`.

Timeout 6 s with 1 retry. Without a key, or on any error, it returns 503 and the caller carries on.

`check:router` sends 12 labelled payments through it (flights, a roofer, a vet, a hospital, energy, vouchers, groceries, Spotify…) and prints how many route as expected.

## 7. Arbiter (`src/arbiter/`)

Pipeline: **router answer → situation → proposals → per-customer queue → decision.** The arbiter is pure TypeScript with no dependencies: it runs in the browser or in Node, and holds its state in memory.

**Catalogue bridge** (`catalogue.ts`):
- **Situations:** catalogue scenarios that share a `lifeEvent` form one situation. For example, `travel` = `card-abroad-check` + `travel-insurance`, and `moving` = `update-address` + `home-insurance-review`. A scenario without a life event is its own situation.
- **Settings per scenario:**
  - `kind`: an `offer` (sells something) or a `service` (helps).
  - Product rules: e.g. offers only to customers who don't have the product yet, claims only to those who do.
  - `timing`: `now`, `before_event` (N days before e.g. the flight), or `after` (N days after the payment).
  - Expiry.

  Anything not listed defaults to: service, sent now, valid 30 days.

**Router adapter** (`fromRouter.ts`):
- `fromRoute()` adds up the shortlist probabilities within the chosen situation. For example, 0.52 travel-insurance + 0.39 card-abroad-check gives 0.91 travel. It also fills in the time of day and the customer, and passes on Jev's `channel`.
- `fromMcc()` is the fallback without Jev: the first Jev scenario whose MCC hints match, at confidence 0.7.
- `classify()` is a browser helper: it calls the router and falls back to MCC on 503 or a network error.

**Proposals** (`proposals.ts`): one per action the customer qualifies for. Each has an earliest send time (`notBefore`), an expiry, the transactions behind it (evidence) and the channel. For `before_event`, the event date comes from the classifier or from a date in the description such as `14NOV`.

**Arbiter** (`arbiter.ts`) is driven by the caller: `submit(proposal)`, `tick(now)`, `feedback(answer)`. It has no clock of its own.

| Decision | When |
|---|---|
| merge | the same situation + action is already queued; confidence = `1 − (1 − a)(1 − b)` |
| drop | expired · declined in the last 30 days (365 days after a "yes") · confidence < 0.4 |
| hold | before `notBefore` · medium-confidence offer waiting up to 7 days for more evidence · quiet hours 21:00–08:00 · contact limit reached · waiting for an answer to a question |
| send | `offer` (confidence ≥ 0.7), `service` (never rate-limited), or `question` (medium confidence: offers after 7 days without more evidence, services right away) |

- **Contact limit:** per customer, 1 offer and 2 questions per rolling 7 days. Services don't count toward it.
- **Order:** highest confidence first, then the one that expires soonest.
- **Holds:** each hold is reported once, not on every tick.
- **Answers:** "Yes" to a question raises the confidence to 0.9 and puts the proposal back in the queue.
- **Monitoring:** `queue()` and `stats()` provide the data for a pipeline view.

**Contract** (`types.ts`):
- In: `ClassifiedTransaction`, `Customer`.
- Out: `Decision { decision, action, reason, detail, confidence, proposal }`.
- Back: `Feedback { scenario, actionId, answer }`.

Times are local wall-clock strings (`2026-11-04T08:00`), parsed as UTC so that hours are compared correctly on any machine.

**Tests** (`arbiter.test.ts`, 25 tests):
- The full stage script from `docs/demo-plan.md`.
- Merging, questions, blocking, contact limits, service bypass, quiet hours and expiry.
- Timing, and which customers qualify for which actions.
- That every catalogue scenario appears exactly once, and the router adapter.

## 8. Gaps and risks

1. **The UI doesn't use the router or the arbiter yet.** The app runs on `detectTrip` alone. Nothing in the UI calls `/api/route-transaction` or `classify()`. The pipeline view described in `docs/demo-plan.md` (5 columns, "Next tick", "Run 1,000") doesn't exist yet. *Fix:* a pipeline screen next to the phone, fed by `classify()` → `createProposals()` → `Arbiter`.
2. **Two personas, two stories.** The app and `pitch.md` use Sofie (Leuven, New York, relative dates). The arbiter uses Lotte (Ghent, Barcelona and pet insurance, fixed November 2026 dates). *Fix:* run the arbiter on Sofie's `transactions` and choose one pitch.
3. **The 12 rule-decided scenarios are never detected.** Only travel has rule code (`detectTrip`). Duplicate payment, low balance, card limit and the others exist only in the catalogue.
4. **Travel is detected twice, in different ways.** `detectTrip` scores weighted MCC groups (0.97). The router asks Jev per payment, and the arbiter adds up the probabilities. They can disagree on stage. *Fix:* treat `detectTrip` as the rules decider for `travel` and feed its result into the arbiter like any other classification.
5. **Thresholds don't match.** The router fires at 0.3, the arbiter drops below 0.4, and `detectTrip` fires at 0.5. None are tuned; `check:router` gives the first real numbers.
6. **The MCC fallback decides.** `fromMcc()` acts on MCC hints at 0.7, which goes against the catalogue's rule that "MCC hints never decide". It's accepted as a stage safety net only.
7. **The APIs only exist in dev and preview.** The endpoints are Vite middleware, so a static deployment of `dist/` has no API. The canned fallbacks keep the UI working, and it's fine for a laptop demo.
8. **The arbiter only keeps state in memory.** Queues, contact history and blocks are lost on reload, and there's no customer store. Fine for the demo; production would need a store per customer.
9. **The docs disagree.** `README.md` doesn't mention the Jev router, the arbiter or `npm test`. `pitch.md` says 2.3 million customers and the challenge brief says 2.5 million. `docs/demo-plan.md` describes the arbiter demo and `pitch.md` describes the Travel Assistant.
10. **Two AI providers.** OpenAI writes the tip and TypeSafe classifies. Two keys, and two vendors to explain on the GDPR and data-residency question (both US-hosted).

## 9. How it would scale (pitch material, not built)

Payment events from KBC's core systems (or PSD2 via BankMCP) go through the same pipeline:
1. **Cheap filters:** rules and MCC codes.
2. **Jev**, only where the meaning of the payment matters.
3. **Situations and proposals.**
4. **An arbiter per customer**, keyed by customer ID.
5. **Channels:** Kate chat, push, the in-app feed, or an advisor.

Only step 5 talks to the customer, and the arbiter keeps that rare.

The presenter panel's measurement gives a lower bound for the rules step: about 0.5 ms per customer, so a few minutes for 2.3 million customers on one laptop. Jev's cost scales with the number of payments that pass the filters, not with all payments.
