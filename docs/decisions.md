# Decisions

Logged by `/grill`. Newest at the bottom. Read before asking a question that may already be settled.

## Proactive Kate: transaction pipeline — 2026-09-30

The demo is the **processing pipeline**, not a single offer:
**transaction → classify into a known scenario → scenario proposes an action → arbiter queues, holds or releases it → action (Kate message).**
Full design: `docs/demo-plan.md`.

### Pipeline
- **D1 Scenarios:** Kate knows a fixed set of scenarios. Each one is a config entry with a description (used for classification), eligibility rules, a product, a default action, and a hold rule. Every transaction tries to fall into exactly one scenario, or into `none`. Adding a scenario means adding an entry; the pipeline doesn't change. _Rejected:_ free-form AI deciding what to offer (can't explain, can't control).
- **D2 Classification:** One Jev **Choice** request per transaction. The options are every scenario's description plus `none`, and the context is the transaction plus a short customer summary. The result is the scenario Jev picked and a probability for each option. If Jev is down or we have no key, a merchant/keyword list per scenario is used instead. _Rejected:_ merchant lists only (a new scenario needs hand-typed merchants); Claude (slow, costly per transaction).
- **D3 Proposal:** If the transaction matches a scenario and the customer passes that scenario's eligibility rules (e.g. doesn't already have the product), the scenario creates a *proposal*: customer, scenario, confidence, suggested action, the earliest time it may be sent, and when it expires. A scenario never contacts the customer itself. _Rejected:_ scenarios sending messages directly (spam as scenarios grow).
- **D4 Arbiter with a queue:** Proposals go into a per-customer queue. On every tick of the simulated clock, the arbiter takes one of these decisions for each proposal:
  - **send**: release it as an action.
  - **hold**: keep it, with a reason:
    - *not yet*: its earliest send time hasn't arrived, e.g. "10 days before the trip".
    - *need more evidence*: medium confidence, so it waits for a second matching transaction.
    - *contact limit*: the customer already got a message this week.
    - *quiet hours*: it's night.
  - **merge**: another proposal for the same scenario is already queued, so the two are combined and the confidence goes up.
  - **drop**: it expired, the customer declined this scenario earlier, or its confidence is too low.

  When several proposals are ready at once, the one with the highest confidence goes first and the rest wait. _Rejected:_ no queue, deciding at once (no timing, no evidence building up).
- **D5 Actions:** The arbiter's output is one of three actions:
  - **Kate message**, for high confidence.
  - **Light question**, for medium confidence once it's allowed out: e.g. "Planning a trip?"
  - **Log only**, for low confidence.

  Claude writes the message text for the released action, with a fixed text as fallback. "Why am I seeing this?" is built from the scenario, its probability and the transactions that triggered it, not from Claude.
- **D6 Feedback:** The customer's answer goes back to the arbiter. "Not now" or "No" drops every queued proposal for that scenario and blocks it for 30 days. "Yes" closes the proposal as converted.

### Demo
- **D7 Data:** Synthetic. One main customer ("Lotte, Ghent") whose transactions the audience follows. A background stream of a few hundred generated customers runs through the same pipeline and feeds a counter at each stage (e.g. 1,000 transactions → 60 proposals → 12 sent). BankMCP appears only on the architecture slide, as the way real bank data would plug in. _(assumed)_
- **D8 Screen:** A pipeline view with five columns: *Incoming* → *Classified* → *Proposals* → *Arbiter queue* (held with reason / sent / dropped) → *Kate* (phone). Controls: "Next tick" and "Run 1,000". _(assumed)_
- **D9 Server:** One small Node server holds the Jev and Claude keys and runs the pipeline and the arbiter. The browser only renders. _(assumed)_

### Dropped from earlier drafts (same day)
- Live-adding a scenario file during the pitch: not the focus now. Can come back as `nice`.
- A separate "Kate's agenda" panel: covered by the arbiter holding a proposal as *not yet*.
- A Noul question per scenario: replaced by one Choice question, because a transaction should fall into one scenario.
- Hand-scored signal weights (airline +0.5…): replaced by Jev probabilities plus eligibility rules.

## Arbiter queue — 2026-09-30

- **D10 Ownership:** A colleague delivers classified transactions: `{ transaction, scenario, probabilities }`. The arbiter work owns `scenarios.json`, the eligibility checks, creating proposals, and the arbiter queue. A second colleague owns the actions: turning a released decision into a Kate message or question, and sending the customer's answer back as feedback. _Rejected:_ the arbiter receiving ready-made proposals.
- **D11 Form:** A standalone TypeScript module in `arbiter/` with vitest tests and a small CLI that replays Lotte's script and prints every decision. It has no server or UI dependency. _Rejected:_ building it inside a shared server now (would clash with the colleagues' setup).
- **D12 Medium confidence:** A proposal with confidence 0.4–0.7 is held for up to 7 days waiting for more evidence. If no second matching transaction arrives, it goes out as a light question. A "Yes" answer raises the confidence to 0.9 and puts it back in the queue as an offer. _Rejected:_ dropping it after 7 days; asking right away.
- **D13 Contact limit:** Per customer, in a rolling 7 days: at most **1 offer** and at most **2 light questions**, counted separately. _Rejected:_ one contact of any kind per week; only offers counting.

## Scenario list from KBC's Kate capabilities — 2026-09-30

- **D14 Scope:** Only capabilities a transaction can trigger go into `arbiter/src/scenarios.json` (28 situations). Reactive capabilities, and proactive ones with non-transaction triggers (PIN, weather, voucher balance), are listed in `docs/kate-capabilities.md`. _Rejected:_ all ~150 items as scenarios (many can never be triggered by a payment, and they'd bloat the classifier's option list).
- **D15 Situations with actions:** The classifier picks a *situation* (e.g. `travel`). Each situation lists *actions* in KBC's wording, and each action the customer qualifies for becomes its own proposal. Merging, blocking and feedback work per situation + action. _Rejected:_ one scenario = one action (a flight could only trigger either the card check or the insurance offer).
- **D16 Services vs offers:** An action is an `offer` (sells something) or a `service` (helps). Services skip the weekly contact limit and don't wait for evidence (medium confidence → light question right away), but still wait out quiet hours. _Rejected:_ one shared limit (a duplicate payment could wait a week behind an insurance offer).
