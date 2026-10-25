# Progress rules

The user's progress lives in the project at `.learning/progress.md`. Create it from the template below if it's missing. Track **concepts, not layers**, so learning carries across features.

## Counting

- **Independent:** approved in review, using hint levels 1–2 at most.
- **Assisted:** the user used hint level 3 or asked for the solution. It doesn't count toward stage moves.
- **Skipped:** Claude wrote it at the user's request. Not counted.

## Core concept stages

| From → to | Rule |
| --- | --- |
| Guided → Unguided | after 2 independent approvals at Guided |
| Unguided → Graduated | after 2 independent approvals at Unguided |
| Graduated → Unguided | after a failed refresher (assisted, or a Must fix about that concept). Reset its Unguided count to 0. |

- **A strong solo** counts as one independent Unguided approval for each concept clearly done well. A Guided concept done well in a solo moves to Unguided.
- **Refreshers:** one is due in the next feature whenever the number of `done` features (build and extend) is a multiple of 3. Pick the graduated concept with the oldest "last practiced" date that the feature can use. A pass keeps it graduated and updates the date.
- **Focus:** a concept marked focus (from a solo or a recurring mistake) gets priority in features and solo tasks until its next independent approval.

## Other tracks

- **Design stage:** `questions` → `draft` after 2 design rounds rated **Strong**. Design never graduates.
- **Test writing:** turns **on** after 2 `done` features.
  - From then on, the user writes 1–2 tests per feature.
  - Test concepts follow the same stages as core concepts: unit test with fakes, route test with Supertest, schema test.
- **Foundations:** each one is done when it's `written` (the user wrote it and it was approved) or `explained` (the user answered the explain-back questions well). At most one per feature, in table order.
- **Bug hunt level:** 1 → 2 after 2 hunts found and fixed independently at level 1. 2 → 3 the same way.
- **Solo reminder:** suggest a solo session when the last one was more than 14 days ago.
- **Recurring mistake:** a Must fix that appears in two or more reviews. Remove it after two approved reviews in a row where that concept was practiced without the mistake.
  - When it is recorded, its concept gets **focus**, and the next session offers a drill on that exact pattern
    (see SKILL.md, "At the start of every mode"). Record the drill in the Drills table.
- **Language concepts:** when a review's Must fix is a JavaScript/TypeScript mistake (not a backend one), record it
  under its Language concept and offer a drill. Language concepts move up like core concepts: a passed drill without
  hints counts as one independent approval at the concept's stage.

## Concept names

Reuse these names. Add new ones only when nothing fits.

- **Repository (Prisma):**
  - find by unique field, existence check
  - create, update, delete
  - filter + pagination
  - include relations
  - aggregate / group by
  - translate Prisma errors
- **Validation (Zod):**
  - required and format rules
  - length and range rules
  - transforms (trim, lowercase, coerce)
  - cross-field refinement
  - query/params validation
- **Service:**
  - orchestration flow
  - uniqueness check with DB constraint
  - multi-write interactive transaction
  - password hashing usage
  - work after commit
  - authorization check
- **Tests:** unit test with fakes, route test with Supertest, schema test
- **Language (JavaScript/TypeScript):**
  - classes and instances (`new`, `extends`, `super`, fields)
  - control flow and early return
  - async errors (`await`, `try/catch`, rethrow)
  - narrowing `unknown`
  - method chains and call order

## Progress mode (`/feature-build progress`)

Show a short summary:

- design stage and the last design ratings
- core concepts grouped by stage, with counts and focus marks
- test writing: on or off
- foundations left
- bug hunt level
- the last solo session and its verdict
- recurring mistakes
- language concepts and the drills done

Then suggest **one** next step. Pick in this order:

1. A drill, if a recurring mistake has no passed drill yet.
2. A solo session, if one is due.
3. Finishing a feature that is `final-reviewed` but not `done` yet.
4. A feature that practices a focus concept or a recurring mistake.
5. A bug hunt, if none in the last 3 features.
6. An extend task, if none in the last 3 features.
7. A feature with the concept closest to moving up.

## Template

```markdown
# Learning progress

## Tracks
- Design stage: questions (Strong rounds: 0)
- Test writing: off
- Features done: 0
- Bug hunt level: 1
- Last solo: never

## Concepts
| Concept | Area | Stage | Guided ✓ | Unguided ✓ | Assisted | Focus | Last practiced |
|---|---|---|---|---|---|---|---|

## Foundations
| Foundation | Status (todo / written / explained) | Date |
|---|---|---|
| Error classes + errorHandler | todo | |
| Zod validate middleware | todo | |
| Controller + router | todo | |
| Module wiring (constructor DI) | todo | |
| Prisma model + migration | todo | |
| Mapper + response types | todo | |
| createApp + Supertest setup | todo | |

## Recurring mistakes
- (none yet)

## Features
| Feature | Type (build / extend) | Design rating | Plan | Status | Date |
|---|---|---|---|---|---|

## Bug hunts
| # | Feature | Level | Category | Fixed independently? | Hints | Date |
|---|---|---|---|---|---|---|

## Drills
| Date | Concept | Why (review or recurring mistake) | Result (passed / assisted / not yet) |
|---|---|---|---|

## Solo sessions
| Date | Task | Time used | Verdict | Focus after |
|---|---|---|---|---|
```
