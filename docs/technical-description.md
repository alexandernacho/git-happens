# Technical description

## 1. Overview

KBC's challenge: *understand what each customer needs and respond at exactly the right moment.*
Our answer is a pipeline that reads every payment, recognises the situations Kate knows how to handle, and lets Kate reach out **first**. It does so only when it helps, at the right time, and rarely enough that it never feels like sales.

```
 payment ─► 1. detect ─► 2. situation ─► 3. proposals ─► 4. arbiter ─► 5. experience ─► customer
            rules + Jev    catalogue       per action       queue per       Kate in the       │
                                                            customer        KBC app           │
                                               ▲                                              │
                                               └──────────── 6. feedback ◄────────────────────┘
```

| Stage | Component | Where |
|---|---|---|
| Input | Transaction stream: the persona Sofie in the demo | `src/data/transactions.ts` |
| 1. Detect | Rule detectors (`detectTrip` and others) and the Jev router | `src/lib/`, `server/scenarioRouter.ts` |
| 2. Situation | Scenario catalogue, grouped by life event | `src/data/scenarios.ts`, `src/arbiter/catalogue.ts` |
| 3. Proposals | One proposal per action the customer qualifies for | `src/arbiter/proposals.ts` |
| 4. Arbiter | Decides per customer: send, hold, merge or drop | `src/arbiter/arbiter.ts` |
| 5. Experience | Kate's push or feed card; the Travel Assistant flow for trips | `src/screens/`, `src/App.tsx` |
| 6. Feedback | "Add" / "Not now" go back to the arbiter | `src/arbiter/arbiter.ts` |
| Presenter panel | Shows the pipeline live next to the phone | `src/components/PresenterPanel.tsx` |

## 2. Stack and commands

- **Frontend:** React 19, TypeScript 6, Tailwind 4, Vite 6 (runs on Node 20).
- **Server:** API endpoints are Vite plugins (`configureServer` / `configurePreviewServer`), so API keys stay on the presenter's laptop and never reach the browser.
- **AI, used only where language or meaning matters:**
  - **TypeSafe Jev** (`@typesafe-ai/sdk`) recognises what a payment is about.
  - **OpenAI** (`gpt-4.1-mini`) writes Kate's personal money tip.
- **Tests:** vitest for the pipeline. Assertion scripts for the rules and the router.

```bash
npm run dev            # app on http://localhost:5173 (wide window shows the presenter panel)
npm run build          # tsc -b + vite build
npm test               # pipeline tests, including the full stage script
npm run check          # rule detectors on the persona
npm run check:router   # 12 labelled payments through Jev
npm run arbiter        # replays the stage script in the terminal
```

Keys live in `.env.local` (template: `.env.example`): `TYPESAFE_API_KEY` and `OPENAI_API_KEY`. Every AI call has a fallback, so the demo runs identically without a network.

## 3. Input: transactions

All sources deliver one format: `{ id, date, description, amount, mcc, country }`.
- **In the demo:** `generatePersona()` produces 251 transactions for **Sofie, 29, Leuven**, seeded so every run is identical:
  - **Everyday life:** salary, rent, groceries, rail, restaurants and subscriptions.
  - **A past trip:** a Barcelona weekend 4 months ago, with card spend in Spain.
  - **The new trip:** a Brussels Airlines BRU–JFK flight and a New York hotel, paid 2 days ago.

  Dates are relative to today.
- **In production:** the same format comes from KBC's core banking events, or from other banks via PSD2 (e.g. BankMCP). Only this adapter changes.

The presenter panel plays the stream forward with **Next tick**. **Run 1,000** pushes a thousand generated customers through the same pipeline.

## 4. Stage 1 — Detection: rules first, Jev where meaning matters

Every scenario in the catalogue has a `decider`:

