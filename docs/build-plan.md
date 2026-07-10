# PMIDE v2 Build Plan

> **Date:** 2026-07-08
> **Status:** Current roadmap for building [build-brief.md](build-brief.md). Grounded in the actual Theia codebase at `S:\Vibe Coding Folder\pmide-theia`.
> Work happens in the app repo (`S:\Vibe Coding Folder\pmide-theia`); this document is the reference plan.
>
> **Progress (2026-07-10):** Phase 0 ✅ and the Phase 1 wedge ✅ — engine seam (`PmideAgentService` over the bundled Agent SDK), BM25 space index with `pmide_search`/`pmide_facts` tools, six-surface nav, Ask v0 with citations + drift callouts, Product Space linking, and the PMIDE Light theme — all verified end-to-end (headless engine test 6/6; Playwright UI drive: cited answer, drift flag, citation opens file at line). Still open from Phase 1: local embeddings slice, the router as a repo skill, first-run "Connect Claude" screen, custom icon set. Phases 2–6 not started.

## Grounding facts (verified in the codebase)

These are the things already true of the app that the plan builds on:

- The Electron app already ships `@theia/ai-claude-code@1.73.1`, whose backend dynamically imports the **Claude Agent SDK** (`@anthropic-ai/claude-agent-sdk`) and streams responses over Theia RPC. The engine-seam pattern already exists — but the current integration hides SDK options the v2 vision needs (`mcpServers`, `plugins`, `agents`, `settingSources`).
- The pmide extension is ~3,600 lines, mostly v1-demo-specific. Reusable pieces: the `PmideHtmlWidget` base class, `PmideGitResourceResolver` (git-ref diffs), the spawn-git runner in `pmide-service-impl.ts`, and the preference-gating pattern.
- Theia **multi-root workspaces** cover multi-repo linking natively. `MonacoThemingService.registerParsedTheme` enables a custom light theme; the default theme is set in `applications/electron/package.json`.

## Engine decision

Keep `@theia/ai-claude-code` untouched as the developer chat for the Code surface. Build a new **`PmideAgentService`** (node layer, modeled on the existing implementation) that exposes the full Agent SDK surface: in-process MCP tools via `createSdkMcpServer()`, plugins, and `settingSources`. This one file is the "thin swap seam" the brief calls for.

Bundle the Agent SDK with the app (`asarUnpack`) so non-technical PMs never need a global npm install. Add a first-run "Connect Claude" auth screen.

## Phases

### Phase 0 — Housekeeping (~1 week)

- This documentation task (v2 brief recorded, v1 docs archived).
- App-repo cleanup: tag the last commit `v1-golden-demo`, then delete the golden-flow/demo code — `pmide-flows.ts`, `pmide-state.ts`, `render-html.ts`, `pmide-panels.ts`, `pmide-views.ts`, `demo-data.ts`.
- Generalize the git runner to take a `repoPath` parameter.
- **Exit criteria:** the app still builds and launches as a clean IDE.

### Phase 1 — Ask + linked repos + context router (~7–9 weeks) — the wedge

The single-player wedge from the brief. Must be excellent alone.

- **Product Space** = a Theia multi-root workspace; link metadata lives in `.pmide/workspace.json` inside the product repo (versioned).
- **Local stores:** one SQLite database per space (`better-sqlite3` + `sqlite-vec` + FTS5) at `~/.pmide/index/…` — a rebuildable cache, never committed. Tables: `documents`, `chunks`, `chunks_fts`, `chunk_vectors`, `facts`, `claims`, `connections`.
- **Ask** = an Agent SDK session with read-only tools plus in-process `pmide_search` / `pmide_facts` MCP tools. The system prompt enforces a citation contract (`[[cite:…]]` → clickable source chips) and drift markers (`[[drift:…]]` → calm amber callouts). Custom React Ask widget (not `@theia/ai-chat-ui`).
- **Context router** ships as a real Claude Code skill in the product repo (`.claude/skills/pmide-context-router/`); the classifier's verdict is executed by deterministic TypeScript.
- **Embeddings sequenced honestly:** FTS5/BM25 keyword search first; local ONNX embeddings (bge-small via `@huggingface/transformers`) as a later slice behind an `Embedder` interface.
- **Six-surface left nav** registered up front (Ask + Context real; the others placeholders).

**Slice order:** engine seam → spaces/linking → FTS index + Ask v0 (the first "wow") → embeddings → router skill → drift/health/polish.

**Top risk, de-risk first:** the bundled Agent SDK running from the packaged installer on a clean machine.

### Phase 2 — Specs workspace (~3–4 weeks)

- Specs tree over `product-repo/specs/**`.
- Monaco markdown editing + a preview styled editorially.
- "Save version" = a git commit with a Claude-drafted plain-language message.
- Friendly timeline and diffs via the generalized `pmide-git` resolver. No git jargon in reader mode.

### Phase 3 — Workflows / packages (~4–6 weeks)

- Packages = Claude Code plugins, loaded through `PmideAgentService`.
- Three baseline workflows: discovery synthesis, evidence-to-spec, stakeholder update.
- The flagship skill-building workflow with auto-embedded evals.
- Every run gated by human review before artifacts land.

### Phase 4 — Code surface + prototyping (~2–3 weeks)

- A `pmide.uiMode` mode switch reveals stock Theia (Explorer, SCM, terminal) plus the stock Claude chat.
- Prototype scaffolding from templates with task/preview wiring.

### Phase 5 — Two-way integrations + analysis (~4–6 weeks)

- MCP connections managed in the Context surface with health indicators.
- On-demand fetches cached with an `as_of` expiry — no standing mirrors.
- Two flagship write-back actions built as workflow packages behind the review gate.

### Phase 6 — Home command center (~2–3 weeks)

- Composes existing services: git activity, drift ledger, pending reviews, connected-source pulls.
- Replaces the getting-started widget.

### Theming track (alongside Phases 1–2)

- "PMIDE Light" — a VS Code-format theme registered from the extension.
- An editorial CSS layer: bundled humanist fonts, a `pmide-reader` body class.
- A curated icon set for the six surfaces.

## Total estimate

~5.5–8 months solo, Claude-assisted. A usable single-player wedge (through Phase 1) at ~2.5 months.
