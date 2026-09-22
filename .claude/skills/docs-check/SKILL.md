---
name: docs-check
description: Check and fix the repo's Markdown files (markdownlint rules, aligned tables, links and anchors) with markdownlint-cli2, then fix what the automatic fixer cannot. Use when the user asks to check, fix or clean up Markdown docs, or after writing or editing several .md files.
argument-hint: "[file ...]"
disable-model-invocation: true
allowed-tools: Read, Edit, Bash(npx markdownlint-cli2:*), Bash(git status:*), Bash(git diff:*)
---

# Docs Check Skill

Make the repo's Markdown pass `npx markdownlint-cli2`: the rules in `.markdownlint.jsonc`, plus aligned tables and
valid relative links/anchors. The conventions are in `.claude/rules/markdown.md`.

## Usage

```txt
/docs-check
/docs-check docs/requirements/Functional-Requirements.md
```

## Behavior

1. **Note what is already modified.** Run `git status --short` so you can tell the user's uncommitted edits from
   your fixes.
2. **Run the fixer.** `npx markdownlint-cli2 --fix "**/*.md"` for the whole repo, or
   `npx markdownlint-cli2 --fix <files>` when the user named files. This applies the automatic markdownlint fixes,
   including table alignment (`MD060`).
3. **Read the report** markdownlint-cli2 prints for anything it couldn't fix automatically.
4. **Fix what is left by hand.** Use this table, then read the file's context before editing:

   | Rule or message                     | Fix                                                                             |
   |--------------------------------------|----------------------------------------------------------------------------------|
   | `MD036` emphasis used as heading    | Make it a real heading, or end the bold label with a colon (`**Label:**`)       |
   | `MD040` fence without a language    | Add `sh` (commands), `txt` (output), `sql` (DDL), `ts`, `yaml`, ...              |
   | `MD024` duplicate heading           | Rename one so each heading is unique                                            |
   | `MD034` bare URL                    | Wrap it in `<...>` or write `[text](url)`                                       |
   | `MD001` heading level jumps         | Use the next level down (`##` then `###`)                                       |
   | `MD031`, `MD032`, `MD022`, `MD058`  | Add the blank line before and after the fence, list, heading or table           |
   | `MD012`, `MD009`, `MD010`, `MD047`  | Remove extra blank lines, trailing spaces and tabs; end with one newline        |
   | `MD060` or "table columns are not aligned" | Run `npx markdownlint-cli2 --fix <path>`, or fix a malformed row (uneven cell count) |
   | broken link or anchor               | Point it at the real file, or at the heading's GitHub slug (lowercase, hyphens) |

5. **Run `npx markdownlint-cli2 <files>` again** and repeat step 4 until it passes. Stop after three rounds and
   tell the user what is left instead of guessing.
6. **Report** what the fixer changed and what you fixed by hand, using `git diff --stat`. Never stage or commit;
   suggest `/git-commit`.

## Rules

- Never rewrite or delete the user's prose to satisfy the linter. Fix formatting, not content.
- Do not change `.markdownlint.jsonc` or disable a rule to make a file pass. If a rule seems wrong, ask the user.
- If `npx markdownlint-cli2` reports it needs installing, tell the user to run `npm install` (it should be a
  devDependency — see `package.json`).
