---
name: ship-issue
description: Take one GitHub issue (number or URL) from Todo to an open PR — check its real state, claim it, branch, build, verify, and open a PR with "Closes #n". Use when asked to implement, fix, or pick up a specific issue.
argument-hint: <issue-number>
---

# /ship-issue — issue to PR

Start with: `Picking up #<n>.`

Follow `AGENTS.md`. It wins over this file if they disagree.

## 1. Check the real state

```bash
gh issue view <n> --json title,body,labels,assignees,state
git branch -a --list "*<n>-*"
gh pr list --state all --search "<n> in:title,body"
```

- **Closed or merged already:** report it and stop.
- **Branch or PR exists:** resume it. Do not start over.
- **Assigned to someone else:** stop and ask. Do not take a teammate's issue.

## 2. Check the scope

The issue must say what "done" looks like. If it doesn't, ask **one** short question and wait.

- **Too big (over 2 hours):** propose a split into smaller issues. Do not build it as one.
- **Foggy (open product decisions):** suggest `/grill <topic>` first.
- **Bundled extras:** build only what the title promises. Put the rest in a new issue.

## 3. Claim and branch

```bash
gh issue edit <n> --add-assignee @me
git switch main && git pull
git switch -c <n>-<short-slug>
```

Leave uncommitted work that isn't yours alone. Never commit to `main`.

Don't move the board card. Opening the PR with `Closes #<n>` moves it to `In Progress`.

## 4. Build

- Build the smallest thing that makes the issue's "done" true in the demo.
- Match the surrounding code. Use TypeScript, React functional components, and Tailwind.
- Keep to the files this issue needs. Teammates work in parallel.
- Fake it where the demo allows (seed data, hardcoded config). Say so in the PR.

## 5. Verify

Run whatever the repo has: typecheck, lint, tests, build (check `package.json` scripts). Then run the app and see the change work.

Before committing, scan the diff for secrets: `git diff main | grep -nE 'sk-|pk_|api[_-]?key|secret|\.env'`. **The repo is public.**

If a check fails, fix it or report it. Never claim green without output.

## 6. Open the PR

```bash
git add <files> && git commit -m "<what now works>"
git push -u origin HEAD
gh pr create --fill --body "Closes #<n>

<what now works, how to try it, what was faked>"
```

**Do not merge.** Merging needs the user's approval.

## 7. Report

- The PR link.
- What now works, and how to try it in one command.
- One next action — usually: "Ask a teammate to review PR #x".
