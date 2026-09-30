# Pitch — KBC Travel Assistant (3 minutes)

**Setup:** `npm run dev`, open http://localhost:5173 in a wide browser window (≥1280 px) so the
"Behind the scenes" panel shows next to the phone. Presenter panel = remote control: click any step to
jump there, **Restart demo** to start over. Backup: a screen recording of one full run.

## 0:00–0:30 — The problem (one speaker, no slides needed)
> "Sofie just booked a flight to New York and a hotel. Right now she opens five apps: one for insurance,
> one for cash, one for an eSIM, a spreadsheet for her budget… Her bank saw the booking the moment she paid.
> And did nothing with it. We fix that."

## 0:30–2:15 — Live demo (click through, ~12 s per screen)
1. **Home** — "This is Sofie's KBC app." Wait for the notification to slide in: *Going to New York?*
2. **Trip detected** — "Why am I seeing this?" shows the two card payments and their merchant codes.
   "No AI black box: two rules, 97 % sure, and only Sofie sees it."
3. **Insurance** — "She booked two days ago. Cancellation cover has to start now, so this is the one
   moment an insurance offer is actually *helpful*." Tap *Add*.
4. **Destination** — pre-filled from the flight code BRU→JFK. Dates editable. Confirm.
5. **Budget** — "€110 a day. Not a generic number: in Barcelona she spent €75 a day, New York is 45 %
   more expensive." Point at the AI tip. Tap *Set aside*.
6. **Currency** — suggested dollar amount from her own budget, pick up at her branch.
7. **eSIM** — "The US is outside the EU, so roaming costs money. Plan matches her 7-day trip." Show the QR.
8. **Trip ready** — one checklist. "Two minutes, one app, four products."

*(Optional, if time: on the Destination screen pick Barcelona → currency and eSIM disappear, because
euro + EU roaming. Personalisation also means not selling what she doesn't need.)*

## 2:15–2:45 — Why it scales (point at the side panel)
> "This runs on data KBC already has: every card payment carries a merchant category code. We scanned
> Sofie's 250 payments in well under a millisecond — all 2.3 million KBC customers in minutes, on one laptop.
> And the same pattern works for every life moment: moving house, a new car, a baby on the way."

## 2:45–3:00 — Value
> "For Sofie: less hassle, at exactly the right moment. For KBC: insurance, FX and partner sales at the
> moment of intent — and a customer who feels her bank looks out for her."

## Likely jury questions
- **Privacy?** Runs on the bank's own transaction data, inside the app; nothing leaves KBC. Opt-out on
  the first screen. Consent before any offer is made.
- **False positives?** Needs a flight *and* lodging for high confidence; one booking alone scores lower
  and only shows a soft hint. Business trips could be excluded via the card type.
- **Why rules and not an LLM for detection?** Explainable to the customer and to the regulator, cheap to
  run on millions of customers. The LLM is used where language helps: the personal tip.
- **Data?** Synthetic persona with real ISO 18245 merchant codes; public datasets are US-only and have no
  per-customer trip story.
