# PMIDE v2 Build Brief

> **Date:** 2026-07-08
> **Status:** Current — supersedes [archive/requirements-v1/](../archive/requirements-v1/) (the original PMIDE requirements set). See [v1-to-v2-delta.md](v1-to-v2-delta.md) for what changed and [build-plan.md](build-plan.md) for the phased plan to build it.
> **Naming note:** the original brief used "Throughline" as a working title. It was a placeholder only — per the naming decision, the product name is **PMIDE** everywhere, and occurrences of "Throughline" have been replaced with PMIDE in this document. Content is otherwise verbatim, with light markdown formatting.

A build specification for a product-management IDE. Written to be handed to Claude Code as the starting context for implementation. Read this alongside a CLAUDE.md in the target repo.

## 1. Vision

PMIDE is an IDE for product managers and the non-engineers who work alongside them. It sits over a team's repositories, connects to the tools where product signal already lives, and becomes the place where PM work happens: understanding the product, ingesting and managing context, running analysis, making and recording decisions, and producing version-correct artifacts that engineers and AI coding agents can act on directly.

It is a real IDE — file tree, editor, integrated terminal, diffs — with a progressive-disclosure surface layered on top so a non-technical PM can work in a clean document view while a technical PM drops into the full code environment. The engine underneath is Claude Code.

The problem it solves: today a PM's context is scattered across five or more tools, coding agents need structured and unambiguous specs to build well, and there is a wide gap between engineering and everyone else — especially in non-tech companies. PMIDE closes the loop from raw product signal to agent-executable decision, and gives the whole team one place to read from and trust.

The core value is connective: the PM understands the code by asking; the engineer pulls the current spec without hunting through stale documents; analysis and decisions live in one version-controlled place instead of being scattered across Slack threads and doc revisions.

## 2. Target user

Primary: product managers in non-tech companies (finance, insurance, manufacturing, healthcare, operations-heavy businesses) where engineering is a walled-off department and non-engineers are cut off from it. Secondary: PMs at tech companies who want a purpose-built environment instead of a repurposed developer IDE.

The product must serve both the non-technical PM who wants a clean document experience and the technical PM who wants to open files, read diffs, and prototype in the terminal. Same underlying environment, two surfaces.

## 3. Design principles

These are constraints, not suggestions. Every feature decision resolves back to them.

**Human keeps the judgment.** This is not an autonomous agent. The PM is the trigger, the reviewer, and the source of customer feedback. AI-embedded workflows do the labor; the human decides. Never design a flow that removes the human from the decision.

**Progressive disclosure.** One environment, surfaces that scale from a Word-like reader up to a full IDE. Depth is always present; it is never forced.

**Context compounds.** Every decision, spec, and piece of ingested signal makes the next task easier. Leaving the tool should mean losing accumulated context. This is how the product earns daily use rather than mandating it.

**System of engagement, not system of record.** Raw data stays in Jira, Amplitude, Confluence, etc. PMIDE is where the PM reads, analyzes, decides, reports, and acts. Do not rebuild those tools' storage or their deep-exploration UIs. Do own the interaction, the analysis, and the decision record.

**Lean context.** Never mirror everything into the model's context window. Retrieve only what is relevant, when it is relevant. Bloated context degrades output.

**Version-correct by default.** Artifacts live in git as markdown. Anyone pulling a spec gets the current truth. Changes surface as friendly diffs, not raw git.

## 4. The surfaces

The app is one environment with switchable surfaces in a left nav:

- **Home** — a live command center: what changed, what needs the PM's review, current priorities, pulled from connected sources.
- **Ask** — the translator. Natural-language questions answered from live code and current specs, with source citations. The primary single-player wedge.
- **Specs** — the document workspace. A clean editor (reader surface) that writes markdown to git underneath. Version history shown as a friendly timeline.
- **Workflows** — the library of packages and the runner for AI-embedded workflows.
- **Code** — the full IDE: file tree, editor, integrated terminal, diffs, inline questions. For prototyping and hands-on work.
- **Context** — connected repos, data sources, MCP connections, ingestion controls, and connection-health/trust indicators.

## 5. Key features

### 5.1 The IDE core

Full IDE functionality: file tree, code editor with syntax highlighting, integrated terminal, multi-file diffs. A PM can open any file, read the code, run commands, and prototype with Claude directly in the environment. This is a real IDE, not a document tool with a code viewer bolted on — the non-technical experience is a skin over the IDE, and the technical PM has the whole thing.

Prototyping is a first-class use case: the PM builds a clickable prototype from a spec with Claude, works the details in the terminal, and validates before anything goes to the engineering backlog.

### 5.2 Ask — the translator

A natural-language query surface over the linked repos and context stores. A non-technical person asks "how does refund eligibility work?" and gets a plain-language answer citing the actual code and the current spec. An engineer asks "what's the current spec for X?" and pulls it without reading a pile of documents.

