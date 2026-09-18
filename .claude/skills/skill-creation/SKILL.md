---
name: skill-creation
description: Scaffold or improve a Claude Code skill by reading existing skills and applying this repository's conventions. Use when the user wants to create a new skill or enhance an existing one.
argument-hint: "[skill-name]"
---

# Skill Creation Guide

A reference for creating well-structured Claude Code skills in this repository. Follow it every time you scaffold or
edit a skill.

## Usage

```
/skill-creation
/skill-creation <skill-name>
```

## Behavior

1. **Read existing skills** in `.claude/skills/*/SKILL.md` to align with established conventions.
2. **Clarify** what the skill should do and how it will be triggered, if it isn't clear. Confirm it does *one* thing.
3. **Scaffold** `.claude/skills/<skill-name>/SKILL.md` with the frontmatter and structure below. Put long reference
   material in sibling files (e.g. `reference.md`) and link to them from `SKILL.md`.
4. **Validate** against the quality checklist before saving.
5. **Report** the files created and any assumptions made.

## Skill File Structure

```
.claude/skills/<skill-name>/
  SKILL.md          # required; keep it short (well under ~500 lines)
  reference.md      # optional supporting files, loaded only when linked and needed
```

`<skill-name>` is lowercase kebab-case (e.g. `git-commit`, `openapi-generator`) and matches the directory name.

## Frontmatter

```markdown
---
name: <skill-name>
description: <what it does + when to use it>
---
```

| Field                      | Required | Notes                                                                                     |
| -------------------------- | -------- | ----------------------------------------------------------------------------------------- |
| `name`                     | yes      | Lowercase kebab-case; matches the directory name                                          |
| `description`              | yes      | The model reads this to decide when to invoke; see the rules below                        |
| `argument-hint`            | no       | Shown in autocomplete, e.g. `[domain] [file]`                                             |
| `allowed-tools`            | no       | Pre-approves tools while the skill runs, e.g. `Bash(git diff:*)`. Grant the minimum.      |
| `disable-model-invocation` | no       | `true` = only the user can run it. Use for side-effecting skills (commit, deploy).       |
| `user-invocable`           | no       | Defaults to `true`. Set `false` only for background-knowledge skills hidden from the menu |

### Description Rules

- Start with an action verb: "Generate...", "Read...", "Create...", "Analyze..."
- State the **input** and the **output**
- End with "Use when the user wants to <goal>."
- Keep it to 1-2 sentences, under 50 words
- Be specific. Vague descriptions make the skill fire at the wrong time.

**Good:** `Generate a Conventional Commits message from the staged changes and create the commit. Use when the user wants to commit staged changes.`

**Bad:** `Helps with git stuff.`

## Body Structure

```
# <Title>

<One-paragraph summary>

## Usage
## Behavior
## <Domain-specific reference sections: tables, formats, examples>
## Rules & Quality Standards   <- always last
```

- **Usage**: show every invocation variant the skill supports.
- **Behavior**: numbered, ordered steps with a **bold** step name and nested bullets. Include decision logic ("If X
  is missing, do Y"), output paths and how they are chosen, and what to report back.
- **Reference sections**: tables, code blocks and examples. Always include at least one concrete output example.
- **Rules & Quality Standards**: a short list of hard constraints the model must never violate.

## Project Conventions

- Skills must not contradict `CLAUDE.md` or `.claude/rules/`. Point at those files instead of copying their content,
  so there is one source of truth.
- Skills that write files or change git state should say exactly which paths or commands they touch.
- Skills that run commands should list them in `allowed-tools` and use `disable-model-invocation: true` when the
  action is hard to reverse.

## Quality Checklist

- [ ] Directory name is kebab-case and matches `name`
- [ ] `description` starts with an action verb, states input and output, and ends with "Use when..."
- [ ] `allowed-tools` is minimal; `disable-model-invocation` is set for side-effecting skills
- [ ] **Usage** shows all valid invocation forms
- [ ] **Behavior** steps are numbered, ordered and cover failure cases
- [ ] At least one concrete output example is present
- [ ] **Rules & Quality Standards** is present and non-empty
- [ ] No placeholder text (`TODO`, `<your name here>`) remains
- [ ] Nothing conflicts with `CLAUDE.md` or `.claude/rules/`
- [ ] The skill does **one thing**. If it does two unrelated things, split it.

## Full Skill Template

````markdown
---
name: my-skill
description: <Action verb> <input> and <output>. Use when the user wants to <goal>.
argument-hint: "[arg]"
---

# My Skill Title

<One-paragraph description of what this skill does and why it is useful.>

## Usage

```
/my-skill
/my-skill <arg>
```

## Behavior

1. **First step**
   - Detail
   - If <condition>, do <action>

2. **Write output**
   - Write to `<path>`; create the directory if needed

3. **Report results**
   - Summarize what was produced and any assumptions

## Output Example

```<language>
<concrete example of the skill's output>
```

## Rules & Quality Standards

- <Hard constraint 1>
- <Hard constraint 2>
````

## Existing Skills in This Repository

| Skill               | What makes it a good model                                                          |
| ------------------- | ----------------------------------------------------------------------------------- |
| `git-commit`        | Types and scopes tables, safe git rules, `disable-model-invocation`, varied examples |
| `openapi-generator` | Extends an existing spec, defers to the rules file, validates with lint             |
