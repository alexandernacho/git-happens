# Demo plan: Kate's transaction pipeline

Decisions: `docs/decisions.md` (Proactive Kate: transaction pipeline).

## The idea in one sentence
Kate today waits for questions. We show the engine that lets her act first: every transaction is sorted into a scenario Kate knows, the scenario proposes an action, and an arbiter decides **whether, when and how** Kate reaches out.

## Pipeline

```
 transaction ──► 1. classify ──► 2. scenario ──► 3. arbiter queue ──► 4. action ──► customer
                 (Jev Choice)    (eligible?)      hold / merge /       Kate message   │
                 or fallback     → proposal       send / drop          light question │
                                                       ▲               log only       │
                                                       └───────── 5. feedback ◄───────┘
```

### 1. Transaction (input)
One shared format, whatever the source (our synthetic file today, KBC core or BankMCP later):
```json
{ "id": "t-1042", "customerId": "lotte", "ts": "2026-10-03T14:12",
  "amount": -142.00, "counterparty": "RYANAIR DAC", "description": "FR 8412 BRU-BCN 14NOV",
  "channel": "card" }
```

### 2. Scenarios (what Kate knows)
`arbiter/src/scenarios.json`: 28 *situations* a transaction can fall into. Each lists the *actions* Kate can take, in KBC's own wording from `docs/kate-capabilities.md`.
An action is an **offer** (sells something, rate-limited) or a **service** (helps, never rate-limited).

| Situation | Actions | Used in the stage script |
|---|---|---|
| `travel` | check card enabled abroad (service, 7 days before) · travel insurance (offer, 10 days before) | yes |
| `seasonal_spend` | Christmas savings pot (offer, our idea) | yes |
| `none` | — | yes |
| 25 others | duplicate payment, low balance, warranty, energy supplier, pet insurance, … | no |

### 3. Classify
One Jev request per transaction. Its context is the transaction plus a short customer summary (products held, city). It asks one **Choice** question: "Which situation does this transaction show?" The options are the scenario descriptions above, including `none`.
Jev returns the scenario it picked and a probability for every scenario.
- `none` or probability < 0.4 → logged, stop.
- Otherwise → go to the scenario.

**Fallback:** if Jev fails or we have no key, each scenario uses its keyword list (`ryanair|vueling|booking.com` → `travel`).

### 4. Scenario → proposal
The scenario checks its eligibility rules (plain code, e.g. "has travel insurance?"). If the customer passes, it creates a proposal:
```json
{ "customerId": "lotte", "scenario": "travel", "confidence": 0.91,
  "action": "offer", "product": "KBC Travel Insurance",
  "notBefore": "2026-11-04", "expires": "2026-11-14", "evidence": ["t-1042"] }
```

### 5. Arbiter (the heart of the demo)
It keeps one queue per customer. On every tick it looks at each proposal and takes one decision:

| Decision | When | Shown in the queue as |
|---|---|---|
| **merge** | A proposal for the same scenario is already queued | "merged, confidence 0.55 → 0.82" |
| **drop** | Expired, declined in the last 30 days, or confidence < 0.4 | "dropped: customer said no" |
| **hold** | Before `notBefore` · confidence 0.4–0.7 waiting for more evidence · a message already sent this week · night | "held: waiting for the trip date" |
| **send** | None of the above | "sent" |

If several proposals are ready at once, the one with the highest confidence goes first and the rest wait.
Contact policy: at most 1 message a week, none between 21:00 and 08:00.

### 6. Action and feedback
- **Kate message** (confidence ≥ 0.7): Claude writes 2 short sentences with the product and price, plus buttons **[Yes]** **[Not now]**. If Claude fails, a fixed text is used.
- **Light question** (0.4–0.7, once allowed out): "Planning a trip?" with the buttons **[Yes]** **[No]**. A "Yes" raises the confidence and puts the proposal back in the queue.
- **Log only**: nothing reaches the customer.
- "Why am I seeing this?": the scenario, its probability and the transactions in `evidence`. It's built by code, so it's always true.
- Feedback: "Not now" or "No" drops that scenario's proposals for 30 days. "Yes" closes the proposal.

## What the judge sees
One page, five columns: **Incoming → Classified → Proposals → Arbiter queue → Kate (phone)**.
Each card moves left to right. The arbiter column shows held cards with their reason.

Script (~3 min):
1. **Delhaize €38** → classified `none` (0.96) → stops. *"Most payments need nothing."*
2. **Ryanair €142, BRU→BCN 14 Nov** → `travel` 0.91 → proposal → **held: not before 4 Nov**. *"Kate knows, but now isn't the right moment."*
3. **Fnac €80** → `seasonal_spend` 0.55 → **held: need more evidence**.
4. **Bol.com toys €45** → `seasonal_spend` 0.6 → **merged → 0.82**, now ready.
5. **Tick to 4 Nov** → both travel insurance (0.91) and seasonal (0.82) are ready → the arbiter **sends travel insurance** and holds seasonal with "contact limit: next week". The phone buzzes.
6. **Tap "Not now"** → travel insurance is blocked for 30 days.
7. **Tick to 7 Nov** → the card-abroad check goes out anyway: *"It's a service, not a sale, so it doesn't count toward the limit."*
8. **Tick to 11 Nov** → seasonal is sent.
9. **Click "Run 1,000"** → the background customers flow through, and the counters show e.g. *1,000 transactions → 62 proposals → 14 sent, 31 held, 17 dropped*. *"This is how it scales: cheap sorting for every transaction, and Kate only speaks when the arbiter allows it."*

## Build order (each < 2 h)
1. Transaction format + synthetic data (Lotte's script + a generator for background customers).
2. `scenarios.json` + keyword fallback classifier. The pipeline runs end to end in the console.
3. Arbiter: queue, hold/merge/drop/send, contact policy, simulated clock.
4. Pipeline UI: five columns, "Next tick", phone mockup.
5. Feedback buttons wired back to the arbiter.
6. Jev Choice classification (keyword fallback stays).
7. Claude message text (fixed text stays as fallback).
8. "Run 1,000" + counters.

After step 5 the whole demo works without any AI. Steps 6–7 make it smart; step 8 shows the scale.

## Before going on stage
- [ ] Run the script twice on the demo laptop.
- [ ] Wi-Fi off: keyword fallback and fixed text still work.
- [ ] "Reset" restarts the clock and queues.
- [ ] Say it: the data is synthetic, and the products and prices are illustrative.
- [ ] Architecture slide: transaction sources (KBC core, BankMCP/PSD2) → classify → scenarios → arbiter → channels (Kate, push, advisor).
