# Feature Build Guide

How to use the `/feature-build` skill to grow from junior to mid level, from the first command to a finished feature.

You don't need to read it all now. Read **Start here**, keep the **Cheat sheet** open, and come back to a section
when you reach that step.

## Contents

1. [Start here](#1-start-here)
2. [Cheat sheet](#2-cheat-sheet)
3. [What the skill trains](#3-what-the-skill-trains)
4. [Before a feature: pick the right kind](#4-before-a-feature-pick-the-right-kind)
5. [A feature from start to end](#5-a-feature-from-start-to-end)
6. [When you feel late](#6-when-you-feel-late)
7. [Ship mode](#7-ship-mode)
8. [Practice rounds](#8-practice-rounds)
9. [Your notes: which one to open when](#9-your-notes-which-one-to-open-when)
10. [Progress: how to read it](#10-progress-how-to-read-it)
11. [The rules of the game](#11-the-rules-of-the-game)
12. [What went wrong before, and what to do now](#12-what-went-wrong-before-and-what-to-do-now)
13. [Questions](#13-questions)
14. [Where things live](#14-where-things-live)

## 1. Start here

If you read only this section, you can use the skill well.

1. **Start every session with `/feature-build progress`.** It shows what is open and suggests **one** next step. Do
   that step.
2. **One piece per sitting.** Each piece has a time box of 25–60 minutes. Write it, run its tests, then run
   `/feature-build review <piece>` right away. Don't wait for the end of the feature.
3. **When you feel late, type `/feature-build late`.** Never skip everything. The skill shrinks the work to the one
   piece that matters most. One piece written is worth more than four pieces skipped.
4. **Don't read every note.** While coding, open only the **To-Do** note. In the other notes, read the summary at the
   top and the titles; open a folded part only when its title surprises you.
5. **Do the practice rounds.** Solo, bootstrap, bug hunt and PR review are where take-home readiness shows. The skill
   tells you when one is due.
6. **You don't hand-write every endpoint.** Learn the first endpoint of each roadmap stage. Repeat one or two similar
   ones for speed. `ship` the rest.
7. **Measure yourself by the pieces you write per week,** not by the dates in a task schedule.

## 2. Cheat sheet

| Command | Use it when | Time |
| --- | --- | --- |
| `/feature-build progress` | at the start of every session | 2 min |
| `/feature-build <feature>` | you start a new learning feature | design 10–15 min, then 1–3 h of pieces |
| `/feature-build review <piece>` | you finished one piece and its tests are green | 5 min |
| `/feature-build review` | all pieces are done | 10–15 min |
| `/feature-build final-review` | you want the correct version of every piece (counts as assisted) | 15 min |
| `/feature-build late` | you feel late, or you want Claude to write your piece | 2 min |
| `/feature-build ship <feature>` | the project must move, and you don't want to learn this one | Claude builds it |
| `/feature-build extend <change>` | you change a feature that already exists | like a small feature |
| `/feature-build solo` · `solo done` | a timed take-home task, no AI | 60–120 min |
| `/feature-build bootstrap` · `bootstrap done` | build a base app from an empty folder, no AI | 30 min |
| `/feature-build bug-hunt` · `bug-hunt check` | find and fix a planted bug | 45 min |
| `/feature-build pr-review` · `pr-review check` | review a teammate's PR with planted problems | 30 min |
| `/feature-build drill [concept]` · `drill check` | practice one JavaScript/TypeScript pattern | 5–10 min |

**Things you can say at any time, without a command:**

| Say | What happens |
| --- | --- |
| `hint for <piece>` | one hint, one level higher each time you ask |
| `how do I call <API>?` | a free example on a different case; it is **not** a hint |
| paste an error or a failing test | Claude explains what it means, where to look and why; it doesn't fix your code |
| `I want to write the controller myself` | you get that piece too, Guided, for this feature only |
| `skip` · `back` · `I don't know` | during the design interview: leave a question empty, go back, or say you don't know (all fine) |

## 3. What the skill trains

A mid-level engineer can do 5 things. Every mode trains some of them:

| Goal | What it means | Trained by |
| --- | --- | --- |
| 1. Design | contract, data, errors, transactions, edge cases, tests | the design interview |
| 2. Implement | write it without step-by-step help, even from an empty folder | your pieces, solo, bootstrap |
| 3. Test | choose what to test, and write good tests | the test list, your test pieces |
| 4. Read, debug, review | work in code you didn't write | bug hunt, PR review, extend |
| 5. Explain | say why, as in an interview | explain-backs, PR descriptions, "why" questions |

**Who writes what:**

- **You:** the design, your final flow, and the core logic: service methods and transactions, Zod rules, repository
  queries, translating database errors. Sometimes also 1–2 tests, one foundation, or one refresher.
- **Claude:** everything that would teach you nothing new: routes, controllers, wiring, mappers, types, migrations,
  middleware, error classes, config and the other tests. You never fix boilerplate.

## 4. Before a feature: pick the right kind

There are three kinds of feature. Pick with your roadmap (`Features/00- API Roadmap.md` in the vault):

| Kind | When | What you do |
| --- | --- | --- |
| **learn** | the first endpoint of a roadmap stage (its new idea) | the full design interview and your pieces |
| **repeat** | the same shape as a feature you already finished (a second CRUD, another actor's login) | a short design ("what is different?"), your pieces with no steps; fast, builds speed |
| **ship** | everything else you need for the project | nothing; Claude builds it (see [Ship mode](#7-ship-mode)) |

**The difficulty check.** Before the design, the skill counts the new concepts the feature needs. At most 2 new
concepts and 3 Guided concepts fit in one feature. If it's too much, it offers to split the feature, give a piece to
Claude (that's **planned**, not a skip), or do an easier feature first. You decide.

## 5. A feature from start to end

### Step 1: Start the feature

```txt
/feature-build add a delivery address
```

The skill reads `package.json` and the closest feature, checks the difficulty, creates the feature folder in the vault,
and tells you the **interview mode**.

### Step 2: The design interview

| Mode | When | Sections | Time |
| --- | --- | --- | --- |
| Full | the feature writes data | all 6 | about 15 min |
| Short | the feature only reads | 1, 2, 3, 6 | about 10 min |
| Repeat | a repeat feature | only what's different | 5–10 min |

**The 6 sections:**

1. **Contract and access:** method, route, every input (body, params, query, headers, cookies), who may call it and
   how the server knows, the success status, the response fields.
2. **Flow:** you tell the whole flow in your own words, in one go. You get up to 5 hints about where to look, then you
   may revise it once. Always think: *for each row I read, what states can it be in (missing, deleted, suspended,
   expired, used)?*
3. **What can go wrong:** one list of every error and edge case, each with its status code and which layer throws it.
4. **Data and rules** (full mode): tables, columns and where each value comes from, constraints, input rules.
5. **Writes and races** (full mode): what must succeed or fail together, what runs after the commit, two requests at
   the same moment.
6. **Tests:** test names only, one per line, like `it("rejects a suspended account")`.

**How to answer well:**

- Answer with the same numbers: `1. POST`, `2. /api/v1/customers/me/addresses`.
- Short answers are fine. "I don't know" is a real answer and helps the comparison show what to learn.
- Each section starts with **"Your checklist asks:"**: 1–2 questions you missed in past features. They are your own
  lessons, so use them.
- Things the project already decides (the `/api/v1` prefix, the response envelope, the error shape) are not asked.
- Look things up while you answer: `src/prisma/contract.prisma`, `.claude/rules/domain-rules.md`, the spec in
  `docs/api/`. That is part of real design work.

### Step 3: Read the comparison

Claude compares every answer with its own design. In chat you see only the score, the must-fix gaps and your
strengths. The full comparison is in the **Design Review** note.

- **Verdicts:** ✅ Match · ✅ Different, valid (your design is used) · 🟡 Different, risky (you choose) · 🔴 Missed ·
  🔴 Wrong.
- **Score:** points ÷ items × 10. **Strong** = no must-fix gap and 8 or more. **Needs work** = 3+ must-fix gaps or
  under 5. **OK** = the rest.
- **How to read the note:** the summary, then **Fix first** (open by default), then only the titles. Open a 🔴 or 🟡 item
  when you don't understand its title.

Every miss goes into your **Design Checklist**, as a question. After you get an item right in two later features, it
moves to **Learned**.

### Step 4: Write your final flow

You rewrite the flow yourself, as a numbered list from request to response, fixing what you missed. Claude checks it
and gives hints, not answers (at most 2 rounds). Your flow goes into plan §3, in your words. This is where the design
becomes yours.

### Step 5: Approve the plan with `go`

The plan is in `.learning/plans/<feature>.md`. Chat shows only section 10, **My part**: your pieces, in order, each with
a time box. Reply:

```txt
go
```

Or add your time estimate for each piece, in minutes. It's optional, and it trains estimating:

```txt
go 20 40 45 15
```

### Step 6: The scaffold

Claude creates the branch `feature/<feature>`, writes all its own files and tests, and creates your pieces. Each piece
in the code is a single line plus a stub:

```ts
async getProfile(userId: string): Promise<CustomerProfileResponse> {
  // LEARN-TODO (core, guided): CustomersService.getProfile
  throw new Error("LEARN-TODO: CustomersService.getProfile");
}
```

Everything you need to write it is in the **To-Do** note, not in the code. Claude never commits, pushes or merges
without asking.

### Step 7: Write your pieces

Open the **To-Do** note. For each piece, visible: where (file and signature), the goal, the run command, and "done
when". Folded, so you try first:

- **Steps** (Guided pieces only)
- **What you need** (helpers, fields, errors, rules)
- **Tests that cover it** (read their `expect` lines first: they say exactly what the piece must do)

**The loop for one piece:**

1. Read the goal and the tests' `expect` lines.
2. Try to write it. Open **Steps** or **What you need** only when you're stuck.
3. Run its tests (the To-Do note has the exact command).
4. Run `npm run lint`: an unused variable often means a missing step.
5. `/feature-build review <piece>`.

**The hint ladder**, when you're stuck (`hint for <piece>`):

| Level | You get | Counts as |
| --- | --- | --- |
| 0 | how to call an API, on a different example | free, not a hint |
| 1 | a question that points at the idea | independent |
| 2 | the pattern or helper to use | independent |
| 3 | pseudo-code, step by step | assisted |
| 4 | the solution, in chat only (type it, don't paste it) | assisted |

Ask for level 0 as often as you want. Not knowing an API is normal.

### Step 8: Piece review, the same day

`/feature-build review <piece>` runs lint, the type check and the tests for that piece, then gives you 1–2 good
points, must-fix and should-fix items as hints, and a verdict: `Approved` or `Another pass needed`. If you gave an
estimate, it asks how long it really took. An approved piece counts right away.

### Step 9: Full review

When all pieces are done: `/feature-build review`.

- **Explain-back:** if the feature has an explain-back foundation, you answer its 3 questions first. **The feature
  can't be approved without your answers.** Wrong answers don't block; missing answers do. It takes about 15 minutes.
- You get the test results, lint findings, must-fix and should-fix items (as hints), a "why" question about your code
  and a **SQL check** (you write the SQL you expect the ORM to run, then compare it with the real one).

### Step 10: When approved, the PR description

To mark the feature `done`, write:

- a commit message, Conventional Commits style: `feat(customers): get my profile`
- a short PR description: what, why, how you tested it, and one risk or trade-off
- your answer to the "why" question

This is interview practice: any honest answer counts. Claude gives 2–3 lines of feedback and commits only if you ask.
Then it tells you what changed in your progress, for example "`include relations` moved to Unguided".

### Step 11 (optional): Final review

`/feature-build final-review` scores every piece out of 10 and shows the **correct version** of each one, built and
tested in a copy, never in your files. You type the fixes yourself. Every piece it has to correct counts as
**assisted**, so use `review` first and `final-review` last.

## 6. When you feel late

Type `/feature-build late`, or just say "write it for me". The skill asks one question:

> What's blocking you? 1) I'm stuck 2) I'm short on time 3) I want the project to move

| Your answer | What happens |
| --- | --- |
| 1. Stuck | the next hint level, or the piece is split so you write only its first part |
| 2. Short on time | the **minimum dose**: you keep the one most important piece, with a 25–45 min time box; Claude writes the others |
| 3. The project must move | Claude writes the rest, then offers a 10-minute **own it** task: 2 "why" questions about its code, or retype its key method from memory |

If you insist, Claude writes it, with no argument. It is recorded as a skip, with the reason. Skips are information:

- many `stuck` skips → the features are too hard, so the next ones get easier
- many `time` skips → the pieces are too big, so they get smaller
- many `project` skips → you need more `ship` and `repeat`, fewer `learn` features

With no feature open, `late` shows your last 14 days ("5 pieces written, 2 reviews approved, 1 drill") and offers the
smallest next step.

## 7. Ship mode

`/feature-build ship <feature>` is for work you need but don't want to learn now. Claude writes a short plan, waits for
`go`, then builds everything with tests on its own branch. It writes only a short Overview note. Ship features never
count as skipped, and never count in your learning numbers. After 2 ship features in a row, the skill suggests a
learning feature next.

## 8. Practice rounds

After every 2 learning features, one practice round is due, in this order:

```txt
solo → bug hunt → bootstrap → PR review → extend → (again)
```

You can say `later` **once** per round. After that, a new learning feature starts the practice round instead.
`ship` and `review` still work, so the project and open work can always move.

### Solo: a timed take-home

- `/feature-build solo`, then `solo done` when you finish.
- **Your first solo is a baseline:** 60 minutes, one resource (create, list, get by id), no auth. It's a measure, not
  a test; a weak result shows what to practice.
- Later solos: 90 minutes by default (60 or 120 if you choose), a new domain (bookings, loans, events...).
- An empty folder outside the project. Classic Prisma (`schema.prisma` + `@prisma/client`), like most companies.
- You write everything. Docs and search are allowed; AI code help is not.
- Graded like a hiring reviewer: Works, Structure, Validation and errors, Data and queries, Tests, Code quality, Time.
  Verdict: `Would pass`, `Borderline` or `Not yet`, with the top 3 things to change.

### Bootstrap: an app from an empty folder in 30 minutes

- `/feature-build bootstrap`, then `bootstrap done`.
- The target: `createApp()` and a server file, `AppError` with two subclasses and an `errorHandler`, a Zod `validate`
  middleware, one module (router → controller → service → repository, wired with constructor injection; an in-memory
  repository is fine), `POST` and `GET /:id` with one rule and one 404, and a passing Supertest test for each route.
- Each foundation you write correctly here is marked `written`. Repeat it every few weeks until all parts are correct
  in under 30 minutes.

### Bug hunt: find a planted bug

- `/feature-build bug-hunt`, then `bug-hunt check`. About 45 minutes.
- You get a bug ticket in `.learning/bug-hunts/<n>.md` (what users see, steps, expected vs actual, never the cause), on
  the branch `learn/bug-hunt-<n>`. Don't read that branch's git log.
- Your job: reproduce it, find the root cause, fix it, and add a regression test that fails without the fix.
- Levels 1 → 3: from a failing test, to a symptom only, to subtle bugs (N+1, a swallowed error, a race).

### PR review: review a teammate's code

- `/feature-build pr-review`, then `pr-review check`. About 30 minutes.
- Read `.learning/pr-reviews/<n>.md` and `git diff main...learn/pr-review-<n>`. It hides 3–5 problems: a bug, a
  security or data problem, a test problem, a design problem, and maybe a performance one.
- Write each comment in the PR file: `file:line · must / should / nit · your comment`. Don't open the `.key` file.
- The check counts what you found, what you missed and any false alarms, and shows one of your comments rewritten as a
  model comment.

### Extend: change an existing feature

- `/feature-build extend <change>`. You get only the feature name and the change, not the files.
- You write an impact list: files and layers, the migration and what happens to existing rows, API changes and
  clients, tests, rules, risks. Then it works like a small feature, on the branch `enhance/<change>`.

### Drill: one language pattern

- `/feature-build drill [concept]`, then `drill check`. 5–10 minutes, in `.learning/drills/`, outside `src/`.
- Run it with `npx tsx .learning/drills/<file>.ts` until it prints `All checks passed`.
- The skill offers one when a mistake repeats, or a review finds a JavaScript/TypeScript mistake.

## 9. Your notes: which one to open when

Each feature folder in the vault (`03- Development/Features/NN- <Feature>/`) has up to 5 notes. Every note starts with
a short summary. Details are folded: the titles already say the answer.

| Note | Open it when | Read |
| --- | --- | --- |
| `00- Overview` | you come back to a feature | the summary and **Next** |
| `01- Design Review` | after the interview | the summary, **Fix first**, the titles |
| `02- To-Do` | **while coding: the only note you need** | your current piece |
| `03- Reviews` | after a review | the newest review at the top |
| `04- Final Review` | after a final review | **Type the fixes** |

Shared by all features:

- `Features/00- Design Checklist.md`: your past misses, by interview section. The interview quotes the right part for
  you, so you don't need to reread it all.
- `Features/00- Database/<module>.md`: the module's tables, drawn once and updated when the contract changes.

Feature folders made before the new format (01–07) keep their old notes and numbers. New notes there continue the
numbering (for example `06- Reviews.md`).

## 10. Progress: how to read it

`/feature-build progress` shows three parts, then **one** next step.

1. **Now:** **My code** (pieces you wrote ÷ pieces assigned, over your last 5 finished learning features), your last 14
   days, and a skip-reason signal if there is one.
2. **Mid-level goals:** a table of the 5 goals, each with its evidence and 🔴 🟡 ✅, and what moves it next.
3. **Details:** concepts by stage, foundations left, recurring mistakes, drills, estimates.

**Start checks.** Every command starts with at most 2 one-line checks:

| Check | What it means |
| --- | --- |
| Open work | a feature is `final-reviewed` but not `done` for 7+ days; close it first |
| Comeback | 2+ features in a row were mostly skipped, so the next one gets at most 2 pieces; it ends after one feature with no skips |
| Practice due | a practice round is due (see [Practice rounds](#8-practice-rounds)) |
| Drill due | a repeated mistake has no passed drill yet |

## 11. The rules of the game

**How work is counted:**

| Word | Meaning | Moves a concept up? |
| --- | --- | --- |
| independent | approved, with hints 1–2 at most | yes |
| assisted | hint 3 or 4, or the final review had to correct it | no |
| skipped | Claude wrote your piece after `go` (with the reason) | no |
| planned | a piece moved to Claude before `go` | no, and it's not a skip |

**Concept stages.** Each concept (like "include relations" or "multi-write transaction") climbs these stages:

| Stage | What you get | Moves up after |
| --- | --- | --- |
| Guided | the goal and numbered steps (folded) | 2 independent approvals |
| Unguided | only the goal | 2 independent approvals |
| Graduated | Claude writes it | it comes back as a refresher sometimes; a failed refresher moves it back to Unguided |

**The other tracks:**

- **Design stage:** `questions` (the interview) → `draft` (you write the plan yourself) after 2 Strong full-mode
  rounds.
- **Foundations:** 7 base parts of an app (error classes and errorHandler, validate middleware, controller and router,
  module wiring, data model and migration, mapper and response types, createApp and Supertest). One per feature: you
  write it, or explain it back. Bootstrap can mark them `written` too.
- **Test writing:** on after 2 `done` features; then you write 1–2 test bodies per feature.
- **Refresher:** every 3rd `done` feature, one graduated concept comes back for you to write.
- **Focus:** a concept from a solo weakness or a repeated mistake gets priority until you get it right once.
- **Recurring mistake:** a must-fix that appears in 2+ reviews. It gets a drill, and it's removed after 2 approved
  reviews in a row without it.

## 12. What went wrong before, and what to do now

| Before | Now |
| --- | --- |
| Feeling late → "write it for me" → 9 of 10 pieces skipped in 3 features | `/feature-build late` → keep one piece, 25–45 min |
| Reading every long note from top to bottom | the To-Do note while coding; summaries and titles for the rest |
| Reviewing only at the end of the feature | `review <piece>` after each piece, the same day |
| The errorHandler explain-back left unanswered in 4 features | it blocks approval now; it takes about 15 minutes |
| No solo, bug hunt or PR review in any feature so far | a practice round every 2 features, starting with a baseline solo |
| A hard security feature (refresh token rotation) with Guided concepts | the difficulty check, the roadmap order, and `repeat` for similar features |
| Comparing myself with a dated task schedule | pieces written per week, shown in `progress` |

## 13. Questions

**Can I change who writes a part?** Yes, for the current feature. "I want to write the controller myself" gives you
that piece, Guided. "Write the repository for me" goes through the `late` question.

**A test of Claude's code fails. Is that my problem?** No. Claude's code must be correct. Tell it, and it fixes it.
Only the tests that cover your pieces should fail before you write them.

**My piece needs the test database.** The To-Do note's **Before you start** has the commands:
`npm run test:db:up`, then `npm run test:db:migrate`. Unit tests don't need it.

**Can I stop in the middle of a feature?** Yes. Your state lives in `.learning/progress.md` and the feature's notes.
Next time, `/feature-build progress` shows where you stopped.

**I don't agree with Claude's design.** Say why. If your design is valid, it's marked "Different, valid" and used.
If it's risky, you get the trade-off and you choose.

**Should I use `final-review` on every feature?** No. Use `review` until it's approved. Use `final-review` when you
want to see the full correct versions, knowing that corrected pieces count as assisted.

## 14. Where things live

| What | Where |
| --- | --- |
| The skill | `.claude/skills/feature-build/` (`SKILL.md` and its 7 files) |
| My progress | `.learning/progress.md` |
| Plans | `.learning/plans/<feature>.md` |
| Drills, bug hunts, PR reviews | `.learning/drills/`, `.learning/bug-hunts/`, `.learning/pr-reviews/` |
| Feature notes | vault: `04- Projects/Food Delivery Clone/03- Development/Features/` |
| The roadmap | vault: `Features/00- API Roadmap.md` |
| Business rules | `.claude/rules/domain-rules.md` |
| The data model | `src/prisma/contract.prisma` |
