> **OBSOLETE (2026-07-08).** This document describes the original PMIDE vision and is kept for the record only. It is superseded by [docs/build-brief.md](../../docs/build-brief.md). See [docs/v1-to-v2-delta.md](../../docs/v1-to-v2-delta.md) for what changed.

# PMIDE Roadmap, Risks, and Open Decisions

## 1. Roadmap Overview

PMIDE should be developed in phases. The first phase should prove the future vision through a real-feeling forked IDE demo. Later phases should harden agent execution, governance, enterprise integration, and cross-team operating-model capabilities.

## 2. Phase 1: Vision MVP

### Goal

Demonstrate the future operating model to enterprise product leaders.

### Capabilities

- Forked VS Code shell
- PMIDE branding
- Context Library
- Planning import
- Safe draft branch
- Work Package Builder
- Skill Builder
- Git diff and source control
- PR creation
- Product Intent Review UI
- Simulated Agent Router
- Simulated Governance Panel

### Success definition

The audience understands within ten minutes that PMIDE is an IDE rebuilt for product managers in the AI-agent era.

## 3. Phase 2: Real Agent Workflows

### Goal

Move from simulated agent routing to real execution paths.

### Capabilities

- Real GitHub issue creation
- Real Copilot, Claude, Codex, or enterprise-agent task execution
- Real Agent Run records
- Real PR analysis
- Real review comments
- Real context package generation
- Real Skill invocation

### Key challenge

The system must remain agent-agnostic while providing enough depth to be useful with at least one real provider.

## 4. Phase 3: Enterprise Governance

### Goal

Make PMIDE credible for enterprise-controlled environments.

### Capabilities

- Role-based permissions
- Approval workflows
- Policy rules
- Audit logs
- Skill registry
- Context governance dashboard
- Blocked action enforcement
- Protected branch enforcement
- Risk/compliance review states

### Key challenge

Governance must feel like enablement, not bureaucracy.

## 5. Phase 4: Multi-Agent Orchestration

### Goal

Turn PMIDE into an operating layer across multiple agents and humans.

### Capabilities

- Agent router
- Agent compatibility matrix
- Context package builder
- MCP-style tool registry
- Agent performance history
- Human-in-the-loop routing
- Agent comparison
- Agent fallback
- Agent task decomposition

### Key challenge

Avoid becoming a generic agent platform. PMIDE should stay anchored in product and engineering collaboration.

## 6. Phase 5: Enterprise Operating Model

### Goal

Support cross-team and portfolio-level product operations.

### Capabilities

- Team dashboards
- Cross-repo context
- Portfolio-level Work Packages
- Risk/compliance integration
- Release readiness
- Executive product intelligence
- Operating-model analytics
- Enterprise templates
- Organization-level context governance

### Key challenge

Scaling context without creating context sprawl.

## 7. MVP Demo Success Criteria

The demo is successful if product leaders understand these five ideas:

1. Product managers can work inside an IDE without becoming software engineers.
2. Context is now a governed, version-controlled product asset.
3. PMs collaborate with AI to create Work Packages instead of manually writing static requirements.
4. Skills make reusable team capability accessible to product teams.
5. Product and engineering can collaborate through branches, commits, and PRs without breaking enterprise controls.

## 8. Key Demo Moments

### Moment 1: PM opens an IDE and it feels made for product work

The audience sees the IDE metaphor preserved but reoriented.

### Moment 2: Planning notes become context updates

This proves the product is not a document editor.

### Moment 3: PM starts a safe draft branch

This makes Git approachable without hiding it.

### Moment 4: PM creates a skill with a button

This shows the future of reusable agent capability.

### Moment 5: PM generates a Work Package from context

This shows the replacement for old handoff artifacts.

### Moment 6: PM routes work to an agent

This shows an agent-agnostic operating model.

### Moment 7: PM reviews product intent from a PR

This shows how product and tech interact in the repo.

## 9. Key Risks

## Risk 1: PMs may still find the IDE intimidating

### Why it matters

The product is intentionally preserving the IDE metaphor. That makes the vision stronger, but it also creates adoption risk for less technical PMs.

### Mitigation

- Guided workflows
- PM-safe branch mode
- Plain-language Git explanations
- Clear default actions
- AI companion always available
- Role-based layouts
- Progressive disclosure of advanced technical features

## Risk 2: Product leaders may see it as too technical

### Why it matters

The demo audience is enterprise product leadership, not developers. If the demo starts with code, terminals, or Git mechanics, the strategic value may be missed.

### Mitigation

- Anchor demo in planning session, context, governance, and product review
- Show code only after product context is established
- Explain that PMIDE helps PMs participate safely, not become developers

## Risk 3: Engineers may see it as PMs interfering in code

### Why it matters

Engineering adoption will fail if PMIDE appears to bypass engineering control.

