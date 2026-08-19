---
name: skill-creation
description: Scaffold or improve a Copilot CLI skill by reading existing skills and applying repository conventions. Use when the user wants to create a new skill or enhance an existing one.
user-invocable: true
---

# Skill Creation Guide

A reference skill for creating high-quality, well-structured Copilot CLI skills for this repository. Read and follow this guide every time you scaffold a new skill.

## When to Use

- A user asks you to create a new skill
- A user asks you to improve or rewrite an existing skill
- You identify a recurring workflow that would benefit from a dedicated skill

## Usage

```
/skill-creation
```

## What It Does

1. **Reads** existing skills in `.github/skills/` to align with established conventions
2. **Scaffolds** the new skill directory and `SKILL.md` with correct frontmatter and structure
3. **Validates** the result against the quality checklist below before saving

---

## Skill File Structure

Every skill lives at:
```
.github/skills/<skill-name>/SKILL.md
```

`<skill-name>` must be lowercase kebab-case (e.g., `git-commit`, `openapi-generator`).

---

## Frontmatter

```markdown
---
name: <skill-name>
description: <trigger description — see rules below>
user-invocable: true
---
```

### Frontmatter Rules

| Field | Required | Notes |
|---|---|---|
| `name` | ✅ | Lowercase kebab-case; must match the directory name |
| `description` | ✅ | The model reads this to decide when to invoke; see Description Rules |
| `user-invocable` | ✅ | Always `true` for user-facing skills |

### Description Rules

The `description` field is the **most important part of a skill**. It controls when the skill is invoked.

- Start with an action verb: `"Generate..."`, `"Read..."`, `"Create..."`, `"Analyze..."`
- State the **input** and the **output** explicitly
- End with: `"Use when the user wants to <action>."`
- Keep it to **1–2 sentences**, under **50 words**
- Be specific — vague descriptions cause the skill to fire at the wrong time

**Good:**
```
Read a markdown file containing a list of APIs and generate complete API documentation in OpenAPI Specification 3.0 (YAML or JSON). Use when the user wants to generate or scaffold OpenAPI docs from a markdown API list.
```

**Bad:**
```
Helps with API stuff and documentation things.
```

---

## Body Structure

Use this section order consistently across all skills:

```
# <Title>

<One-paragraph summary of what the skill does>

## Usage
## Behavior
## <Domain-specific reference sections (tables, formats, examples)>
## Rules & Quality Standards   ← always last
```

### Usage Section

Show every invocation variant the skill supports:

```markdown
## Usage
\```
/skill-name
/skill-name <required-arg>
/skill-name <required-arg> --flag value
\```
```

### Behavior Section

Number every step the skill performs. Use **bold** for the step name. Use nested bullets for sub-steps.

```markdown
## Behavior

1. **Step name**
   - Detail
   - Detail

2. **Step name**
   - Detail
```

Rules:
- Steps must be **ordered and exhaustive** — the model executes them top to bottom
- Include decision logic: "If X is missing, do Y"
- Include output file paths and how they are determined
- Include what to report back to the user after completion

### Reference Sections

Add domain-specific sections between **Behavior** and **Rules**. Use tables, code blocks, and examples generously. Good examples from existing skills:

- `git-commit` uses a **Types table** and **Example commits** per type
- `openapi-generator` uses **Supported Markdown Styles** with code block examples and an **Output Example** (YAML snippet)

Always include at least one **concrete output example** so the model knows exactly what the result should look like.

### Rules & Quality Standards Section

End every skill with a `## Rules & Quality Standards` section. This is a short bullet list of hard constraints the model must never violate. Examples:

```markdown
## Rules & Quality Standards

- Never invent data not present in the source material
- Always produce valid output — no broken references or missing required fields
- Reuse shared structures via references rather than inlining duplicates
- If input is ambiguous, make the most reasonable assumption and state it in the output summary
```

---

## Quality Checklist

Before saving a new or updated skill, verify every item:

- [ ] Directory name is `lowercase-kebab-case` and matches `name` in frontmatter
- [ ] `description` starts with an action verb, states input + output, ends with "Use when..."
- [ ] `user-invocable: true` is present
- [ ] **Usage** section shows all valid invocation forms
- [ ] **Behavior** steps are numbered, ordered, and exhaustive
- [ ] At least one concrete **output example** (code block) is present
- [ ] **Rules & Quality Standards** section is present and non-empty
- [ ] No placeholder text (e.g., `TODO`, `<your name here>`) remains
- [ ] The skill does **one thing** — if it does two unrelated things, split it into two skills

---

## Full Skill Template

```markdown
---
name: my-skill
description: <Action verb> <input> and <output>. Use when the user wants to <goal>.
user-invocable: true
---

# My Skill Title

<One-paragraph description of what this skill does and why it is useful.>

## Usage

\```
/my-skill
/my-skill <arg>
/my-skill <arg> --flag value
\```

## Behavior

1. **First step**
   - Detail
   - If <condition>, do <action>

2. **Second step**
   - Detail

3. **Generate output**
   - Write to `<path>`; create the directory if it does not exist
   - Output format: <format>

4. **Report results**
   - Print a summary of what was produced
   - Note any assumptions made

## <Reference Section Title>

<Tables, lists, or code blocks with domain-specific reference material>

## Output Example

\```<language>
<concrete example of the skill's output>
\```

## Rules & Quality Standards

- <Hard constraint 1>
- <Hard constraint 2>
- <Hard constraint 3>
```

---

## Examples of Well-Written Skills in This Repository

| Skill | What makes it good |
|---|---|
| `git-commit` | Exhaustive behavior steps; types table with clear "use when" column; three varied output examples covering simple/feature/refactor cases |
| `openapi-generator` | Explicit file location logic; three supported input styles with code examples; full YAML output example; strict quality rules |