Every answer shows its sources (which files, which spec version, which data). This makes silent connection failures visible instead of hallucinated over. Ask should detect and surface disagreements between code and spec (drift), because catching those is high-value and only possible once repos are linked.

Ask must be excellent for a single user on day one, before any teammate joins. It is the wedge; build it first.

### 5.3 Packages

The unit of PM tooling is a package: a folder bundling skills, reference files, templates, and evals for a given kind of work (discovery synthesis, spec generation, capacity planning, stakeholder updates).

A PM does not start from a blank builder and does not "fork." They scaffold a new copy from a baseline template — a clean, independently owned copy (the "use this template" model, not the "fork" model), which they then edit freely. They can optionally pull an updated baseline later, but there is no live tether back to the origin.

In the Claude Code ecosystem, the distributable form of a package maps to a plugin, and a collection maps to a marketplace. Use that packaging and sharing model rather than inventing one.

### 5.4 Workflows

AI-embedded, human-triggered processes composed from a package's skills. The human triggers each run and reviews the output.

The skill-building workflow is a flagship. It walks the PM through: discuss the intent, ask clarifying questions, capture answers, write the skill, test it, gather feedback, iterate, and — critically — auto-embed evals the PM would not think to add themselves so the skill does not silently degrade over time.

Ship two or three strong baseline workflows (discovery synthesis, evidence-to-spec, stakeholder update). Expose deeper package authoring for power users. Do not lead with a blank builder.

### 5.5 Smart context management (the context router)

Ingest context from connected sources (via MCP) and manual uploads. A routing skill classifies each item and decides where it belongs and when it is likely to be needed, so nothing is blindly loaded into every prompt. Three destinations:

- Unstructured prose (interviews, research, Confluence pages) → vector/embedding store, retrieved semantically only when relevant.
- Structured data (metrics, ticket fields, counts) → relational/structured store, queried precisely.
- Live systems of record (Jira, Amplitude) → left in place, fetched on demand via MCP, not copied.

The router is the moat: it keeps context lean, which keeps output quality high, and it makes ingestion a curated act rather than a dump. The PM can see and curate what persists.

### 5.6 Multi-repo linking

Link more than one repository — typically the code repo(s) plus a separate product/context repo. Keep them independent but joined, so questions and artifacts can span both without forcing a monorepo or fragile git submodules.

### 5.7 Analysis, reporting, and decisions in-tool

Raw data stays in the source systems, but analysis, reporting, and decision-making happen in PMIDE. The PM pulls the relevant structured data, runs the analysis here, produces the report here, and records the decision here as a version-controlled artifact. This is the system-of-engagement boundary: do not rebuild Amplitude's charts for deep exploration, but do own the PM-facing analysis and the decision record.

### 5.8 Two-way integrations (system of engagement)

MCP read access covers pulling data. Being the daily home requires write-back for the highest-frequency PM actions. Build real two-way integrations for a small set — status check, ticket update, metric-into-spec, stakeholder update — and leave the long tail read-only via MCP. Absorb the handful of actions a PM does many times a day, not every tool's full surface.

Include connection-health and trust indicators so a dropped connection is visible, never silent.

### 5.9 Version control for PM artifacts

Specs, decisions, and reports are markdown in git. Diffs, attribution, rollback, and a friendly revision timeline come for free from git but are presented without git jargon for the non-technical surface. Engineers and Claude Code pull current, correct artifacts directly.

## 6. Visual design and identity

The UI must be immediately recognizable as an IDE — familiar skeleton, so people know how to use it on sight — while looking like nothing else in the category. The goal is a tool people want to open. Most IDEs are dark, dense, and built for engineers who tolerate them. PMIDE should feel calm, human, and premium, closer to a refined writing app than a developer console, without losing the power underneath.

**Familiar skeleton, re-skinned.** Keep the layout conventions that make an IDE legible: left nav, main editor, contextual panels. Do not reinvent where things go. Reinvent how they feel — spacing, color, type, and iconography carry the differentiation, not a strange new layout.

**Light and warm by default, not dark and dense.** The default theme is light, spacious, and editorial. A dark mode exists for the code surface, but the product does not open into the typical black, cramped dev environment. Generous whitespace, a clear hierarchy, and larger type on the reader surface signal that this is a place for thinking and writing, not just editing files.

**Two visual modes tied to the two surfaces.** Reader mode is document-like: spacious, generous margins, larger humanist type, minimal chrome. Code mode is precise and denser: monospace, tighter grid, full IDE controls. Both share one color identity and one icon family so the product feels continuous as the PM moves between them. Progressive disclosure is expressed visually — complexity and chrome fade in only as the user goes deeper.

**One ownable signature color.** Pick a single distinctive accent that is not VS Code blue and not a generic dev-tool hue, and use it with restraint — for the product mark, the primary action, and the connective moments (citations, links between code and spec). Holding one accent to a small set of roles is what lets it carry meaning and become recognizable rather than decorative. Everything else stays neutral.

