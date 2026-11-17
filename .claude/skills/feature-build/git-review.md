# Git review mode

`/feature-build git-review [pr-number]` reviews what the user **wrote about** their code: every commit message on the
feature branch, the PR, and the squash commit that landed on `main`. Code quality is `review` and `final-review`'s
job; this mode asks whether someone who wasn't there can understand **what** changed and **why** from the history
alone.

It runs **after the merge**, so every finding is a lesson for the next PR, not a fix. Like `final-review`, it may show
the corrected text (a rewritten message, a better PR section), because nothing can be changed any more.

**Read only.** Never commit, push, merge, edit a PR or issue, or comment on GitHub. Use the `gh` CLI and `git` for
reading; if the GitHub MCP server is unavailable, `gh` is enough.

## Steps

1. **Find the PR:**
   - from the argument (`git-review 15`), otherwise
   - the merged PR of the latest feature in `.learning/progress.md`: `gh pr list --state merged --head <branch>`.
   - **Not merged yet** → say this mode runs after the merge, list the 3–5 things it will check (so the user can
     prepare), and stop.
2. **Collect the facts** (keep the real output for the note):
   - the PR: `gh pr view <n> --json number,title,body,url,headRefName,mergedAt,mergeCommit,commits,files,closingIssuesReferences`
   - CI on the PR: `gh pr checks <n>`
   - each branch commit: `git show --stat --format=fuller <sha>`. The PR keeps the branch commits even after a squash;
     fetch them with `git fetch origin pull/<n>/head` if they are not local.
   - the squash commit on `main`: `git show --stat --format=fuller <mergeCommit>`
   - the linked issue: `gh issue view <issue>` (its acceptance criteria and the questions it asked)
   - the feature's plan and notes (what the feature really did, which decisions were made)
3. **Check that each commit builds alone.** For every branch commit, in order: `git worktree add --detach
   <scratchpad>/git-review/<sha> <sha>`, symlink `node_modules`, run the type check and the build, then
   `git worktree remove --force`. Record which commits fail and why (usually a file committed later). Remove every
   worktree, even when a step fails.
4. **Check the PR as GitHub shows it:**
   - Text in `<angle brackets>` outside code is hidden by GitHub as HTML. Find it in the raw body.
   - Checklists render only as `- [ ]` / `- [x]`. Find `[x ]`, `[ x]`, `[]`.
   - `Closes #N` (or `Fixes` / `Resolves`) is present, and `closingIssuesReferences` confirms GitHub linked it.
   - Every command in "How to test" exists: each `npm run <script>` is in `package.json`. Don't run commands that
     write to a database other than the test one.
5. **Compare the words with the diff:**
   - Does each commit's subject describe what its diff really changes (type, scope, verb)?
   - Does the PR mention every change a reviewer must know about, especially project-wide ones (routes, middleware,
     config, the spec, dependencies)?
   - Does it answer the question or decision the linked issue asked for?
   - Is the code Claude wrote credited honestly (a `Co-authored-by` trailer, or a line in the PR), without a pile of
     duplicate trailers?
6. **Score and write the note** (see below). Update the vault's **Git Checklist** with every miss.
7. **Progress:** update `.learning/progress.md` (see "Progress").
8. **Report briefly in chat:** the note path, the scores, the 3 things explained well, the 3 most important misses, and
   one rewritten commit message as an example.

## What to check

Use the project's own rules first: Conventional Commits types and the scopes already used in `git log`, the user's
commit-brevity rule (a body of 2–3 lines, not a bulleted breakdown), one topic per PR, and squash-only `main` with a
clean squash message.

**Each commit:**

