> **OBSOLETE (2026-07-08).** This document describes the original PMIDE vision and is kept for the record only. It is superseded by [docs/build-brief.md](../../docs/build-brief.md). See [docs/v1-to-v2-delta.md](../../docs/v1-to-v2-delta.md) for what changed.

# PMIDE Agents, Context, Skills, and Governance

## 1. Strategic Importance

PMIDE is built around a core belief:

```text
AI-native product work depends on governed context, reusable skills, traceable agent runs, and product-intent review.
```

The IDE is not just a place to write code. It becomes the control surface for how product teams shape agent behavior, manage enterprise context, and safely participate in repo-native delivery.

## 2. AI Companion

## 2.1 Description

The AI Companion is the embedded assistant that helps PMs operate inside PMIDE.

It should be repo-aware, context-aware, branch-aware, and artifact-aware.

It should not feel like a detached chatbot. It should behave like a guided teammate inside the IDE.

## 2.2 Requirements

**AI-001:** The app shall include an always-available AI companion panel.

**AI-002:** The companion shall be repo-aware.

**AI-003:** The companion shall be context-aware.

**AI-004:** The companion shall know the current branch and unsaved changes.

**AI-005:** The companion shall help create context updates, Work Packages, skills, PR summaries, and review packets.

**AI-006:** The companion shall explain IDE concepts in PM-friendly language.

**AI-007:** The companion shall support agent selection or simulated agent selection in MVP.

**AI-008:** The companion shall disclose which files or context sources it used.

**AI-009:** The companion shall not make repo changes without explicit user confirmation.

## 2.3 Companion responsibilities

The companion should help the PM:

- Import and interpret planning notes
- Extract business rules and decisions
- Identify context conflicts
- Generate Work Packages
- Create skills
- Explain branches and diffs
- Summarize PRs
- Identify acceptance criteria gaps
- Generate release stories
- Prepare reviewer comments

## 3. Agent Router

## 3.1 Description

The Agent Router is an agent-agnostic routing layer for choosing the right agent or human for work.

PMIDE should not be tied to one coding agent. It should act like the product operations layer that can route work to different execution engines.

## 3.2 Supported categories

- Claude
- GitHub Copilot
- Codex
- Gemini
- Custom enterprise agent
- Human engineer

## 3.3 Requirements

**ROUTER-001:** The app shall display available agents.

**ROUTER-002:** The app shall recommend an agent based on work type.

**ROUTER-003:** The app shall explain why an agent is recommended.

**ROUTER-004:** The app shall show what context will be sent to the agent.

**ROUTER-005:** The app shall support human approval before sending work to an agent.

**ROUTER-006:** The MVP may simulate actual agent execution but must show the routing UI.

## 3.4 Example router output

```text
Recommended flow:

Claude
Use for requirement refinement and context consistency.

Copilot
Use for GitHub-native issue-to-PR implementation.

Codex
Use for script or test generation.

Human Engineer
Use if architecture or risk impact is high.
```

## 4. Agent Runs

## 4.1 Description

An Agent Run is a traceable record of AI work.

This matters in enterprise settings because product leaders, engineering, risk, and compliance need to understand what the agent was asked to do, what context it used, and what it changed.

## 4.2 Requirements

**RUN-001:** The app shall show all agent runs linked to a Work Package.

**RUN-002:** Each Agent Run shall show:

- Agent
- User who initiated it
- Time started
- Task
- Context used
- Skill used
- Branch
- Files changed
- Commands run
- Output
- Errors
- PR link
- Status

**RUN-003:** Status values shall include Draft, Waiting for Approval, Running, Needs Input, Completed, Failed, Cancelled, and Merged.

**RUN-004:** The app shall distinguish simulated MVP agent runs from actual agent runs in internal metadata, but the demo UI should present the intended future flow.

## 5. Context Governance

## 5.1 Description

Context should be treated as an enterprise-governed asset because agents will use it to shape requirements, code, tests, reviews, and release communications.

Bad context creates bad agent output. Conflicting context creates unpredictable work. Sensitive context creates enterprise risk.

## 5.2 Context governance requirements

**CTX-GOV-001:** Every context object shall have an owner.

**CTX-GOV-002:** Every context object shall have a status.

**CTX-GOV-003:** Context changes shall occur on safe draft branches in enterprise mode.

**CTX-GOV-004:** High-risk context categories shall require approval.

High-risk categories may include:

- Compliance rules
- Billing rules
- Risk controls
- Security policies
- Customer data handling
- Legal language
- Regulatory requirements

