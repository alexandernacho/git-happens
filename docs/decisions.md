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
