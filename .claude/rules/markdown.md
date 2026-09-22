---
paths:
  - "**/*.md"
---

# Markdown Conventions

Rules for every Markdown file in this repo — the requirements docs (`docs/requirements/`), the DB design notes
alongside `docs/dbdesign/`, and generated reports (`docs/database-report/`). Enforced by `.markdownlint.jsonc`
(read by `npx markdownlint-cli2` and by the editor's markdownlint extension, so both agree) and by a
`PostToolUse` hook (`.claude/hooks/md-check.sh`) that lints each `.md` file you edit. Write files that pass the
first time. To check one: `npx markdownlint-cli2 <path>`. To apply the automatic fixes:
`npx markdownlint-cli2 --fix <path>`.

## Headings

- One level-1 heading (`#`) per file, as its title on the first line (after any front matter). Do not skip levels
  (`##` then `####`).
- Never use bold or italic text alone on a line as a heading (`MD036`). Use a real heading. If it must stay a label,
  end it with a colon: `**Must fix:**`.
- Do not repeat the same heading text in a file (`MD024`); make each one specific.
- A blank line before and after every heading.

## Code blocks

- Every fenced block has a language (`MD040`): `sh` for commands, `txt` for output, `sql` for DDL, `ts` for
  TypeScript, `yaml` for OpenAPI snippets, and so on. Never a bare fence.
- A blank line before and after every fenced block. Inside a list item, indent the fence to the item's text.

## Tables

- Style `any` (`MD060`): a table just needs to be internally consistent — a short table can stay visually
  aligned, but a table with paragraph-length cells (e.g. `docs/database-report/` audit reports) can use compact
  style (`| --- | --- |`, one space around each cell, no forced column-width padding) instead.
- Escape a pipe inside a cell as `\|`. Never let a row have more or fewer cells than the header.

## Lists, links and text

- A blank line before and after every list (`MD032`). Use `-` for bullets and `1.` `2.` `3.` for ordered lists.
- No bare URLs (`MD034`): write `<https://example.com>` or `[text](https://example.com)`.
- Relative links must point to a file that exists in this repo (e.g. a database report linking back to
  `docs/dbdesign/Food-Delivery-System-sqldiagram.sql`), and `#anchors` must match a heading (GitHub's slug:
  lowercase, punctuation and emoji removed, spaces become hyphens).
- No trailing spaces, no tabs, no two blank lines in a row, and one newline at the end of the file.
- Line length is not enforced (`MD013` is off in `.markdownlint.jsonc`) — tables and links run long. Keep prose
  readable (about 120 columns) and never wrap a table row.

## Generated reports

- `docs/database-report/YYYY-MM-DD-schema-audit.md` files are written by the `database-architect` agent's Schema
  Audit Mode. They should still pass lint like any other file — the agent is expected to produce clean Markdown,
  not a draft to be fixed up afterward.

## Before you say you are done

Run `npx markdownlint-cli2 <the files you changed>` and fix everything it reports.
