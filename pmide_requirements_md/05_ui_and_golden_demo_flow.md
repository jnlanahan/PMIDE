# PMIDE UI and Golden Demo Flow

## 1. UI Direction

PMIDE should feel like an IDE rebuilt for product managers.

It should not hide that it is an IDE. It should preserve the feeling of a technical workspace while making product-relevant workflows easier, safer, and more understandable.

The visual system should communicate:

- This is real repo work
- Product managers can participate safely
- AI is an embedded teammate
- Context is managed like code
- Pull requests are part of product work
- Governance is built in

## 2. Information Architecture

## 2.1 Left Activity Bar

Required sections:

1. Explorer
2. Context Library
3. Work Packages
4. Skills
5. Agent Runs
6. Source Control
7. Pull Requests
8. Releases
9. Governance
10. Terminal
11. Settings

## 2.2 Top-Level Command Bar

Primary actions:

- New Safe Draft
- Import Planning Session
- Update Context
- Create Work Package
- Create Skill
- Route to Agent
- Open Pull Request
- Review Product Intent
- Generate Release Story

## 2.3 Status Bar

Should show:

- Current repo
- Current branch
- Draft safety status
- Agent connected
- Governance mode
- Sync status
- Pending approvals
- Current user role

Example:

```text
Repo: enterprise-sample-app | Branch: safe-draft/billing-rules | Mode: PM Safe Draft | Agent: Claude | Governance: Enforced
```

## 3. Key Screens

## 3.1 Home Dashboard

Required cards:

```text
Context Updates Suggested
Work Packages Ready
Agent Runs Active
Pull Requests Needing Product Review
Skills Pending Approval
Governance Alerts
Recent Decisions
```

Example content:

```text
Today in Your Product Workspace

Context Changes Suggested
- Billing account status rule found in planning notes

Work Packages Ready
- Enforce billing-status rule in account settings

Agent Runs
- No active agent runs

Pull Requests Needing Product Review
- None

Governance
- 1 context change requires review before merge
```

## 3.2 Context Library View

Layout:

```text
Left: Context categories
Center: Selected context object
Right: Metadata, linked decisions, affected work, governance status
Bottom: Git diff or AI explanation
```

Key actions:

- Import Planning Session
- New Context Item
- Compare to Main
- Accept Context Update
- Propose Change
- View Raw Markdown

## 3.3 Work Package View

Layout:

```text
Top: Work Package title, status, branch
Left: Sections
Center: Rich editor
Right: Context used, readiness score, agent actions
Bottom: Linked files, issue, PR, agent run
```

Key actions:

- Generate from Context
- Ask Companion
- Add Context Source
- Create GitHub Issue
- Route to Agent
- Propose Change

## 3.4 Skill Builder View

Wizard steps:

```text
Step 1: Purpose
Step 2: Trigger
Step 3: Inputs
Step 4: Context
Step 5: Workflow
Step 6: Output
Step 7: Scripts and references
Step 8: Governance
Step 9: Preview generated files
```

Key actions:

- Create Skill
- Preview Skill
- Validate Skill
- View Raw Files
- Propose Skill
- Request Approval

## 3.5 Product Intent Review View

Layout:

```text
Top: PR title and status
Left: Acceptance signals
Center: Product-readable review
Right: Changed files, risks, reviewers
Bottom: Actions
```

Key actions:

- Approve Product Intent
- Request Agent Revision
- Send to Engineer Review
- Escalate to Risk Review
- Open in GitHub

## 3.6 Agent Router View

Layout:

```text
Task summary
Recommended agent
Available agents
Context package preview
Skill selection
Risk level
Approval required
Start button
```

Supported routing options:

- Claude
- Copilot
- Codex
- Gemini
- Custom enterprise agent
- Human engineer

## 4. Golden Demo Flow

## 4.1 Demo scenario

A product manager attends a planning session where the team decides that inactive accounts should not be allowed to update payment settings.

The PM opens PMIDE, imports the planning notes, updates the context library, creates a reusable billing review skill, generates a Work Package, routes implementation to an agent, and reviews the resulting PR for product intent.

## 4.2 Step 1: Open Enterprise Repo

User opens PMIDE.

Home screen shows:

```text
Today in Your Product Workspace

Context Changes Suggested
- Billing account status rule found in planning notes

Work Packages Ready
- Enforce billing-status rule in account settings

Agent Runs
- No active agent runs

Pull Requests Needing Product Review
- None

Governance
- 1 context change requires review before merge
```

Demo point:

The audience immediately sees that this is an IDE, but it is oriented around product work.

## 4.3 Step 2: Import Planning Session

User clicks **Import Planning Session**.

Input options:

- Paste notes
- Upload transcript
- Import file from repo
- Connect meeting note source, simulated in MVP
- Pull from Slack, simulated in MVP

AI extracts:

```text
Detected from planning session:

New Decision
Inactive accounts cannot update payment settings.

New Business Rule
Payment settings may only be changed when account status is active.

New Work Package
Enforce billing-status rule in account settings.

Suggested Skill
Billing Domain Reviewer.

Potential Impact
Checkout, account settings, support flows, payment method storage.
```

Demo point:

The product is not a document editor. It turns planning input into context, decisions, work, and skills.

## 4.4 Step 3: Start Safe Draft

PMIDE prompts:

```text
Create a safe draft branch for these changes?

Recommended branch:
safe-draft/billing-status-rule

Nothing will change in the shared product until this branch is reviewed and approved.
```

User clicks **Start Safe Draft**.

PMIDE creates branch:

```text
safe-draft/billing-status-rule
```

Demo point:

PMIDE teaches Git instead of hiding it.

