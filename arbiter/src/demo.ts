import { Arbiter } from "./arbiter";
import { createProposals } from "./proposals";
import type { ClassifiedTransaction, Customer, Decision, Feedback, IsoTime, ScenarioConfig } from "./types";

export const lotte: Customer = {
  id: "lotte",
  name: "Lotte",
  products: ["current_account", "kbc_card", "home_insurance"],
};

export type Step =
  | { type: "tx"; ct: ClassifiedTransaction }
  | { type: "tick"; at: IsoTime }
  | { type: "feedback"; fb: Feedback };

// Stand-in classifier output until Jev is wired in. Matches the script in docs/demo-plan.md.
const tx = (
  id: string,
  ts: IsoTime,
  amount: number,
  counterparty: string,
  description: string,
  scenario: string,
  p: number,
): Step => ({
  type: "tx",
  ct: {
    transaction: { id, customerId: "lotte", ts, amount, counterparty, description, channel: "card" },
    scenario,
    probabilities: { none: Math.round((1 - p) * 100) / 100, [scenario]: p },
  },
});

export const lotteScript: Step[] = [
  tx("t-1001", "2026-10-02T12:30", -38.4, "DELHAIZE GENT", "Groceries", "none", 0.96),
  tx("t-1042", "2026-10-03T14:12", -142, "RYANAIR DAC", "FR 8412 BRU-BCN 14NOV", "travel", 0.91),
  tx("t-1107", "2026-10-30T16:05", -80, "FNAC GENT", "Books and games", "seasonal_spend", 0.55),
  tx("t-1133", "2026-11-03T22:40", -45, "BOL.COM", "Toys", "seasonal_spend", 0.6),
  { type: "tick", at: "2026-11-04T08:00" },
  {
    type: "feedback",
    fb: { customerId: "lotte", scenario: "travel", actionId: "travel_insurance", answer: "not_now", at: "2026-11-04T09:15" },
  },
  { type: "tick", at: "2026-11-07T08:00" },
  { type: "tick", at: "2026-11-11T08:00" },
];

export interface Event {
  step: Step;
  /** Why the transaction or some of its actions produced no proposal. */
  skipped: string[];
  decisions: Decision[];
}

/** Runs steps through proposal creation and the arbiter. Each transaction is followed by a tick at its own time. */
export function run(steps: Step[], customer: Customer, scenarios: ScenarioConfig[], arbiter = new Arbiter()): Event[] {
  return steps.map((step): Event => {
    if (step.type === "tick") return { step, skipped: [], decisions: arbiter.tick(step.at) };
    if (step.type === "feedback") return { step, skipped: [], decisions: arbiter.feedback(step.fb) };

    const { proposals, skipped } = createProposals(step.ct, customer, scenarios);
    if (!proposals.length) return { step, skipped, decisions: [] };
    const submitted = proposals.flatMap((p) => arbiter.submit(p));
    return { step, skipped, decisions: [...submitted, ...arbiter.tick(step.ct.transaction.ts)] };
  });
}
