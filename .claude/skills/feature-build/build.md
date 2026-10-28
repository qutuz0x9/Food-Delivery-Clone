# Build mode

Order: Project check → Phase 1 (Design) → wait for approval → Phase 2 (Scaffold).

## Project check

Do this silently, then summarize it in one line in the plan.

1. **Read `package.json`:** the versions of Express, Prisma, Zod, Vitest and Supertest, the scripts, and the module system. Check whether `tsconfig.json` exists.
2. **Find the module** named in the request and the closest existing feature. Mirror its structure, naming, error shape and transaction style.
3. **New project or missing parts of the stack:** plan a "Project setup" step with the dependencies to install and the base files from the default layout in `stack.md`.
4. **Decide what the user gets this time,** using `.learning/progress.md`:
   - **Design stage:** `questions` or `draft`.
   - **Core concepts:** the stage of each one this feature uses.
   - **Foundation:** the next undone one. If the feature creates it, the user writes it. If it already exists, the user explains it back.
   - **Refresher:** if one is due, pick a graduated concept this feature can use, the one practiced longest ago.
   - **Tests:** if test writing is on, pick 1–2 tests for the user to write.

## Phase 1: Design

If the feature request is too vague to design (for example, it's unclear what the feature does), ask up to 3 short questions first. Do not ask design questions here. Design is the user's job, below.

Before the first design question, create the feature folder with its **Overview** hub and the **Database Diagram** note (see `notes.md`), so the user can see the tables while answering. Update the Overview after every later note.

If the vault has a **Design Checklist** (`03- Development/Features/00- Design Checklist.md`, see `notes.md`), give its path in the first interview message and suggest rereading it first. It lists the user's own past misses, so it's their learning, not a hint for this feature.

### Design stage `questions`

Interview the user one section at a time: all the questions of a section go in one message, and the user answers them together. Start with one line: it takes about 10 minutes, short answers are fine, "I don't know" is a fine answer, `skip` leaves a question empty, and `back` changes an earlier section.

Go through these 6 sections in order. Adapt the questions to the feature: drop the ones that don't apply, and add one when the feature needs it (for example, "Should register also log the user in?").

1. **Endpoint:** method → route → request body → success status → response body
2. **Errors:** every error case the user can think of, one per line, each with its status code
3. **Data:** tables → fields and types → values the app must generate → constraints (required, unique, length) → indexes
4. **Validation:** rules for each field → which rules go in the Zod schema and which in the service
5. **Transaction:** is one needed? → what goes inside → what runs after it
6. **Edge cases and security:** every case the user can think of, one per line. Give
   four thinking prompts, with no answers, because beginners often have nothing to start from here:
   - *two requests at the same moment?*
   - *a step fails halfway?*
   - *what would an attacker try?*
   - *data that already exists, or was deleted?*

Each message:

- Starts with `Phase 1: Your Design · <Section> (<n>/6)`.
- Lists the section's questions as a numbered list, in the order above, then stops and waits for the answers. Ask the user to answer with the same numbers (`1. POST`, `2. ...`).
- May point to where to look (for example, "read `src/prisma/contract.prisma`"), but never hints at the answer.
- Does not judge the answers. Keep all feedback for the You vs me table. If an answer is unclear or a number is missing, ask about only those numbers in one short follow-up.

In Errors and Edge cases, the user lists cases instead of answering numbered questions. After their list, ask once "More cases, or `done`?" before moving on.

When a section is finished, show it filled in, then ask all the questions of the next section in the same message:

```txt
Endpoint
1. Method: POST
2. Route: /api/v1/auth/register/customer
3. Request body: ...
```

When all 6 sections are done, compare in a **You vs me** table:

| Topic | Your design | My design | Verdict | Why |
| --- | --- | --- | --- | --- |

The verdict is one of:

- **Match**
- **Missed:** something important is missing
- **Different, valid:** use the user's design
- **Different, risky:** explain the trade-off and let the user choose
- **Wrong:** a bug or security problem; it must change

Then rate the round:

| Rating | Meaning |
| --- | --- |
| **Strong** | no must-fix gaps |
| **OK** | 1–2 must-fix gaps |
| **Needs work** | 3 or more |

A **must-fix gap** is any of these:

- a missed error case that changes the API contract
- wrong status code meaning
- a missing constraint that allows bad data
- a missing or wrong transaction that can leave data inconsistent
- a security problem

Then write the plan from the agreed design, and the **Design Review** note (see `notes.md`). Add every **Missed**, **Wrong** and must-fix item of the You vs me table to the **Design Checklist** (create it on the first round).

### Design stage `draft`

1. Create `.learning/plans/<feature-slug>.md` with the plan template headings and a one-line hint under each. The user fills in sections 1–3 and 5–8.
2. Tell the user to fill it in and say `ready`. Stop.
3. **Design review:** for each section, list what's good and the issues as **Must fix / Should fix**. Write the issues as questions, not answers. Rate the round (same scale as above).
4. The user revises until there are no Must-fix issues. Then Claude writes sections 4, 9, 10 and 11, and finalizes the plan.
5. Write the **Design Review** note (see `notes.md`), with the user's plan sections as "My answers", and add the round's Must-fix issues to the **Design Checklist**.

### Plan template

Write the plan to `.learning/plans/<feature-slug>.md` and show it in chat.

```markdown
# Plan: <Feature>

Notes: <vault feature folder, see notes.md>
Branch: feature/<feature-slug>

## 1. Goal and assumptions
What the feature does, and the assumptions.
Project: <TS or JS, Express version, existing feature mirrored>. New dependencies: <list or none>.

## 2. Endpoint contract
- Method and route
- Request body: example JSON
- Success: status code and example JSON
- Errors table: Case | Status | Error code / message

## 3. Request → response flow
Numbered list, one line per hop, saying what happens and why that layer owns it:
router → validate middleware → controller → service → repository → Prisma → back up → errorHandler.
Show where each error is thrown and where it becomes a response.

## 4. Files
Table: File | Layer | Who writes (Claude / You) | Purpose

## 5. Data model
Prisma model: fields, types, required/optional, @unique, @default, relations, indexes. Migration name.

## 6. Validation rules
Table: Field | Rules | Where (Zod schema vs service)

## 7. Transaction and error design
- Which writes run inside one interactive transaction, and what runs after it.
- What happens on failure.
- Which layer translates Prisma errors (e.g. a unique violation) into app errors.

## 8. Edge cases and security

## 9. Tests
Table: Test (describe › it) | What it checks | Covers | Written by (Claude / You)

## 10. Your part
Table, in the recommended order (usually repository → Zod rules → service → tests):
Piece | Kind (core / foundation / refresher / test) | Stage | One line on what it must do
Then the foundation of this feature: written, or explain-back (with the 3 questions to answer at review).
Design rating for this round, and the user's design stage.

## 11. Think before you code
2–4 questions without answers, about things the user's design did not cover.
```

Give the path of the Design Review note in one line.

End with: **Reply `go` to create the files, or tell me what to change.**

**Stop here.** Do not create code files or install anything until the user approves.

## Phase 2: Scaffold (after `go`)

**First, the branch.** Before writing or installing anything, put the feature on its own branch, so `main` never
holds unfinished work:

- Run `git status` and `git branch --show-current`. If there are uncommitted changes that don't belong to this
  feature, stop and ask what to do with them.
- Create the branch from the current branch (normally `main`): `git switch -c feature/<feature-slug>` (extend mode:
  `enhance/<change-slug>`). The plan and progress files written in Phase 1 move with it, since they're uncommitted.
- If the branch already exists (a feature resumed later), switch to it instead.
- Say the branch name in one line, and add it to the Build Log. Never commit, push or merge without asking.

1. **Project setup** (if planned): install the dependencies and create the base files.
2. **Prisma:** add the model.
   - If `DATABASE_URL` is set and reachable, run `npx prisma migrate dev --name <name>`.
   - Otherwise run `npx prisma generate` and give the user the migrate command.
   - Exception: if the Prisma model is this feature's **written** foundation, leave the model to the user and only generate after they write it.
3. **Claude-owned files:** write them completely, following `stack.md`.
4. **User-owned pieces:** create them in the `LEARN-TODO` format for their kind and stage (see `stack.md`):
   - core concepts
   - the refresher
   - a **written** foundation (guided)
   - the user's tests
5. **Tests:** write all the other tests from plan section 9.
6. **Verify:** run the type check and the tests (see `stack.md`).
   - Tests that cover user pieces should fail.
   - Tests of Claude-only code should pass.
   - The user's `it.todo` tests show as todo.
7. **Progress:** update `.learning/progress.md`. Add the feature as `in progress` and record the design rating. Follow `progress-rules.md`.
8. **Notes:** write the **Build Log** and the **To-Do** notes (see `notes.md`), from the real files and the real
   results of step 6.
9. **Report briefly:**
   - the paths of the three notes
   - files, grouped as "I wrote" and "You write"
   - the user's pieces in order, with file, method, kind and stage, and which one to start with
     (the full checklist is in the To-Do note)
   - if there is an **explain-back** foundation: the file to read, and the 3 questions they will answer at review
   - the commands to run the tests and the type check
   - "When you finish, run `/feature-build review`."
   - if the last solo session was more than 14 days ago, one line suggesting `/feature-build solo`
