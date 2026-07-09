> **OBSOLETE (2026-07-08).** This document describes the original PMIDE vision and is kept for the record only. It is superseded by [docs/build-brief.md](../../docs/build-brief.md). See [docs/v1-to-v2-delta.md](../../docs/v1-to-v2-delta.md) for what changed.

# PMIDE Product Vision and Positioning

## 1. Product Summary

**Product name:** PMIDE  
**Category:** IDE rebuilt for product managers and enterprise product teams  
**Core concept:** A product-manager-friendly IDE where product, engineering, and AI agents operate in the same repository, using version-controlled context, agent skills, work packages, branches, commits, pull requests, and governed review workflows.

PMIDE is not GitHub rebuilt for PMs. It is **VS Code rebuilt for PMs**, or more broadly, **the IDE rebuilt for PMs**.

The product should preserve the core IDE metaphor. Product managers should see code, terminal, branches, commits, pull requests, and repository structure. The difference is that PMIDE makes these concepts approachable, assisted, governed, and product-oriented.

The future workflow is not:

```text
PM writes a feature brief → engineer reads it → developer opens PR
```

The future workflow is:

```text
PM updates context → works with AI to shape work → routes to agent or engineer → reviews product intent → preserves decisions in the repo
```

## 2. Product Thesis

Enterprise product teams are moving toward repo-native, AI-assisted work. Product managers are becoming more technical, but their tools are still split across documents, Jira, Slack, GitHub, IDEs, and AI chat interfaces.

Today, technical PMs and product-minded operators are starting to use IDEs, terminals, local Markdown files, context folders, and AI coding assistants to manage product work. This is not because PMs want to become software engineers. It is because the repo is becoming the operating layer for AI-assisted product delivery.

The enterprise gap is not code generation. The gap is:

- Context governance
- Work shaping
- Agent routing
- Product-intent review
- Safe PM participation inside the IDE
- Traceability from planning decision to PR
- Enterprise controls around AI-generated work

PMIDE fills that gap.

## 3. Target Audience

### Primary audience

Enterprise product leaders evaluating the future of product and engineering collaboration in an AI-native operating model.

### Primary user

A product manager in a large enterprise organization, ranging from moderately technical to non-technical, but willing to operate inside an IDE-like environment.

### Secondary users

- Engineering managers
- Tech leads
- Product owners
- Product operations teams
- Business analysts
- Design partners
- Risk, compliance, and governance reviewers
- AI transformation teams
- Internal platform teams

## 4. Positioning

### One-liner

**PMIDE is an IDE rebuilt for product teams, where PMs manage context, generate agent-ready work, route tasks to any coding agent, and review product intent inside a governed enterprise repo.**

### Expanded positioning

PMIDE gives product managers the same operating environment as engineers, but with product-native controls. PMs can manage context libraries, generate work packages, create skills, safely use branches, trigger pull requests, and collaborate with AI agents without needing to master raw Git workflows.

### Category language

Use direct category language:

```text
IDE rebuilt for product managers
Product-native IDE
Enterprise PMIDE
Agentic product operations IDE
Repo-native product operating environment
```

Avoid positioning it as:

```text
GitHub for PMs
Jira replacement
PRD generator
No-code app builder
Notion for engineering
```

## 5. What PMIDE Is Not

PMIDE is not:

- A Jira replacement
- A GitHub replacement
- A generic AI chatbot
- A static PRD generator
- A no-code app builder
- A simplified wrapper that hides all technical concepts
- A tool that turns PMs into developers
- A tool that bypasses engineering review

## 6. What PMIDE Is

PMIDE is:

- An IDE rebuilt for PMs
- A repo-native team operating system
- A context management layer for AI-native product teams
- An agent-agnostic product operations environment
- An enterprise-safe interface for PM participation in repo-based delivery
- A governed workspace for context, skills, work packages, branches, PRs, and product-intent review

## 7. Strategic Principles

### 7.1 Keep the IDE metaphor

PMIDE should feel like an IDE, not like Notion, Jira, Linear, or a documentation portal.

PMs should be able to see:

- Repo structure
- Code
- Terminal
- Branches
- Commits
- Pull requests
- Diff views
- Agent activity
- Context files
- Skills
- Scripts

The product should assist PMs through these concepts, not hide them completely.

### 7.2 Teach Git through product language

The branch concept should exist. PMIDE should explain it clearly.

Example:

```text
You are working in a safe draft branch.
Nothing changes in the shared product until this is reviewed and approved.
```

The UI should use plain-language overlays, guided actions, and tooltips while preserving real Git terminology.

### 7.3 Context is the new product artifact

Traditional artifacts like epics, stories, and feature briefs still matter, but the future artifact is broader:

```text
Context that agents and humans can reuse.
```

PMIDE should treat context as a first-class managed object, not as background documentation.

### 7.4 Work is created with an agent, not written alone

The PM should not manually fill out static templates as the default flow. The PM should collaborate with an AI companion that understands:

- The repo
- The context library
- Planning history
- Skills
- Prior decisions
- Current branch
- Current work package

### 7.5 Agent-agnostic by design

PMIDE should support multiple agent backends:

- Claude
- GitHub Copilot
- Codex
- Gemini
- Custom enterprise agents
- Human engineer workflows

The PM should not need to care deeply which agent does what. The IDE should recommend agents based on task type, risk, available context, and enterprise policy.

### 7.6 Safe and governed, not dumbed down

Enterprise PMs should feel empowered, not locked out. Governance should appear as:

- Guardrails
- Approvals
- Safe drafts
- Policy checks
- Role-based controls
- Audit logs
- Context visibility

### 7.7 Everything important should become repo-native

The user may edit through a friendly UI, but the durable source of truth should be version-controlled files, branches, commits, pull requests, and review history.

## 8. Product Vision

PMIDE should become the enterprise product team’s AI-native operating environment.

In the future, a product manager opens PMIDE at the beginning of the day and sees:

- What changed in product context
- What decisions were made
- Which work packages are ready
- Which agent runs are active
- Which pull requests need product review
- Which skills need approval
- Which branches are safe drafts
- Which changes are blocked by governance
- Which release stories need stakeholder communication

The IDE becomes the place where product and engineering collaborate around the repo, with AI agents as active contributors.

## 9. Core Value Proposition

The core value is not that PMs can code.

The core value is that PMs can manage the context and agentic work system that increasingly determines what code gets produced.

PMIDE lets enterprise product teams:

- Capture planning decisions as durable context
- Make context available to humans and agents
- Create reusable skills without hand-writing technical files
- Turn planning input into Work Packages
- Route work to agents or humans
- Safely use branches and pull requests
- Review product intent before engineering merge
- Preserve a full trace from decision to code change

## 10. Strategic Demo Message

The demo should show product leaders a future operating model:

```text
Product and engineering no longer collaborate through handoffs.
They collaborate inside the repo, using an IDE designed for both humans and agents.
```
