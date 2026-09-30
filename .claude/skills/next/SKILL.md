---
name: next
description: Read-only answer to "what should I do next?" for the git-happens team. Reads GitHub issues, PRs, CI, and local branches, then ranks at most 5 items, each with the exact command to run. Never changes anything.
argument-hint: "[me]"
---

# /next — what to do now

**Read-only.** Never create, assign, comment, merge, or push. Only report, and name the exact command to run.

## 1. Gather evidence (run in parallel)

```bash
git fetch --prune
gh pr list --json number,title,author,headRefName,reviewDecision,statusCheckRollup,isDraft
gh issue list --state open --json number,title,labels,assignees
gh run list --branch main --limit 3
git branch -vv
```

**Git/gh wins over the board.** An issue can say "Todo" while a branch `<n>-slug` already has commits. Trust the branch. Flag the mismatch in one line.

Before you report a branch as work in progress, check `gh pr list --state all --head <branch>`. A branch whose PR already merged is leftover, not work.

## 2. Rank

Rank every open item in this fixed order:

1. **Waiting on me** — PRs by teammates with green checks and no review. Per `AGENTS.md`, reviews must happen within 15 minutes.
2. **Red `main`** — a failed CI run on `main`. The demo must stay demoable.
3. **My work in progress** — issues assigned to me, or my unpushed or unmerged branches.
4. **Free `must` issues** — unassigned, labelled `must`.
5. **Free `nice` issues** — only when no `must` is free.

Show at most **5** items. If more qualify, say how many you left out.

With `me` as argument: show only items 1 and 3.

## 3. Output

One line per item with all four parts:

```
1. PR #7 "Map view shows pins" (Sam) — checks green, no review → `gh pr review 7 --approve` — a teammate is blocked on you
2. #4 "User can upload a CSV" — unassigned, must → `/ship-issue 4` — first free must-have
```

- **What:** the issue or PR number and title.
- **State:** as read from the evidence.
- **Command:** the exact invocation. Never "look into it".
- **Why:** one clause tying back to the ranking.

If nothing needs attention, say so. Do not invent work to fill 5 slots.
