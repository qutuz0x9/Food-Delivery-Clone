# Team Lead Guide

How to use the `/team-lead` skill to practise working in a real team: a Tech Lead gives you issues, you build them on
branches, open PRs, and the lead reviews and merges them, all on real GitHub.

You don't need to read it all now. Read **Start here**, keep the **Cheat sheet** open, and come back to a section
when you reach that step.

## Contents

1. [Start here](#1-start-here)
2. [Cheat sheet](#2-cheat-sheet)
3. [What the skill simulates](#3-what-the-skill-simulates)
4. [One-time setup](#4-one-time-setup)
5. [A sprint from start to end](#5-a-sprint-from-start-to-end)
6. [The review: what the lead checks](#6-the-review-what-the-lead-checks)
7. [Standup: reading the board](#7-standup-reading-the-board)
8. [Surprises](#8-surprises)
9. [Watching it in GitQut](#9-watching-it-in-gitqut)
10. [The Team Lead Log](#10-the-team-lead-log)
11. [The rules of the game](#11-the-rules-of-the-game)
12. [Questions](#12-questions)
13. [Where things live](#13-where-things-live)

## 1. Start here

If you read only this section, you can use the skill well.

1. **Start every session with `/team-lead status`.** It shows the sprint board and suggests **one** next step. Do
   that step.
2. **One issue at a time.** Run `/team-lead start <issue>`, build it, open a PR, run `/team-lead review <pr>`. Don't
   start a second issue while the first one waits for a review.
3. **The issue is the definition of done.** Its acceptance criteria are exactly what the review checks. Read them
   before you write code, and tick them in your head before you open the PR.
4. **Write `Closes #<issue>` in every PR body.** Without it the review blocks the PR, and the issue doesn't close when
   the PR is merged.
5. **Changes requested is normal.** Real PRs often need a second round. Fix the blocking items, push, and run
   `/team-lead review <pr>` again.
6. **Measure yourself by "merged on the first round".** The log tracks it, and it should go up sprint after sprint.

## 2. Cheat sheet

| Command | Use it when | What happens |
| --- | --- | --- |
| `/team-lead setup` | once per repo | checks `gh` and the merge rules, creates the labels, creates the vault log |
| `/team-lead plan` | a sprint ends, or there is no sprint yet | closes the old sprint, reads the project, proposes 3–4 issues, you pick, they're created |
| `/team-lead status` | at the start of every session | the board: To do / In progress / In review / Changes requested / Done |
| `/team-lead` | same as `status` | |
| `/team-lead start <issue>` | you pick up an issue | linked branch from `main`, a "picked up" comment, hand-off to `/feature-build` |
| `/team-lead review <pr>` | your PR is open (or you pushed fixes) | waits for CI, reviews in a fresh agent, posts the verdict, merges if approved |
| `/team-lead surprise` | you want a curveball | a requirement change or a real bug filed against merged work |

**The loop for one issue:**

```txt
/team-lead start 8  →  /feature-build build  →  commits "Refs #8"  →  push  →  PR "Closes #8"
        →  /team-lead review 12  →  APPROVED: merged, #8 closed
                                 →  CHANGES REQUESTED: fix, push, review again
```

## 3. What the skill simulates

| Real team | In the simulation |
| --- | --- |
| A lead plans the sprint | `plan` reads the spec, the contract, the roadmap and the git history, and proposes issues |
| Work is tracked in issues | real GitHub issues with acceptance criteria, `priority:*` and `size:*` labels, assigned to you |
| A sprint has a deadline | a GitHub milestone `Sprint N`, due in 7 days |
| You work on a branch | `start` creates a branch linked to the issue (`gh issue develop`) |
| A teammate reviews your PR | a fresh reviewer agent reads only the diff, the issue and the project rules |
| The lead merges | after APPROVED and green CI, a squash merge with a clean message |
| Plans change | `surprise`: a requirement change or a bug report |
| Standups | `status`: what's done, what's blocked, what's at risk |

The lead is **one persona**: professional, brief and friendly. It plans, reviews and merges, but never writes your
feature code. The build happens in `/feature-build` (or by you).

Everything is posted with `gh`, so it appears under **your** GitHub account. That's why every issue ends with
`Filed by the Tech Lead (simulated)` and every comment starts with `[Tech Lead]`: anyone reading the repo can tell it's
a simulation.

## 4. One-time setup

Run `/team-lead setup` once in a repo. It does four things:

1. **Checks `gh`**: you're logged in, and the repo has a GitHub remote.
2. **Reads the merge rules** (the ruleset on `main`) and tells you what to fix. You fix it yourself:
   - **Required approvals must be 0.** GitHub never lets you approve your own PR, so with 1 approval nothing can merge.
   - **Required status checks should list your CI jobs** (`lint-and-build`, `conventional-commits`). An empty list
     looks like protection but enforces nothing.
3. **Creates the labels** after you say yes: `priority:high/medium/low`, `size:S/M/L`, `team-lead`, `scope-change`.
4. **Creates the vault log**: `04- Projects/<project>/Team Lead Log.md`.

It's safe to run again: labels are updated, not duplicated.

## 5. A sprint from start to end

### Step 1: Plan the sprint

Run `/team-lead plan`. The lead:

- closes the previous sprint, if one is open: it summarises it, moves unfinished issues to the new sprint and closes
  the old milestone
- reads the project: `README`, `CLAUDE.md`, the API spec, the contract, the roadmap note, `TODO`s, open issues and recent
  merges
- proposes **3–4 issues** in a table: title, type, priority, size, why now, short acceptance criteria

You pick which ones to create. **Nothing is created before you pick.** Then you get the milestone, the issues and a
kick-off message that says which issue to start first.

Sizes: **S** ≈ half a day, **M** ≈ 1–2 days, **L** ≈ 3+ days.

### Step 2: Start an issue

```sh
git switch main && git pull
```

Then run `/team-lead start <issue>`. It:

- creates a branch linked to the issue (`feature/...`, `fix/...` or `chore/...`) and checks it out
- comments on the issue: "Picked up by @you, branch `...`"
- suggests `/feature-build build` with the issue's title and acceptance criteria

### Step 3: Build it

Build in `/feature-build` as usual. Commit with `Refs #<issue>` in the footer:

```txt
feat(auth): add the authenticate middleware

Refs #8
```

`Refs` links the commit to the issue without closing it. Branch commits get squashed at merge time, so don't polish
them.

### Step 4: Open the PR

Run the checks CI runs, then push and open the PR:

```sh
npm run lint && npm run lint:api && npm run build
git push -u origin <branch>
gh pr create --web
```

- **Title:** the same as the issue title, in `type(scope): summary` form. The `pr-title` check fails otherwise.
- **Body:** the PR template fills itself in. Write `Closes #<issue>` under **What**, tick the type, tick only the
  checklist items that are true, and fill **How to test**.

### Step 5: Ask for the review

Run `/team-lead review <pr>`. The lead:

1. waits for CI (`gh pr checks --watch`); a red check is a blocking finding
2. hands the PR to the **reviewer agent**, which reads the diff, the issue and the project rules
3. posts the review on the PR as a comment: `[Tech Lead review] Round N`
4. on **APPROVED** with green CI: squash-merges with a clean message, deletes the branch, and the issue closes
5. on **CHANGES REQUESTED**: lists the blocking items; you fix them, push, and run `review` again

After a merge:

```sh
git switch main && git pull
```

### Step 6: Repeat, then close the sprint

Start the next issue. When the week ends, run `/team-lead plan` again: unfinished issues carry over and the summary
goes in the log.

## 6. The review: what the lead checks

The review comment has a fixed shape:

```md
## [Tech Lead review] Round 1

**Verdict: CHANGES REQUESTED**

### Blocking
1. `src/middlewares/authenticate.ts:18`: an expired token returns 500 → it should be the 401 envelope

### Suggestions (non-blocking)
- `src/middlewares/authenticate.ts:5`: `tok` → `token` reads better

### Acceptance criteria
- [x] reads the Bearer header
- [ ] 401 for an expired token: returns 500
```

**Blocking** (must be fixed before merge):

- a bug: wrong logic, a missing edge case from the criteria, a missing `await`, the wrong status code
- a security problem: a missing auth or role check, leaking `passwordHash` or tokens
- an acceptance criterion not met
- breaking the project rules (`CLAUDE.md`, `.claude/rules/`), or changing a route without updating `docs/api/`
- red CI
- no `Closes #<issue>`, or unrelated changes in the same PR

**Suggestions** (nice to fix, never block): naming, small refactors, style the linter doesn't check.

In round 2 and later, the lead first checks whether each earlier blocking item is fixed, and doesn't raise new nits
about code you didn't touch.

## 7. Standup: reading the board

`/team-lead status` puts every sprint issue in one column:

| Column | Means | Your move |
| --- | --- | --- |
| **To do** | open, no branch, no PR | `/team-lead start <issue>` when it's next |
| **In progress** | linked branch, no PR yet | finish it and open the PR |
| **In review** | open PR, not reviewed since your last push | `/team-lead review <pr>` |
| **Changes requested** | the latest review blocks, no new commits yet | fix the blocking items, push |
| **Done** | closed by a merged PR | nothing |

It also shows the days left and what's at risk ("2 days left, #10 hasn't started"), and gives **one** next step.

## 8. Surprises

Real plans change. At most **once per sprint** the lead throws one of these (on its own during `status`, or when you
run `/team-lead surprise`):

- **Requirement change:** an issue you haven't finished gets new acceptance criteria and the `scope-change` label, with
  a comment explaining why. If the change would need a contract change, the lead asks you instead of deciding.
- **Bug on merged work:** a `bug` issue against code merged this sprint, only for a **real** gap the lead can point to
  (file, line, the input that breaks it). If there's no real bug, it offers a small follow-up improvement or skips the
  surprise. It never invents a bug in code that works.

## 9. Watching it in GitQut

Open GitQut (`gitq`) and press **`@`** for the GitHub screen.

| You want to see | Where |
| --- | --- |
| your sprint issues | **Issues → Assigned**: ▲ high, ■ medium, ▼ low priority, then the S/M/L size |
| your open PR and its checks | **Pull Requests → Mine**: ✓ / ✗ / ↻ next to the title |
| the lead's verdict | select the PR: the preview shows a `Tech Lead · Changes requested · round 2` badge, and the activity feed marks lead comments with ◆ |
| that it merged | **Pull Requests → Merged** |
| Dependabot PRs | **Pull Requests → All open** |

Useful keys there: `[` `]` change the filter, `space` on an issue creates a linked branch, `o` opens the item in the
browser, `c` comments. The screen refreshes every minute and when you switch back to the terminal.

## 10. The Team Lead Log

The vault note `04- Projects/Food Delivery Clone/Team Lead Log.md` keeps the history:

- **Stats:** sprints, issues merged, % merged on the first round, average review rounds, surprises
- **One section per sprint:** each issue with its priority, size, PR, rounds, result and **feedback themes**
- **The sprint summary**, written when the sprint closes

Read the feedback themes column every few sprints. A theme that keeps coming back ("missing 401 path", "spec drift")
is the thing to add to your feature-build Design Checklist.

## 11. The rules of the game

1. **Nothing is created on GitHub without your yes**: you pick the issues in `plan` and approve the labels in `setup`.
   Merging after APPROVED is agreed by design.
2. **The lead never changes repo settings.** It tells you what to change.
3. **The lead never force-pushes or rewrites history,** and only deletes the branch of a PR it just merged.
4. **One issue, one branch, one PR.** Unrelated fixes get their own issue.
5. **The repo's conventions win** over the skill's defaults: commit style, branch names, the PR template, `CLAUDE.md`.
6. **Body files are written outside the repo** (a temp folder), so they can't be committed by accident.

## 12. Questions

**The merge button is grey: "Review required".**
The ruleset requires an approval. Set required approvals to 0 (see [One-time setup](#4-one-time-setup)).

**The review blocked my PR for "no Closes #".**
Edit the PR body, add `Closes #<issue>`, then run `/team-lead review <pr>` again.

**CI is red. Will the lead still review?**
Yes, but red CI is a blocking finding, so the verdict will be CHANGES REQUESTED. Fix CI first to save a round.

**Can I disagree with a blocking item?**
Yes. Reply on the PR with your reason, then run `review` again. The reviewer reads the earlier rounds.

**I didn't finish the sprint.**
That's fine. `plan` moves unfinished issues to the next sprint. The log shows it, which is the point.

**Does it work in other repos?**
It's a project skill, so it only loads in this repo. To use it elsewhere, copy `.claude/skills/team-lead/` and
`.claude/agents/team-lead-reviewer.md` into that repo's `.claude/`, then run `/team-lead setup` there.

**Why does everything show my name?**
`gh` uses your account. The `[Tech Lead]` markers and the `team-lead` label mark the simulated parts.

## 13. Where things live

| What | Where |
| --- | --- |
| The skill | `.claude/skills/team-lead/SKILL.md` |
| Issue, review, squash and log formats | `.claude/skills/team-lead/references/formats.md` |
| The reviewer agent | `.claude/agents/team-lead-reviewer.md` |
| Issues, PRs, milestones, labels | GitHub: `qutuz0x9/Food-Delivery-Clone` |
| The sprint history | vault: `04- Projects/Food Delivery Clone/Team Lead Log.md` |
| How the issue workflow works | vault: `03- Development/Configurations/06- Issue Workflow (Web and gh CLI).md` |
| The build step | [FEATURE-BUILD-GUIDE.md](FEATURE-BUILD-GUIDE.md) |
