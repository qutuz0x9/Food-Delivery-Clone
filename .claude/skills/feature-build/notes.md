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
| `03- Build Log.md` | Phase 2: after Verify and Progress, before the report |
| `04- To-Do.md` | Phase 2: right after the Build Log |
| `NN- (Review) <headline>.md` (05, 06, ...) | every `/feature-build review` of this feature, one note per review |
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
- **No matching project folder:** ask once. If there is no vault for this project, write the three notes to
  `.learning/notes/<feature-slug>/` in the repo instead.
- **Never** write into the project's `Tasks/` folder: those files belong to another tool.
- Put the folder in the plan, as the line `Notes: <vault feature folder>` under the plan title, so later steps and
  review mode can find it.

## Format (all three notes)

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
3. A `>[!Summary]` callout: the rating and its must-fix gaps in a few words, the strengths, the biggest lesson.
4. `## My answers`: the user's design exactly as they gave it.
   - Stage `questions`: one `###` per interview section, with the filled-in block shown in chat.
   - Stage `draft`: the user's plan sections 1–3 and 5–8.
   - Extend: the user's impact list.
5. `## The comparison`: the You vs me table exactly as shown in chat, plus one line explaining the verdicts.
6. `## The must-fix gaps, explained`: one `###` per gap. Say why it matters, with a concrete failure from this
   feature (a request sequence, a bad row, an attack). A small table or a `txt` timeline helps.
7. `## What I did well`: the real strengths, the same ones you gave in chat.
8. `## Edge cases and security`: your list, when the user's was missing or short.
9. `## Rating`: the rating table with this round marked, and the user's design stage after this round.
10. `## Think before you code`: plan section 11, as questions without answers.

If the user changes the design after the table and before `go`, update the note to the agreed design before you
scaffold.

## 03- Build Log.md

`type/concept`. Everything Claude did after `go`. Sections, in order:

1. A `>[!Note]` callout: the date, links to the Design Review and To-Do notes, and a line saying this note
   describes the real code.
2. `# <Feature> Build Log`
3. A `>[!Summary]` callout: the steps below as a numbered list of one line each.
4. `## Step by step`: what happened, in order.
   - Packages installed: the command, and a table of package | version | what it is.
   - Anything you investigated before writing code (docs, a probe script against the database) and what you
     learned. Say that probe scripts were rolled back and deleted.
   - The checks you ran, with their real results.
   - Anything that surprised you or that you corrected (e.g. a test that passed by accident), and the lesson in it.
5. `## The map`: a `txt` tree of every file, marked **New**, **Edit** or **Me** (the user writes a piece in it).
   A second tree for files outside `src/`.
6. `## The files, in the order a request runs`: one `###` per file. A short real excerpt, what it does and why it is
   built that way. For a user's stub, show the signature and the first steps, not a solution.
7. `## The tests`: a table of file | number of tests | what they use (fakes, Supertest, ...). Show the key trick of
   the service tests. Say which tests already pass and why, and which tests were skipped and why.
8. `## Config and docs changes`: one `###` per changed area (scripts, tsconfig, env files, Docker, spec, project
   docs, plan, progress), each with a short excerpt.
9. `## How it fits together`: a `txt` diagram of the request flow, including where each error goes.
10. `## New ideas in this code`: every pattern or language feature in Claude's code that the user hasn't met in an
    earlier feature (check the earlier Build Logs and the vault's Explanations and Learning Topics). For each, a
    `###` with 3 lines: what it is, a real excerpt (1–3 lines), and why the project uses it. Link a deeper vault
    note when one exists; otherwise end with "Ask for a deeper note with `/codebase-output`". Examples: a factory
    function, constructor injection, a closure, a derived type like `Parameters<...>`.
11. `## Things to notice`: 3–5 design points the user should remember.
12. `## Still open`: setup the user must do, and decisions that are waiting for the user.

## 04- To-Do.md

`type/study-guide`. A checklist the user follows, step by step, to finish the feature. Use Obsidian checkboxes
(`- [ ]`), so the user can tick them off. Sections, in order:

1. A `>[!Note]` callout: one line on what this list is, and links to the other two notes.
2. `# <Feature> To-Do`
3. `## Before you start`: setup steps that block running the app or the tests (env vars, a command to generate a
   secret, a database step), each a checkbox with the exact command. Say which steps the tests don't need.
4. `## My pieces, in order`: one checkbox per user piece, in the order of plan section 10:
   - `- [ ] **<n>. <Piece>** (<kind>, <stage>)`
   - under it, indented, in this order:
     - the file, and what the piece must do in one line;
     - **Before:** "read the `expect` lines of `<test file>` first: they say exactly what the piece must do"
       (when a test covers it);
     - the exact command that runs its tests (a test file filter, e.g. `npx vitest run auth.validation`; when no
       test covers it, `npm run typecheck` plus a manual check: the exact request or script that shows it works);
     - **Self-check:** "run `npm run lint` and the test; read every message, because an unused variable often
       means a missing step";
     - "done when" (which tests turn green), then "→ `/feature-build review <piece>`".
   - Point the user to the first piece and why it comes first.
5. `## When I'm stuck`: say "hint for `<piece>`" to get hints that grow one level per request; ask "how do I call
   `<API>`?" for a free API example (it doesn't count as a hint); paste an error to get it explained (not fixed).
6. `## Finish`: checkboxes for the full test run (`npm test` shows `<total> passed`), the type check, lint, and
   `/feature-build review`.
7. `## Can wait`: open points that do not block the user's pieces, so they don't worry about them now.

In the chat report, give the To-Do path and the first piece. Don't repeat the whole list in the terminal.

## Review notes

One note per review, directly in the feature's folder (no subfolder), so every note of a feature sits under one
root and the user can go back over their mistakes feature by feature.

- **Name:** `NN- (Review) <headline>.md`. `NN` continues the numbering of the feature folder, so the first review
  is `05-` (after `04- To-Do.md`). The headline names the main problem in a few words, e.g.
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
- **Shape:** grouped by the 6 interview sections (Endpoint, Errors, Data, Validation, Transaction, Edge cases and
  security). Each item is a **question**, not an answer, with where it came from:
  `- [ ] Can two requests pass my uniqueness check at the same moment? (Register Customer: insert-time duplicates)`
- Don't repeat an item that is already there; add the new feature's name to it instead. When the user gets an item
  right in a later round, mark it `✅ <feature>` so they can see it sticking.
