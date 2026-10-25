# Practice modes

## Extend: change an existing feature

Trains reading code you didn't just write, and thinking about the impact of a change.

1. Give the user only the feature name and the change request. Don't list the files. Finding them is part of the exercise.
2. **Impact analysis.** Create the **Overview** hub and the **Database Diagram** note first (see `notes.md`). The user reads the code, then writes a short impact list:
   - files and layers that change
   - whether a migration is needed, and what happens to **existing rows** (e.g. a new required column on a table that already has data)
   - whether the API contract changes, and whether that breaks existing clients
   - tests to update and tests to add
   - risks
3. **Compare** in a **You vs me** table, with the same verdicts and rating as the design round in `build.md`. Agree on the change. Write the **Design Review** note (see `notes.md`), with the impact list as "My answers".
4. **Plan:** a short plan covering only what changes, using the plan template sections that apply.
5. **Scaffold** (after `go`):
   - Claude makes the boilerplate changes.
   - The user's changes inside existing code get `LEARN-TODO (extend, <stage>)` markers at the exact spot, with no `throw`, so existing behavior keeps working.
   - Update or add tests so they fail until the change is made.
   - The stage follows the concept involved.
   - Write the **Build Log** and **To-Do** notes (see `notes.md`).
6. **Review:** with `/feature-build review`, as usual. Also check that old behavior still works, and that the migration is safe for existing data.

Record it in the Features table with the type `extend`.

## Bug hunt: find and fix a planted bug

Trains debugging: reproduce, find the root cause, fix, and add a regression test.

### Setup: `/feature-build bug-hunt`

1. **Check the preconditions:**
   - there is a git repository with a clean working tree
   - at least one feature is `done` and has tests

   If not, say what's missing and stop.
2. **Choose the bug level** from `.learning/progress.md` (start at level 1). Choose one realistic bug in a done feature:

   | Level | Bug examples | How it shows |
   | --- | --- | --- |
   | 1 | missing `await`, wrong status code, wrong error class, inverted condition, missing trim/lowercase | an existing test fails |
   | 2 | password hash leaked in the response, one write not using the transaction client, unique violation not translated (becomes 500), off-by-one in pagination, case-sensitive email lookup | the tests pass; the symptom is in the ticket |
   | 3 | N+1 queries, a `catch` that swallows the error, a race condition window, a wrong date/timezone calculation | subtle; the ticket shows logs or timing |

3. **Plant the bug.** Remember the current branch name. Then:
   - create the branch `learn/bug-hunt-<n>`
   - make one small change
   - commit it with the message `bug-hunt <n> setup`

   Don't touch the tests. Don't add comments that point to the bug.
4. **Write the ticket** to `.learning/bug-hunts/<n>.md`, like a real bug report:
   - what users see
   - steps to reproduce
   - expected vs actual result
   - logs, if they help

   Never write the cause.
5. **Tell the user:**
   - the ticket
   - their job: reproduce it, find the root cause, fix it, and add a regression test that fails without the fix
   - the rule: don't look at the git log of this branch
   - the hint ladder is available
   - when done, run `/feature-build bug-hunt check`

### Check: `/feature-build bug-hunt check`

1. Read the ticket. Read the planted bug with `git show` on the setup commit, and the user's fix with `git diff` against it.
2. **Run the full test suite.**
3. **Ask for the root cause:** in 2–3 sentences, what was the cause and why did it produce that symptom? Skip this if they already explained.
4. **Verify the regression test** fails without the fix. Do this only if the user's changes are limited to the fix and test files:
   - stash only the source fix (`git stash push -- <source files>`)
   - run the new test
   - restore the fix (`git stash pop`)
5. **Give feedback:**
   - Is the fix at the root cause, or does it only hide the symptom?
   - Is the regression test good?
   - How long did it take, and which hints were used?
6. **Record** the hunt in `.learning/progress.md`, then follow `progress-rules.md` for the level.
7. **Cleanup:** ask before switching back to the original branch and deleting `learn/bug-hunt-<n>`.

## Drill: short JavaScript/TypeScript practice

Trains the language basics behind backend code: one small pattern, 5–10 minutes, in a scratch file outside `src/`, so
the project is never touched. Use it for recurring mistakes and for Must fixes that were language mistakes (see the
Language concepts in `progress-rules.md`).

