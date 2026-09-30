import { DEFAULT_POLICY, type Policy } from './policy'
import { days, hourOf, toIso, toMs } from './time'
import type { ActionKind, Decision, DecisionKind, DropReason, Feedback, HoldReason, IsoTime, Proposal } from './types'

type Status = 'queued' | 'asked'

interface Entry {
  proposal: Proposal
  status: Status
  /** Last hold reason emitted, so a hold is reported once, not on every tick. */
  lastReason?: HoldReason
}

interface CustomerState {
  queue: Entry[]
  contacts: { kind: 'offer' | 'question'; at: number }[]
  blocked: Map<string, { until: number; reason: DropReason }>
}

export interface QueueItem {
  proposal: Proposal
  status: Status
  reason?: HoldReason
}

export interface Stats {
  proposals: number
  merged: number
  sentOffers: number
  sentQuestions: number
  sentServices: number
  dropped: number
  queued: number
}

const round2 = (n: number) => Math.round(n * 100) / 100

/** Proposals are merged, blocked and answered per scenario + action. */
const keyOf = (p: { scenario: string; actionId: string }) => `${p.scenario}/${p.actionId}`

const HOLD_TEXT: Record<HoldReason, string> = {
  not_yet: 'not the right moment yet',
  need_evidence: 'waiting for more evidence',
  quiet_hours: 'quiet hours',
  contact_limit: 'contact limit reached this week',
  awaiting_answer: "waiting for the customer's answer",
}

/**
 * Holds proposals per customer and decides, on each tick, whether to send, hold, merge or drop them.
 * It has no clock: the caller drives time with `submit`, `tick` and `feedback`.
 */
export class Arbiter {
  private customers = new Map<string, CustomerState>()
  private counts = { proposals: 0, merged: 0, sentOffers: 0, sentQuestions: 0, sentServices: 0, dropped: 0 }

  private policy: Policy

  constructor(policy: Policy = DEFAULT_POLICY) {
    this.policy = policy
  }

  /** Adds a proposal. Returns a merge or drop decision; a new proposal is queued silently until the next tick. */
  submit(proposal: Proposal): Decision[] {
    const s = this.state(proposal.customerId)
    const now = toMs(proposal.createdAt)
    this.counts.proposals++

    const block = s.blocked.get(keyOf(proposal))
    if (block && now < block.until) {
      return [this.drop(proposal, now, block.reason, `customer ${block.reason} this recently`)]
    }
    if (proposal.confidence < this.policy.minConfidence) {
      return [this.drop(proposal, now, 'low_confidence', `confidence ${proposal.confidence} too low`, 'log')]
    }

    const existing = s.queue.find((e) => keyOf(e.proposal) === keyOf(proposal))
    if (existing) {
      const before = existing.proposal.confidence
      const merged = round2(1 - (1 - before) * (1 - proposal.confidence))
      existing.proposal = {
        ...existing.proposal,
        confidence: merged,
        evidence: [...existing.proposal.evidence, ...proposal.evidence],
        notBefore: toIso(Math.min(toMs(existing.proposal.notBefore), toMs(proposal.notBefore))),
        expires: toIso(Math.max(toMs(existing.proposal.expires), toMs(proposal.expires))),
      }
      if (existing.status === 'asked' && merged >= this.policy.actThreshold) existing.status = 'queued'
      existing.lastReason = undefined
      this.counts.merged++
      return [this.decision(existing.proposal, now, 'merge', 'merged', `merged, confidence ${before} → ${merged}`)]
    }

    s.queue.push({ proposal: { ...proposal }, status: 'queued' })
    return []
  }

