# PMIDE — the IDE rebuilt for product managers

This repository is a **product built on the Eclipse Theia Platform** (not a fork of
VS Code): the official `theia-ide` template, rebranded to PMIDE, plus the
`theia-extensions/pmide` extension that adds the product-native surfaces.

## What PMIDE adds on top of Theia

- **Seven PM sections in the activity bar**: Context Library, Work Packages,
  Skills, Agent Runs, Pull Requests, Releases, Governance.
- **A real demo repo**: on first launch the backend materializes
  `~/pmide-demo/enterprise-sample-app`, `git init`s it, and wires a local bare
  repo as `origin` — so branches, commits, and pushes in the golden flow are real.
- **The golden demo flow** (menu **PMIDE** or command palette, category `PMIDE`):
  Import Planning Session → extraction review → Start Safe Draft (real branch)
  → Accept Context Update (real files + real Monaco diff vs main) → Create Skill
  (9-step wizard, real skill folder) → Create Work Package → Save Version (real
  commit) → Share Draft (real push) → Propose Change → Route to Agent (simulated
  agents, **real implementation branch + commit**) → Product Intent Review →
  Generate Release Story.
- **Branch-safety status bar**: teal *"PM Safe Draft — protected main untouched"*
  whenever you're on a draft branch; live changed-file count.
- **Governance panel**: approval matrix, live checks, audit trail.
- **Theia AI**: the full AI stack ships (`@theia/ai-ide`, `@theia/ai-anthropic`,
  `@theia/ai-claude-code`, MCP). To enable the chat companion: Settings →
  enable AI features → configure an Anthropic API key.

## Build & run (Windows)

Prereqs: Node ≥22, yarn 1.x, Python 3 + setuptools, VS 2022 Build Tools
(C++ workload incl. Spectre-mitigated libs).

```
yarn                          # install
yarn build:extensions         # compile all theia-extensions
yarn electron build           # bundle the desktop app (dev mode)
yarn electron start           # launch PMIDE (desktop)

yarn browser build            # optional: browser target
yarn browser start            # http://localhost:3000
```

Packaged installer / PMIDE.exe:

```
yarn electron package         # → applications/electron/dist (PMIDESetup.exe + win-unpacked/PMIDE.exe)
```

Note: if launching from a VS Code terminal, unset `ELECTRON_RUN_AS_NODE` first.

## Demo reset

Delete `~/pmide-demo` and restart PMIDE — the workspace re-bootstraps to the
start of the golden flow.

## Where things live

```
theia-extensions/pmide/
  src/common/demo-data.ts        the demo repo contents + flow content
  src/common/protocol.ts         frontend↔backend RPC contract
  src/node/pmide-service-impl.ts repo bootstrap + real git operations
  src/browser/pmide-flows.ts     the golden-flow engine
  src/browser/render-html.ts     screen renderers (dashboard, review packet, …)
  src/browser/pmide-views.ts     the 7 activity-bar views
  src/browser/pmide-panels.ts    main-area panels
  src/browser/pmide-contributions.ts  commands, PMIDE menu, status bar, bootstrap
  src/browser/style/pmide.css    design system (Theia-theme aware)
theia-extensions/product/        PMIDE branding (welcome page, about)
applications/electron/           desktop app + electron-builder config + icons
```
