# Feature notes

Every build and extend feature gets its notes in the user's Obsidian vault, so the data, the design, the build and
the next steps are kept outside the terminal. The user reads them later, in their own time, so write them for a
beginner: short sentences, simple English, and a one-line explanation of each new term the first time it appears.

All of a feature's notes sit directly in its folder (no subfolders), numbered in the order the user works through
them, with `00- Overview.md` as the hub:

| Note | Written when |
| --- | --- |
| `00- Overview.md` | Phase 1, together with the Database Diagram; **updated after every step below** |
| `01- Database Diagram.md` | Phase 1: before the first design question (extend: before the impact analysis) |
| `02- Design Review (You vs Me).md` | Phase 1: after the You vs me table, the rating and the plan, before "Reply `go`" |
| `03- Logic & Flow.md` | Phase 1: right after the Design Review, from the agreed design; Phase 2 adds the real code names |
| `04- Build Log.md` | Phase 2: after Verify and Progress, before the report |
| `05- To-Do.md` | Phase 2: right after the Build Log |
| `NN- (Review) <headline>.md` (06, 07, ...) | every `/feature-build review` of this feature, one note per review |
| `NN- (Review) Piece Reviews.md` | the first `/feature-build review <piece>`; every later piece review is appended (see `review.md`) |
| `NN- (Final Review) <Feature>.md` | `/feature-build final-review`; its format is in `final-review.md` |

One note lives **outside** the feature folders, shared by all features:
`04- Projects/<project>/03- Development/Features/00- Design Checklist.md` (see "Design Checklist" below).

## 00- Overview.md

`type/project`. The feature's home page: the user opens it first, and it always shows the current state. Keep it
short: it points to the other notes, it doesn't repeat them.

1. A `>[!Summary]` callout: the endpoint in one line, the status (`designing`, `building`, `in review`,
   `final-reviewed (<score>/10)`, `done`), the start date and the latest date, the plan's path in the repo.
2. `# <Feature>`
3. `## Notes, in the order I use them`: number | link | what it's for, one row per note that exists.
4. `## My pieces`: number | piece | score (from the final review, `—` before it) | status with ✅ 🟡 🔴 and the next
   action in a few words.
5. `## Timeline`: date | step, one row per working day.
6. `## What's next`: 2–4 checkboxes, the next actions in order.
7. `## Decisions made in this feature`: one bullet per decision (from the design round and later discussions), with
   a link when a note explains it.

**Update it** after each step that changes something: a new note (add its row), a review (statuses), the final
review (scores, status), the feature becoming `done`. Rewrite only the sections that changed.

## Where

- **Vault:** `/home/qutuz0x9/MyData/Backend-Developer/CodeBase`. A project's notes live in `04- Projects/<project>`.
  Match the code folder name loosely, ignoring case, number prefixes like `04-`, spaces, `-` and `_`
  (`Food-Delivery-Clone` → `Food Delivery Clone`).
- **Feature folder:** `04- Projects/<project>/03- Development/Features/NN- <Feature Title>/`.
  - `NN` continues the numbering of the folders already in `Features/` (`01`, `02`, ...). Create `Features/` if it
    is missing.
  - Extend mode: `NN- (Extend) <Change Title>`.
  - The title is short and in Title Case, e.g. `01- Register Customer`, `02- Login Customer`.
- **No matching project folder:** ask once. If there is no vault for this project, write the notes to
  `.learning/notes/<feature-slug>/` in the repo instead.
- **Never** write into the project's `Tasks/` folder: those files belong to another tool.
- Put the folder in the plan, as the line `Notes: <vault feature folder>` under the plan title, so later steps and
  review mode can find it.

## Format (all feature notes)

- **Frontmatter:** copy the shape of the notes already in the project folder.
  - `tags`: 1–2 `topic/` (reuse the ones sibling notes use, e.g. `topic/express`, `topic/typescript`), exactly one
    `type/` (given per note below), and 0–3 `concept/` only if they really fit (e.g. `concept/auth`,
    `concept/security`, `concept/testing`, `concept/architecture`).
  - `related-to: "[[<the project's Overview note name>]]"`, then a `---` line.
- **Point of view:** the notes belong to the user. Write "my design" for the user's design and "Claude's design" for
  yours.