**A custom icon family.** Do not ship stock IDE icons. Use one consistent icon set with slightly softer, more human geometry so the toolbar and nav do not read as "yet another editor." Consistent stroke weight and corner treatment across every icon.

**Typography as a differentiator.** A strong humanist sans (or a serif "voice" face) for the reader and document surfaces signals writing and judgment; a clean, comfortable monospace for code. The type choices should make the reader surface feel like a premium editor, not a config panel.

**Signature affordances that become the recognizable element.** The things no other IDE has should carry the brand: a persistent Ask affordance, and a context/sources rail that shows where an answer came from. Make these visually distinctive — elegant source-citation chips, and a calm, confident treatment for code/spec drift (surfaced as a considered warning, not an alarming red banner). These are what people will picture when they think of the product.

**Feel: calm, precise, confident.** Reference points for polish: the precision of Linear, the approachability of Notion, the restraint of a well-made writing app. Avoid enterprise-drab and avoid toy-playful. Subtle, purposeful motion only.

**Avoid.** Pure-black dev-tool darkness as the default; neon syntax rainbows; cramped, panel-heavy density on the reader surface; generic stock icons; more than one accent color competing for attention. Each of these pushes the product back toward "just another IDE."

## 7. How it works (architecture)

**Engine.** Claude Code is the agent and the workflow engine. Its skills and subagents are the substrate for packages and workflows — do not build a separate agent framework. Commit to Claude Code for v1; keep a thin seam so the engine could be swapped later, but do not build agent-agnosticism now.

**Storage layers.**

- Git repositories: source of truth for code and for PM artifacts (specs, decisions, reports) as markdown.
- Vector store: embeddings of unstructured ingested prose for semantic retrieval.
- Structured store: relational data for precise queries (metrics, ticket fields).
- No standing mirror of live systems of record.

**Context router.** A classifier skill sits between ingestion and storage, deciding destination and expected retrieval timing per item. Retrieval is on demand and relevance-scoped.

**Integration layer.** MCP for read and for the long tail of sources; dedicated two-way integrations for the few high-frequency write actions.

**Surfaces.** A single application shell renders the reader surface and the full IDE surface over the same underlying files and stores. Switching surfaces changes presentation and available depth, not the data.

## 8. Primary user journeys

**Understand the product (Ask).** A non-technical stakeholder asks a plain question; the tool retrieves relevant code and the current spec, answers in plain language with citations, and flags any code/spec drift.

**Ingest and manage context.** The PM connects Confluence and uploads research; the router classifies each item to the vector store, structured store, or leaves it for on-demand MCP; the PM curates what persists.

**Run a workflow.** The PM triggers evidence-to-spec: relevant signal is retrieved, clustered, and ranked; a structured, agent-executable spec is produced; the PM reviews and edits; the spec is committed to git.

**Build a skill.** The PM runs the skill-building workflow: discuss, question, write, test, feedback, iterate, and auto-embed evals. The new skill lands in a package.

**Prototype.** The PM opens the full IDE, builds a clickable prototype from a spec with Claude, works the terminal, and validates before the backlog.

**Decide and report.** The PM pulls structured data, runs analysis in-tool, records the decision as a versioned artifact, and updates stakeholders through a two-way integration.

## 9. Build sequencing

1. **Ask + linked repos + context router.** The single-player wedge. Must be excellent alone. This is the reason one PM adopts before their team.
2. **Specs workspace** + git-backed artifacts with friendly diffs.
3. **Packages + two or three baseline workflows**, including the skill-building workflow with auto-embedded evals.
4. **Full IDE surface + prototyping.**
5. **Two-way integrations** for the high-frequency actions; analysis and reporting in-tool.
6. **Home command center** tying it together.

## 10. Non-goals (explicit traps to avoid)

- Do not rebuild Jira, Amplitude, or Confluence. Own engagement and decisions; leave raw data and deep exploration to the source systems.
- Do not mirror all connected data into context. Retrieve on demand, scoped by relevance.
- Do not lead with a blank workflow builder. Lead with strong baseline packages that scaffold.
- Do not build agent-agnosticism in v1. Commit to Claude Code; keep a thin swap seam only.
- Do not remove the human from decisions. No autonomous end-to-end shipping.
- Do not force daily use by mandate. Earn it through compounding context and reduced tool-switching.

## 11. Open questions to resolve before or during build

- **Cold-start.** Ask must deliver standalone value on day one, before the team joins. Verify it does.
- **Gatekeeper.** In non-tech enterprises, engineering controls repo access and may resist letting non-engineers in. Identify the path past this (read-only mirrors, sanctioned scopes, an eng champion).
- **Substrate.** The design assumes GitHub-style repos. Many target companies run Azure DevOps or GitLab, or outsource engineering. Confirm the substrate for the actual first customers before committing the integration layer.
- **Form factor.** "IDE" is the chosen frame. Validate that target PMs will accept an IDE-shaped tool rather than a browser- or doc-native one, at least for the non-technical surface.
