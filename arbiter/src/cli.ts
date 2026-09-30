import { Arbiter } from "./arbiter";
import { lotte, lotteScript, run, type Step } from "./demo";
import { scenarios } from "./index";

const label = (step: Step): string => {
  if (step.type === "tick") return `${step.at}  ⏱  tick`;
  if (step.type === "feedback") return `${step.fb.at}  💬 ${step.fb.scenario}/${step.fb.actionId}: customer says "${step.fb.answer}"`;
  const t = step.ct.transaction;
  const p = step.ct.probabilities[step.ct.scenario];
  return `${t.ts}  💳 ${t.counterparty} €${-t.amount}  →  ${step.ct.scenario} (${p})`;
};

const ICON = { send: "📨", hold: "⏸ ", merge: "🔗", drop: "🗑 " };

const arbiter = new Arbiter();
for (const event of run(lotteScript, lotte, scenarios, arbiter)) {
  console.log(label(event.step));
  for (const why of event.skipped) console.log(`      ·  skipped: ${why}`);
  for (const d of event.decisions) {
    const action = d.action ? ` [${d.action}]` : "";
    console.log(`      ${ICON[d.decision]} ${d.decision.toUpperCase()}${action} ${d.scenario}/${d.actionId} (${d.confidence}): ${d.detail}`);
  }
}
console.log("\nstats", arbiter.stats());
