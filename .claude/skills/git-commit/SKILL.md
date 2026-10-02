---
name: git-commit
description: Survey every tracked and untracked change, group related files into logical commits, visualize the groups, and generate a Conventional Commits message for the group the user picks. Use when the user wants to commit changes.
disable-model-invocation: true
allowed-tools: Bash(git status:*), Bash(git diff:*), Bash(git log:*), Bash(git add:*), Bash(git commit:*)
---

# Git Commit Skill

Generate high-quality, meaningful git commits following the Conventional Commits standard used in this repository.

## Usage

```txt
/git-commit
```

## Behavior

1. **Survey everything**
   - Run `git status --short` to see staged, unstaged, and untracked files together, not just what is already
     staged.
   - Read enough of each change to know what it is *for*: `git diff --staged -- <file>` for staged files,
     `git diff -- <file>` for unstaged tracked files, and read untracked files directly (or `git diff --no-index
     /dev/null <file>` for a text diff view) before guessing from the path alone.
   - If the tree is clean (nothing staged, unstaged, or untracked), tell the user there is nothing to commit and
     stop.
2. **Group by relationship, not just by path** — see Grouping Guidance.
   - Cluster changes into logical commits, including any generated/derived files that must land with the source
     change that produced them.
   - Note dependencies between groups (e.g. a schema change must be committed before the docs that reference its
     new fields).
   - Flag anything ambiguous — a change with no clear purpose, or one that could belong to more than one group —
     in a separate "Unclear" list instead of guessing which group it belongs to.
3. **Visualize the groups**
   - Render each group as a short title, a one-line rationale, and a `File | State` table (`staged` / `unstaged`
     / `untracked`).
   - State a recommended commit order when groups depend on each other.
   - This is a reply to the user, not a file to write or an artifact to publish — it exists to help them pick a
     group, not to persist anywhere.
4. **Ask which group to work on next**
   - Use `AskUserQuestion` listing the groups (plus an "other / specific files" option) so the user picks one.
5. **Stage exactly that group**
   - Run `git add` with the explicit paths for the chosen group only — never `-A` or `.`, even here. Show the
     resulting `git status --short` so the user can see exactly what is now staged.
   - If the staged result still looks like it mixes unrelated changes (the grouping missed something), say so and
     offer to split further before writing a message.
6. **Match the repo's style**
   - Run `git log --format=%s -10` and reuse the existing scope names where they fit.
7. **Pick the scope** from the changed paths (see Scopes).
8. **Pick the type** from the nature of the change (see Types).
9. **Write the subject**: imperative mood, max 72 chars, no period, specific.
10. **Write the body** explaining *why* the change was made, not just what changed.
11. **Add a footer** if applicable (breaking changes, issue links), then the attribution line (see Footer).
12. **Get the user's approval of the message** (see Message Review). Do not run `git commit` until the user has
    explicitly accepted the exact message.
13. **Create the commit** with `git commit` (use a HEREDOC for multi-line messages) using the approved text
    verbatim.
    - Never use `--no-verify` or `--amend` unless the user asks.
    - If a hook fails, fix the cause and create a new commit. Show the user any change to the message first.
14. **Report** the commit hash and subject.
15. **Offer the next group** if any remain, and repeat from step 4 until the user is done or stops.

## Grouping Guidance

Judge relatedness from what a change actually does, not from its directory:

- **Read before grouping.** Two files in the same folder can be unrelated (a schema rename and an unrelated doc
  typo fix both touching `docs/`); two files in different folders can be the same change (a Prisma contract edit
  and the OpenAPI schema file that documents its new column).
- **Generated/derived files travel with their source.** An emitted client (`contract.json`, `contract.d.ts`), a
  migration folder, or a regenerated index (e.g. an endpoint list rebuilt from the spec) belongs in the same
  commit as the file that produced it — never commit the source change and the regenerated artifact separately.
- **A rename or decision ripples outward; follow it, don't split it.** When a file is renamed or a convention
  changes (a path, a source-of-truth file, a script name), every doc/rule/agent file updated only to reflect that
  one decision is one commit, even though the files themselves live in unrelated directories. Don't split a single
  ripple just because it touches `.claude/agents/`, `CLAUDE.md`, and `README.md` at once.
- **New API/schema surface area is one commit per surface, not per file.** A new domain's path file, schema file,
  and the registration lines added to the top-level spec file are one group.
- **Tooling setup is its own group.** A new dependency, the script that uses it, the CI step that runs the
  script, and the config file for that tool belong together, separate from the content the tool operates on.
- **When truly unsure, don't force it.** List the file under "Unclear" with the specific reason (no clear change,
  plausibly fits two groups, looks like incidental tool output) and let the user decide rather than picking a
  side silently.

## Message Review

The user always reviews the message before the commit is created.

1. Show the full draft message (subject, body and footer) in a code block, plus the list of files it will commit.
2. Ask with `AskUserQuestion`, putting the full message in the `preview` field of the first option:
   - **Commit (Recommended)**: commit exactly this message
   - **Edit**: change the message
   - **Cancel**: abort without committing
3. Act on the answer:
   - **Commit**: create the commit with the shown message, unchanged.
   - **Edit**: if the user gave instructions ("shorter", "change type to fix", or replacement text through the
     free-text "Other" answer), apply them. If they only chose Edit, ask what to change. Show the revised message and
     go back to step 2. Repeat until they accept or cancel. If they supply a complete replacement message, use it
     verbatim, but still re-check it against the Subject Line Rules and point out any violation (over 72 chars,
     trailing period, non-conventional type) so they can decide.
   - **Cancel**: stop. Nothing is committed, and staged files stay staged.
4. Approval covers only the message shown. If the message changes for any reason after approval, ask again.

## Commit Format

```txt
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

| Paths                         | Scope                           |
| ----------------------------- | ------------------------------- |
| `docs/api/`                   | `api`                           |
| `docs/dbdesign/`              | `dbdesign`                      |
| `docs/requirements/`          | `requirements`                  |
| `README.md`                   | `readme`                        |
| `.claude/skills/`             | `skills`                        |
| `.claude/rules/`, `CLAUDE.md` | `claude`                        |
| `src/modules/<feature>/`      | `<feature>` (auth, orders, ...) |
| `src/app.ts`, `src/index.ts`  | `app`                           |

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

```txt
docs(dbdesign): add order_item_options table

Order items had no way to record selected add-ons, so customizations
were lost after checkout. Snapshot the chosen options per order item
so later menu edits don't alter past orders.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
```

### New feature

```txt
feat(auth): add JWT refresh token support

- Issue refresh tokens on login alongside access tokens
- Add POST /auth/refresh to exchange expired access tokens
- Store refresh tokens hashed, never in plain text

Refs #88

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
```

### Refactor

```txt
refactor(orders): extract status transitions into service layer

Status transitions were spread across the controller and repository.
Centralizing them in OrderService makes the rules easier to test and
keeps every change appending to order_status_history.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
```

## Rules & Quality Standards

- Never commit without the user's explicit approval of the exact message. Silence or a vague reply is not approval.
- Only stage what the user confirmed from the grouped survey, by explicit path. Never run `git add -A` or
  `git add .`, even when staging a confirmed group.
- Only commit what is staged.
- Never skip hooks (`--no-verify`) or rewrite history unless the user explicitly asks.
- Never commit files that look like secrets (`.env`, credentials). Warn the user instead.
- The subject is at most 72 chars, imperative, with no trailing period, and the body explains *why*.
- Keep each commit to one logical group. Use the survey to find the grouping, don't guess from a partial
  `git status`.