- builds and passes the type check alone (Must fix when it doesn't: `git bisect` and reverts break on it)
- subject: Conventional Commits `type(scope): summary`, imperative, lower case, no period, about 50 characters, a type
  and scope that match the diff
- body (when needed): **why**, not a list of files; 2–3 lines; wrapped at about 72 characters
- one logical change: code and its tests together; not a commit per file, not a mix of unrelated topics
- nothing that shouldn't be there: secrets, tool folders, generated files, debug code

**The PR:**

- title: what a reader of `main` should see (it becomes the squash subject)
- what, why, how it was tested (commands that run), risks or follow-ups
- links the issue with a closing keyword, and answers what the issue asked
- matches the diff: nothing big left unmentioned, nothing claimed that isn't there
- renders right on GitHub (hidden `<words>`, checklists, code fences)
- CI green before the merge

**The squash commit on `main`:**

- subject equals the PR title plus `(#n)`
- body is clean: a short why, not GitHub's default list of every branch commit, not duplicate `Co-authored-by` lines
- `Closes #N` kept, so the history links the issue

## Scoring

Three scores, each out of 10, with the same deductions as `final-review`:

| Start at 10, then | Deduction |
| --- | --- |
| each **Must fix**: a commit that doesn't build, a message that says the wrong thing, a secret committed, the issue not linked, the decision the issue asked for missing, a "How to test" command that fails | −2 |
| each **Should fix**: wrong type or scope, a body that lists files instead of why, a text GitHub renders wrong, a missing risk, messy squash body, credit missing or duplicated | −0.5 |

- **Commits:** all branch commits together. Count the same mistake once, and say how many commits it touched.
- **PR:** the title and the description.
- **Squash commit:** the commit on `main`.
- **Overall:** the average, one decimal, then one line: what it means and the single most important habit to build.
- Minimum 1 when something is right. Text Claude wrote at the user's request is not scored; say so.

## The note

`NN- (Git Review) PR <n>.md` in the feature's folder, continuing its numbering. Frontmatter: tags `topic/git`,
`type/bug`, `related-to`, and `Date: <today>`. Sections, in order:

1. A `>[!Note]` callout: what was reviewed (the commits, PR #n, the squash commit with its short sha and merge date),
   a link to the Overview, and "everything is merged: these are lessons for the next PR".
2. `# My Commits and PR <n>`
3. A `>[!Summary]` callout: the overall score, what went well, the biggest misses, the one lesson.
4. `## Scores`: part | score | the main reasons in one line; the overall in the last row.
5. `## What I explained well`: the real strengths, each with the line that shows it.
6. `## What I missed`: things that should have been said and weren't (the why, a project-wide change, the issue's
   question, the risks, a credit). Each with where it belonged and why a reader needs it.
7. `## What to improve`: one `###` per problem, worst first: the real text (quoted from the commit or PR), what it
   causes for a reader or a tool (`git log`, `git blame`, `git bisect`, GitHub), and **a rewritten version** in a fence.
8. `## Commit by commit`: a table of short sha | subject | builds alone? | verdict | the one fix.
9. `## The squash commit`: the real text on `main`, what's right, what's wrong, and the clean version it should have
   been.
10. `## Next time: a checklist`: the checks this review found missing, as checkboxes to run before the next merge.
11. `## Key Takeaways`: 3–5 lessons.

Quote real text everywhere: never paraphrase a commit message or a PR section you are judging.

## Git Checklist

`04- Projects/<project>/03- Development/Features/00- Git Checklist.md`, `type/study-guide`, next to the Design
Checklist and built the same way: created on the first git review, grouped by **Commits**, **PR** and **Squash and
merge**, each item a question with where it came from:
`- [ ] Does every commit build on its own? (Protect Routes: 3 of 5 didn't)`. Don't repeat an item; add the new PR to
it. When a later review finds the item done right, mark it `✅ PR <n>`, and after two ✅ move it to a **Learned**
callout at the end. Rebuild it from earlier commit reviews in the vault the first time, so past misses are not lost.

## Progress

- Record the review in the **Git reviews** table: date, PR, the three scores, the overall, and the biggest miss.
- Update the **Git** concepts (names in `progress-rules.md`): a part scored 8 or more with no Must fix counts as one
  approval for its concept; a Must fix keeps it where it is.
- A Must fix that also appeared in an earlier git review is a **recurring mistake** (same rules as code mistakes).
- If the feature's status was waiting for the merge, set it to `done`.