### Start: `/feature-build drill [concept]`

1. **Pick the concept:** the argument; otherwise the oldest recurring mistake without a passed drill; otherwise the
   Language concept with the most recent Must fix.
2. **Write the drill file** `.learning/drills/NN-<concept-slug>.ts` (`NN` continues the folder's numbering):
   - A header comment: the concept, the review or mistake it comes from, and the goal in one line.
   - 1–3 tiny exercises, each a function with a `LEARN-TODO (drill)` marker and a `throw new Error("LEARN-TODO")`.
     Use a **new, small context**, not the user's project code (e.g. a shop's `OutOfStockError`, not
     `EmailAlreadyExistsError`), so the user practices the pattern, not the answer they already saw.
   - At the bottom, checks with `node:assert/strict` that print `✓ <check>` for each pass, and end with
     `All checks passed`.
   - It must run with `npx tsx .learning/drills/NN-<concept-slug>.ts` and fail until the exercises are done.
3. **Tell the user** in 3 lines: the file, the run command, and "`/feature-build drill check` when the checks pass".
   The hint ladder applies; level 0 (API lookup) is free.

Example of an exercise for "classes and instances":

```ts
// LEARN-TODO (drill): throw the right error when stock is 0, so the caller can catch it with instanceof
export function reserveItem(stock: number): number {
  throw new Error("LEARN-TODO");
}
```

### Check: `/feature-build drill check`

1. Run the drill file. All checks must pass.
2. Read the code: is it the pattern, or a workaround that only satisfies the checks?
3. One "why" question about it, in an interview style (e.g. "What does `instanceof` check?").
4. **Record** it in the Drills table of `.learning/progress.md`: `passed` (hints 0–2), `assisted` (hint 3 or 4), or
   `not yet`. A pass counts as an independent approval for the Language concept.

## Solo: timed take-home task

Trains the real test: a blank folder, no AI, a time limit. It's like a startup take-home task.

### Start: `/feature-build solo`

1. **Propose a task** sized for the time box (default 90 minutes; the user may choose 60 or 120).
   - Use a domain different from recent solos and features (products, bookings, library loans, orders, events...), so nothing is memorized.
   - Use concepts the user has at the Unguided or Graduated stage, plus one Guided concept as a stretch.
2. **Write `SOLO-TASK.md`** in an empty folder the user chooses, outside the main feature work, with:
   - context
   - the required endpoints
   - business rules
   - validation requirements (as requirements, not code)
   - acceptance criteria
   - what is evaluated
   - stretch goals
   - the time box
   - the stack: Node.js + Express, Prisma + PostgreSQL, Zod, Vitest
3. **Record the start time** (run `date`) in `.learning/progress.md` under Solo sessions, as in progress.
4. **Tell the user** the rules and the timer:
   - They write everything: setup, code and tests.
   - Docs and search are allowed. AI code help is not.

During the session:

- If the user asks for code help, remind them it's a solo session.
- Answer only questions about the task itself, like an interviewer would.
- Offer to end the session early if they want. That's fine, and it's recorded as incomplete.

### Finish: `/feature-build solo done`

1. **Record the end time** and the time used.
2. **Run** their tests and type check. Check each acceptance criterion by running the app or a temporary script, and delete any temporary files afterwards.
3. **Grade it like a hiring reviewer.** Rate each area Strong / OK / Weak, with one line on why:
   - **Works:** acceptance criteria met
   - **Structure:** layers and separation
   - **Validation and errors:** rules, status codes, error shape
   - **Data and queries:** model, constraints, efficient queries, transactions
   - **Tests:** coverage of important behavior, test quality
   - **Code quality:** naming, readability, types
   - **Time:** finished in time, priorities when time ran short
4. **Give the overall verdict:** `Would pass`, `Borderline` or `Not yet`, plus the top 3 things that would change it.
5. **Update progress:**
   - Record the session.
   - The top weaknesses become **focus** concepts.
   - A concept clearly done well counts as one independent Unguided approval. If it's still Guided, it moves to Unguided.
6. **Don't fix their code.** The hint ladder is available after the session if they want to improve it.
