# Contributing

## Workflow

1. Open an issue (feature, bug or task) or pick one.
2. Branch off `main`: `feature/<name>`, `fix/<name>` or `chore/<name>`.
3. Commit with [Conventional Commits](https://www.conventionalcommits.org): `type(scope): summary`, where the scope
   is the module (`auth`, `orders`, ...). Example: `feat(auth): log customers out at POST /auth/logout/customer`.
4. Run the checks CI runs:

   ```bash
   npm run lint
   npm run lint:api
   npm run build
   ```

5. Open a PR to `main` with a Conventional Commits title and `Closes #<issue>` in the body.
6. Merge once CI is green and the review is done, then delete the branch.

## Rules

- `src/prisma/contract.prisma` is the source of truth. Check every feature against it, and propose a contract change
  before making one.
- Update `docs/api/` in the same PR as any route you add or change.
- Pin any new GitHub Action to a full commit SHA with a version comment.
