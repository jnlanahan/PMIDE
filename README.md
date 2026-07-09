# PMIDE — the IDE rebuilt for product managers

A native desktop IDE built on the Eclipse Theia Platform. Built from the
requirements in `pmide_requirements_md/`.

## How to run PMIDE

- **Start Menu / Desktop:** after installation, launch **PMIDE** like any other
  program (Start Menu → PMIDE, or the desktop shortcut).
- **From this folder:** double-click **`Launch PMIDE.bat`**.
- **Installer:** `S:\pmide-theia\applications\electron\dist\PMIDESetup.exe`
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
| `S:\pmide-theia\` | PMIDE source (Theia workspace); see `PMIDE.md` there for developer docs |
| `S:\pmide-theia\applications\electron\dist\` | Build output: `PMIDESetup.exe` + `win-unpacked\PMIDE.exe` |
| `%LOCALAPPDATA%\Programs\PMIDE\` | Installed app location |
| `pmide_requirements_md/` | The original requirements document set |
| `archive/` | The earlier zero-install browser mock-up + build screenshots (kept for reference; open `archive/browser-mockup/index.html` in a browser) |
