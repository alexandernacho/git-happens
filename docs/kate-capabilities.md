# Kate's capabilities: what the arbiter uses and what it doesn't

Source: KBC's public communications about Kate (list collected 2026-09-30).
The arbiter only handles items **a transaction can trigger**. Those are in `arbiter/src/scenarios.json`, grouped by situation, with the KBC wording as each action's `label`.
Everything else is listed here so we can say in the pitch: "we reuse what Kate already does; we only add *when* she does it."

## Used in scenarios.json (triggered by a transaction)

| Situation | Actions (KBC wording) |
|---|---|
| `travel` | Checking whether a debit card is enabled for use abroad before travelling · Helping customers take out travel insurance |
| `moving` | Helping customers update personal information · Helping customers review their home insurance · Providing information about home / family insurance |
| `salary_up` | Showing potential savings opportunities · Providing information about insurance savings |
| `duplicate_payment` | Detecting a duplicate payment |
| `low_balance` | Sending a low-balance notification · Adjusting an account limit |
| `large_card_spend` | Adjusting a payment-card limit |
| `repeated_manual_transfer` | Setting up recurring payments |
| `new_recurring_payment` | Providing an overview of active direct debits · Tracking subscriptions |
| `annual_bill` | Providing a reminder before a scheduled payment |
| `unusual_spending` | Highlighting unusual spending |
| `foreign_transfer` | Providing information about foreign payments |
| `shared_expense` | Checking whether another person has reimbursed the customer |
| `parking_paid` / `public_transport_paid` / `cinema_paid` | Helping customers register parking through 4411 · buy public-transport tickets · buy cinema tickets |
| `partner_merchant` | Offering cashback opportunities |
| `electronics_purchase` | Suggesting that customers store an electronics warranty |
| `car_repair` | Helping customers start a claim for vehicle damage |
| `home_repair` | Helping customers start a claim for home damage · Asking customers whether they have suffered storm damage |
| `home_renovation` | Reminding customers when their home insurance should be reviewed · Helping customers explore greener home improvements |
| `energy_bill` | Suggesting ways to save on energy bills · Suggesting a cheaper energy supplier |
| `service_voucher_order` | Reminding customers to order new service vouchers · Linking service-voucher services to KBC Mobile |
| `medical_abroad` | Helping customers start a claim for a travel incident |
| `hospital_bill` | Turning an AssurCard-related question into a hospitalisation-claim process · Providing information about hospitalisation insurance |
| `pet_expense` | Helping customers take out pet insurance |
| `family_growing` | Providing information about family insurance |
| `car_bought` | Providing information about car insurance |
| `insurance_elsewhere` | Suggesting a cheaper or more suitable insurance solution |
| `seasonal_spend` | *Ours, not in KBC's list:* suggesting a savings pot for December spending |

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
