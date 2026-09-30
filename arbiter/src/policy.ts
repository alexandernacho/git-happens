// Contact policy and thresholds. See docs/decisions.md D4, D12, D13.
export interface Policy {
  /** At or above: ready to send as an offer. */
  actThreshold: number;
  /** Below: dropped (log only). */
  minConfidence: number;
  /** Medium confidence waits this long for more evidence, then becomes a light question. */
  evidenceWaitDays: number;
  /** Rolling window for the contact limits. */
  windowDays: number;
  maxOffers: number;
  maxQuestions: number;
  /** No contact from quietStartHour until quietEndHour. */
  quietStartHour: number;
  quietEndHour: number;
  declineBlockDays: number;
  convertedBlockDays: number;
  /** Confidence after the customer says "yes" to a light question. */
  confirmedConfidence: number;
}

export const DEFAULT_POLICY: Policy = {
  actThreshold: 0.7,
  minConfidence: 0.4,
  evidenceWaitDays: 7,
  windowDays: 7,
  maxOffers: 1,
  maxQuestions: 2,
  quietStartHour: 21,
  quietEndHour: 8,
  declineBlockDays: 30,
  convertedBlockDays: 365,
  confirmedConfidence: 0.9,
};
