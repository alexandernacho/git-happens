// KBC scenarios that a transaction can trigger. KBC lists ~150 things Kate can do; most are
// reactive (find an ATM, contact KBC) and stay out of this list. The rest are here, each with
// a trigger: what a payment looks like when it signals the need.
//
// `decider` says who spots the trigger:
//   - 'rules': code alone (amounts, dates, repeats, balances). Exact and free.
//   - 'jev':   the meaning of the payment matters ("VANDENBROUCKE DAKWERKEN" = a roofer).
//              `trigger` is sent as the Choice criteria, so it describes the payment, not the product.
//
// `mcc` hints are ISO 18245 codes that make the trigger likely. They pre-filter; they never decide.

export type ScenarioCategory = 'payments' | 'documents' | 'insurance' | 'energy' | 'vouchers' | 'finance'

// Life moments the daily pass looks for over a 30-day window, not in a single payment.
export type LifeEvent = 'travel' | 'moving' | 'new-car' | 'new-pet' | 'new-baby' | 'new-job' | 'home-damage' | 'health'

export type Scenario = {
  id: string
  category: ScenarioCategory
  kbc: string // the scenario as KBC words it
  trigger: string
  decider: 'rules' | 'jev'
  lifeEvent?: LifeEvent
  mcc?: number[]
}

