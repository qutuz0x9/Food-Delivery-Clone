# Learning progress

## Tracks

- Design stage: questions (Strong rounds: 1)
- Last design ratings: Strong (list-cities, 2026-10-28: missed the sort order, the empty list and the edge cases, none must-fix); Needs work (login-customer, 2026-10-27: no 403 for non-active accounts, deleted accounts could log in, no brute-force limit); Needs work (register-customer: cookie flags, insert-time duplicates, missing role)
- Test writing: on (from the next feature)
- Features done: 2
- Bug hunt level: 1
- Last solo: never

## Concepts

| Concept | Area | Stage | Guided ✓ | Unguided ✓ | Assisted | Focus | Last practiced |
| --- | --- | --- | --- | --- | --- | --- | --- |
| find by unique field, existence check | Repository | Unguided | 2 | 0 | 1 | | 2026-10-27 |
| filter + pagination | Repository | Guided | 1 | 0 | 0 | | 2026-10-28 |
| create, update, delete | Repository | Guided | 1 | 0 | 0 | | 2026-10-25 |
| translate Prisma errors | Repository | Guided | 0 | 0 | 0 | | 2026-10-25 |
| required and format rules | Validation | Guided | 1 | 0 | 1 | | 2026-10-27 |
| length and range rules | Validation | Guided | 1 | 0 | 1 | | 2026-10-27 |
| transforms (trim, lowercase, coerce) | Validation | Guided | 1 | 0 | 1 | | 2026-10-27 |
| orchestration flow | Service | Guided | 1 | 0 | 2 | | 2026-10-28 |
| uniqueness check with DB constraint | Service | Guided | 0 | 0 | 1 | | 2026-10-25 |
| multi-write interactive transaction | Service | Guided | 0 | 0 | 1 | | 2026-10-25 |
| password hashing usage | Service | Guided | 1 | 0 | 1 | | 2026-10-27 |
| work after commit | Service | Guided | 1 | 0 | 0 | | 2026-10-25 |
| authorization check | Service | Guided | 1 | 0 | 0 | | 2026-10-27 |
| classes and instances | Language | Guided | 0 | 0 | 0 | | 2026-10-25 |
| control flow and early return | Language | Guided | 1 | 0 | 0 | | 2026-10-27 |
| async errors (await, try/catch, rethrow) | Language | Guided | 0 | 0 | 0 | | 2026-10-25 |
| narrowing unknown | Language | Guided | 0 | 0 | 0 | | 2026-10-25 |
| method chains and call order | Language | Guided | 0 | 0 | 0 | | 2026-10-25 |
| null and undefined handling (`?.`, `??`, `!`) | Language | Guided | 0 | 0 | 1 | focus | 2026-10-27 |

## Foundations

| Foundation | Status (todo / written / explained) | Date |
| --- | --- | --- |
| Error classes + errorHandler | todo (register-customer: AppError written; errorHandler AppError branch needs a `return`; Zod + 500 branches skipped. login-customer: explain-back not answered. list-cities: answered; Q2 mostly right, Q1 misses Express 5 forwarding rejected promises, Q3 misses the 4-parameter rule and registration order) | 2026-10-28 |
| Zod validate middleware | todo | |
| Controller + router | todo | |
| Module wiring (constructor DI) | todo | |
| Prisma model + migration | todo | |
| Mapper + response types | todo | |
| createApp + Supertest setup | todo | |

## Recurring mistakes

- **One response per request:** a branch that sends a response doesn't stop (`return` or `else`), so later code runs too and answers again. Seen in the errorHandler reviews on 2026-10-22 (twice) and still open on 2026-10-25. Remove after two approved reviews in a row without it. Concept: control flow and early return. Drill: passed 2026-10-27 (`.learning/drills/01-control-flow-early-return.ts`).

## Features

| Feature | Type (build / extend) | Design rating | Plan | Status | Date |
| --- | --- | --- | --- | --- | --- |
| Register customer (JWT + refresh token) | build | Needs work | `.learning/plans/register-customer.md` | final-reviewed (5.6/10) | 2026-10-25 |
| Login customer | build | Needs work | `.learning/plans/login-customer.md` | done (8.5/10, merged in PR #1) | 2026-10-27 |
| List cities | build | Strong | `.learning/plans/list-cities.md` | done (8.3/10, committed 98a9a52; PR practice skipped) | 2026-10-28 |

## Bug hunts

| # | Feature | Level | Category | Fixed independently? | Hints | Date |
| --- | --- | --- | --- | --- | --- | --- |

## Drills

| Date | Concept | Why (review or recurring mistake) | Result (passed / assisted / not yet) |
| --- | --- | --- | --- |
| 2026-10-27 | control flow and early return | recurring mistake: one response per request | passed (one level-1 hint on exercise 3: a boundary value) |

## Solo sessions

| Date | Task | Time used | Verdict | Focus after |
| --- | --- | --- | --- | --- |
