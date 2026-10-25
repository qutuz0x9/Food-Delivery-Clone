# Review mode

## Steps

1. **Find the feature:** from the argument, or the latest `in progress` feature in `.learning/progress.md`. Read its plan.
2. **Find unfinished work:**
   - search for `LEARN-TODO` markers whose stubs still throw
   - search for `it.todo` tests the user was assigned

   Review the finished pieces, and list the unfinished ones.
3. **Explain-back:** if this feature has an explain-back foundation and the user hasn't answered the 3 questions yet, ask them now. Wait for the answers before the rest of the review.
   - Answers are mostly right → mark the foundation `explained`.
   - Otherwise → explain the gaps and keep it `todo`. It comes back in a later feature.
4. **Run** the type check (TS), lint and the full test suite. In the note, open the Investigation with
   **"What lint already told you"**: the lint findings in the user's pieces, and the bug each one points at (an
   unused `tx` is a missing argument, an unused import is a missing step). This builds the habit of running lint
   before asking for a review.
5. **Read the user's code.** Check the recurring mistakes in `.learning/progress.md` first, then:
   - **Correctness against the plan:** flow, status codes, error classes thrown.
   - **Edge cases** from plan sections 8 and 11.
   - **Async:** no missing `await`, no floating promises, no `try/catch` that swallows errors or hides the real one.
   - **Transactions:** every write inside the transaction uses the transaction client, nothing slow or external runs inside (emails, HTTP calls), and failures roll back.
   - **Prisma queries:** use unique lookups where possible, select only what's needed, don't load many rows to check one, no N+1 in loops. Prisma errors are translated where the plan said.
   - **Zod rules:** all rules from plan section 6, with transforms where the plan asks.
   - **Security:** no plain passwords, no password hash or other secrets in responses or logs.
   - **The user's tests:**
     - They test behavior through the public method, not internal details.
     - Arrange / act / assert is clear.
     - The assertion checks the thing the test name promises.
     - The test would fail if the code were broken. Say how you checked.
   - **A written foundation:** correct, and consistent with the rest of the app.
   - **Readability and conventions:** naming, structure, small functions, no `any` in TS.
6. **Write the review note** in the feature's folder, named `NN- (Review) <headline>.md` (see `notes.md`), and update the feature's `00- Overview.md` (the new row, the piece statuses). Use this format inside the note's `## Review` section, and give the user its path with a short summary in chat:
   - **Tests:** X passed, Y failed (list the failing names)
   - **Good:** 1–3 specific things they did well.
   - **Must fix / Should fix / Nice to have:** each item gives `file:line`, the problem as a hint or question, and why it matters. Give no corrected code; the hint ladder applies if they ask.
   - **Verdict:** `Approved` or `Another pass needed`
   - **Check your understanding:** one "why" question about their own code, the kind an interviewer would ask. It does not block approval.
   - **SQL check:** pick the most interesting query the user wrote. Ask them to write the SQL they expect Prisma to run. It does not block approval.
7. **Do not edit the user's code.** If you find a bug in Claude-owned code, fix it and say so.
8. **Language mistakes:** when a Must fix is a JavaScript/TypeScript mistake rather than a backend one (a class
   thrown without `new`, a missing `return`, the wrong call order, a catch that swallows errors), name its Language
   concept from `progress-rules.md`, record it, and end the reply by offering a drill (`/feature-build drill`).

## Piece review: `/feature-build review <piece>`

A quick review of **one** piece, right after the user writes it, so a mistake is caught the same day instead of
piling up until the end of the feature.

1. **Find the piece** by name in the latest `in progress` feature (e.g. `createUser`, `AppError`, `schema`).
2. **Run** lint, the type check and only the tests that cover the piece (the To-Do note lists them).
3. **Read the piece** with the checks of step 5 that apply to it.
4. **Reply in chat, short:** tests for this piece, 1–2 things done well, Must fix / Should fix as hints or
   questions, and `Approved` or `Another pass needed`.
5. **Append it to the note** `NN- (Review) Piece Reviews.md` in the feature's folder (create it on the first piece
   review, numbered like other review notes). One section per review: `## <date> · <piece> · <verdict>`, then the
   same content as the chat reply. Update `00- Overview.md` (the piece's status).
6. **Progress:** an approved piece counts like an approval in a full review (see `progress-rules.md`).

## SQL check (after the user answers)

- **Show the real SQL:**
  - If a database is reachable, run the related integration test or a tiny temporary script with `PRISMA_LOG_QUERIES=1`, then delete the script.
  - Otherwise, show the SQL Prisma would generate and say it's approximate.
- **Compare it with the user's SQL:**
  - what matches
  - what Prisma does differently and why (`LIMIT`, parameters like `$1`, quoted names, the selected columns, separate queries for `include`)
  - whether an index supports this query

## When approved

1. **Commit and PR practice:** ask the user to write a commit message (Conventional Commits, e.g. `feat(auth): register customer`) and a short PR description: what, why, how it was tested, and risks.
   - Give 2–3 lines of feedback.
   - Don't commit for them unless they ask.
2. **Progress:** update `.learning/progress.md` following `progress-rules.md`:
   - concept counts and stages
   - refresher result
   - foundation status
   - recurring mistakes
   - the feature marked `done`
3. **Cleanup:** offer to remove the `LEARN-TODO` markers and step comments, keeping the user's code.
4. **What changed:** tell the user in one or two lines what changed in their progress. Examples: "`find by unique field` moved to Unguided", "Test writing is now on", "Next feature includes a refresher".