export const scenarios: Scenario[] = [
  // Payments, cards and security
  {
    id: 'duplicate-payment',
    category: 'payments',
    kbc: 'Detecting a duplicate payment.',
    trigger: 'Same amount to the same counterparty twice within 3 days.',
    decider: 'rules',
  },
  {
    id: 'card-abroad-check',
    category: 'payments',
    kbc: 'Checking whether a debit card is enabled for use abroad before travelling.',
    trigger: 'Customer paid for an upcoming trip outside Belgium: flights, hotels, holiday rentals, car rental or a travel agency.',
    decider: 'jev',
    lifeEvent: 'travel',
    mcc: [4511, 7011, 4722, 7512],
  },
  {
    id: 'foreign-payment-info',
    category: 'payments',
    kbc: 'Providing information about foreign payments.',
    trigger: 'Transfer to an account or card payment at a merchant outside the SEPA zone.',
    decider: 'rules',
  },
  {
    id: 'reimbursement-check',
    category: 'payments',
    kbc: 'Checking whether another person has reimbursed the customer.',
    trigger: 'Customer paid a bill that is usually shared: a group dinner, a holiday house, concert or festival tickets for several people, a joint gift.',
    decider: 'jev',
  },
  {
    id: 'recurring-payment-setup',
    category: 'payments',
    kbc: 'Setting up recurring payments.',
    trigger: 'Same manual transfer to the same person or landlord for 3 months in a row, with no standing order.',
    decider: 'rules',
  },
  {
    id: 'direct-debit-overview',
    category: 'payments',
    kbc: 'Providing an overview of active direct debits.',
    trigger: 'A first collection under a new direct-debit mandate.',
    decider: 'rules',
  },
  {
    id: 'parking-4411',
    category: 'payments',
    kbc: 'Helping customers register a parking session through 4411.',
    trigger: 'Customer paid for street parking or a parking garage with a card, a meter or a third-party parking app.',
    decider: 'jev',
    mcc: [7523],
  },
  {
    id: 'public-transport-tickets',
    category: 'payments',
    kbc: 'Helping customers buy public-transport tickets.',
    trigger: 'Customer bought a train, tram, bus or metro ticket outside KBC Mobile: NMBS/SNCB, De Lijn, STIB/MIVB, TEC.',
    decider: 'jev',
    mcc: [4111, 4112],
  },
  {
    id: 'cinema-tickets',
    category: 'payments',
    kbc: 'Helping customers buy cinema tickets.',
    trigger: 'Customer bought cinema tickets outside KBC Mobile.',
    decider: 'jev',
    mcc: [7832],
  },
  {
    id: 'card-limit',
    category: 'payments',
    kbc: 'Adjusting a payment-card limit.',
    trigger: 'Card spending this month is above 80% of the card limit.',
    decider: 'rules',
  },
  {
    id: 'low-balance',
    category: 'payments',
    kbc: 'Sending a low-balance notification.',
    trigger: 'Balance after this transaction is below the customer threshold, or below the next known debit.',
    decider: 'rules',
  },
  {
    id: 'upcoming-payment-reminder',
    category: 'payments',
    kbc: 'Providing reminders about upcoming scheduled payments.',
    trigger: 'A scheduled payment or known recurring debit is due within 3 days.',
    decider: 'rules',
  },

  // Documents and administration
  {
    id: 'store-warranty',
    category: 'documents',
    kbc: 'Suggesting that customers store an electronics warranty.',
    trigger: 'Customer bought an electronic device or household appliance worth more than about €100: phone, laptop, TV, washing machine, fridge.',
    decider: 'jev',
    mcc: [5732, 5722, 5045],
  },
  {
    id: 'update-address',
    category: 'documents',
    kbc: 'Helping customers update personal information.',
    trigger: 'Customer is moving house: a moving company, van rental, a rental deposit to a new landlord, notary fees, or connection fees at a new address.',
    decider: 'jev',
    lifeEvent: 'moving',
    mcc: [4214],
  },

  // Insurance
  {
    id: 'travel-insurance',
    category: 'insurance',
    kbc: 'Helping customers take out travel insurance.',
    trigger: 'Customer paid for an upcoming trip: flights, hotels, holiday rentals, a package holiday or a travel agency.',
    decider: 'jev',
    lifeEvent: 'travel',
    mcc: [4511, 7011, 4722],
  },
  {
    id: 'vehicle-claim',
    category: 'insurance',
    kbc: 'Helping customers start a claim for vehicle damage.',
    trigger: 'Customer paid for car repairs after damage: a body shop, windscreen repair, towing or a car-damage expert. Not routine servicing or tyres.',
    decider: 'jev',
    mcc: [7531, 7549],
  },
  {
    id: 'home-damage-claim',
    category: 'insurance',
    kbc: 'Helping customers start a claim for home damage.',
    trigger: 'Customer paid for an urgent home repair: an emergency plumber, water-damage drying, a glazier, an emergency locksmith after a break-in.',
    decider: 'jev',
    lifeEvent: 'home-damage',
    mcc: [1711, 1799, 7699],
  },
  {
    id: 'storm-damage',
    category: 'insurance',
    kbc: 'Helping customers report possible storm damage.',
    trigger: 'Customer paid a roofer, tree removal or facade repair shortly after a storm warning for their region.',
    decider: 'jev',
    lifeEvent: 'home-damage',
    mcc: [1761],
  },
  {
    id: 'hospitalisation-claim',
    category: 'insurance',
    kbc: 'Turning an AssurCard-related question into a hospitalisation-claim process.',
    trigger: 'Customer paid a hospital bill or a large bill from a medical specialist.',
    decider: 'jev',
    lifeEvent: 'health',
    mcc: [8062, 8011],
  },
  {
    id: 'pet-insurance',
    category: 'insurance',
    kbc: 'Helping customers take out pet insurance.',
    trigger: 'Customer got a new pet or has growing vet costs: a breeder, an animal shelter, a first large pet-store purchase, a vet bill.',
    decider: 'jev',
    lifeEvent: 'new-pet',
    mcc: [742, 5995],
  },
  {
    id: 'car-insurance',
    category: 'insurance',
    kbc: 'Providing information about car insurance.',
    trigger: 'Customer bought a car: a down payment or full payment to a car dealer, or a vehicle-registration fee.',
    decider: 'jev',
    lifeEvent: 'new-car',
    mcc: [5511, 5521],
  },
  {
    id: 'home-insurance-review',
    category: 'insurance',
    kbc: 'Reminding customers when their home insurance should be reviewed.',
    trigger: 'Customer is moving or renovating: a rental deposit, notary fees, a moving company, or large payments to builders or kitchen and furniture stores.',
    decider: 'jev',
    lifeEvent: 'moving',
    mcc: [4214, 5712, 5211],
  },
  {
    id: 'family-insurance',
    category: 'insurance',
    kbc: 'Providing information about family insurance.',
    trigger: 'Customer is expecting or just had a baby: a maternity ward bill, a baby store, a pram or nursery furniture, a first childcare (crèche) payment.',
    decider: 'jev',
    lifeEvent: 'new-baby',
    mcc: [5641],
  },
  {
    id: 'cheaper-insurance',
    category: 'insurance',
    kbc: 'Suggesting a cheaper or more suitable insurance solution.',
    trigger: 'Customer pays a recurring premium to an insurer that is not KBC.',
    decider: 'jev',
    mcc: [6300],
  },

  // Energy and sustainability
  {
    id: 'cheaper-energy-supplier',
    category: 'energy',
    kbc: 'Suggesting a cheaper energy supplier.',
    trigger: 'Customer pays a gas or electricity bill or advance to an energy supplier.',
    decider: 'jev',
    mcc: [4900],
  },
  {
    id: 'energy-saving',
    category: 'energy',
    kbc: 'Suggesting ways to save on energy bills.',
    trigger: 'Energy advance or bill is more than 20% higher than the same month last year.',
    decider: 'rules',
  },
  {
    id: 'greener-home',
    category: 'energy',
    kbc: 'Helping customers explore greener home improvements.',
    trigger: 'Customer paid for solar panels, a heat pump, insulation, new windows or an energy audit (EPC).',
    decider: 'jev',
    mcc: [1711, 1731, 5211],
  },

  // Service vouchers and benefits
  {
    id: 'service-voucher-reminder',
    category: 'vouchers',
    kbc: 'Reminding customers to order new service vouchers.',
    trigger: 'Customer bought service vouchers (dienstencheques / titres-services), for example through Pluxee.',
    decider: 'jev',
  },
  {
    id: 'kbc-deals-cashback',
    category: 'vouchers',
    kbc: 'Offering cashback opportunities.',
    trigger: 'Payment at a merchant that has an active KBC Deals offer.',
    decider: 'rules',
  },

  // Personal finance management
  {
    id: 'subscription-tracking',
    category: 'finance',
    kbc: 'Tracking subscriptions.',
    trigger: 'A new card payment that repeats monthly or yearly at the same merchant.',
    decider: 'rules',
  },
  {
    id: 'unusual-spending',
    category: 'finance',
    kbc: 'Highlighting unusual spending.',
    trigger: 'Amount is far above what the customer usually spends in this category.',
    decider: 'rules',
  },
  {
    id: 'seasonal-savings',
    category: 'finance',
    kbc: 'Forecasting future spending.',
    trigger: 'A season with a spending peak last year (Christmas, summer holiday, back to school) starts within 6 weeks.',
    decider: 'rules',
  },
  {
    id: 'new-income',
    category: 'finance',
    kbc: 'Tracking income.',
    trigger: 'Customer receives a first salary from a new employer, or salary stops.',
    decider: 'jev',
    lifeEvent: 'new-job',
  },
]

// The option Jev picks when nothing fits. Without it, a Choice always names some scenario.
export const NO_SCENARIO = {
  id: 'none',
  trigger: 'Routine spending (groceries, restaurants, rent, usual subscriptions) that signals no new need.',
}

// Choice criteria for the Jev router: scenario id → trigger, plus the no-match option.
export function jevCriteria(): Record<string, string> {
  const criteria: Record<string, string> = {}
  for (const s of scenarios) if (s.decider === 'jev') criteria[s.id] = s.trigger
  criteria[NO_SCENARIO.id] = NO_SCENARIO.trigger
  return criteria
}
