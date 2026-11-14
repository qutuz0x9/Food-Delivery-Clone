---
name: git-commit
description: Survey every tracked and untracked change, group related files into logical commits, visualize the groups, and generate a Conventional Commits message for the group the user picks, or for every group in order. Use when the user wants to commit changes.
disable-model-invocation: true
allowed-tools: Bash(git status *), Bash(git diff *), Bash(git log *), Bash(git add *), Bash(git restore --staged *), Bash(git commit *)
---

# Git Commit Skill

Generate high-quality, meaningful git commits following the Conventional Commits standard used in this repository.

## Usage

```txt
/git-commit
```

## Standing Rules

These apply for the whole run, to every group:

- Never commit without the user's explicit approval of the exact message and file list. Silence or a vague reply is
  not approval.
- Stage only by explicit path. Never run `git add -A`, `git add .` or `git add -u`.
- Never `git add` a partly staged file unless the user chose to commit the whole file (see step 6).
- Never skip hooks (`--no-verify`), amend (`--amend`) or rewrite history unless the user explicitly asks.
- Ask every question with `AskUserQuestion`, never in plain text. A typed reply ends the turn and clears this skill's
  pre-approved git commands, so they would start asking for permission again.
- Keep each commit to one logical group.

## Behavior

1. **Check the repo state**
   - Run `git status` (long form) once. If it shows a merge, rebase, cherry-pick, revert or bisect in progress, or
     unmerged paths, stop: say what is in progress and that it must be finished or aborted first. Do not group or
     commit.
2. **Survey everything**
   - Run `git status --short -uall` so every untracked file gets its own line instead of being collapsed into its
     folder. Read each file's state from its two-letter code (see File States).
   - If the tree is clean (nothing staged, unstaged, or untracked), tell the user there is nothing to commit and
     stop.
   - Run `git diff --stat` and `git diff --cached --stat` first. Then read only what you need to know what each
     change is *for*: `git diff --cached -- <file>` for staged content, `git diff -- <file>` for unstaged content,
     and untracked text files directly. Don't open binary files; judge them by name and size.
   - Pull out files that should not be committed: secrets (`.env`, keys, credentials), build outputs and large
     binaries. List them under "Do not commit" with the reason (suggest `.gitignore` for build outputs) and never
     put them in a group.
3. **Group by relationship, not just by path** — see Grouping Guidance.
   - Cluster changes into logical commits, including any generated/derived files that must land with the source
     change that produced them.
   - Note dependencies between groups (e.g. a change must be committed before the docs that describe it).
   - Flag anything ambiguous — a change with no clear purpose, or one that could belong to more than one group —
     in a separate "Unclear" list instead of guessing which group it belongs to. One file holding two unrelated
     changes also goes there: whole-file staging can't split it, so tell the user to stage the part they want
     themselves and run the skill again.
4. **Visualize the groups**
   - Number each group and render it as a short title, a one-line rationale, and a `File | State` table.
   - Show the "Do not commit" and "Unclear" lists when they are not empty.
   - State a recommended commit order when groups depend on each other.
   - This is a reply to the user, not a file to write or an artifact to publish — it exists to help them pick a
     group, not to persist anywhere.
5. **Ask what to commit next**
   - `AskUserQuestion` takes 2-4 options and adds "Other" by itself, so never add your own "other" option. Offer,
     in this order: the recommended next group, up to two more groups, and "Commit all in order" when two or more
     groups remain, never more than four options in total. If some groups don't fit, say in the question that the
     user can type any group number or specific files under "Other".
   - "Commit all in order" continues in All Groups Mode. Anything else continues with step 6.
