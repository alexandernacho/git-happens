# Kate's capabilities: what the arbiter uses and what it doesn't

Source: KBC's public communications about Kate (list collected 2026-09-30).
The arbiter only handles items **a transaction can trigger**. Those are in the scenario catalogue `src/data/scenarios.ts` (33 scenarios, KBC wording), grouped into situations by life event in `src/arbiter/catalogue.ts`.
Everything else is listed here so we can say in the pitch: "we reuse what Kate already does; we only add *when* she does it."

## Proactive, but triggered by something other than a transaction

These could feed the same arbiter later through another event source. They're out of scope for the demo.

- **Card events:** incorrect PIN entry, PIN possibly blocked, unblocking a PIN.
- **Weather:** warning about potential storm damage.
- **Balances outside the account:** service vouchers nearly used up, Monizze voucher balance.
- **Calendar or product dates:** reviewing home insurance on schedule, upcoming bills, forecasting future spending, expected account movements.

## Reactive (the customer asks, Kate answers)

Not for the arbiter. Kate already does these on request.

- **Payments:** make a payment, transfer money, find a payment, payment status, payment options, payments abroad, managing direct debits, other services in KBC Mobile.
- **Cards:** report a lost or stolen debit or credit card.
- **Places:** find an ATM or branch, show their locations.
- **Documents:** insurance or financial certificates, the digital safe, storing or retrieving warranties, organising documents, payment, insurance or product documents.
- **Information and navigation:** product information, the KBC website or MyNWS, current products, understanding a notification, account answers, navigating KBC Mobile, personalised answers.
- **Contact:** contact KBC, KBC Mobile Live, hand over to an employee with context, make an appointment, find the right channel or process.
- **Insurance:** report damage or an accident, submit a claim, understand coverage, policy information, request an AssurCard number, insurance contacts and explanations, information on hospitalisation, travel, pet, family, car, home and liability insurance.
- **Energy:** compare suppliers, energy costs, energy consumption, sustainability information and KBC solutions.
- **Benefits:** manage service vouchers, check voucher balances, buy vouchers, KBC Deals, partner offers, Kate Coins (vouchers, cashback), exclusive deals, events, personalised commercial offers.
- **Personal finance:** track income and expenses, categorise spending, recurring expenses, subscription suggestions, smart budget, spending insights, financial overview, monthly expenses, household costs, personalised insights.
