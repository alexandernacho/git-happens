# Arbiter

Turns classified transactions into proposals, queues them per customer, and decides **send / hold / merge / drop**.
Design: `docs/decisions.md` (D4, D10–D13) and `docs/demo-plan.md`.

```bash
npm install
npm run demo    # replays Lotte's script and prints every decision
npm test
```

## Contract (`src/types.ts`)

**In, from classification:** `ClassifiedTransaction` = `{ transaction, scenario, probabilities, eventDate? }`.
The options to classify into are the situation `description` fields in `src/scenarios.json`, plus `none`.
A situation's `needs` field says what extra context the classifier must include: `history` (recent transactions), `balance`, or `event_date`.

**Scenarios:** each situation lists the actions Kate can take, using KBC's own wording (`docs/kate-capabilities.md`).
An action is an `offer` (sells something, rate-limited) or a `service` (helps, never rate-limited). One transaction creates one proposal per action the customer qualifies for.

**Out, to actions:** `Decision` = `{ at, customerId, scenario, actionId, decision, action?, reason, detail, confidence, proposal }`.
Only `decision: "send"` means contact the customer: `action` is `"offer"`, `"service"` or `"question"`. `proposal.label` and `proposal.product` say what to talk about. Everything else is for the pipeline UI.

**In, from actions:** `Feedback` = `{ customerId, scenario, actionId, answer: "yes" | "no" | "not_now", at }`.

## Usage

```ts
import { Arbiter, createProposals, scenarios } from "./src/index";

const arbiter = new Arbiter();
const { proposals, skipped } = createProposals(classified, customer, scenarios);
proposals.forEach((p) => arbiter.submit(p));      // returns merge/drop decisions
arbiter.tick(now);                                // returns send/hold/drop decisions
arbiter.feedback({ customerId, scenario, actionId, answer: "not_now", at });
arbiter.queue(customerId);                        // current queue with hold reasons, for the UI
arbiter.stats();                                  // counters for "Run 1,000"
```

The arbiter has no clock. The caller drives time with `tick(now)`, so the same code serves the demo's "Next tick" button and the tests.

## Rules (`src/policy.ts`)

| Rule | Value |
|---|---|
| Offer | confidence ≥ 0.7 |
| Drop | confidence < 0.4 |
| Service | confidence ≥ 0.7 → sent as service; 0.4–0.7 → light question right away |
| Medium-confidence offer (0.4–0.7) | wait up to 7 days for more evidence, then send a light question; "yes" → 0.9 → offer |
| Merge | same scenario + action already queued: `1 − (1 − a)(1 − b)` |
| Contact limit (offers only) | per rolling 7 days: 1 offer and 2 questions. Services are never limited |
| Quiet hours (everything) | 21:00–08:00 |
| "No" / "Not now" | that scenario + action blocked 30 days, its queued proposals dropped |
| "Yes" to an offer | that scenario + action blocked 365 days (converted) |
| Timing | `now`, `before_event` (N days before e.g. the flight), or `after` (N days after the payment) |
| Order | highest confidence first, then soonest expiry |