- **Rules** (12 scenarios, plus travel) handle what code can decide exactly and for free: amounts, repeats, balances and dates.
  - `detectTrip` recognises a booked trip from merchant category codes (MCC).
    1. It takes outgoing travel payments from the last 45 days: flights, lodging, travel agencies, car rental.
    2. It finds the destination from the route (`BRU-JFK`) or a city name.
    3. It scores each destination by booking type (flight 0.55, lodging 0.35, car 0.1, plus 0.07 for a combination).

    For Sofie: New York, 0.97, in about 0.5 ms.
  - Other rule detectors cover duplicate payments (same amount and counterparty within 3 days), low balance, card-limit use, new direct debits, repeated manual transfers, upcoming bills and unusual spending.
- **Jev** (21 scenarios) handles payments whose meaning matters, e.g. "VANDENBROUCKE DAKWERKEN" is a roofer and "AZ SINT-JAN" is a hospital.
  - `POST /api/route-transaction` sends **one** TypeSafe request per payment with two questions:
    - a **Choice** over the scenarios' trigger texts plus `none`;
    - a **Noul** (yes/no probability): does this signal a new need or life event?
  - It returns the picked scenario, the top 3 with probabilities, and a channel: `push` for life events, `feed` for everyday opportunities.
  - Routine spending (groceries, Spotify) lands on `none` and stops here.

Both deciders produce the same output, a `ClassifiedTransaction`: the situation, a probability per situation, and the channel.
- When Jev is unreachable, the catalogue's MCC hints stand in with a fixed confidence of 0.7.
- Rules and Jev can see the same payment. Their results then **merge** in the arbiter (stage 4), so two independent signals strengthen each other instead of competing.

## 5. Stage 2 — Situations: the catalogue

`src/data/scenarios.ts` lists the **33 KBC scenarios a payment can trigger**, using KBC's own wording for what Kate does. The ~120 reactive capabilities (find an ATM, contact KBC) stay out of it; see `docs/kate-capabilities.md`.

- **Situations:** scenarios that share a `lifeEvent` form one situation.
  - `travel` = check card abroad + travel insurance.
  - `moving` = update address + review home insurance.
  - `home-damage` = claim + storm damage.
- **Confidence:** the probabilities of a situation's scenarios add up. A flight that Jev splits 0.52 / 0.39 between travel insurance and the card check is a 0.91 travel situation, so both actions are proposed.
- **Settings per scenario** (`catalogue.ts`), added on top of the catalogue:
  - **offer** (sells something) or **service** (helps);
  - product rules, e.g. offers only to customers without the product, claims only to customers with it;
  - timing: `now`, `before_event` (e.g. 7 days before the flight) or `after` (e.g. 25 days after a voucher order);
  - expiry.

Adding a scenario means adding one catalogue entry. Detection, the arbiter and the experience don't change.

## 6. Stage 3 — Proposals

`createProposals()` turns a classified transaction into one proposal per action the customer qualifies for. A proposal is a *request* to contact the customer, never the contact itself. Each proposal holds:
- the action and product, confidence and channel;
- the earliest send time and an expiry;
- the transactions behind it, which feed "Why am I seeing this?".

For Sofie's New York trip:
- **Travel insurance** (offer, send now: cancellation cover must start at booking). Product rule: she has no travel insurance.
- **Check card abroad** (service, 7 days before departure).

## 7. Stage 4 — The arbiter

The arbiter keeps **one queue per customer**. On every tick it takes a decision for each proposal:

| Decision | When |
|---|---|
| **merge** | The same action is already queued. Confidence = `1 − (1 − a)(1 − b)`, e.g. 0.55 and 0.6 become 0.82. |
| **hold** | Before its send time · a medium-confidence offer waiting up to 7 days for more evidence · quiet hours (21:00–08:00) · contact limit reached · waiting for the customer's answer |
| **send** | As an **offer** (confidence ≥ 0.7), a **service**, or a light **question** (medium confidence) |
| **drop** | Expired · the customer said no in the last 30 days · already bought · confidence < 0.4 |

**Contact policy:**
- Per customer, at most **1 offer and 2 questions per rolling week**.
- Services (duplicate payment, card abroad, low balance) are never rate-limited.
- When several proposals are ready at once, the highest confidence goes first and the rest wait with reason *contact limit*.

The arbiter has no clock of its own. The presenter panel's ticks drive it in the demo; a scheduler drives it in production. It is plain TypeScript with no dependencies. Every decision carries a human-readable reason, which the presenter panel shows and "Why am I seeing this?" reuses.

