import { describe, expect, it } from "vitest";
import { Arbiter } from "../src/arbiter";
import { lotte, lotteScript, run } from "../src/demo";
import { scenarios } from "../src/index";
import { createProposals } from "../src/proposals";
import { parseEventDate } from "../src/time";
import type { ClassifiedTransaction, Proposal } from "../src/types";

const proposal = (over: Partial<Proposal> = {}): Proposal => ({
  id: `lotte:moving:${over.createdAt ?? "x"}`,
  customerId: "lotte",
  scenario: "moving",
  actionId: "home_insurance",
  kind: "offer",
  label: "Providing information about home insurance",
  product: "KBC Home Insurance",
  confidence: 0.9,
  createdAt: "2026-10-10T10:00",
  notBefore: "2026-10-10T10:00",
  expires: "2026-12-01T00:00",
  evidence: ["t-1"],
  ...over,
});

const summary = (ds: ReturnType<Arbiter["tick"]>) =>
  ds.map((d) => `${d.decision}:${d.scenario}${d.actionId === "home_insurance" ? "" : `/${d.actionId}`}:${d.action ?? d.reason}`);
const fb = (answer: "yes" | "no" | "not_now", at: string) =>
  ({ customerId: "lotte", scenario: "moving", actionId: "home_insurance", answer, at }) as const;

describe("demo script (docs/demo-plan.md)", () => {
  it("plays out step by step", () => {
    const events = run(lotteScript, lotte, scenarios).map((e) => (e.decisions.length ? summary(e.decisions) : e.skipped));
    expect(events).toEqual([
      ["no scenario"],
      ["hold:travel/check_card_abroad:not_yet", "hold:travel/travel_insurance:not_yet"],
      ["hold:seasonal_spend/christmas_pot:need_evidence"],
      ["merge:seasonal_spend/christmas_pot:merged", "hold:seasonal_spend/christmas_pot:quiet_hours"],
      ["send:travel/travel_insurance:offer", "hold:seasonal_spend/christmas_pot:contact_limit"],
      [],
      // Services are not rate-limited: the card check goes out in the same week as the offer.
      ["send:travel/check_card_abroad:service"],
      ["send:seasonal_spend/christmas_pot:offer"],
    ]);
  });
});

