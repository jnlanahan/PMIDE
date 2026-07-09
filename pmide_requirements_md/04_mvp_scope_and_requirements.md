# PMIDE MVP Scope and Requirements

## 1. MVP Goal

The MVP should be a real-feeling forked VS Code experience that demonstrates an enterprise future state:

```text
A PM works inside an IDE, manages repo-native context, creates a skill, generates a Work Package, routes work to an agent, sees code changes, and reviews a PR for product intent.
```

The MVP does not need every backend integration to be production-ready. It does need to feel real, use a real repo, perform real file and Git operations where possible, and show credible UI for future capabilities.

## 2. MVP Product Definition

The MVP is not a static clickable prototype.

It should be an actual forked IDE that can:

- Open a real local GitHub repo
- Display a PMIDE-branded shell
- Show PM-native panels
- Create and edit repo-backed artifacts
- Create branches
- Commit and push changes
- Open real pull requests
- Show simulated or generated product-intent review

## 3. MVP Must Actually Work

The MVP must support these working capabilities:

1. Open a real GitHub repo locally.
2. Display IDE-style shell with PMIDE-branded navigation.
3. Show repo files, source control, terminal, and branch status.
4. Create a safe draft branch.
5. Edit context through a friendly UI.
6. Save context changes as Markdown files.
7. Generate a Work Package from context and planning notes.
8. Save Work Package files to the repo.
9. Create a Skill through a guided UI.
10. Save generated `SKILL.md` and related files to the repo.
11. Show Git diff for changed context, Work Package, and Skill files.
12. Commit changes using PM-friendly commit flow.
13. Push branch to GitHub.
14. Open a real pull request for context, Work Package, and Skill changes.
15. Display a PR review packet inside PMIDE.
16. Open the PR in GitHub.

## 4. MVP Can Simulate

The MVP can simulate these capabilities:

1. Actual coding-agent implementation of code changes.
2. Multi-agent routing decisions.
3. Automated risk scoring.
4. Acceptance criteria verification.
5. Enterprise approval workflow.
6. Skill security scanning.
7. Cross-system integrations.
8. Full audit-log backend.
9. Actual merge controls.
10. Automated release deployment.

## 5. MVP Must Show UI for Simulated Capabilities

Even if not fully implemented, the demo should include visible UI for:

- Agent Router
- Governance Approval Queue
- Risk Policy Checks
- Product Intent Review
- Agent Run History
- Release Story
- Role-Based Permissions
- Enterprise Settings

The purpose is to show the future operating model, not merely the working code path.

## 6. MVP Priorities

## Priority 1: PMIDE Shell

Requirements:

- Forked VS Code shell
- PMIDE branding
- Custom activity bar sections
- Demo repo support
- PM-safe branch indicator
- PM-native command palette entries
- Role-based layout placeholder

Required activity bar sections:

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

## Priority 2: Context Library

Requirements:

- Display context objects from repo files
- Rich edit Markdown-backed context
- Planning session extraction
- Context diff
- Safe draft branch support
- Save accepted context updates to branch

Context categories:

- Product principles
- Business rules
- Customer segments
- Compliance rules
- Domain glossary
- UX standards
- Architecture notes
- Release constraints
- Agent instructions
- Decision history

## Priority 3: Work Package Builder

Requirements:

- AI companion-assisted generation
- Context source mapping
- Markdown-backed Work Package files
- Readiness score, acceptable if simulated
- Acceptance signals
- Risk controls
- Review plan
- Agent instructions

Required Work Package files:

```text
/work-packages/WP-0001-billing-status-rule/work-package.md
/work-packages/WP-0001-billing-status-rule/context-map.json
/work-packages/WP-0001-billing-status-rule/review-plan.md
```

## Priority 4: Skill Builder

Requirements:

- Guided skill wizard
- Generate `SKILL.md`
- Generate skill folder
- Generate templates, references, and optional script placeholders
- Simulated validation and governance
- Raw file preview

Required output:

```text
/skills/billing-domain-reviewer/SKILL.md
/skills/billing-domain-reviewer/templates/review-output.md
/skills/billing-domain-reviewer/references/billing-rules.md
/skills/billing-domain-reviewer/scripts/check-billing-terms.py
```

## Priority 5: Git Workflow

Requirements:

- Create branch
- Show branch safety explanation
- Show changed files
- Stage changes
- Commit changes
- Push branch
- Create PR
- Open PR in GitHub

PM-friendly labels:

| Git term | PMIDE assisted label |
|---|---|
| Branch | Safe Draft Branch |
| Commit | Save Version |
| Push | Share Draft |
| Pull Request | Propose Change |
| Diff | Compare Changes |
| Merge | Accept Change |
| Conflict | Competing Change |

## Priority 6: Product Intent Review

Requirements:

- Generate review packet from PR or sample diff
- Show acceptance signal coverage
- Show changed areas in plain English
- Show risk and test gaps
- Simulate recommendation logic
- Allow Open in GitHub

## 7. Functional Requirements

## 7.1 PMIDE Shell

**PMIDE-SHELL-001:** The app shall launch with PMIDE branding, navigation, and welcome screen.

**PMIDE-SHELL-002:** The app shall preserve core IDE affordances, including file explorer, editor tabs, terminal, source control, branch status, and extensions.

**PMIDE-SHELL-003:** The app shall add PM-native activity bar sections for Context Library, Work Packages, Skills, Agent Runs, Releases, and Governance.