## 4.5 Step 4: Update Context Library

User reviews PM-friendly context diff:

```text
Business Rule Update

Before:
Payment settings can be updated by authenticated users.

After:
Payment settings can be updated only by authenticated users whose account status is active.

Impacted Areas:
- Account settings
- Billing permissions
- Checkout
- Support workflows
```

User clicks **Accept Context Update**.

PMIDE writes:

```text
/context/business-rules.md
/context/domain-glossary.md
/context/release-constraints.md
```

Demo point:

Context becomes a version-controlled product asset.

## 4.6 Step 5: Create Skill

User clicks **Create Skill**.

PMIDE opens guided skill builder:

```text
Skill Name:
Billing Domain Reviewer

Purpose:
Review work related to billing rules, account status, and payment setting changes.

When should agents use this skill?
When a work package or PR touches billing, payment methods, account status, or checkout.

Inputs:
- Business rules
- Domain glossary
- Changed files
- Work package
- Acceptance signals

Output:
- Product behavior review
- Risk notes
- Missing acceptance criteria
- Recommended reviewer questions
```

PMIDE generates:

```text
/skills/billing-domain-reviewer/SKILL.md
/skills/billing-domain-reviewer/templates/review-output.md
/skills/billing-domain-reviewer/references/billing-rules.md
```

Demo point:

Skills are made accessible to PMs as reusable team capabilities.

## 4.7 Step 6: Generate Work Package

User clicks **Create Work Package from Context**.

PMIDE companion generates:

```text
Work Package: Enforce Billing Status Rule in Account Settings

Goal:
Prevent inactive accounts from changing payment settings.

Context Used:
- Business rule: payment settings require active account status
- Domain term: inactive account
- Release constraint: billing changes require product and risk review

Acceptance Signals:
- Active users can update payment settings
- Inactive users cannot update payment settings
- Inactive users see clear explanatory copy
- Existing saved payment methods are not deleted
- Support flow language is updated

Non-Goals:
- Do not change checkout payment authorization
- Do not remove existing payment methods
- Do not redesign account settings

Review Plan:
- Product intent review
- Engineering code review
- Risk review for billing behavior
```

PMIDE writes:

```text
/work-packages/WP-0001-billing-status-rule/work-package.md
/work-packages/WP-0001-billing-status-rule/context-map.json
/work-packages/WP-0001-billing-status-rule/review-plan.md
```

Demo point:

The future artifact is a Work Package, not just a PRD, story, or brief.

## 4.8 Step 7: Route to Agent

User clicks **Route to Agent**.

Agent Router displays:

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

User selects:

```text
Claude: Refine Work Package
Copilot: Create Implementation PR
```

PMIDE creates or simulates:

- GitHub issue
- Agent run record
- Implementation branch
- PR link

Demo point:

PMIDE is agent-agnostic. It is the operating layer, not the agent itself.

## 4.9 Step 8: Show Code Change

The demo should include a real code diff, even if generated from a scripted sample.

Example changed files:

```text
/src/account/settings/payment-settings.tsx
/src/billing/permissions.ts
/tests/billing-status-rule.test.ts
/support/billing-status-copy.md
```

PMIDE should show both:

- Standard code diff
- Product-readable summary

Demo point:

PMs can see code, but PMIDE translates the product meaning of the change.

## 4.10 Step 9: Product Intent Review

PMIDE shows:

```text
Product Intent Review

Intent Match:
High

Satisfied:
- Inactive users cannot update payment settings
- Active users keep existing behavior
- Payment methods are not deleted

Needs Review:
- Support copy updated, but not linked to help center
- Test only covers inactive status, not suspended status
- Error message may need UX review

Changed Areas:
- Account settings payment form
- Billing permissions check
- User-facing error copy
- Billing status test

Recommended Action:
Request agent revision before engineering approval.
```

User clicks **Request Agent Revision** or **Approve Product Intent**.

Demo point:

PMs review product intent. Engineers still review code.

## 4.11 Step 10: Open GitHub PR

User clicks **Open in GitHub**.

The real GitHub PR shows normal branch, commits, files changed, and review comments.

Demo point:

PMIDE is not replacing GitHub review. It is making the PM’s role in repo-native delivery understandable and useful.

## 5. Key Demo Moments

## Moment 1: PM opens an IDE and it feels made for product work

The audience sees the IDE metaphor preserved but reoriented.

## Moment 2: Planning notes become context updates

This proves the product is not a document editor.

## Moment 3: PM starts a safe draft branch

This makes Git approachable without hiding it.

## Moment 4: PM creates a skill with a button

This shows the future of reusable agent capability.

## Moment 5: PM generates a Work Package from context

This shows the replacement for old handoff artifacts.

## Moment 6: PM routes work to an agent

This shows agent-agnostic operating model.

## Moment 7: PM reviews product intent from a PR

This shows how product and tech interact in the repo.

## 6. UI Tone

The UI should be direct and enterprise-safe.

Avoid cute labels. Avoid excessive chatbot metaphors. Avoid making the PM feel shielded from the real system.

Use labels that are understandable but still technical enough to teach:

- Safe Draft Branch
- Save Version
- Compare Changes
- Propose Change
- Product Intent Review
- Context Library
- Work Package
- Agent Run
- Skill
- Governance Check

## 7. UI Anti-Patterns

Avoid:

- Hiding all code
- Hiding all Git terms
- Making it look like Notion
- Making it look like Jira
- Turning everything into chat
- Making the AI companion the entire product
- Making PR review feel like code review for PMs
- Letting PMs bypass engineering review
- Treating skills as magic prompts instead of governed assets