- **Links:** link the other notes of the same feature with `[[<full vault path without .md>|<short name>]]`, only
  once they exist. Link other vault notes only if they really exist.
- **Code excerpts** are copied from the real files, not rewritten, and kept short.
- **Numbers are real:** test counts, versions and results come from the files and the commands you ran, not from the
  plan.
- **Markdown:** one `#` title, a language on every code fence, blank lines around headings, lists and fences.
- **Obsidian callouts** (`>[!Note]`, `>[!Summary]`) are fine, as sibling notes use them.

## 01- Database Diagram.md

`type/reference`, tags `topic/prisma` and `topic/postgresql`. A picture of every table the **module** works with, so
the user can see the data while designing and coding.

**Which tables:**

- every table the module owns (the module map in `CLAUDE.md`; e.g. `auth` owns the `identity` tables),
- plus every table of another module that the feature reads or writes (e.g. `customers` for register),
- and one line naming the tables that reference these but are out of scope (e.g. `orders` → `customers`).

Group the tables by owning module. **Never mark which tables or columns this feature writes.** Choosing them is part
of the user's design.

**Sources, in this order:** `src/prisma/contract.prisma` for columns, types, defaults and relations; the live
database catalog (`pg_constraint`, `pg_index`, read-only) for the real constraint and index names, when it is
reachable; otherwise the migration files. Regenerate the note for every feature, because the contract changes.

Sections, in order:

1. A `>[!Note]` callout: the date, the module, the sources used, and "regenerate when the contract changes".
2. `# <Module> Database Diagram`
3. A `>[!Summary]` callout: how many tables, which module owns which, and the 2–3 most important facts.
4. `## Diagram`: **one** Mermaid `erDiagram` block with every table and relation (Obsidian renders it).
   - **Keep each table small: important columns only.** That means keys (`PK`, `FK`, `UK`) and the columns that
     change behavior (status, soft delete, expiry, a token hash). Leave out `created_at`, `updated_at`, optional
     details and descriptions; the full list is in the contract, and the line above the diagram says so.
   - Comments only for facts that affect code, kept to a few words: `"no default"`, `"soft delete"`, `"no FK"`.
   - Use the **database** names (`users`, `normalized_email`), as in SQL and in constraint names.
   - Every relation with its cardinality and the FK column as its label.
5. `## Tables at a glance`: table | Prisma model (`db.orm.<ns>.<Model>`) | owner module | what one row means.
6. `## Constraints and indexes`: one `###` per table, with a table of kind | name | columns | what it guarantees.
   Cover the primary key, unique constraints, foreign keys with their `ON DELETE` rule, CHECK constraints (enums
   included), and plain or partial indexes. Leave out `NOT NULL`; the diagram shows nullable columns.
7. `## Things to notice`: 3–6 facts that affect code, e.g. an id with no database default, unique constraints that
   still count soft-deleted rows, `RESTRICT` foreign keys that block hard deletes, an index that duplicates a
   primary key. State facts; don't turn them into design answers for this feature.

In the first interview message, give the note's path in one line ("the tables are in ...").

## 02- Design Review (You vs Me).md

`type/comparison`. Sections, in order:

1. A `>[!Note]` callout: the date, the feature, the mode (build or extend) and design stage, the plan's path in the
   repo, and a link to the Build Log once it exists.
2. `# (Review) <Feature>: My Design vs Claude's`
3. A `>[!Summary]` callout: the total score and the rating, the biggest gaps in a few words, the strengths, the
   biggest lesson.