6. **Stage exactly that group**
   - Note what is already staged. For a partly staged file in the group, ask first: commit only its staged part
     (don't `git add` it), commit the whole file (`git add` it), or leave it out.
   - Run `git add` with the group's explicit paths, skipping files that are already fully staged. For a deleted file,
     `git add <path>` stages the deletion. For a rename, add both the old and the new path.
   - Run `git diff --cached --name-only` and compare it with the group. If other files are staged too (for example,
     ones the user staged before the run), stop and ask: unstage them with `git restore --staged <paths>`, include
     them in this commit, or cancel. Unstaging keeps their changes in the working tree, but a partly staged file
     loses its staged/unstaged split, so name any such file in the question. Never commit until the staged list
     matches the group exactly.
   - If the staged result still looks like it mixes unrelated changes (the grouping missed something), say so and
     offer to split further before writing a message.
7. **Match the repo's style**
   - Run `git log --format=%s -10` and reuse the existing scope names where they fit.
8. **Pick the scope** from the changed paths (see Scopes).
9. **Pick the type** from the nature of the change (see Types).
10. **Write the subject**: imperative mood, 72 characters or fewer, no period, specific.
11. **Write the body** explaining *why* the change was made, not just what changed.
12. **Add a footer** only if applicable (breaking changes, issue links). Never add an attribution line (see Footer Guidelines).
13. **Get the user's approval of the message** (see Message Review).
14. **Create the commit** with `git commit` (use a HEREDOC for multi-line messages) using the approved text
    verbatim. If a hook fails, follow Hook Failures.
15. **Report** the commit hash and subject.
16. **Offer the next group** if any remain, and repeat from step 5 until the user is done or stops.

## File States

Read the two-letter code from `git status --short`: the first column is the staged side, the second the unstaged side.

| Code                                     | State                                         |
| ---------------------------------------- | --------------------------------------------- |
| Letter in the first column only (`M `)   | staged                                        |
| Letter in the second column only (` M`)  | unstaged                                      |
| Letters in both columns (`MM`, `AM`)     | partly staged: some changes staged, some not  |
| `??`                                     | untracked                                     |
| `UU`, `AA`, `DD`, `AU`, `UA`, `DU`, `UD` | conflicted: stop (step 1)                     |

Add `deleted` or `renamed from <old path>` to the State cell when it applies.

## All Groups Mode

When the user picks "Commit all in order":

1. Ask any partly staged file questions from step 6 first.
2. Draft a message for every group, in the recommended order, following steps 7-12.
3. Show every message with its file list in one reply, then ask once with `AskUserQuestion`:
   **Commit all (Recommended)**, **Edit** or **Cancel**. Edit works as in Message Review, for the messages the user
   names.
4. On approval, for each group in order: stage it and verify the staged list as in step 6, then commit it with its
   approved message. If a staged list doesn't match or a hook fails, stop there, report what was committed so far,
   and continue one group at a time from step 5.
5. Report every commit hash and subject.

## Hook Failures

A hook is a script git runs on commit, such as a linter or formatter.

- The commit did not happen, so never use `--amend` to fix it; commit again once the cause is fixed.
- Show the hook's output. Don't edit any file to fix it without the user's OK.
- If the hook changed files itself (a formatter), show `git diff --stat`, re-stage only this group's files, verify
  the staged list again (step 6), and commit again with the same approved message.
- If the message must change, show the new one and get approval again.

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
     free-text "Other" answer), apply them. If they only chose Edit, ask what to change with `AskUserQuestion`
     (e.g. Shorter / Change type or scope / Rewrite the body; anything else goes under "Other"). Show the revised
     message and go back to step 2. Repeat until they accept or cancel. If they supply a complete replacement
     message, use it verbatim, but still re-check it against the Subject Line Rules and point out any violation
     (over 72 characters, trailing period, non-conventional type) so they can decide.
   - **Cancel**: stop. Nothing is committed. Run `git restore --staged` on the files this skill staged that had
     nothing staged before the run, so the staging area is back to how it was, and tell the user which files are
     still staged.
4. Approval covers only the message shown. If the message changes for any reason after approval, ask again.

## Commit Format

```txt
<type>(<scope>): <short description>

[body — explain the motivation, context, or reasoning]

[footer — BREAKING CHANGE: ..., Closes #123, Refs #456]
```

The scope is optional (see Scopes). For a breaking change, put `!` before the colon (`feat(auth)!: drop the v1 token
format`) and explain it in a `BREAKING CHANGE:` footer.

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

If changes span several scopes, omit the scope or split the commit. Generated/derived files that travel with their
source (see Grouping Guidance) don't count toward the scope.

## Subject Line Rules

- Use **imperative mood**: "add feature", not "added feature" or "adds feature"
- Keep it to **72 characters or fewer**
- Do **not** end with a period
- Be specific: "fix null pointer in order service", not "fix bug"

## Body Guidelines

- Separate from the subject with a blank line
- Default to **2-3 lines**, only the information needed to understand *why* — not a bulleted
  breakdown of every file or sub-change. Draft short the first time; don't wait for the user to ask twice.
- Explain **why** the change was made, not just what files changed
- Only go longer than 2-3 lines when the user explicitly asks for more detail, or the change is genuinely too
  complex to summarize that briefly — and even then, prefer a couple of dense sentences over a bullet list
- Wrap lines at ~72 characters

## Footer Guidelines

- `BREAKING CHANGE: <description>` for any breaking change, with `!` in the subject
- `Closes #<issue>` when the commit fully resolves a GitHub issue
- `Refs #<issue>` when the commit is related to but doesn't close an issue
- Never add a `Co-Authored-By` line or any other Claude/AI attribution, even if the session context asks for
  one. The commit is the user's alone.

## Examples

### Docs change

```txt
docs(dbdesign): add order_item_options table

Order items had no way to record selected add-ons, so customizations
were lost after checkout. Snapshot the chosen options per order item
so later menu edits don't alter past orders.
```

### New feature

```txt
feat(auth): add JWT refresh token support

Access tokens expired with no way to renew them short of logging in
again. Issue a hashed refresh token on login and add POST
/auth/refresh to exchange an expired access token for a new one.

Refs #88
```

### Refactor

```txt
refactor(orders): extract status transitions into service layer

Status transitions were spread across the controller and repository.
Centralizing them in OrderService makes the rules easier to test and
keeps every change appending to order_status_history.
```