## 8. Stage 5 — The experience

The arbiter's **send** decisions go to Kate in the KBC app:
- **Channel:** a `push` channel appears as a notification on the phone's home screen, and `feed` as a card in the app.
- **Wording:**
  - offers use the product and its reason;
  - services are phrased as help ("Your card isn't enabled for the US yet");
  - questions stay light ("Planning a trip?").

Sending the travel offer opens the **Travel Assistant**, the full journey for the travel situation:
1. **Trip detected**, with "Why am I seeing this?" listing the two card payments and their MCCs.
2. **Travel insurance**, single trip or annual.
3. **Destination and dates**, pre-filled from `BRU-JFK`.
4. **Budget:** €110 a day, from her own Barcelona spending (€75 a day) × New York's cost index (+45%). Kate adds a personal money tip from OpenAI, with a canned tip per city as fallback.
5. **Currency**, from her own budget, picked up at her branch.
6. **eSIM**, sized to the trip length.
7. **Trip ready**: one checklist.

Inside the EU the currency and eSIM steps disappear: personalisation also means not selling what she doesn't need.

## 9. Stage 6 — Feedback

Every answer returns to the arbiter:
- **Add** / **Yes** closes the proposal. That action isn't proposed again for a year.
- **Not now** / **No** blocks that action for 30 days and drops its queued proposals.
- **Yes to a light question** raises the confidence to 0.9 and requeues the proposal as an offer.

## 10. Presenter panel: the pipeline, live

Next to the phone, the panel shows what the engine does, stage by stage:
- **Incoming:** every payment as it arrives.
- **Classified:** decided by rules or by Jev, with probabilities.
- **Proposals:** the actions each situation produced.
- **Arbiter queue:** each proposal with its state: held (with reason), merged, sent or dropped.
- **Counters:** e.g. *1,000 transactions → 62 proposals → 14 sent, 31 held, 17 dropped*.
- **Speed:** detection time per customer, measured live and projected to all KBC customers.

It is also the presenter's remote control: **Next tick**, **Run 1,000**, jump to any screen, and **Restart**.

## 11. The stage run

1. **Routine payments** (groceries, rail, Spotify) → `none` → nothing happens. *"Most payments need nothing."*
2. **Flight and hotel to New York** → rules 0.97 + Jev → `travel` situation:
   - travel insurance is **sent now** as a push, and Sofie opens the Travel Assistant;
   - the card check is **held until 7 days before departure**.
3. **A vet payment** → Jev → `new-pet` → pet insurance **held: contact limit**. *"She already got one offer this week. Kate waits."*
4. **Tick forward to a week before departure** → the card check goes out anyway: *"It's a service, not a sale."*
5. **Run 1,000** → the counters show how little of the stream ever reaches a customer.

## 12. Scale

In production the same pipeline runs on KBC's event stream:
1. **Rules** run on every payment. They cost about 0.5 ms per customer, so all KBC customers take minutes on one machine.
2. **Jev** runs only on payments that rules and MCC filters can't settle. One request answers all scenarios, so cost grows with interesting payments, not with the catalogue.
3. **The arbiter** is keyed by customer ID. Queues are independent, so it scales horizontally with a small state store per customer.
4. **Channels** (Kate chat, push, feed, advisor) receive only what the arbiter releases.

Adding a product or life event is a catalogue entry. Adding a data source is an adapter to the shared transaction format.

## 13. Quality

- **Pipeline tests** (vitest) cover:
  - the full stage run;
  - merging, holds, the contact policy, services vs offers, quiet hours, expiry and feedback;
  - timing and product rules;
  - that every catalogue scenario appears exactly once;
  - the Jev adapter.
- **Scripts:**
  - `npm run check` asserts that the rule detectors find New York at 0.97 and nothing without travel payments;
  - `npm run check:router` sends 12 labelled payments through Jev and reports how many route as expected.
- **Resilience:** every external call (Jev, OpenAI) has a timeout and a fallback, so the demo never hangs on stage.