4. `## My answers`: every answer the user gave, each one checked right under it. The user already knows their own
   answers, so the check is what they read this note for: never list an answer without it.
   - Stage `questions`: one `###` per interview section, and one `####` per numbered answer or listed case.
   - Stage `draft`: one `###` per plan section (1–3 and 5–8), and one `####` per decision in it.
   - Extend: one `###` per part of the impact list (files and layers, migration, API contract, tests, risks), and one
     `####` per item.
   - Every `####` has this shape, so the user can move fast on the Notes and read a Full Explain only when they need
     it:

     ```markdown
     #### 2. Route: 🔴 Wrong

     | My answer | Claude |
     | --- | --- |
     | `/api/v1/auth/login` | `/api/v1/auth/login/customer`<br><br>**Note:** the project's routes name the actor. |

     **Full Explain:** The project's convention is `/auth/<action>/<actor>`, and the spec already uses it. ...
     ```

   - **Heading:** the item's name, then its verdict: `✅ Match`, `✅ Different, valid`, `🟡 Different, risky`,
     `🔴 Missed` or `🔴 Wrong`, from `build.md`. Add `(must-fix)` when the item is a must-fix gap.
   - **Table:** two columns and one row, and nothing else. "My answer" quotes the user's words exactly. "Claude" gives
     Claude's answer, then the Note. A cell can't hold a code fence, so break lines with `<br>` and escape a pipe as
     `\|`.
   - **Note:** one short sentence on why Claude's answer is what it is. It must make sense without the Full Explain.
   - **Full Explain:** never empty, even for a match, and it must add to the Note, not repeat it: the full reason, what
     goes wrong otherwise, and the right way to think about it.
   - **A must-fix item** also shows a concrete failure from this feature in its Full Explain (a request sequence, a bad
     row, an attack). A small table or a `txt` timeline helps.
   - **Things the user missed** get their own `####` at the end of the section they belong to, in the same shape, with
     `—` as "My answer".
5. `## Score`: a table with one row per `###` of "My answers": section | me | Claude. No other columns.
   - Each `####` is worth 1 point. **Match** and **Different, valid** score 1, **Different, risky** ½, **Missed** and
     **Wrong** 0. Claude's column is the number of items in the section.
   - Under the table, the total on its own line: `**Total: 17 / 24**`.
   - Then one line with the rating, what it means and the design stage:
     **Rating:** Needs work (3 must-fix gaps; Strong means none) · **Design stage:** `questions` (Strong rounds: 0).
     The rating still decides the design stage, not the score.
6. `## What I did well`: the real strengths, the same ones you gave in chat.
7. `## More edge cases and security`: Claude's cases that aren't already under "My answers", each with why it matters.
   They are extra learning and aren't scored. Leave the section out when nothing is left.
8. `## Think before you code`: plan section 11, as questions without answers.

If the user changes the design after the table and before `go`, update the note to the agreed design before you
scaffold.

## 03- Logic & Flow.md

