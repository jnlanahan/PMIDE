# PMIDE Core Objects and Repo Model

## 1. Core Object Overview

PMIDE should introduce product-native objects that map to repo-native artifacts.

The PM sees managed product objects. The repo stores durable files, metadata, branches, commits, and PRs.

Core objects:

1. Context Library
2. Work Package
3. Decision Record
4. Skill
5. Agent Run
6. Review Packet
7. Release Story

## 2. Context Library

## 2.1 Definition

The Context Library is a governed set of reusable product, business, technical, and operating context.

It is the most important product surface in PMIDE.

The future of AI-assisted product work depends on high-quality context. PMIDE should make context visible, owned, versioned, reviewed, and reusable by humans and agents.

## 2.2 Context types

Supported context categories:

- Product principles
- Customer segments
- Business rules
- Compliance rules
- Domain glossary
- UX standards
- Architecture notes
- Release constraints
- Prior decisions
- Data definitions
- Stakeholder preferences
- Support policies
- Risk controls
- Agent instructions

## 2.3 PM-facing fields

Each context object should show:

- Title
- Category
- Owner
- Status
- Last updated
- Linked decisions
- Linked Work Packages
- Linked PRs
- Source inputs
- Agent usage
- Governance requirements

## 2.4 Status values

- Draft
- Proposed
- In Review
- Approved
- Superseded
- Deprecated
- Blocked

## 2.5 Repo representation

Recommended structure:

```text
/context/product-principles.md
/context/customer-segments.md
/context/business-rules.md
/context/compliance-rules.md
/context/domain-glossary.md
/context/ux-standards.md
/context/release-constraints.md
/AGENTS.md
/.github/copilot-instructions.md
```

## 2.6 Product requirement

PMIDE should display context as structured objects, not merely as Markdown files. Users should still be able to open the raw Markdown when needed.

## 3. Work Package

## 3.1 Definition

A Work Package is the future-facing abstraction that can replace or unify epics, stories, feature briefs, agent tasks, and implementation prompts.

It is not just a requirement. It is a package of intent, context, risk, acceptance signals, agent instructions, and review expectations.

## 3.2 Required sections

A Work Package should include:

- Goal
- Problem statement
- Relevant context
- Decisions used
- Agent instructions
- Acceptance signals
- Non-goals
- Risk controls
- Test expectations
- Review plan
- Linked issue
- Linked branch
- Linked PR
- Agent run history

## 3.3 PM-facing view

The PM should see a rich, readable editor with context references and AI assistance.

Example:

```text
Work Package: Enforce Billing Status Rule in Account Settings

Goal
Prevent inactive accounts from changing payment settings.

Context Used
- Business rule: payment settings require active account status
- Domain term: inactive account
- Release constraint: billing changes require product and risk review

Acceptance Signals
- Active users can update payment settings
- Inactive users cannot update payment settings
- Inactive users see clear explanatory copy
- Existing saved payment methods are not deleted
- Support flow language is updated

Non-Goals
- Do not change checkout payment authorization
- Do not remove existing payment methods
- Do not redesign account settings

Review Plan
- Product intent review
- Engineering code review
- Risk review for billing behavior
```

## 3.4 Repo representation

```text
/work-packages/WP-0042-billing-status-rule/work-package.md
/work-packages/WP-0042-billing-status-rule/context-map.json
/work-packages/WP-0042-billing-status-rule/review-plan.md
```

## 4. Decision Record

## 4.1 Definition

A Decision Record captures why the team chose something.

It should be easy for a PM to create from a planning session, Slack discussion, meeting note, or AI-generated summary.

## 4.2 Required fields

- Decision
- Date
- Owner
- Context
- Options considered
- Rationale
- Tradeoffs
- Impacted areas
- Linked Work Packages
- Linked PRs
- Status

## 4.3 Repo representation

```text
/decisions/DR-0017-inactive-account-payment-settings.md
```

## 4.4 Example

```text
Decision: Inactive accounts cannot update payment settings.

Rationale:
Inactive accounts may represent suspended, closed, restricted, or risk-flagged customer states. Allowing payment setting changes could create downstream billing and support issues.

Tradeoff:
This adds friction for some users who need to reactivate or resolve status issues first.

Impacted Areas:
- Account settings
- Billing permissions
- Checkout
- Support workflows
```

