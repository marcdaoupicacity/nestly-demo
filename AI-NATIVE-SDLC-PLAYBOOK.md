# The AI-Native SDLC Playbook — A Detailed Guide

> A guide to Anthropic's **"The AI-native SDLC playbook"** (claude.com, August 21, 2026, lead author Louis Claxton, based on the practices of Anthropic's Applied AI team), and how to build it with Claude Code.
>
> Primary source: https://claude.com/blog/the-ai-native-sdlc-playbook
> Companion post: https://claude.com/blog/how-anthropic-secures-its-ai-native-software-development-lifecycle (Jason Clinton, July 21, 2026)

---

## Table of contents

1. [What the playbook is](#1-what-the-playbook-is)
2. [The core argument: the bottleneck moved](#2-the-core-argument-the-bottleneck-moved)
3. [From pipeline to loop](#3-from-pipeline-to-loop)
4. [The governing principle: the production gate](#4-the-governing-principle-the-production-gate)
5. [The six stages and the files they pass on](#5-the-six-stages-and-the-files-they-pass-on)
6. [The 12 plays](#6-the-12-plays)
7. [Security: how Anthropic secures its own AI-native SDLC](#7-security-how-anthropic-secures-its-own-ai-native-sdlc)
8. [How it maps to Claude Code features](#8-how-it-maps-to-claude-code-features)
9. [Building it yourself: step-by-step](#9-building-it-yourself-step-by-step)
10. [Effort estimate](#10-effort-estimate)
11. [Pitfalls and hard parts](#11-pitfalls-and-hard-parts)
12. [Comparison with other playbooks](#12-comparison-with-other-playbooks)
13. [Confidence notes](#13-confidence-notes)

---

## 1. What the playbook is

The playbook is Anthropic's guide to running software development when AI agents write most of the code. It covers three products:

- **Claude Code**: the agent that plans, writes, tests and reviews code.
- **Claude Enterprise**: the governed, organization-wide deployment.
- **Claude Tag**: Claude inside Slack, for capturing intent and handling incidents where the conversations already happen.

It is published as a blog article in the *Best practices* category. Secondary sources report that it is also a **free 14-lesson Claude Academy course**: an introduction, 12 "plays" and closing thoughts.

---

## 2. The core argument: the bottleneck moved

> "Code is no longer the bottleneck."

Before AI agents, writing code was the slowest step, and every SDLC process was designed around it. Once agents write code in minutes, the slow steps become the ones on either side:

| Before code | After code |
|---|---|
| Deciding *what* to build (intent, requirements) | Review |
| Design and specs | Testing and verification |
| Planning | Deployment and approvals |

These steps still run at **human speed**: approval queues, handoffs and meetings. Speeding up coding alone just piles up unreviewed work. The playbook's answer is to redesign the *whole* lifecycle, not only the build step.

---

## 3. From pipeline to loop

The traditional SDLC is a linear pipeline (or a series of sprints). The playbook turns it into a **loop**:

```
        ┌──────────────────────────────────────────────┐
        ▼                                              │
     PLAN ──► DESIGN ──► BUILD ──► TEST ──► DEPLOY ──► MAINTAIN
   intent.md   spec.md    plan.md   diff +   PR       incident
                                    tests             record
                                                        │
                                   becomes a new intent.md
```

Two key ideas:

1. **AI is built into every stage**, not only Build.
2. It **"combines the old control objectives with new enforcement."** You keep the goals that compliance and engineering leaders care about (separation of duties, review, traceability, change control), but enforce them with machine mechanisms such as hooks, CI checks and versioned files, rather than meetings and tickets.

---

## 4. The governing principle: the production gate

> "The agent does everything up to the production gate and nothing past it… Humans remain accountable for every decision that requires judgment."

What this means in practice:

- Agents can draft intent, write specs, plan, code, test, review and open PRs.
- Agents **cannot** push to production. Promotion to production is a human decision.
- **Several layers of agentic review** (AI reviewers, security review, evals) filter the work before a human sees it.
- **Human review is kept** for regulated and critical code.
- **Hooks act as approval gates.** The boundary is enforced by mechanisms, not by trusting the agent to behave.

---

## 5. The six stages and the files they pass on

The central design pattern: **each stage commits a file to version control, and the next stage reads it.** This gives you:

- **Traceability**: every line of code traces back to a plan, a spec and an intent.
- **Context for agents**: the next agent (or human) starts from a written record, not tribal knowledge.
- **Auditability**: the files themselves are the compliance trail.

### Stage 1 — Plan → `intent.md`
**Purpose:** Capture *why* and *what*, before *how*.
**Contents:** problem statement, who is affected, success criteria, constraints, non-goals.
**Who:** a product owner or engineer, often by talking to Claude (for example, in Slack through Claude Tag) and having it draft the file.

### Stage 2 — Design → `spec.md`
**Purpose:** Turn intent into requirements and a technical design.
**Contents:** functional requirements, interfaces/APIs, data model changes, edge cases, risks, test strategy.
**Who:** Claude drafts from `intent.md`; an engineer or architect reviews.

### Stage 3 — Build → `plan.md` → diff
**Purpose:** Break the spec into an implementation plan, then carry it out.
**Rule:** **"Nothing is implemented without an accepted plan."** Plan mode enforces this: Claude explores and proposes, but cannot edit until the plan is approved.
**Contents of plan.md:** files to touch, step order, tests to add, rollback approach.

### Stage 4 — Test → diff + tests
**Purpose:** Verify the change.
**How:** Claude gets a **feedback loop** (it runs tests, linters, type checks and the app itself), and **evals run in CI** to catch regressions in AI-driven behavior.

### Stage 5 — Deploy → the PR
**Purpose:** Package the change for promotion.
**How:** AI PR review (code quality, `/security-review`), guided by **`REVIEW.md`**, the review policy file written by the tech lead (not a stage output). CI/CD runs the full gate. **A human approves promotion past the production gate.**

### Stage 6 — Maintain → incident record → new `intent.md`
**Purpose:** Operate, observe and learn.
**How:** Incidents and metrics are written up as records, and each record **becomes the next `intent.md`**, which closes the loop.

### Summary table

| # | Stage | Input | Output artifact | Agent role | Human role |
|---|---|---|---|---|---|
| 1 | Plan | conversation, ticket, incident | `intent.md` | draft, clarify | own the intent |
| 2 | Design | `intent.md` | `spec.md` | draft spec | approve design |
| 3 | Build | `spec.md` | `plan.md` → diff | plan, implement | accept plan |
| 4 | Test | diff | diff + tests | write/run tests, evals | review results |
| 5 | Deploy | diff + tests | PR | AI review, CI | **approve production** |
| 6 | Maintain | prod signals | incident record | triage, draft record | judge priority |

---

## 6. The 12 plays

*(The list comes from secondary sources describing the Academy course; see [Confidence notes](#13-confidence-notes).)*

### Play 1 — Capture intent (`intent.md`)
Write down the "why" before any work starts. Keep it short: problem, users, success criteria, non-goals.
**Template:**
```markdown
# Intent: <title>
## Problem
## Who is affected
## Success criteria (measurable)
## Constraints
## Non-goals
## Source (ticket / Slack thread / incident link)
```

### Play 2 — Requirements and design (`spec.md`)
Have Claude turn intent into a spec, then review it like a design doc. Specs are where most of the human judgment goes.

### Play 3 — Plan mode as the default
Make plan mode the starting state, so Claude must propose a plan and get approval before editing files. This is the mechanical enforcement of "no implementation without an accepted plan."

### Play 4 — `CLAUDE.md`
A repo-level memory file that Claude Code loads automatically: build and test commands, architecture overview, conventions, forbidden patterns, security rules. Keep it short, correct and current.

### Play 5 — Skills as institutional knowledge
Package repeatable know-how ("how we write migrations," "how we add a feature flag," "our incident template") as **skills** in `.claude/skills/`. They turn knowledge held by individual engineers into reusable, versioned instructions.

### Play 6 — Parallel sessions and subagents
Run several Claude Code sessions at once, each in its own **git worktree**, so they don't step on each other. Use **subagents** for side tasks (research, review, test-writing) so the main context stays clean.

### Play 7 — Give Claude a feedback loop
Claude does its best work when it can check itself: run tests, linters, type checkers, the app or a browser. Without feedback it guesses; with feedback it iterates.

### Play 8 — Continuous evals in CI
Treat evals (graded test sets for AI-driven behavior, including prompts, agents and generated outputs) like unit tests. Run them in CI and block merges on regressions.

### Play 9 — AI in PR review
Every PR gets an AI review pass (quality, correctness, security) guided by `REVIEW.md`. Humans review what the AI flags and anything critical or regulated.

### Play 10 — Hooks as approval gates
Hooks are scripts Claude Code runs automatically at lifecycle events (for example, before a tool call). Use them to **block** dangerous actions such as pushing to main, deploying, editing protected paths or touching secrets, and to require approvals.

### Play 11 — CI/CD integration
Run Claude in CI (for example, through the GitHub Action or headless `claude -p`) for review, fixes and triage. CI holds the **hard gates**; local hooks hold the soft ones.

### Play 12 — Close the loop on metrics
Measure outcomes such as cycle time, review latency, change-failure rate, escaped defects and incident counts. Feed what you learn back into `intent.md`, `CLAUDE.md` and skills.

---

## 7. Security: how Anthropic secures its own AI-native SDLC

From Jason Clinton's companion post (July 21, 2026). It walks through Plan → Code → Test/CI → Deploy → Monitor → Governance, each with an "Enduring Principle." Key practices:

- **Agent identity:** each agent gets a **single-purpose identity with the minimum permissions** it needs. No shared or broad credentials.
- **Secure-by-default context:** secure coding guidelines live in **`CLAUDE.md` and organization-wide skills**, so every session starts with them.
- **Shift-left review:** run **`/security-review` before opening a PR**.
- **Hard gate in CI:** the binding security review happens in CI, where it can't be skipped locally.
- **Monitoring and governance:** agent actions are logged and auditable.

Anthropic also reports that **Claude writes about 80% of the code merged at Anthropic** and that engineers ship **about 8× more code per quarter** than in 2021–2025. These are Anthropic's own figures and have not been verified independently.

---

## 8. How it maps to Claude Code features

| Playbook concept | Claude Code feature | Where it lives |
|---|---|---|
| Accepted plan before build | Plan mode | `.claude/settings.json` → `permissions.defaultMode: "plan"` |
| Team knowledge | `CLAUDE.md` | repo root (plus nested folders) |
| Repeatable procedures | Skills | `.claude/skills/<name>/SKILL.md` |
| Approval gates | Hooks | `.claude/settings.json` → `hooks` |
| Parallel work | Worktrees + multiple sessions | `git worktree add ...` |
| Delegated side tasks | Subagents | `.claude/agents/<name>.md` |
| Self-verification | Bash tool, test runners, browser tools | — |
| PR review | `/security-review`, `/code-review`, GitHub Action | CI workflow |
| Headless automation | `claude -p` | CI scripts |
| Permissions / least privilege | allow/deny rules | `.claude/settings.json` → `permissions` |

---

## 9. Building it yourself: step-by-step

A minimal but real implementation for a single repo.

### Step 1 — Folder layout

```
repo/
├── CLAUDE.md
├── REVIEW.md
├── docs/
│   └── work/
│       └── 2026-11-11-feature-x/
│           ├── intent.md
│           ├── spec.md
│           └── plan.md
├── .claude/
│   ├── settings.json
│   ├── hooks/
│   │   └── gate.sh
│   ├── skills/
│   │   ├── write-intent/SKILL.md
│   │   ├── write-spec/SKILL.md
│   │   └── write-plan/SKILL.md
│   └── agents/
│       └── reviewer.md
└── .github/workflows/
    └── claude-review.yml
```

One folder per piece of work keeps the intent → spec → plan chain together and easy to trace.

### Step 2 — `CLAUDE.md`

```markdown
# Project: <name>

## Commands
- Install: `npm ci`
- Test: `npm test`
- Lint/typecheck: `npm run lint && npm run typecheck`

## Workflow (AI-native SDLC)
- Every change lives in `docs/work/<date>-<slug>/`.
- Order is mandatory: intent.md → spec.md → plan.md → code.
- Never implement without an accepted plan.md.
- Always run tests + lint before declaring done.

## Conventions
- <style rules, architecture notes>

## Security
- Never commit secrets; use env vars.
- Validate all external input.
- Run /security-review before opening a PR.

## Never
- Push to main. Deploy. Edit `.github/workflows/` or `infra/prod/`.
```

### Step 3 — `REVIEW.md` (written by the tech lead)

```markdown
# Review policy
## AI review checks
- Matches spec.md and plan.md; no scope creep
- Tests cover new behavior and edge cases
- No secrets, injection risks, unsafe deserialization
## Requires human review
- Anything under `src/billing/`, `src/auth/`, `infra/`
- DB migrations
- Dependency additions
## Auto-approvable by AI review
- Docs, tests-only, copy changes
```

### Step 4 — `.claude/settings.json` (plan mode + permissions + hooks)

```json
{
  "permissions": {
    "defaultMode": "plan",
    "allow": [
      "Bash(npm test:*)",
      "Bash(npm run lint:*)",
      "Bash(git status)",
      "Bash(git diff:*)"
    ],
    "deny": [
      "Bash(git push origin main:*)",
      "Read(./.env)",
      "Read(./secrets/**)"
    ]
  },
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash|Edit|Write",
        "hooks": [
          { "type": "command", "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/gate.sh" }
        ]
      }
    ]
  }
}
```

### Step 5 — The approval-gate hook (`.claude/hooks/gate.sh`)

Hooks receive the tool call as JSON on stdin. **Exit code 2 blocks** the action and sends stderr back to Claude.

```bash
#!/usr/bin/env bash
# Production gate: block deploys, pushes to main, and edits to protected paths.
input="$(cat)"
tool=$(echo "$input" | jq -r '.tool_name')
cmd=$(echo "$input"  | jq -r '.tool_input.command // empty')
path=$(echo "$input" | jq -r '.tool_input.file_path // empty')

if [[ "$tool" == "Bash" ]]; then
  if echo "$cmd" | grep -Eq 'git push.*(main|master)|deploy|kubectl apply|terraform apply'; then
    echo "BLOCKED: production gate. Agents stop here; a human must promote." >&2
    exit 2
  fi
fi

if [[ "$tool" == "Edit" || "$tool" == "Write" ]]; then
  if echo "$path" | grep -Eq '(\.github/workflows/|infra/prod/|\.env)'; then
    echo "BLOCKED: protected path $path requires human change." >&2
    exit 2
  fi
  # Enforce: no source edits without an accepted plan.md in the active work folder
  if echo "$path" | grep -Eq '^.*/src/' ; then
    if ! ls "$CLAUDE_PROJECT_DIR"/docs/work/*/plan.md >/dev/null 2>&1; then
      echo "BLOCKED: no plan.md found. Write and accept a plan first." >&2
      exit 2
    fi
  fi
fi
exit 0
```

Make it executable: `chmod +x .claude/hooks/gate.sh` (it requires `jq`).

### Step 6 — Skills for the chain

`.claude/skills/write-intent/SKILL.md`:

```markdown
---
name: write-intent
description: Capture a new piece of work as intent.md. Use when the user describes a feature, bug, or incident to start work on.
---
1. Ask at most 3 clarifying questions if the problem or success criteria are unclear.
2. Create `docs/work/<YYYY-MM-DD>-<slug>/intent.md` using the template:
   Problem / Who is affected / Success criteria (measurable) / Constraints / Non-goals / Source.
3. Do not propose solutions. Stop and ask the human to accept the intent.
```

`.claude/skills/write-spec/SKILL.md`:

```markdown
---
name: write-spec
description: Turn an accepted intent.md into spec.md. Use after intent is accepted.
---
1. Read intent.md in the work folder and relevant code.
2. Write spec.md: Requirements, Design, Interfaces, Data changes, Edge cases, Risks, Test strategy.
3. Every requirement must trace to a success criterion in intent.md.
4. Stop for human approval.
```

`.claude/skills/write-plan/SKILL.md`:

```markdown
---
name: write-plan
description: Turn an accepted spec.md into plan.md with ordered, testable steps.
---
1. Read spec.md. List files to change, ordered steps, tests per step, rollback approach.
2. Write plan.md. Do not edit source code.
3. Stop for human acceptance; implementation begins only after.
```

### Step 7 — A reviewer subagent (`.claude/agents/reviewer.md`)

```markdown
---
name: reviewer
description: Reviews a diff against spec.md, plan.md and REVIEW.md. Use before opening a PR.
tools: Read, Grep, Glob, Bash
---
You are a strict reviewer. Read REVIEW.md, the work folder's spec.md and plan.md, and `git diff`.
Report: spec mismatches, missing tests, security issues, scope creep, and whether human review is required per REVIEW.md.
Do not edit files.
```

### Step 8 — Parallel sessions with worktrees

```bash
git worktree add ../repo-feature-a -b feature-a
git worktree add ../repo-feature-b -b feature-b
# open a separate Claude Code session in each directory
```

### Step 9 — CI: AI review + hard gate

Example `.github/workflows/claude-review.yml` (simplified; check the current Claude Code GitHub Action docs for exact inputs):

```yaml
name: claude-review
on: pull_request
jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          prompt: |
            Review this PR against REVIEW.md and the linked docs/work spec/plan.
            Run a security review. Flag anything requiring human review.
  tests-and-evals:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci && npm test
      - run: npm run evals   # fail the build on eval regression
```

Then add **branch protection** to main: required checks, at least one human approval, and no direct pushes. This is the real production gate. Local hooks are the first line of defense, and CI plus branch protection are the binding one.

### Step 10 — Close the loop

- After each incident, write `docs/incidents/<date>-<slug>.md` (what happened, impact, root cause, follow-ups).
- Each follow-up becomes a new `docs/work/.../intent.md`.
- Review metrics monthly (cycle time, review wait, change-failure rate) and update `CLAUDE.md` and skills with what you learned.

---

## 10. Effort estimate

| Component | Effort |
|---|---|
| `CLAUDE.md`, `REVIEW.md` | Hours |
| Plan mode default | Minutes |
| intent → spec → plan skills + templates | ~1 day |
| Hook-based gates | 1–2 days |
| AI PR review in CI | Hours |
| Worktrees / parallel sessions | Hours (plus habit) |
| Skills library for team knowledge | Days, then ongoing |
| Evals in CI | 1–3 weeks |
| Metrics + incident → intent loop | Weeks |
| Org rollout (agent identities, least privilege, governance) | A quarter or more |

**Totals:** solo or small team, a working skeleton in about a week. Full team implementation, 1–3 months. Organization-wide, a quarter or more.

---

## 11. Pitfalls and hard parts

1. **Process discipline.** Writing intent and spec for every change feels like overhead. Scale it: a one-line intent for small fixes, a full spec for features.
2. **Evals are hard.** Most teams lack them. Without evals, the "agentic review" layers have nothing objective to check against.
3. **The review bottleneck moves to humans.** With 5–8× more code, human reviewers of critical paths get overloaded. Use `REVIEW.md` to send only what truly needs a person.
4. **Hooks are not a security boundary on their own.** A local hook can be bypassed by someone with access to the machine. Binding gates belong in CI and branch protection.
5. **Stale `CLAUDE.md`.** Wrong instructions are worse than none. Give it an owner and review it.
6. **Context bloat.** A huge `CLAUDE.md` or too many skills hurts quality. Keep it lean; use skills for detail that is only needed sometimes.
7. **UX is missing.** NN/g notes that no stage or gate in the playbook belongs to UX. Consider adding design review at the Design stage.

---

## 12. Comparison with other playbooks

| Playbook | Publisher | Date | Character |
|---|---|---|---|
| The AI-native SDLC playbook | Anthropic | Aug 2026 | Prescriptive: concrete files, gates and Claude Code features |
| Building an AI-native engineering team | OpenAI | Nov 2025 | Less prescriptive, organizational |
| The new SDLC with vibe coding | Google / Kaggle | May 2026 | Less prescriptive, focused on vibe coding |

Vendor write-ups on putting it into practice: Port (developer-portal angle), MetalBear (infrastructure and dev environments).

---

## 13. Confidence notes

**Verified against Anthropic's own pages:** title, date, lead author, category, the six stages, the file chain, "Nothing is implemented without an accepted plan," the production-gate principle and the security companion post.

**From secondary sources only (treat with care):** the exact list of 12 plays, the 14-lesson Academy format, the co-author names (Jim Blackhurst, Will Steuk, Jamal Arif) and the git worktree recommendation.

**Anthropic-reported, not independently verified:** about 80% of merged code written by Claude, and about 8× more code shipped.

**Implementation sections (§9):** these are an example implementation written for this guide, not text from the playbook. Check config keys against the current Claude Code docs before relying on them.
