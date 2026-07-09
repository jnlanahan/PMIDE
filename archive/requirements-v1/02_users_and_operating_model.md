> **OBSOLETE (2026-07-08).** This document describes the original PMIDE vision and is kept for the record only. It is superseded by [docs/build-brief.md](../../docs/build-brief.md). See [docs/v1-to-v2-delta.md](../../docs/v1-to-v2-delta.md) for what changed.

# PMIDE Users and Operating Model

## 1. Primary Enterprise Scenario

PMIDE is built for a large enterprise product organization where product managers, engineering teams, governance teams, and AI agents increasingly operate around shared repositories.

The demo audience is product leadership. The purpose is to impress them with a future vision of how product work may happen inside an IDE-native, AI-assisted, governed operating model.

The app should feel:

- Fast and magical for context management, work generation, and AI collaboration
- Safe and governed for repo control, branch safety, agent execution, and approvals
- Technical enough to make PMs feel closer to engineering
- Assisted enough that non-technical PMs are not blocked

## 2. Core User Personas

## 2.1 Product Manager

### Profile

A PM in a large enterprise organization. They may have some technical experience or none. They are willing to work in an IDE because the IDE is becoming where the team’s AI-assisted work happens.

### Needs

The PM needs to:

- Manage product and business context
- Understand the repo without becoming a developer
- Work with an AI companion to shape requirements
- Create safe branches without fear
- Understand commits and PRs at a practical level
- Route work to agents or engineers
- Review product intent
- Create release stories
- Collaborate with engineering in the same environment

### Pain points today

- Product context is scattered across tools
- Requirements are detached from code
- AI agents need better context than chat prompts provide
- PMs are unsure how to participate in Git workflows
- PRs are too technical for product review
- Enterprise governance slows down experimentation
- There is no clean operating model for AI-generated work

### PMIDE promise

PMIDE gives the PM a real IDE, but with product-native assistance, safe defaults, and AI collaboration.

## 2.2 Engineering Lead

### Profile

A tech lead, engineering manager, or senior engineer responsible for delivery quality and repo integrity.

### Needs

The engineering lead needs to:

- See what PMs changed
- Review context updates before they affect agents
- Approve agent-ready work
- Control what agents can do
- Ensure implementation quality
- Protect protected branches
- Keep human engineering review intact

### Concerns

- PMs may accidentally make unsafe repo changes
- Agents may act on bad context
- Product-generated artifacts may clutter the repo
- Skills may run scripts or change behavior unexpectedly
- Engineering review may be bypassed

### PMIDE promise

PMIDE lets product participate without bypassing engineering controls.

## 2.3 Product Leader

### Profile

A director, VP, or executive responsible for product operating model modernization.

### Needs

The product leader needs to:

- See what AI-native product work could look like
- Understand product-to-code traceability
- Identify governance gaps
- Increase speed without losing control
- Modernize product/engineering collaboration
- Build confidence in agentic delivery

### PMIDE promise

PMIDE demonstrates a future enterprise operating model where PMs, engineers, and agents collaborate in the same repo under clear governance.

## 2.4 Governance Reviewer

### Profile

A risk, compliance, security, audit, or enterprise governance stakeholder.

### Needs

The governance reviewer needs to:

- Review context changes
- Approve high-risk skills
- Audit agent runs
- Confirm policy adherence
- Block unsafe actions
- Trace decisions to implementation

### PMIDE promise

PMIDE turns AI-assisted product work into something reviewable, auditable, and policy-driven.

## 2.5 Developer

### Profile

A developer or product engineer working in the repo.

### Needs

The developer needs to:

- Continue using normal IDE capabilities
- See product context without leaving the repo
- Review work packages
- Validate agent outputs
- Add technical context and tests
- Maintain code quality

### PMIDE promise

PMIDE does not remove the developer workflow. It adds product-native layers on top of the repo and IDE.

## 3. Future Operating Model

## 3.1 Old operating model

```text
Planning meeting
→ Product doc
→ Jira epic/story
→ Engineering refinement
→ GitHub issue
→ Developer branch
→ Pull request
→ Release note
```

Problems:

- Context gets lost across handoffs
- Product decisions are detached from implementation
- AI agents do not have durable context
- PMs have limited visibility into implementation
- PRs are hard for PMs to interpret
- Governance happens after the work is already shaped