  /** Re-evaluates every queue at `nowIso`. */
  tick(nowIso: IsoTime): Decision[] {
    const now = toMs(nowIso)
    const out: Decision[] = []
    const quiet = this.isQuiet(now)

    for (const s of this.customers.values()) {
      s.queue = s.queue.filter((e) => {
        if (now < toMs(e.proposal.expires)) return true
        out.push(this.drop(e.proposal, now, 'expired', 'expired before it could be sent'))
        return false
      })

      const ready: { entry: Entry; action: 'offer' | 'service' | 'question' }[] = []
      for (const entry of s.queue) {
        const p = entry.proposal
        if (entry.status === 'asked') {
          this.hold(entry, now, 'awaiting_answer', out)
        } else if (now < toMs(p.notBefore)) {
          this.hold(entry, now, 'not_yet', out, `not before ${p.notBefore.slice(0, 10)}`)
        } else if (p.confidence >= this.policy.actThreshold) {
          ready.push({ entry, action: p.kind })
        } else if (p.kind === 'service') {
          // A service is useful now or never: ask right away instead of waiting for evidence.
          ready.push({ entry, action: 'question' })
        } else if (now < toMs(p.createdAt) + days(this.policy.evidenceWaitDays)) {
          this.hold(entry, now, 'need_evidence', out, `confidence ${p.confidence}, waiting for more evidence`)
        } else {
          ready.push({ entry, action: 'question' })
        }
      }

      ready.sort(
        (a, b) =>
          b.entry.proposal.confidence - a.entry.proposal.confidence ||
          toMs(a.entry.proposal.expires) - toMs(b.entry.proposal.expires),
      )

      for (const { entry, action } of ready) {
        // Services help the customer and are never rate-limited; offers and sales questions are.
        const limited = entry.proposal.kind === 'offer' && action !== 'service'
        if (quiet) {
          this.hold(entry, now, 'quiet_hours', out)
        } else if (limited && !this.hasRoom(s, action as 'offer' | 'question', now)) {
          this.hold(entry, now, 'contact_limit', out)
        } else {
          if (limited) s.contacts.push({ kind: action as 'offer' | 'question', at: now })
          out.push(this.decision(entry.proposal, now, 'send', 'ready', `sent as ${action}`, action))
          if (action === 'question') {
            this.counts.sentQuestions++
            entry.status = 'asked'
            entry.lastReason = undefined
          } else {
            if (action === 'offer') this.counts.sentOffers++
            else this.counts.sentServices++
            s.queue = s.queue.filter((e) => e !== entry)
          }
        }
      }
    }
    return out
  }

  /** The customer's answer, from the actions side. */
  feedback(fb: Feedback): Decision[] {
    const s = this.state(fb.customerId)
    const now = toMs(fb.at)

    if (fb.answer === 'yes') {
      const asked = s.queue.find((e) => keyOf(e.proposal) === keyOf(fb) && e.status === 'asked')
      if (asked) {
        // 'Yes' to a light question: it goes out as an offer or service on the next tick.
        asked.proposal = { ...asked.proposal, confidence: Math.max(asked.proposal.confidence, this.policy.confirmedConfidence) }
        asked.status = 'queued'
        asked.lastReason = undefined
        return []
      }
      return this.block(s, keyOf(fb), now, 'converted', this.policy.convertedBlockDays)
    }
    return this.block(s, keyOf(fb), now, 'declined', this.policy.declineBlockDays)
  }

  queue(customerId: string): QueueItem[] {
    return (this.customers.get(customerId)?.queue ?? []).map((e) => ({
      proposal: e.proposal,
      status: e.status,
      reason: e.lastReason,
    }))
  }

  stats(): Stats {
    let queued = 0
    for (const s of this.customers.values()) queued += s.queue.length
    return { ...this.counts, queued }
  }

  private block(s: CustomerState, key: string, now: number, reason: DropReason, forDays: number): Decision[] {
    s.blocked.set(key, { until: now + days(forDays), reason })
    const out: Decision[] = []
    s.queue = s.queue.filter((e) => {
      if (keyOf(e.proposal) !== key) return true
      out.push(this.drop(e.proposal, now, reason, `customer ${reason}`))
      return false
    })
    return out
  }

  private hasRoom(s: CustomerState, kind: 'offer' | 'question', now: number): boolean {
    const since = now - days(this.policy.windowDays)
    const used = s.contacts.filter((c) => c.kind === kind && c.at > since).length
    return used < (kind === 'offer' ? this.policy.maxOffers : this.policy.maxQuestions)
  }

  private isQuiet(now: number): boolean {
    const h = hourOf(now)
    return h >= this.policy.quietStartHour || h < this.policy.quietEndHour
  }

  private hold(entry: Entry, now: number, reason: HoldReason, out: Decision[], detail = HOLD_TEXT[reason]) {
    if (entry.lastReason === reason) return
    entry.lastReason = reason
    out.push(this.decision(entry.proposal, now, 'hold', reason, detail))
  }

  private drop(p: Proposal, now: number, reason: DropReason, detail: string, action?: ActionKind): Decision {
    this.counts.dropped++
    return this.decision(p, now, 'drop', reason, detail, action)
  }

  private decision(
    p: Proposal,
    now: number,
    decision: DecisionKind,
    reason: Decision['reason'],
    detail: string,
    action?: ActionKind,
  ): Decision {
    return {
      at: toIso(now),
      customerId: p.customerId,
      proposalId: p.id,
      scenario: p.scenario,
      actionId: p.actionId,
      decision,
      action,
      reason,
      detail,
      confidence: p.confidence,
      proposal: p,
    }
  }

  private state(customerId: string): CustomerState {
    let s = this.customers.get(customerId)
    if (!s) {
      s = { queue: [], contacts: [], blocked: new Map() }
      this.customers.set(customerId, s)
    }
    return s
  }
}