describe("Arbiter", () => {
  it("drops low confidence as log only", () => {
    const a = new Arbiter();
    expect(summary(a.submit(proposal({ confidence: 0.3 })))).toEqual(["drop:moving:log"]);
  });

  it("merges the same scenario with 1 - (1-a)(1-b)", () => {
    const a = new Arbiter();
    a.submit(proposal({ confidence: 0.55 }));
    const [d] = a.submit(proposal({ confidence: 0.6, evidence: ["t-2"], createdAt: "2026-10-11T10:00" }));
    expect(d.decision).toBe("merge");
    expect(d.confidence).toBe(0.82);
    expect(d.proposal.evidence).toEqual(["t-1", "t-2"]);
  });

  it("asks a light question after 7 days without evidence, and a yes turns it into an offer", () => {
    const a = new Arbiter();
    a.submit(proposal({ confidence: 0.5 }));
    expect(summary(a.tick("2026-10-10T10:00"))).toEqual(["hold:moving:need_evidence"]);
    expect(a.tick("2026-10-16T10:00")).toEqual([]); // hold reported once
    expect(summary(a.tick("2026-10-17T10:00"))).toEqual(["send:moving:question"]);
    expect(summary(a.tick("2026-10-17T11:00"))).toEqual(["hold:moving:awaiting_answer"]);

    a.feedback(fb("yes", "2026-10-17T12:00"));
    const [d] = a.tick("2026-10-17T13:00");
    expect(d.action).toBe("offer");
    expect(d.confidence).toBe(0.9);
  });

  it("blocks a scenario for 30 days after no", () => {
    const a = new Arbiter();
    a.submit(proposal());
    a.tick("2026-10-10T10:00");
    a.feedback(fb("not_now", "2026-10-10T11:00"));
    expect(summary(a.submit(proposal({ createdAt: "2026-10-20T10:00" })))).toEqual(["drop:moving:declined"]);
    expect(a.submit(proposal({ createdAt: "2026-11-10T10:00" }))).toEqual([]);
  });

  it("drops queued proposals of a declined scenario", () => {
    const a = new Arbiter();
    a.submit(proposal({ confidence: 0.5 }));
    const ds = a.feedback(fb("no", "2026-10-11T10:00"));
    expect(summary(ds)).toEqual(["drop:moving:declined"]);
    expect(a.queue("lotte")).toEqual([]);
  });

  it("allows 1 offer and 2 questions per rolling week", () => {
    const a = new Arbiter();
    const at = "2026-10-20T10:00";
    for (const scenario of ["q1", "q2", "q3"]) a.submit(proposal({ scenario, id: scenario, confidence: 0.5 }));
    for (const scenario of ["o1", "o2"]) a.submit(proposal({ scenario, id: scenario, confidence: 0.9 }));
    const ds = summary(a.tick(at));
    expect(ds.filter((d) => d.endsWith(":offer"))).toHaveLength(1);
    expect(ds.filter((d) => d.endsWith(":question"))).toHaveLength(2);
    expect(ds.filter((d) => d.endsWith(":contact_limit"))).toHaveLength(2);
    // The window rolls: 7 days later there is room again.
    expect(summary(a.tick("2026-10-27T10:00"))).toContain("send:o2:offer");
  });

  it("sends the highest confidence first", () => {
    const a = new Arbiter();
    a.submit(proposal({ scenario: "low", id: "low", confidence: 0.75 }));
    a.submit(proposal({ scenario: "high", id: "high", confidence: 0.95 }));
    expect(summary(a.tick("2026-10-10T10:00"))).toEqual(["send:high:offer", "hold:low:contact_limit"]);
  });

  it("holds during quiet hours", () => {
    const a = new Arbiter();
    a.submit(proposal({ createdAt: "2026-10-10T21:30", notBefore: "2026-10-10T21:30" }));
    expect(summary(a.tick("2026-10-10T21:30"))).toEqual(["hold:moving:quiet_hours"]);
    expect(summary(a.tick("2026-10-11T07:59"))).toEqual([]);
    expect(summary(a.tick("2026-10-11T08:00"))).toEqual(["send:moving:offer"]);
  });

  it("sends services even when the offer limit is used, but not during quiet hours", () => {
    const a = new Arbiter();
    a.submit(proposal({ scenario: "o1", id: "o1" }));
    a.submit(proposal({ scenario: "o2", id: "o2" }));
    a.submit(proposal({ scenario: "dup", id: "dup", actionId: "duplicate_alert", kind: "service", createdAt: "2026-10-10T22:00", notBefore: "2026-10-10T22:00" }));
    expect(summary(a.tick("2026-10-10T22:00"))).toEqual([
      "hold:o1:quiet_hours",
      "hold:o2:quiet_hours",
      "hold:dup/duplicate_alert:quiet_hours",
    ]);
    expect(summary(a.tick("2026-10-11T08:00"))).toEqual([
      "send:o1:offer",
      "hold:o2:contact_limit",
      "send:dup/duplicate_alert:service",
    ]);
  });

  it("asks a medium-confidence service right away, without waiting for evidence", () => {
    const a = new Arbiter();
    a.submit(proposal({ actionId: "duplicate_alert", kind: "service", confidence: 0.5 }));
    expect(summary(a.tick("2026-10-10T10:00"))).toEqual(["send:moving/duplicate_alert:question"]);
  });

  it("keeps different actions of one scenario apart", () => {
    const a = new Arbiter();
    a.submit(proposal());
    expect(a.submit(proposal({ actionId: "update_details", kind: "service" }))).toEqual([]);
    expect(a.queue("lotte")).toHaveLength(2);
  });

  it("drops expired proposals", () => {
    const a = new Arbiter();
    a.submit(proposal({ confidence: 0.5, expires: "2026-10-12T00:00" }));
    expect(summary(a.tick("2026-10-12T00:00"))).toEqual(["drop:moving:expired"]);
  });
});

