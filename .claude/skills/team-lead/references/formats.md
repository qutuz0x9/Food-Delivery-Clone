# Team Lead formats

## Issue body

Same sections as the repo's issue forms when it has them (`.github/ISSUE_TEMPLATE/*.yml`): use each form's field
labels as `###` headings, so a lead-made issue looks like one filed on the website. Without forms, use this:

```md
### Summary
<one or two lines: what and why now>

### User story
As a <actor>, I want <goal> so that <benefit>.        <- features only

### Endpoints / area
<routes, modules or files this touches>

### Acceptance criteria
- [ ] <checkable with yes/no, e.g. "401 when there's no token">
- [ ] ...

### Notes
<contract/schema facts, dependencies (#n), open questions>

---
_Filed by the Tech Lead (simulated) · Sprint N · priority: <p> · size: <s>_
```

- A bug uses `### Steps to reproduce`, `### Expected`, `### Actual` instead of the user story and endpoints.
- Criteria come from the real spec, schema and rules. Each response code or rule becomes one criterion.
- Title in the repo's commit style, e.g. `feat(customers): get the customer profile at GET /customers/me`.

## Lead comment on an issue

```md
**[Tech Lead]** <message>
```

## Review comment on a PR

```md
## [Tech Lead review] Round <n>

**Verdict: APPROVED** | **Verdict: CHANGES REQUESTED**

<one or two lines: overall impression>

### Blocking
1. `path/to/file.ts:42`: <what is wrong> → <what "fixed" looks like, not the code>
<or "None">

### Suggestions (non-blocking)
- `path/to/file.ts:10`: <nit>
<or "None">

### Acceptance criteria
- [x] <criterion met>
- [ ] <criterion not met>: <why>

<on APPROVED: "Merging now." · on CHANGES REQUESTED: "Push the fixes and ping me for round <n+1>.">
```

`status` and `review` look for the exact strings `[Tech Lead review]`, `Verdict: APPROVED` and
`Verdict: CHANGES REQUESTED`, so keep them unchanged.

## Squash merge message

```txt
<PR title> (#<pr>)

<2-3 lines: why this change, what it gives the user/system>

Co-authored-by: <deduped trailers from the PR's commits, one line each>
```

Never GitHub's default body (the `* commit` bullets and `---------`).

## Vault log: `<project vault folder>/Team Lead Log.md`

Copy the frontmatter shape of the project's other notes. Default:

```md
---
tags:
  - topic/git
  - type/project
related-to: "[[<project overview note>]]"
---

# Team Lead Log

## Stats

| Sprints | Issues merged | Merged first round | Avg review rounds | Surprises |
| --- | --- | --- | --- | --- |
| 0 | 0 | 0% | 0 | 0 |

## Sprint 1 (2026-11-08 → 2026-11-15)

Goal: <one line>

| Issue | Priority | Size | PR | Rounds | Result | Feedback themes |
| --- | --- | --- | --- | --- | --- | --- |
| #3 Get customer profile | high | M | #4 | 2 | merged | missing 403 path, DTO leaked a field |

Summary: <filled at sprint close: done / carried over, what went well, what to watch next sprint>
```

- Add a row when an issue is created. Update it after each review round and on merge.
- Recalculate the Stats row whenever a row changes.
- Feedback themes are short tags of the blocking items, so repeated mistakes show up over time.