## 5. Skill

## 5.1 Definition

A Skill is a reusable agent capability. It can include instructions, scripts, templates, and references.

PMIDE should make skill creation approachable for PMs without requiring them to manually write `SKILL.md` files.

## 5.2 Required fields

- Skill name
- Purpose
- Trigger conditions
- Inputs
- Steps
- Required context
- Output format
- Scripts
- Templates
- References
- Security permissions
- Approval requirements
- Agent compatibility
- Owner
- Status

## 5.3 Skill statuses

- Draft
- Proposed
- Approved
- Deprecated
- Blocked

## 5.4 Repo representation

```text
/skills/billing-domain-reviewer/SKILL.md
/skills/billing-domain-reviewer/scripts/check-billing-terms.py
/skills/billing-domain-reviewer/templates/review-output.md
/skills/billing-domain-reviewer/references/billing-rules.md
```

## 5.5 PM-facing skill builder

The Create Skill workflow should ask:

- What should this skill help with?
- When should the agent use it?
- What inputs does it need?
- What context should it check?
- What steps should it follow?
- What should it produce?
- Can it run scripts?
- Which agents can use it?
- Does it require approval?
- Who owns it?

## 6. Agent Run

## 6.1 Definition

An Agent Run is a traceable AI execution event.

It records who initiated the work, which agent was used, what context was included, which skills were invoked, what branch was used, and what changed.

## 6.2 Required fields

- Agent used
- Task requested
- User who initiated it
- Context included
- Skill used
- Branch used
- Files changed
- Commands run
- Outputs generated
- Human approvals
- Errors
- PR link
- Review status

## 6.3 Status values

- Draft
- Waiting for Approval
- Running
- Needs Input
- Completed
- Failed
- Cancelled
- Merged

## 6.4 Repo or metadata representation

```text
/agent-runs/AR-0092/run-summary.md
/agent-runs/AR-0092/context-used.json
/agent-runs/AR-0092/commands.json
```

## 7. Review Packet

## 7.1 Definition

A Review Packet is a product-readable review object generated from a PR.

It helps PMs review product intent without pretending to review code quality.

## 7.2 Required fields

- Original intent
- Acceptance signal coverage
- Changed areas
- Product behavior changes
- Risks
- Missing tests
- Questions for engineering
- Questions for risk or compliance
- Recommended action

## 7.3 Example

```text
Product Intent Review

Intent Match: High

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

## 8. Release Story

## 8.1 Definition

A Release Story is a business-readable summary of what changed and why.

It should be generated from Work Packages, PRs, decisions, and review history.

## 8.2 Required fields

- What changed
- Why it changed
- Who is affected
- Customer impact
- Internal enablement notes
- Support notes
- Risk notes
- Linked PRs
- Linked decisions
- Linked Work Packages

## 8.3 Repo representation

```text
/releases/2026-07-billing-status-rule.md
```

## 9. Recommended Demo Repo Structure

```text
/
  src/
  tests/
  context/
    product-principles.md
    business-rules.md
    customer-segments.md
    compliance-rules.md
    domain-glossary.md
    ux-standards.md
    release-constraints.md
  decisions/
    DR-0001-template.md
  work-packages/
    WP-0001-billing-status-rule/
      work-package.md
      context-map.json
      review-plan.md
  skills/
    billing-domain-reviewer/
      SKILL.md
      templates/
        review-output.md
      references/
        billing-rules.md
      scripts/
        check-billing-terms.py
  agent-runs/
    AR-0001/
      run-summary.md
      context-used.json
      commands.json
  releases/
    release-story-template.md
  .github/
    copilot-instructions.md
    pull_request_template.md
  AGENTS.md
```

## 10. Source of Truth Rules

PMIDE should follow these source-of-truth rules:

1. Context lives in repo-native files.
2. Work Packages live in repo-native folders.
3. Skills live in skill folders.
4. Agent Runs must be traceable.
5. PRs remain the review mechanism for shared repo changes.
6. PM-friendly UI should not obscure the actual files changed.
7. Advanced users must be able to inspect raw files.
