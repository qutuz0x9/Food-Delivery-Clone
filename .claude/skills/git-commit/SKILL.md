---
name: git-commit
description: Generate a Conventional Commits message from the staged changes and create the commit. Use when the user wants to commit staged changes.
disable-model-invocation: true
allowed-tools: Bash(git status:*), Bash(git diff:*), Bash(git log:*), Bash(git commit:*)
---

# Git Commit Skill

Generate high-quality, meaningful git commits following the Conventional Commits standard used in this repository.

## Usage

```
/git-commit
```

## Behavior

1. **Check what is staged**
   - Run `git status --short` and `git diff --staged`.
   - If nothing is staged, stop and tell the user. Show the unstaged changes and ask what to stage. Never run
     `git add -A` or `git add .` on your own.
   - If the staged changes are clearly unrelated (e.g. docs and code mixed), suggest splitting into separate commits.
2. **Match the repo's style**
   - Run `git log --format=%s -10` and reuse the existing scope names where they fit.
3. **Pick the scope** from the changed paths (see Scopes).
4. **Pick the type** from the nature of the change (see Types).
5. **Write the subject**: imperative mood, max 72 chars, no period, specific.
6. **Write the body** explaining *why* the change was made, not just what changed.
7. **Add a footer** if applicable (breaking changes, issue links), then the attribution line (see Footer).
8. **Create the commit** with `git commit -m` (use a HEREDOC for multi-line messages).
   - Never use `--no-verify` or `--amend` unless the user asks.
   - If a hook fails, fix the cause and create a new commit.
9. **Report** the commit hash and subject.

## Commit Format

```
<type>(<scope>): <short description>

[body — explain the motivation, context, or reasoning]

[footer — BREAKING CHANGE: ..., Closes #123, Refs #456]
Co-Authored-By: <attribution line from the session context>
```

## Types

| Type       | Use when...                                                  |
| ---------- | ------------------------------------------------------------ |
| `feat`     | Adding a new feature or capability                           |
| `fix`      | Fixing a bug or incorrect behavior                           |
| `docs`     | Updating documentation, comments, or README only             |
| `style`    | Formatting, whitespace, missing semicolons, no logic change  |
| `refactor` | Restructuring code without adding features or fixing bugs    |
| `perf`     | Improving performance without changing behavior              |
| `test`     | Adding or updating tests                                     |
| `chore`    | Build scripts, CI config, dependency updates, tooling        |
| `revert`   | Reverting a previous commit                                  |

## Scopes

Derive the scope from the changed paths. Current scopes in this repo:

| Paths                       | Scope          |
| --------------------------- | -------------- |
| `docs/api/`                 | `api`          |
| `docs/dbdesign/`            | `dbdesign`     |
| `docs/requirements/`        | `requirements` |
| `README.md`                 | `readme`       |
| `.claude/skills/`           | `skills`       |
| `.claude/rules/`, `CLAUDE.md` | `claude`     |
| `src/modules/<feature>/`    | `<feature>` (auth, orders, ...) |
| `src/app.ts`, `src/index.ts`| `app`          |

If changes span several scopes, omit the scope or split the commit.

## Subject Line Rules

- Use **imperative mood**: "add feature", not "added feature" or "adds feature"
- Keep it under **72 characters**
- Do **not** end with a period
- Be specific: "fix null pointer in order service", not "fix bug"

## Body Guidelines

- Separate from the subject with a blank line
- Explain **why** the change was made, not just what files changed
- Use bullet points for multiple related changes
- Wrap lines at ~72 characters

## Footer Guidelines

- `BREAKING CHANGE: <description>` for any breaking API change
- `Closes #<issue>` when the commit fully resolves a GitHub issue
- `Refs #<issue>` when the commit is related to but doesn't close an issue
- End with the `Co-Authored-By` attribution line given in the session context, if there is one

## Examples

### Docs change

```
docs(dbdesign): add order_item_options table

Order items had no way to record selected add-ons, so customizations
were lost after checkout. Snapshot the chosen options per order item
so later menu edits don't alter past orders.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
```

### New feature

```
feat(auth): add JWT refresh token support

- Issue refresh tokens on login alongside access tokens
- Add POST /auth/refresh to exchange expired access tokens
- Store refresh tokens hashed, never in plain text

Refs #88

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
```

### Refactor

```
refactor(orders): extract status transitions into service layer

Status transitions were spread across the controller and repository.
Centralizing them in OrderService makes the rules easier to test and
keeps every change appending to order_status_history.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
```

## Rules & Quality Standards

- Only commit what is staged. Never stage files on your own.
- Never skip hooks (`--no-verify`) or rewrite history unless the user explicitly asks.
- Never commit files that look like secrets (`.env`, credentials). Warn the user instead.
- The subject is at most 72 chars, imperative, with no trailing period, and the body explains *why*.
- Keep the commit to one logical change. Suggest splitting if it isn't.