## 3.2 New operating model

```text
Planning session
→ Context update
→ Safe draft branch
→ Work Package
→ Skill or agent instruction
→ Agent or human execution
→ Pull request
→ Product Intent Review
→ Engineering review
→ Governed release
```

Advantages:

- Product context is durable and version-controlled
- Agent behavior is shaped by governed context
- PMs participate in the repo safely
- Product and engineering share the same operating environment
- PRs become understandable to product stakeholders
- Enterprise review happens throughout the workflow

## 4. Primary PMIDE Workflow

The flagship workflow should be:

```text
PM imports planning notes
→ AI extracts decisions, business rules, work candidates, and skill opportunities
→ PM starts a safe draft branch
→ PM accepts context updates
→ PM creates or updates a skill
→ AI generates a Work Package
→ PM routes work to agent or human
→ Agent produces code or a PR
→ PM reviews product intent
→ Engineering reviews code
→ Team merges governed change
```

## 5. User Mental Model

PMIDE should help users think in these terms:

| Technical Concept | PM-Friendly Concept | UI Framing |
|---|---|---|
| Repository | Product workspace | The shared source of truth for product, code, context, and agents |
| Branch | Safe draft branch | A safe place to propose changes before they affect the shared product |
| Commit | Save version | A saved checkpoint of work |
| Push | Share draft | Send your draft branch to the team/repo |
| Pull request | Proposed change | A reviewable package of changes |
| Diff | Compare changes | What changed from the shared version |
| Merge | Accept change | Approve and apply the proposed change |
| Conflict | Competing change | Two edits touched the same thing and need resolution |
| Agent run | AI work session | A traceable AI execution event |
| Skill | Reusable team capability | A governed instruction package an agent can use |

## 6. PMIDE Role Modes

PMIDE should support role-based layouts while preserving the same underlying IDE.

## 6.1 Product Manager Mode

Default visible actions:

- Import Planning Session
- Update Context
- Create Work Package
- Create Skill
- Start Safe Draft
- Route to Agent
- Review Product Intent
- Generate Release Story

Default panels:

- Context Library
- Work Packages
- Skills
- Agent Runs
- Pull Requests
- Governance
- Terminal, visible but not dominant

## 6.2 Engineering Lead Mode

Default visible actions:

- Review Context Change
- Review Work Package
- Run Tests
- Review Diff
- Start Agent Run
- Open Terminal
- Send Feedback to Product

Default panels:

- Explorer
- Source Control
- Pull Requests
- Work Packages
- Agent Runs
- Terminal
- Governance

## 6.3 Developer Mode

Default visible actions:

- Run Tests
- Open Terminal
- Review Diff
- Generate Test
- Start Agent Run
- Review Code

Default panels:

- Explorer
- Search
- Source Control
- Pull Requests
- Terminal
- Agent Runs
- Context Library, secondary

## 6.4 Governance Reviewer Mode

Default visible actions:

- Review Policy Check
- Approve Context Change
- Block Skill
- View Audit Trail
- Escalate Review

Default panels:

- Governance
- Context Library
- Skills
- Agent Runs
- Pull Requests
- Audit Trail

## 7. Collaboration Model

PMIDE should support collaboration through repo-native mechanics:

- Branches for drafts
- Commits for saved versions
- PRs for review
- Comments for discussion
- Review statuses for approval
- Artifact metadata for traceability

The UI should make this feel approachable, but the backend should stay aligned to standard repo workflows.

## 8. Enterprise Adoption Pattern

The expected enterprise adoption path is:

1. Pilot with a technical product team
2. Use PMIDE for context and Work Package creation
3. Add skill creation and governance
4. Add product-intent PR review
5. Add agent routing and agent run records
6. Expand to multiple product teams
7. Connect to enterprise systems and policy engines

## 9. Demo Audience Interpretation

Product leaders should walk away thinking:

- PMs can operate inside an IDE without losing control
- Product context can become an enterprise-governed asset
- AI agents need better inputs than ad hoc chat prompts
- The repo can become the shared product-engineering operating layer
- PMIDE gives product teams a future-facing way to participate in AI-native delivery
