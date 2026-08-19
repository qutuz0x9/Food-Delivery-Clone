---
name: git-commit
description: Generate high-quality, meaningful git commits following conventional commit standards. Use when the user wants to commit staged changes.
user-invocable: true
---

# Git Commit Skill

Generate high-quality, meaningful git commits following conventional commit standards.

## Usage
```
/git-commit
```

## Behavior
1. Run `git diff --staged` to analyze exactly what changed
2. Identify the affected module/scope from changed file paths
3. Determine the correct commit type based on the nature of the change
4. Write a clear, concise subject line (imperative mood, max 72 chars, no period)
5. Write a body explaining *why* the change was made (not just what)
6. Add footer references if applicable (breaking changes, issue/PR links)
7. Create the commit

## Commit Format
```
<type>(<scope>): <short description>

[body — explain the motivation, context, or reasoning]

[footer — BREAKING CHANGE: ..., Closes #123, Refs #456]
```

## Types and When to Use Them
| Type       | Use when...                                                  |
|------------|--------------------------------------------------------------|
| `feat`     | Adding a new feature or capability                           |
| `fix`      | Fixing a bug or incorrect behavior                           |
| `docs`     | Updating documentation, comments, or README only             |
| `style`    | Formatting, whitespace, missing semicolons — no logic change |
| `refactor` | Restructuring code without adding features or fixing bugs    |
| `perf`     | Improving performance without changing behavior              |
| `test`     | Adding or updating tests                                     |
| `chore`    | Build scripts, CI config, dependency updates, tooling        |
| `revert`   | Reverting a previous commit                                  |

## Subject Line Rules
- Use **imperative mood**: "add feature" not "added feature" or "adds feature"
- Keep it under **72 characters**
- Do **not** end with a period
- Be specific: "fix null pointer in order service" not "fix bug"

## Body Guidelines
- Separate from subject with a blank line
- Explain **why** the change was made, not just what files changed
- Use bullet points for multiple related changes
- Wrap lines at ~72 characters

## Footer Guidelines
- `BREAKING CHANGE: <description>` — for any breaking API change
- `Closes #<issue>` — when the commit fully resolves a GitHub issue
- `Refs #<issue>` — when the commit is related to but doesn't close an issue

## Examples

### Simple fix
```
fix(cart): correct total price calculation for discounted items

The discount was applied after tax instead of before, causing
incorrect totals. Reordered the calculation to apply discount first.

Closes #42
```

### New feature
```
feat(auth): add JWT refresh token support

- Issue refresh tokens on login alongside access tokens
- Add /auth/refresh endpoint to exchange expired tokens
- Store refresh tokens in httpOnly cookies for security

Refs #88
```

### Refactor
```
refactor(order): extract order status logic into service layer

Order status transitions were spread across the controller and model.
Centralizing them in OrderService makes the rules easier to test
and extend in the future.
```