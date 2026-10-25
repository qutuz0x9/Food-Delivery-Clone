# Learning progress

## Tracks

- Design stage: questions (Strong rounds: 0)
- Last design ratings: Needs work (register-customer: cookie flags, insert-time duplicates, missing role)
- Test writing: off
- Features done: 0
- Bug hunt level: 1
- Last solo: never

## Concepts

| Concept | Area | Stage | Guided ✓ | Unguided ✓ | Assisted | Focus | Last practiced |
| --- | --- | --- | --- | --- | --- | --- | --- |
| find by unique field, existence check | Repository | Guided | 0 | 0 | 1 | | 2026-10-25 |
| create, update, delete | Repository | Guided | 1 | 0 | 0 | | 2026-10-25 |
| translate Prisma errors | Repository | Guided | 0 | 0 | 0 | | 2026-10-25 |
| required and format rules | Validation | Guided | 0 | 0 | 1 | | 2026-10-25 |
| length and range rules | Validation | Guided | 0 | 0 | 1 | | 2026-10-25 |
| transforms (trim, lowercase, coerce) | Validation | Guided | 0 | 0 | 1 | | 2026-10-25 |
| orchestration flow | Service | Guided | 0 | 0 | 1 | | 2026-10-25 |
| uniqueness check with DB constraint | Service | Guided | 0 | 0 | 1 | | 2026-10-25 |
| multi-write interactive transaction | Service | Guided | 0 | 0 | 1 | | 2026-10-25 |
| password hashing usage | Service | Guided | 1 | 0 | 0 | | 2026-10-25 |
| work after commit | Service | Guided | 1 | 0 | 0 | | 2026-10-25 |
| classes and instances | Language | Guided | 0 | 0 | 0 | | 2026-10-25 |
| control flow and early return | Language | Guided | 0 | 0 | 0 | focus | 2026-10-25 |
| async errors (await, try/catch, rethrow) | Language | Guided | 0 | 0 | 0 | | 2026-10-25 |
| narrowing unknown | Language | Guided | 0 | 0 | 0 | | 2026-10-25 |
| method chains and call order | Language | Guided | 0 | 0 | 0 | | 2026-10-25 |

## Foundations

| Foundation | Status (todo / written / explained) | Date |
| --- | --- | --- |
| Error classes + errorHandler | todo (register-customer: AppError written; errorHandler AppError branch needs a `return`; Zod + 500 branches skipped) | 2026-10-25 |
| Zod validate middleware | todo | |
| Controller + router | todo | |
| Module wiring (constructor DI) | todo | |
| Prisma model + migration | todo | |
| Mapper + response types | todo | |
| createApp + Supertest setup | todo | |

## Recurring mistakes

- **One response per request:** a branch that sends a response doesn't stop (`return` or `else`), so later code runs too and answers again. Seen in the errorHandler reviews on 2026-10-22 (twice) and still open on 2026-10-25. Remove after two approved reviews in a row without it. Concept: control flow and early return (focus). Drill: not yet.

## Features

| Feature | Type (build / extend) | Design rating | Plan | Status | Date |
| --- | --- | --- | --- | --- | --- |
| Register customer (JWT + refresh token) | build | Needs work | `.learning/plans/register-customer.md` | final-reviewed (5.6/10) | 2026-10-25 |

## Bug hunts

| # | Feature | Level | Category | Fixed independently? | Hints | Date |
| --- | --- | --- | --- | --- | --- | --- |

## Drills

| Date | Concept | Why (review or recurring mistake) | Result (passed / assisted / not yet) |
| --- | --- | --- | --- |

## Solo sessions

| Date | Task | Time used | Verdict | Focus after |
| --- | --- | --- | --- | --- |
