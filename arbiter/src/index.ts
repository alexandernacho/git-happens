import scenariosJson from "./scenarios.json";
import type { ScenarioConfig } from "./types";

export * from "./types";
export { Arbiter, type QueueItem, type Stats } from "./arbiter";
export { createProposals, type ProposalResult } from "./proposals";
export { DEFAULT_POLICY, type Policy } from "./policy";

export const scenarios = scenariosJson as ScenarioConfig[];