`type/concept`, tags `topic/express` (or the sibling notes' topic) and `concept/architecture`. The feature's business
logic in pictures: what the rules are, in which order the code applies them, and why each decision goes the way it
does. The user reads it before coding and comes back to it while coding, so it describes the **agreed design**
(Claude's design after the You vs me table), never the user's first answers.

It must not give away the user's pieces: show **what** happens and **why**, in plain words, never code, exact ORM or
Zod calls, or query shapes. The plan already holds this level of detail, so the note adds no new hints.

Sections, in order:

1. A `>[!Note]` callout: the date, the feature, a link to the Design Review and the Overview, and "describes the agreed
   design; the code names are added after `go`".
2. `# <Feature> Logic & Flow`
3. A `>[!Summary]` callout: what the feature does in business terms (one line), the 3–5 rules that matter most, and
   the one idea the whole feature depends on (e.g. "a token works once").
4. `## Business rules`: a table of # | rule | source (contract, rules file, design decision) | enforced where
   (layer, and the database constraint when one backs it up).
5. `## The whole flow`: **one** Mermaid `flowchart TD`, from "client sends" to "client gets the response". Every
   check is a diamond (`{...}`), every write a box, every error exit a box with its status and code, and the success
   path ends at the response. Mark the user's pieces with `👤` in the node label.
6. `## Through the layers`: **one** Mermaid `sequenceDiagram` with a participant per layer (Client, Router or
   middleware, Controller, Service, Repository, Database), showing the happy path, and one `alt` block for the most
   important failure.
7. `## Decisions, one by one`: one `###` per decision point of the flow, in the order the code reaches them. Each has:
   - a small Mermaid `flowchart LR` of just that decision (the condition and its branches);
   - **Rule:** the business rule behind it, in one line;
   - **Why here:** why it sits at this point of the flow (what goes wrong if it runs earlier or later);
   - **If it were missing:** a concrete failure from this feature (a request, a bad row, an attack), one or two lines.
8. `## State changes`: one Mermaid `stateDiagram-v2` per row or entity whose state changes, with every allowed
   transition labelled by what causes it. Then one line on what must never happen. Leave the section out when nothing
   changes state.
9. `## Two requests at once`: a Mermaid `sequenceDiagram` of the race the design guards against, and the line of the
   design that stops it. Leave it out when the feature has no race.
10. `## Where each rule lives`: rule # → file and method. Before `go`, write the planned names from plan §4; after
    the scaffold, update it with the real ones.

**Mermaid rules** (Obsidian renders Mermaid, but a syntax error shows nothing):

- Put every label that has spaces, symbols or parentheses in double quotes: `A["revoked_at set?"]`, `B{"expired?"}`.
- No `"` inside a label; use `'` instead. No raw `<`, `>` or `|` inside a label.
- Keep labels short (a few words). Long explanations go in the text under the diagram, not in the nodes.
- Node ids are short and unique within one diagram (`check1`, `revoke`); never reuse an id with another label.
- Label edges with the condition: `-->|yes|`, `-->|no|`.

## 04- Build Log.md

`type/concept`. Helps the user understand the code Claude wrote after `go`. It explains the code, not the story of
writing it.

- **Short:** about 200 lines for a normal feature, less for a small one. Cut before adding.
- **One fact, one place:** never say the same thing in two sections.
- **No process story:** leave out install commands, docs you looked up, probe scripts and lockfile details.

Sections, in order:

1. A `>[!Note]` callout: the date, the branch, links to the Design Review, To-Do and Overview notes, and a line saying
   this note describes the real code.
2. `# <Feature> Build Log`
3. A `>[!Summary]` callout: 2–3 lines on what now works, what waits for the user's pieces, and the test result.
4. `## How it works`: a `txt` diagram of the request flow, with where each error goes and its status code. Mark the
   user's pieces with `← Me`.
5. `## What changed`: a `txt` tree of every file in `src/`, marked **New**, **Edit** or **Me** (the user writes a piece
   in it), with a few words on each, including how many tests a test file gained. A second tree for files outside
   `src/` (spec, config, plan). One line per new package: name, version, what it is.
6. `## The code worth reading`: one `###` per file, for the 3–5 files that hold a real decision, in the order a request
   runs. A real excerpt of at most 10 lines, then 1–3 sentences on why it's built that way. Skip wiring and one-line
   files, because the tree covers them, and the user's stubs, because the To-Do covers them.
7. `## New ideas in this code`: every pattern or language feature in Claude's code that the user hasn't met in an
   earlier feature (check the earlier Build Logs and the vault's Explanations and Learning Topics). A clever trick in
   a test counts too. For each, a `###` with 3 lines: what it is, a real excerpt (1–3 lines), and why the project uses
   it. Link a deeper vault note when one exists. End the section, once, with "Ask for a deeper note with
   `/codebase-output`". Examples: a factory function, constructor injection, a closure, a derived type like
   `Parameters<...>`.
8. `## Test results`: a table of check | real result, then 1–2 sentences on which failures are expected (the user's
   pieces) and which tests were skipped and why.
9. `## Surprises`: at most 3 bullets on something that went wrong or that you corrected, each with its lesson (e.g. a
   test that passed by accident). Leave the section out when there are none.

Anything still open goes in the To-Do note, not here.

## 05- To-Do.md

`type/study-guide`. A checklist the user follows, step by step, to finish the feature. Use Obsidian checkboxes
(`- [ ]`), so the user can tick them off. Sections, in order:

1. A `>[!Note]` callout: one line on what this list is, and links to the other two notes.
2. `# <Feature> To-Do`
3. `## Before you start`: setup steps that block running the app or the tests (env vars, a command to generate a
   secret, a database step), each a checkbox with the exact command. Say which steps the tests don't need.
4. `## My pieces, in order`: **the only place the user's instructions live**, because the code holds just the
   `LEARN-TODO` line (see `stack.md`). One line first: which piece to start with, and why. Then one `###` heading per
   piece, in the order of plan section 10. The heading is the **task in plain words**, numbered, e.g.
   `### 1. Revoke the whole token chain safely`. Under it, in this order:
   - `- [ ] Done`, a checkbox to tick when the piece is approved.
   - **Where:** the file, the class and method (or schema / test name), its kind and stage, and the exact signature
     in a `ts` fence, so the user knows the inputs and the return type.
   - **Goal:** one or two sentences: what the piece must do and why it matters in this feature.
   - **Steps** (Guided only): a numbered list, one operation per step, in the order the code runs: what to do, not
     the code. Name the project's own classes, fields, helpers and error classes. Leave it out at the Unguided stage.
   - **What you need:** everything else needed to write it alone, as bullets: the helpers, fields, constants and
     error classes to use (with their file), the rules and edge cases it must respect, and the plan section that
     explains them. Never the solution code, and no exact ORM or Zod call (asking "how do I call X?" is a free API
     lookup).
   - **Tests:** the test file and the `describe` / `it` names that cover it, with "read their `expect` lines first:
     they say exactly what the piece must do". When no test covers it: the manual check (the exact request or
     script).
   - **Run:** the exact command (e.g. `npx vitest run auth.service -t logoutCustomer`).
   - **Done when:** which tests turn green, then "run `npm run lint` too, because an unused variable often means a
     missing step", then "→ `/feature-build review <piece>`".
5. `## When I'm stuck`: say "hint for `<piece>`" to get hints that grow one level per request; ask "how do I call
   `<API>`?" for a free API example (it doesn't count as a hint); paste an error to get it explained (not fixed).
6. `## Finish`: checkboxes for the full test run (`npm test` shows `<total> passed`), the type check, lint, and
   `/feature-build review`.
7. `## Can wait`: open points left by the build that do not block the user's pieces (a decision for later, a container
   still running), so they don't worry about them now.

In the chat report, give the To-Do path and the first piece. Don't repeat the whole list in the terminal.

## Review notes

One note per review, directly in the feature's folder (no subfolder), so every note of a feature sits under one
root and the user can go back over their mistakes feature by feature.

- **Name:** `NN- (Review) <headline>.md`. `NN` continues the numbering of the feature folder, so the first review
  is `06-` (after `05- To-Do.md`). The headline names the main problem in a few words, e.g.
  `06- (Review) errorHandler Returns 200 and Hangs`. When a review approves with nothing to fix, use
  `NN- (Review) <piece> Approved`.
- **Frontmatter:** `type/bug`, plus `Date: <today>` as sibling notes use.
- **Sections, in order:**
  1. A `>[!Note]` callout: which pieces were reviewed, a link to the To-Do note, and a link to the previous review.
  2. `# <headline>`
  3. A `>[!Summary]` callout: the verdict and the main causes in 3–5 bullets.
  4. `## Symptom`: the real test output and lint output, trimmed to the relevant lines.
  5. `## Investigation`: one `###` per failure or problem, quoting the failure message, the test's expectation and
     the user's code (real excerpts), explaining what happens at runtime, and ending with a hint as a question.
  6. `## Root cause`: a table of problem | cause | `file:line`.
  7. `## Review`: the review format from `review.md`: Tests, Good, Must fix, Should fix, Nice to have, Verdict,
     Check your understanding, SQL check. Hints and questions only; never corrected code.
  8. `## How to verify after the fixes`: the commands, with the goal for each.
  9. `## Key Takeaways`: 3–5 lessons the user can reuse in the next feature.
- In chat, give the note's path and a short summary (verdict, the 2–4 main causes, the goal). Don't paste the note.

## Design Checklist

`03- Development/Features/00- Design Checklist.md`, `type/study-guide`. The questions the user missed in past design
rounds, turned into a checklist to reread before the next one. It grows with every round: it's built from the
user's own mistakes, so it teaches without giving away the answers for a new feature.

- **When:** created on the first design round; updated after every round's You vs me table (`build.md`) and every
  extend comparison (`practice.md`).
- **Shape:** grouped by the 7 interview sections (Endpoint, Business logic and flow, Errors, Data, Validation,
  Transaction, Edge cases and security). Each item is a **question**, not an answer, with where it came from:
  `- [ ] Can two requests pass my uniqueness check at the same moment? (Register Customer: insert-time duplicates)`
- Don't repeat an item that is already there; add the new feature's name to it instead. When the user gets an item
  right in a later round, mark it `✅ <feature>` so they can see it sticking.
