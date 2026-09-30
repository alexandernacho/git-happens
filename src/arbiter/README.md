# Arbiter

Turns classified transactions into proposals, queues them per customer, and decides **send / hold / merge / drop**.
Design: `docs/decisions.md` (D4, D10–D13) and `docs/demo-plan.md`.

```bash
npm run arbiter   # replays Lotte's script; routes with Jev live if TYPESAFE_API_KEY is set
npm test
```

## Contract (`types.ts`)

**In, from the Jev router (PR #11):** `fromRoute(transaction, routeResult, customerId, time?)` turns `/api/route-transaction`'s answer into a `ClassifiedTransaction`. In the browser, `classify(transaction, customerId)` calls the router and falls back to the catalogue's MCC hints (`fromMcc`) when it answers 503.

**Scenarios:** `src/data/scenarios.ts` is the one catalogue. `catalogue.ts` groups its scenarios into *situations* by `lifeEvent` (travel = card-abroad-check + travel-insurance) and adds what the arbiter needs per scenario: `offer` or `service`, product rules and timing. Jev picks one scenario; the arbiter adds up the probabilities within its situation and proposes every action in it the customer qualifies for.

**Out, to actions:** `Decision` = `{ at, customerId, scenario, actionId, decision, action?, reason, detail, confidence, proposal }`.
Only `decision: 'send'` means contact the customer: `action` is `"offer"`, `"service"` or `"question"`. `proposal.label` and `proposal.product` say what to talk about; `proposal.channel` is Jev's push/feed suggestion. Everything else is for the pipeline UI.

**In, from actions:** `Feedback` = `{ customerId, scenario, actionId, answer: "yes" | "no" | "not_now", at }`.

## Usage

```ts
import { Arbiter, classify, createProposals, situations } from './arbiter'; // from src/

const arbiter = new Arbiter();
const classified = await classify(transaction, customer.id);  // Jev, or MCC fallback
const { proposals, skipped } = createProposals(classified, customer, situations);
proposals.forEach((p) => arbiter.submit(p));      // returns merge/drop decisions
arbiter.tick(now);                                // returns send/hold/drop decisions
arbiter.feedback({ customerId, scenario, actionId, answer: "not_now", at });
arbiter.queue(customerId);                        // current queue with hold reasons, for the UI
arbiter.stats();                                  // counters for "Run 1,000"
```

The arbiter has no clock. The caller drives time with `tick(now)`, so the same code serves the demo's "Next tick" button and the tests.

## Rules (`policy.ts`)

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
