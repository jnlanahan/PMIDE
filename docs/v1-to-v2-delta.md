# PMIDE v1 → v2: What Changed and Why

> **Date:** 2026-07-08
> The original requirements set now lives at [archive/requirements-v1/](../archive/requirements-v1/) and is **obsolete**. The current vision is [build-brief.md](build-brief.md); the plan to build it is [build-plan.md](build-plan.md).

The v2 brief supersedes the v1 requirements set. It is not an incremental revision — several foundational assumptions changed. This document maps each major change so anyone reading the archived v1 docs knows exactly which ideas no longer hold.

## The changes

| # | v1 (archived) | v2 (current) | Why it changed |
|---|---|---|---|
| 1 | "VS Code rebuilt for PMs" — a forked-VS-Code framing, an editor with PM features bolted on | A real IDE on Eclipse Theia with a **progressive-disclosure reader surface** layered on top: two surfaces, one environment. Non-technical PMs get a clean document view; technical PMs get the full IDE | The two-audience insight: the product must serve both the non-technical PM and the technical PM in the *same* environment, not pick one |
| 2 | Agent-agnostic — Claude, Copilot, Codex, and Gemini as interchangeable engines | **Committed to Claude Code** as the engine and workflow substrate (skills, subagents, plugins). Only a thin swap seam is kept | Agent-agnosticism was speculative complexity. Claude Code's skills/plugins ecosystem *is* the package model v2 needs — building an abstraction over four engines would rebuild that worse |
| 3 | A fixed, scripted **golden demo flow** (planning import → branch → skill → work package → PR → release story) | Real workflows run by a real engine on real repos. The demo-mode code is retired | The demo proved the concept; v2 builds the actual product. Scripted state machines can't compound context or answer real questions |
| 4 | **7 core objects** (Work Package, Decision Record, Review Packet, Context Entry, Skill, Product Intent, Release Story) with prescribed schemas and repo layout | **Markdown artifacts in git** (specs, decisions, reports) plus **packages that map to Claude Code plugins**. No bespoke object model | The object model was a system-of-record instinct. v2 is a system of *engagement*: artifacts are plain versioned markdown that engineers and agents consume directly |
| 5 | **7 PM activity-bar views** (Context Library → Governance) | **Six surfaces:** Home, Ask, Specs, Workflows, Code, Context | The surfaces follow the PM's actual jobs (understand, write, run, build, connect) instead of the v1 object taxonomy |
| 6 | Enterprise-**governance** framing: approvals, role gates, audit trails as the selling point | **Trust, citation, and drift** framing: every answer cites sources, code/spec drift is surfaced, connection health is visible. System of engagement, not system of record | Governance is a buyer feature; trust is a user feature. The wedge is a single PM getting cited, truthful answers — governance can come later |

## What v2 adds that v1 didn't have

- **Ask as the single-player wedge** — natural-language Q&A over linked repos with source citations and drift detection. Built first; must be excellent for one user on day one.
- **The context router** — a classifier that routes ingested context to a vector store (unstructured prose), a structured store (metrics, ticket fields), or leaves it in the source system for on-demand MCP fetch. Keeps context lean; this is the moat.
- **Multi-repo linking** — code repo(s) + a product/context repo, independent but joined, without monorepos or submodules.
- **Ask-first build order** — Ask → Specs → Workflows/packages → Code surface → two-way integrations → Home. v1 led with the full seven-view demo at once.
- **A light, warm, editorial visual identity** — calm and premium, closer to a refined writing app than a dark developer console. One signature accent color, humanist type, custom icons, distinctive citation chips and drift treatment.

## What carries over unchanged

- The desktop IDE is built on **Eclipse Theia** (evolving the existing app at `S:\pmide-theia`, not starting fresh).
- **Git as the source of truth** for PM artifacts, with friendly, jargon-free diffs and history.
- **Human keeps the judgment** — human-triggered, human-reviewed workflows; no autonomous shipping.
- The target user: PMs in non-tech companies where engineering is walled off.