**PMIDE-SHELL-004:** The app shall support role-based layout modes, at minimum as UI placeholders in MVP.

**PMIDE-SHELL-005:** The app shall allow users to customize visible panels and primary action buttons, at minimum as UI placeholders in MVP.

**PMIDE-SHELL-006:** The app shall include a command palette with PM-native commands.

Example commands:

```text
PMIDE: Import Planning Session
PMIDE: Start Safe Draft
PMIDE: Update Context Library
PMIDE: Create Work Package
PMIDE: Create Skill
PMIDE: Route to Agent
PMIDE: Review Product Intent
PMIDE: Generate Release Story
```

## 7.2 Context Library

**CTX-001:** The app shall display repository context files as structured product context objects.

**CTX-002:** The app shall support context categories.

**CTX-003:** The app shall allow users to edit context through a rich editor.

**CTX-004:** The app shall allow users to view raw Markdown.

**CTX-005:** The app shall show context freshness, owner, last updated date, and linked decisions.

**CTX-006:** The app shall show context conflicts.

**CTX-007:** The app shall generate PM-friendly diffs for context changes.

**CTX-008:** The app shall map context changes to repo file changes.

**CTX-009:** The app shall require safe draft branches for context changes in enterprise mode.

**CTX-010:** The app shall support context approval states.

## 7.3 Planning Session Import

**PLAN-001:** The app shall allow users to paste planning notes.

**PLAN-002:** The app shall allow users to import a Markdown or text file from the repo.

**PLAN-003:** The MVP UI shall show future options for Slack, meeting transcript, email, and Confluence import.

**PLAN-004:** The app shall extract candidate decisions, business rules, open questions, work packages, skill opportunities, risks, dependencies, and context conflicts.

**PLAN-005:** The app shall present extracted items in a review queue.

**PLAN-006:** The user shall be able to accept, edit, reject, or defer each extracted item.

**PLAN-007:** Accepted items shall generate repo-native artifacts.

**PLAN-008:** The app shall show which context files will be changed before writing to the repo.

## 7.4 Safe Draft Branch Assistant

**BRANCH-001:** The app shall explain the current branch in plain English.

**BRANCH-002:** The app shall recommend branch names based on the work.

**BRANCH-003:** The app shall create safe draft branches.

**BRANCH-004:** The app shall prevent direct commits to protected branches in PM mode, at minimum through warning and disabled guided action in MVP.

**BRANCH-005:** The app shall show branch comparison against main.

**BRANCH-006:** The app shall explain common Git states.

**BRANCH-007:** The app shall provide assisted resolution paths for common Git errors.

## 7.5 Work Package Builder

**WP-001:** The app shall create Work Packages from planning notes, context, existing issues, or blank input.

**WP-002:** The app shall generate required Work Package sections.

**WP-003:** The app shall allow the PM to converse with an AI companion while editing the Work Package.

**WP-004:** The app shall show which context sources informed the generated work.

**WP-005:** The app shall allow users to add or remove context sources.

**WP-006:** The app shall score work readiness, simulated acceptable in MVP.

**WP-007:** The app shall allow users to generate GitHub issues from Work Packages, simulated acceptable in MVP.

**WP-008:** The app shall allow users to route Work Packages to agents or human engineers, simulated acceptable in MVP.

**WP-009:** The app shall store Work Packages as repo-native files.

## 7.6 Skill Builder

**SKILL-001:** The app shall provide a Create Skill button.

**SKILL-002:** The app shall guide users through skill creation.

**SKILL-003:** The app shall generate a valid skill folder structure.

**SKILL-004:** The app shall generate `SKILL.md`.

**SKILL-005:** The app shall support optional scripts, templates, and references.

**SKILL-006:** The app shall show a PM-friendly preview of the skill.

**SKILL-007:** The app shall show raw files for technical users.

**SKILL-008:** The app shall validate skill quality, simulated acceptable in MVP.

**SKILL-009:** The MVP shall simulate security scanning but display realistic scan results.

**SKILL-010:** The app shall support skill status.

## 7.7 Git and PR

**PR-001:** The app shall create a pull request from the current safe draft branch.

**PR-002:** The app shall generate PR title and description.

**PR-003:** The PR description shall include summary, reason, files changed, linked context, linked Work Package, requested review, and risk notes.

**PR-004:** The app shall allow users to open the PR in GitHub.

**PR-005:** The app shall show required review roles.

**PR-006:** The MVP shall create real PRs for context, Work Package, and Skill changes.

## 8. Nonfunctional Requirements

## 8.1 Usability

- PMs should understand the main workflow without prior Git expertise.
- Git concepts should be visible but explained.
- Default actions should be safe.
- Advanced technical views should remain available.

## 8.2 Performance

- PMIDE should open a repo within acceptable VS Code-like startup expectations.
- Context Library should load quickly for demo-scale repos.
- AI generation should stream responses when possible.

## 8.3 Security

- No secret exposure in generated context previews.
- No script execution without approval.
- No hidden agent actions.
- No automatic push or PR creation without confirmation.
- Enterprise mode should prefer allowlisted skills and connectors.

## 8.4 Auditability

- Every generated artifact should record source inputs.
- Every agent run should record context used.
- Every approval should be linked to user and timestamp.
- Every Work Package should link to branch, PR, and review result.

## 8.5 Extensibility

- Product panels should be modular.
- Skills should be portable.
- Agent connections should be replaceable.
- Context schema should be configurable by enterprise teams.
