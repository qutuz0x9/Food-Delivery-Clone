<!-- markdownlint-disable-file MD041 -->

## What

<!-- One or two lines. The PR title follows Conventional Commits: feat(auth): ... -->

Closes #

## Why

<!-- The problem or reason. Link the issue if it already explains it. -->

## Type

- [ ] feat
- [ ] fix
- [ ] refactor
- [ ] docs
- [ ] chore / ci / build

## Endpoints

<!-- Routes added or changed, e.g. POST /api/v1/auth/logout/customer. Delete this section if none. -->

## Risk

- [ ] Backward compatible
- [ ] Changes behavior of an existing endpoint (describe below)
- [ ] Breaking: response shape, route or required field changed
- [ ] Includes a migration; it can be undone without losing data

## Checklist

- [ ] Checked against `src/prisma/contract.prisma`
- [ ] `docs/api/` updated for every route added or changed
- [ ] `docs/requirements/APIs-Endpoints.md` updated if a route was added or renamed
- [ ] Contract changed: ran `npm run contract:emit` and planned a migration
- [ ] `npm run lint`, `npm run lint:api` and `npm run build` pass
- [ ] Tests added or updated (if needed)

## How to test

<!-- Requests to send and what they should return. -->
