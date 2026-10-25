# Final review mode

`/feature-build final-review` closes a feature. It is the one mode that **shows solutions**: the user gets a score,
the correct version of every step, and a full implementation and guide for anything they didn't finish. The user
types the fixes themselves, so **never edit the user's files** in this mode.

Use `/feature-build review` while the user is still working (hints only). Use this mode when they ask for the
final review, or when every piece is attempted.

## Steps

1. **Find the feature:** from the argument, or the latest feature that is `in progress` in `.learning/progress.md`.
   Read its plan, its To-Do note and its earlier review notes.
2. **Check the To-Do:** for every checkbox in the To-Do note, decide `done`, `partly` or `not done`, with the
   evidence (a test, a file and line, a command result). Don't trust the ticks; check the code.
3. **Run everything:** the type check, the full test suite and lint. Keep the real output.
4. **Build the correct version of every piece in a temporary copy, never in the user's files:**
   - Copy the project into the scratchpad without `node_modules`, `dist` and `.git`, and symlink `node_modules`.
   - In the copy, fix what is wrong and implement what is missing. Keep the user's structure and names wherever they
     were fine, so the difference is only the fix.
   - Run the type check, the tests and lint in the copy. Every correct version shown must pass there.
   - For code no test covers (repository queries, error translation), check it against the dev database inside a
     transaction that always rolls back, or say plainly that it is unverified.
5. **Score each piece** with the rubric below, and the design round.
6. **Write the final review note** (see "The note" below) in the feature's folder.
7. **Progress:** update `.learning/progress.md` (see "Progress"), and the feature's `00- Overview.md` (scores,
   status `final-reviewed (<score>/10)`, what's next).
8. **Report briefly in chat:** the note path, the overall score, the scores table, and the 3 fixes to type first.

## Scoring rubric

Score every piece the user owned (core pieces and the foundation) and the design round, each out of 10. The same
rubric every time, so scores can be compared across features.

| Start at 10, then | Deduction |
| --- | --- |
| each **Must fix**: a bug, a missing required step, a contract mismatch, an unfinished part | −2 |
| each **Should fix**: works, but wrong practice, misleading message, convention broken | −0.5 |
| hint level 3 (pseudo-code) used on this piece | −1 |
| hint level 4 (solution) used on this piece | the piece scores at most 5 |

- Count the same bug once per piece, even if it appears on several lines.
- **Nice to have** items cost nothing.
- Minimum 1 when some part of the piece works, 0 when nothing works.
- Parts Claude wrote at the user's request are **skipped**: not scored. Score only the user's part, and say so.
- **Design round:** Strong = 9, OK = 7, Needs work = 5. Adjust by one point when the rating hides a clear strength
  or weakness, and say why.
- **Overall:** the average of all scores, with one decimal. Then one line: what the score means and the single most
  important thing to improve.

## The note

`NN- (Final Review) <Feature>.md` in the feature's folder, continuing its numbering. Frontmatter: `type/study-guide`,
`Date: <today>`. Sections, in order:

1. A `>[!Note]` callout: what this is, the date, links to the To-Do and the earlier reviews, and "my files were not
   changed: I type the fixes myself".
2. `# <Feature> Final Review`
3. A `>[!Summary]` callout: the overall score, what it means, the 3 most important lessons.
4. `## Scores`: piece | score | the main reasons in one line. The overall score in the last row.
5. `## To-Do check`: every To-Do item | `done` / `partly` / `not done` | evidence.
6. `## Piece by piece`: one `###` per piece, in To-Do order, each with:
   - **Score** and the deductions that made it.
   - **What I wrote:** a short real excerpt of the user's code.
   - **What's right:** the real strengths.
   - **What's wrong:** each problem, and what goes wrong at runtime because of it.
   - **The correct version:** the full corrected code from the verified copy, with the changed lines marked by a
     `// ← changed` or `// ← new` comment.
   - **Why:** one short paragraph per change.
   - For an unfinished piece, title the block **Not done: here is the implementation**, and add a **Guide**: the
     steps in order, one line each, so the user can type it and understand each line.
7. `## Type the fixes`: a checklist in the order to apply them, each with its file and the test that turns green.
   End with the verify commands and their goals (all tests passing, type check, lint).
8. `## What I learned`: 3–5 lessons for the next feature, and the interview questions this feature prepares for.
9. `## Progress`: what this review recorded in `.learning/progress.md`.

## Progress

Count honestly, per concept and per foundation, following `progress-rules.md`:

- A concept the user got right with hint levels 1–2 at most → one **independent** approval at its stage.
- A concept the final review had to correct → **assisted**.
- A concept the final review had to implement because it was missing → **skipped**.
- A foundation is `written` when the user wrote it and it was correct or only needed Should fixes. If parts were
  skipped, write that next to it.
- Set the feature's status to `final-reviewed (<overall>/10)`. It becomes `done` after the user types the fixes, all
  tests pass, and the "When approved" steps of `review.md` run (commit and PR practice).
- Keep recurring mistakes that the review still found.