describe("createProposals", () => {
  const ct = (over: Partial<ClassifiedTransaction> = {}): ClassifiedTransaction => ({
    transaction: {
      id: "t-1042",
      customerId: "lotte",
      ts: "2026-10-03T14:12",
      amount: -142,
      counterparty: "RYANAIR DAC",
      description: "FR 8412 BRU-BCN 14NOV",
    },
    scenario: "travel",
    probabilities: { travel: 0.91, none: 0.09 },
    ...over,
  });

  it("schedules travel 10 days before the flight and expires on the flight date", () => {
    const { proposals } = createProposals(ct(), lotte, scenarios);
    expect(proposals.map((p) => [p.actionId, p.kind, p.notBefore, p.expires])).toEqual([
      ["check_card_abroad", "service", "2026-11-07T00:00", "2026-11-14T00:00"],
      ["travel_insurance", "offer", "2026-11-04T00:00", "2026-11-14T00:00"],
    ]);
  });

  it("prefers the classifier's event date", () => {
    const { proposals } = createProposals(ct({ eventDate: "2026-12-20T00:00" }), lotte, scenarios);
    expect(proposals[1].notBefore).toBe("2026-12-10T00:00");
  });

  it("skips customers who already have the product", () => {
    const r = createProposals(ct(), { ...lotte, products: ["travel_insurance"] }, scenarios);
    expect(r.proposals.map((p) => p.actionId)).toEqual(["check_card_abroad"]);
    expect(r.skipped).toEqual(["travel_insurance: not eligible: already has travel_insurance"]);
  });

  it("picks the actions that fit the customer's products", () => {
    const moving = ct({ scenario: "moving", probabilities: { moving: 0.8 } });
    const withHome = createProposals(moving, lotte, scenarios).proposals.map((p) => p.actionId);
    const without = createProposals(moving, { ...lotte, products: [] }, scenarios).proposals.map((p) => p.actionId);
    expect(withHome).toEqual(["update_details", "review_home_insurance", "family_insurance"]);
    expect(without).toEqual(["update_details", "home_insurance", "family_insurance"]);
  });

  it("schedules \"after\" actions later", () => {
    const vouchers = ct({ scenario: "service_voucher_order", probabilities: { service_voucher_order: 0.9 } });
    const reorder = createProposals(vouchers, lotte, scenarios).proposals.find((p) => p.actionId === "reorder_vouchers");
    expect(reorder?.notBefore).toBe("2026-10-28T14:12");
  });

  it("skips none, unknown scenarios and low confidence", () => {
    const skipped = (c: ClassifiedTransaction) => createProposals(c, lotte, scenarios).skipped;
    expect(skipped(ct({ scenario: "none" }))).toEqual(["no scenario"]);
    expect(skipped(ct({ scenario: "pets" }))).toEqual(['unknown scenario "pets"']);
    expect(skipped(ct({ probabilities: { travel: 0.3 } }))).toEqual(["low confidence 0.3"]);
  });
});

describe("scenarios.json", () => {
  it("has unique ids and every action is an offer or a service", () => {
    const ids = scenarios.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const s of scenarios) {
      expect(s.actions.length).toBeGreaterThan(0);
      for (const a of s.actions) expect(["offer", "service"]).toContain(a.kind);
    }
  });
});

describe("parseEventDate", () => {
  it("rolls to next year when the date has passed", () => {
    expect(parseEventDate("BRU-BCN 5JAN", "2026-12-20T10:00")).toBe("2027-01-05T00:00");
    expect(parseEventDate("no date here", "2026-12-20T10:00")).toBeUndefined();
  });
});