**CTX-GOV-005:** PMIDE shall show context conflicts.

**CTX-GOV-006:** PMIDE shall show which agents or Work Packages depend on a context item.

**CTX-GOV-007:** PMIDE shall maintain a history of context changes through Git and metadata.

## 5.3 Context conflict example

```text
Conflict Detected

Business Rule A:
Inactive users cannot update payment settings.

Business Rule B:
All authenticated users can update payment settings.

Recommended Action:
Update Business Rule B or mark as superseded.
```

## 6. Skill Builder

## 6.1 Description

Skills are reusable team capabilities. They may contain instructions, scripts, references, and output templates.

For PMIDE, the key opportunity is making skill creation approachable for product teams while keeping skill execution governed.

## 6.2 Skill Builder workflow

Skill wizard questions:

- What should this skill help with?
- When should an agent use it?
- What inputs does it need?
- What context should it check?
- What steps should it follow?
- What should it produce?
- Can it run scripts?
- Which agents can use it?
- Does it require approval?
- Who owns it?

## 6.3 Skill validation requirements

Validation categories:

- Clear purpose
- Clear trigger
- Clear inputs
- Clear output
- Bounded scope
- No conflicting instructions
- No unsafe tool usage
- No hidden data access
- Owner assigned
- Review required for sensitive domains

## 6.4 Skill security requirements

**SKILL-SEC-001:** Skills that include scripts shall require approval.

**SKILL-SEC-002:** Skills that access sensitive context shall require approval.

**SKILL-SEC-003:** Skills shall disclose what files, tools, scripts, and context they may use.

**SKILL-SEC-004:** Skills shall support blocked status.

**SKILL-SEC-005:** Skill runs shall be traceable through Agent Runs.

**SKILL-SEC-006:** PMIDE shall show simulated security scan results in MVP.

## 6.5 Example skill scan result

```text
Skill Validation: Billing Domain Reviewer

Passed:
- Purpose is clear
- Trigger conditions are defined
- Output format is defined
- Owner is assigned

Needs Review:
- Skill touches billing domain
- Skill references a script
- Risk approval required before organization-wide use

Status:
Ready to propose
```

## 7. Governance Panel

## 7.1 Description

The Governance Panel is the enterprise control surface for approvals, policies, blocked actions, and auditability.

## 7.2 Requirements

**GOV-001:** The app shall display governance checks for the current branch.

**GOV-002:** The app shall show required approvals based on artifact type.

Examples:

- Context update requires product owner approval.
- Billing skill requires risk approval.
- Agent run touching code requires engineering approval.
- Compliance context change requires compliance review.

**GOV-003:** The app shall show blocked actions.

**GOV-004:** The app shall show policy explanations.

**GOV-005:** The app shall maintain an audit trail.

**GOV-006:** The MVP may simulate approvals but must show realistic approval states.

## 7.3 Governance states

- No review required
- Review recommended
- Review required
- Waiting for approval
- Approved
- Blocked
- Escalated

## 8. Permissions and Safety

## 8.1 Role-based controls

Roles:

- Viewer
- Product Editor
- Product Approver
- Skill Author
- Skill Approver
- Agent Operator
- Engineering Reviewer
- Governance Reviewer
- Admin

## 8.2 Protected actions

Require confirmation or approval:

- Push to protected branch
- Create PR
- Route to agent
- Run script
- Create skill with script
- Change compliance context
- Modify agent instructions
- Approve product intent
- Merge PR

## 8.3 Guardrails

The app shall:

- Block direct commits to protected branches in PM mode.
- Show branch safety state at all times.
- Require review for high-risk context.
- Require approval for skills that can run scripts.
- Log all agent tasks.
- Show what context will be sent to agents.
- Provide explainability for generated artifacts.

## 9. Product Intent Review Governance

PMs should review product intent, not code quality.

Product Intent Review should answer:

- Did the change satisfy the Work Package?
- Were acceptance signals addressed?
- Did the PR violate any non-goals?
- Did it touch unexpected areas?
- Are there product, UX, risk, or support gaps?
- Should engineering review proceed?

Actions:

- Approve Product Intent
- Request Agent Revision
- Send to Engineer Review
- Escalate to Risk Review
- Open in GitHub

## 10. Auditability

Every important action should be traceable.

Audit records should include:

- User
- Time
- Artifact changed
- Branch
- Commit
- PR
- Agent used
- Context used
- Skill used
- Approval state
- Result

The MVP may simulate the full audit log, but the UI should clearly show where this capability lives.
