# PMIDE — the IDE rebuilt for product managers

A native desktop IDE built on the Eclipse Theia Platform.

## Current vision (v2)

- **[docs/build-brief.md](docs/build-brief.md)** — the current product vision:
  Claude Code as the engine, Ask as the single-player wedge, a context router,
  six surfaces, light/editorial design.
- **[docs/build-plan.md](docs/build-plan.md)** — the phased roadmap to build it.
- **[docs/v1-to-v2-delta.md](docs/v1-to-v2-delta.md)** — what changed from v1
  and why.
- `archive/requirements-v1/` — the superseded v1 requirements set, kept for the
  record (each file carries an OBSOLETE banner).

## How to run PMIDE

- **Start Menu / Desktop:** after installation, launch **PMIDE** like any other
  program (Start Menu → PMIDE, or the desktop shortcut).
- **From this folder:** double-click **`Launch PMIDE.bat`**.
- **Installer:** `S:\Vibe Coding Folder\pmide-theia\applications\electron\dist\PMIDESetup.exe`
  (Windows SmartScreen will warn because the binary is unsigned — choose
  "More info → Run anyway").

PMIDE starts as a normal, fully usable IDE: open any folder, edit with the
Monaco editor, use the real terminal, git, debugging, the AI chat, and install
VS Code extensions from Open VSX.

## Demo Mode (the golden PM demo — off by default)

The scripted product-management walkthrough is opt-in:

- **Turn on:** command palette (F1) → `PMIDE: Enable Demo Mode` (also in the
  PMIDE menu). This creates a real demo repository at
  `%USERPROFILE%\pmide-demo\enterprise-sample-app`, opens it, docks the seven
  PM sections (Context Library → Governance) in the activity bar, and activates
  the golden flow: planning import → safe draft branch → context update → skill
  → work package → commit/push/PR → agent routing → product intent review →
  release story. Branches, commits, diffs, and pushes are real git.
- **Turn off:** `PMIDE: Disable Demo Mode`, then reload the window.
- **Reset the demo:** delete `%USERPROFILE%\pmide-demo` and re-enable Demo Mode.

## AI chat (Claude)

Theia AI ships in PMIDE (Anthropic provider + Claude Code integration included).
Enable it: Settings → search "AI features" → enable → add your Anthropic API key.

## Where things live

| Path | What it is |
|---|---|
| `S:\Vibe Coding Folder\pmide-theia\` | PMIDE source (Theia workspace); see `PMIDE.md` there for developer docs |
| `S:\Vibe Coding Folder\pmide-theia\applications\electron\dist\` | Build output: `PMIDESetup.exe` + `win-unpacked\PMIDE.exe` |
| `%LOCALAPPDATA%\Programs\PMIDE\` | Installed app location |
| `docs/` | The current v2 vision, delta, and build plan |
| `archive/requirements-v1/` | The original (obsolete) v1 requirements document set |
| `archive/` | Also holds the earlier zero-install browser mock-up + build screenshots (kept for reference; open `archive/browser-mockup/index.html` in a browser) |
