# AGENTS.md

Guidance for humans and AI agents (Claude Code, Codex, Cursor) working in this repo.
This file is the single source of truth. `CLAUDE.md` imports it — edit here, not there.

## Project
Team **git-happens** (3 people) building our entry for the Tectonic hackathon.
Goal: a working demo by the deadline. Cut features before cutting the demo.

## How we work: GitHub Issues + Projects board

All work is tracked in GitHub. No other task tool.

- **Repo:** https://github.com/alexandernacho/git-happens
- **Board:** https://github.com/users/alexandernacho/projects/1 — columns `Todo` → `In Progress` → `Done`

### Rules
1. **One task = one issue.** No work without an issue. Write the title as an outcome: "User can log in with email", not "auth stuff".
2. **One owner per issue.** Assign yourself before you start, and move the card to `In Progress`. Unassigned = free to take.
   New issues and PRs land on the board in `Todo` automatically.
3. **Label the priority.** `must` = the demo breaks without it. `nice` = only if time is left. Finish all `must` before any `nice`.
4. **Keep issues small.** One issue fits in 2 hours or less. Split it if not.
5. **Branch per issue.** Name: `<issue-number>-<short-slug>`, e.g. `12-email-login`.
6. **Close through the PR.** Put `Closes #12` in the PR body. Merging closes the issue and moves the card to `Done`.
7. **Keep `main` demoable.** Small PRs. Merge often. Never push a broken build to `main`.
8. **Review fast.** Ask a teammate for a quick look. If nobody answers within 15 minutes, self-merge and say so in the team chat.

### Commands
```bash
gh issue list --assignee @me                      # my open issues
gh issue list --label must --search "no:assignee" # free must-haves to pick up
gh issue create --title "User can log in with email" --label must --assignee @me
gh issue develop 12 --checkout                    # create + check out a branch for #12
gh pr create --fill --body "Closes #12"
gh pr merge --squash --delete-branch
```

### For AI agents
- Before you write code, find the issue for the task. If there is none, ask the user whether to create one.
- Stay inside the scope of the issue. Note other problems as a new issue, don't fix them in the same PR.
- Never push to `main` directly. Never merge without the user's approval.

## Stack
_To be decided. Default: TypeScript, React functional components, Tailwind._
