---
name: grill
description: Stress-test a plan, feature, or design by interviewing the user in at most 2 rounds of sharp trade-off questions, then log the decisions to docs/decisions.md. Use before building anything non-trivial, or on any "grill" trigger.
argument-hint: <topic>
---

# /grill — fast decision interview

Find the decisions that would break the demo if guessed wrong. Ask them. Log the answers. Stop.

Hackathon rule: **a wrong guess costs hours, a question costs 30 seconds.** But we have one night, so cap it at **2 rounds**.

## 1. Before asking anything

- **Facts are your job.** Never ask what the repo can answer ("does X exist", "which library do we use"). Read the code, `AGENTS.md`, and `docs/decisions.md` yourself.
- **Never re-ask a settled decision.** If `docs/decisions.md` already answers it, skip it and say which entry settled it.
- **Prune scale questions.** We demo to judges, not to 10,000 users. Caching, queues, multi-tenancy, and perf tuning are out of scope. Default every recommendation to the smallest thing that demos well.

## 2. The rounds

1. **Round 1:** list every open decision whose answer changes what we build. Ask them all in one message, numbered.
2. **Round 2:** only the follow-ups that Round 1 answers unlocked. Skip Round 2 when there are none.
3. Anything still open after Round 2: take the **(Recommended)** option, and log it as `assumed`.

Ask about consequences, not mechanics. Do not ask the user to pick a reversible implementation detail — decide it yourself.

## 3. Question format

Use this format for every question. Give 2–4 options, mark exactly one **(Recommended)**, and give each option a one-sentence example of what the user or judge *sees*. Use the same scenario across all options so the contrast is clear.

```
❓ **Q1** — **<title>**: <question>

- **<option A> (Recommended)** — <trade-off>
  *Example:* <what the judge sees under A>
- **<option B>** — <trade-off>
  *Example:* <same moment under B>

➡️ Recommended: <A> — <one-line reason>
```

Filled in:

```
❓ **Q1** — **Login**: Does the demo need real accounts?

- **Hardcoded demo user (Recommended)** — zero auth work, but no sign-up flow to show.
  *Example:* The judge opens the app and lands straight on the dashboard as "Demo Dana".
- **Email magic link** — real flow, but costs ~1 hour and a mail provider.
  *Example:* The judge types an email, switches to their inbox, and clicks a link before seeing anything.

➡️ Recommended: Hardcoded demo user — judges score what the product does, not the login.
```

The user may answer with an option not listed. Accept it.

## 4. Log the decisions

Append to `docs/decisions.md` after each round (create the file if missing). Write it as each round closes, so a crash doesn't lose it.

```markdown
## <topic> — YYYY-MM-DD

- **D1 <title>:** <what was decided>. _Rejected:_ <other options, one line>.
- **D2 <title>:** <decision> _(assumed — not answered)_.
```

## 5. Close

End with:
1. The decisions, one line each.
2. Anything `assumed`, so the team can object.
3. One next step — usually: create the issues with `gh issue create ... --label must`, or run `/ship-issue <n>`.