### Mitigation

- PMs approve product intent, not code quality
- Engineering review remains intact
- Protected branches and required reviews stay enforced
- Code changes still go through PRs
- Technical users retain normal IDE workflows

## Risk 4: Skills introduce enterprise security concerns

### Why it matters

Skills can include instructions, scripts, references, and tool access. In enterprise environments, that creates security, compliance, and audit concerns.

### Mitigation

- Skill approval workflow
- Script permission model
- Static validation
- Allowlisted skills
- Audit logs
- Context preview before agent execution
- Blocked status for unsafe skills

## Risk 5: Agent-agnostic support becomes too broad

### Why it matters

Supporting every agent deeply is unrealistic for MVP.

### Mitigation

- Design the router generically
- Implement one real provider initially
- Simulate others in the UI
- Use pluggable abstractions
- Keep PMIDE positioned as the operating layer, not the agent engine

## Risk 6: Repo-native product artifacts create clutter

### Why it matters

Engineers may reject a repo filled with product documents, generated work packages, skills, and metadata.

### Mitigation

- Use a clean repo structure
- Keep generated artifacts predictable
- Use reviewable PRs
- Allow teams to configure folders
- Provide `.pmide` configuration
- Make raw files useful and readable

## Risk 7: Work Package abstraction may not resonate

### Why it matters

Enterprise teams already use epics, features, stories, PRDs, and Jira objects. A new artifact may feel unnecessary.

### Mitigation

- Present Work Package as an abstraction, not a replacement on day one
- Allow import/export from Jira-style structures
- Show why agent-ready work needs more than a story
- Keep terminology configurable later

## 10. Open Product Decisions

## 10.1 Naming

Options:

- PMIDE
- Product IDE
- TeamIDE
- Product Studio
- Context Studio
- AgentOps IDE

Recommendation:

Use **PMIDE** for prototype. It is blunt, memorable, and clearly signals the category.

## 10.2 Artifact naming

Options:

- Work Package
- Product Task
- Agent Brief
- Delivery Packet
- Product Change

Recommendation:

Use **Work Package**. It is broad enough for enterprise and future-facing enough to avoid old Jira language.

## 10.3 Branch language

Recommendation:

Use both terms together.

Example:

```text
Safe Draft Branch
safe-draft/billing-status-rule
```

This teaches PMs the real term while giving them a practical mental model.

## 10.4 Skills location

Recommendation:

Use a top-level `/skills` folder in the demo repo, with future support for `.claude/skills`, `.github/skills`, or enterprise-specific standards.

## 10.5 GitHub visibility

Recommendation:

GitHub should be visible as the repo and PR destination, but PMIDE should not feel like a GitHub product.

PMIDE is the IDE experience. GitHub is the review and repo platform used in the demo.

## 10.6 Agent provider for MVP

Options:

- Claude for requirement/context generation
- Copilot for GitHub-native issue-to-PR flow
- Codex for code/script generation
- Simulated multi-agent flow with one real model underneath

Recommendation:

Use one real model for generation and simulate routing to multiple agents in the MVP. The demo should sell the agent-agnostic operating model without overbuilding integrations.

## 10.7 How much code should PMs see?

Recommendation:

PMs should be able to see code, but code should not be the first surface in the demo.

Default progression:

```text
Planning input → Context → Work Package → Skill → Agent Run → Code diff → Product Intent Review → GitHub PR
```

## 11. Future Integrations

## 11.1 GitHub

MVP:

- Open repo
- Branch
- Commit
- Push
- Create PR
- Open PR in GitHub

Future:

- Issue creation
- PR comments
- Review status
- Required reviewers
- Checks
- Actions status
- Copilot agent assignment

## 11.2 AI Providers

MVP:

- One provider can be used for generation
- Other providers can be represented in UI as selectable but simulated

Future:

- Claude
- Copilot
- Codex
- Gemini
- Enterprise model gateway
- Local model option
- MCP-connected tools

## 11.3 Enterprise Systems

MVP UI only:

- Jira
- Confluence
- Slack
- Teams
- SharePoint
- Figma
- ServiceNow
- Risk systems
- Data catalog

Future integrations should be handled through MCP or enterprise connectors where practical.

## 12. Final Product Definition

PMIDE is an enterprise IDE rebuilt for product managers.

It lets product teams work inside the same repo as engineering while making branches, commits, context files, skills, agents, pull requests, and product-intent review approachable and governed.

The core value is not that PMs can code.

The core value is that PMs can manage the context and agentic work system that increasingly determines what code gets produced.

The MVP should prove this future:

```text
Planning session
→ Context update
→ Safe draft branch
→ Skill creation
→ Work Package generation
→ Agent routing
→ Code change
→ Product Intent Review
→ GitHub PR
→ Governed enterprise delivery
```
