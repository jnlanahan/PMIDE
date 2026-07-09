/* ═══════════════════════════════════════════════════════════════
   PMIDE core — state, tabs, router, palette, terminal, companion.
   ═══════════════════════════════════════════════════════════════ */

/* ─────────── state ─────────── */
const state = {
  role: 'Product Manager',
  section: 'home',
  branch: 'main',
  onDraft: false,
  changes: [],            // {file, status}
  commits: [],            // {sha, msg}
  lastCommittedChanges: [],
  pushed: false,
  prContext: false,
  suggestedCommitMsg: '',
  openDirs: new Set(['context', 'src', 'src/billing']),
  activeFile: null,
  activeDetail: null,
  rawView: {},
  tabs: [],               // {id, title, icon, kind, arg}
  activeTab: null,
  extraction: [],
  wiz: null,
  routeSel: {},
  flow: {
    planningImported: false, contextAccepted: false, skillCreated: false,
    skillProposed: false, wpCreated: false, routed: false, codeReady: false,
    reviewed: false, intentDecision: null, prOpenedInGitHub: false, releaseStory: false,
  },
  // mutable copies of catalog data
  wps: DATA.workPackages.map(w => ({ ...w })),
  skills: DATA.skills.map(s => ({ ...s })),
  runs: DATA.agentRuns.map(r => ({ ...r })),
  releases: DATA.releases.map(r => ({ ...r })),
  prs: [],
  audit: DATA.audit.map(a => ({ ...a })),
};

/* ─────────── App namespace ─────────── */
const App = {};

App.allContext = () => DATA.context;
App.allWPs = () => state.wps;
App.allSkills = () => state.skills;
App.allRuns = () => state.runs;
App.allReleases = () => state.releases;
App.allPRs = () => state.prs;
App.allGov = () => state.flow.skillProposed ? DATA.governance : DATA.governance.filter(g => g.id !== 'gov-2');
App.getFile = (path) => DATA.files[path];
App.currentTree = () => DATA.tree;

App.treeAdd = function (dirName, node) {
  const dir = DATA.tree.find(n => n.name === dirName && n.type === 'dir');
  if (dir && !dir.children.some(c => c.name === node.name)) dir.children.push(node);
  state.openDirs.add(dirName);
};

/* ─────────── tabs ─────────── */
const TAB_ICONS = { dashboard: '⌂', file: '▤', context: '◫', wp: '▣', skill: '★', run: '⇶', pr: '⇄', release: '➤', gov: '⛨', settings: '⚙', diff: '±', codediff: '±' };

App.openTab = function (tab) {
  const existing = state.tabs.find(t => t.id === tab.id);
  if (!existing) state.tabs.push(tab);
  else Object.assign(existing, tab);
  state.activeTab = tab.id;
  App.renderTabs();
  App.renderEditor();
  App.renderStatus();
  App.renderDemoGuide();
};
App.closeTab = function (id, ev) {
  if (ev) ev.stopPropagation();
  const i = state.tabs.findIndex(t => t.id === id);
  if (i === -1) return;
  state.tabs.splice(i, 1);
  if (state.activeTab === id) {
    const next = state.tabs[Math.max(0, i - 1)];
    state.activeTab = next ? next.id : null;
    if (!next) App.openTab({ id: 'dashboard', title: 'Home', kind: 'dashboard' });
  }
  App.renderTabs();
  App.renderEditor();
};
App.focusTab = function (id) {
  state.activeTab = id;
  App.renderTabs();
  App.renderEditor();
};

App.renderTabs = function () {
  const bar = document.getElementById('tabbar');
  bar.innerHTML = state.tabs.map(t => `
    <div class="tab ${t.id === state.activeTab ? 'active' : ''}" onclick="App.focusTab('${t.id}')" title="${esc(t.title)}">
      <span class="ticon" style="color:${t.id === state.activeTab ? 'var(--brand-bright)' : 'var(--text-faint)'}">${TAB_ICONS[t.kind] || '▤'}</span>
      <span class="tab-label">${esc(t.title)}</span>
      <span class="tab-close" onclick="App.closeTab('${t.id}', event)">✕</span>
    </div>`).join('');
};

App.renderEditor = function () {
  const el = document.getElementById('editorContent');
  const bc = document.getElementById('breadcrumbs');
  const tab = state.tabs.find(t => t.id === state.activeTab);
  if (!tab) { el.innerHTML = ''; bc.innerHTML = ''; return; }
  let html = '', crumbs = '';
  switch (tab.kind) {
    case 'dashboard': html = Views.dashboard(); crumbs = 'enterprise-sample-app › Home'; break;
    case 'file': html = Views.file(tab.arg); crumbs = 'enterprise-sample-app › ' + tab.arg.split('/').join(' › '); break;
    case 'diff': html = Views.fileDiff(tab.arg); crumbs = 'Compare Changes › ' + tab.arg; break;
    case 'codediff': html = Views.codeDiff(); crumbs = 'Compare Changes › agent/wp-0042-implementation'; break;
    case 'context': html = Views.contextDetail(tab.arg); crumbs = 'Context Library › ' + tab.title; break;
    case 'wp': html = Views.wpDetail(tab.arg); crumbs = 'Work Packages › ' + tab.arg; break;
    case 'skill': html = Views.skillDetail(tab.arg); crumbs = 'Skills › ' + tab.title; break;
    case 'run': html = Views.runDetail(tab.arg); crumbs = 'Agent Runs › ' + tab.arg; break;
    case 'pr': html = Views.prView(tab.arg); crumbs = 'Pull Requests › ' + tab.title; break;
    case 'release': html = Views.releaseDetail(tab.arg); crumbs = 'Releases › ' + tab.title; break;
    case 'gov': html = Views.governance(); crumbs = 'Governance'; break;
    case 'settings': html = Views.settings(); crumbs = 'Settings'; break;
  }
  el.innerHTML = html;
  bc.innerHTML = crumbs.split(' › ').map(c => esc(c)).join(' <span class="crumb-sep">›</span> ');
  el.scrollTop = 0;
};

/* ─────────── openers ─────────── */
App.openFile = function (path, raw = false) {
  state.activeFile = path;
  if (raw) state.rawView[path] = true;
  App.openTab({ id: 'file:' + path, title: path.split('/').pop(), kind: 'file', arg: path });
  App.renderSidebar();
};
App.toggleRaw = function (path) {
  state.rawView[path] = !state.rawView[path];
  App.renderEditor();
};
App.openFileDiff = function (path) {
  App.openTab({ id: 'diff:' + path, title: 'Δ ' + path.split('/').pop(), kind: 'diff', arg: path });
};
App.openCodeDiff = function () {
  App.openTab({ id: 'codediff', title: 'Implementation diff — WP-0042', kind: 'codediff' });
};
App.openContext = function (id) {
  state.activeDetail = id;
  const c = DATA.context.find(x => x.id === id);
  App.setSection('context', false);
  App.openTab({ id: 'ctx:' + id, title: c.title, kind: 'context', arg: id });
  App.renderSidebar();
};
App.openWP = function (id) {
  state.activeDetail = id;
  const w = state.wps.find(x => x.id === id);
  App.setSection('workpackages', false);
  App.openTab({ id: 'wp:' + id, title: id + ' — ' + w.title, kind: 'wp', arg: id });
  App.renderSidebar();
};
App.openSkill = function (id) {
  state.activeDetail = id;
  const s = state.skills.find(x => x.id === id);
  App.setSection('skills', false);
  App.openTab({ id: 'skill:' + id, title: s.name, kind: 'skill', arg: id });
  App.renderSidebar();
};
App.openRun = function (id) {
  state.activeDetail = id;
  App.setSection('agentruns', false);
  App.openTab({ id: 'run:' + id, title: 'Agent Run ' + id, kind: 'run', arg: id });
  App.renderSidebar();
};
App.openPRView = function (id) {
  state.activeDetail = id;
  const p = state.prs.find(x => x.id === id);
  if (!p) return;
  App.setSection('prs', false);
  App.openTab({ id: 'pr:' + id, title: p.number + ' ' + p.title, kind: 'pr', arg: id });
  App.renderSidebar();
};
App.openRelease = function (id) {
  state.activeDetail = id;
  const r = state.releases.find(x => x.id === id);
  App.setSection('releases', false);
  App.openTab({ id: 'rel:' + id, title: r.title, kind: 'release', arg: id });
  App.renderSidebar();
};
App.openGovernance = function () {
  App.setSection('governance', false);
  App.openTab({ id: 'gov', title: 'Governance', kind: 'gov' });
  App.renderSidebar();
};
App.openSettings = function () {
  App.openTab({ id: 'settings', title: 'Settings', kind: 'settings' });
};
App.openDashboard = function () {
  App.openTab({ id: 'dashboard', title: 'Home', kind: 'dashboard' });
};
App.toggleDir = function (path) {
  state.openDirs.has(path) ? state.openDirs.delete(path) : state.openDirs.add(path);
  App.renderSidebar();
};

/* ─────────── activity bar + sidebar ─────────── */
App.renderActivityBar = function () {
  const bar = document.getElementById('activitybar');
  const badge = (id) => {
    if (id === 'scm' && state.changes.length) return `<span class="activity-badge">${state.changes.length}</span>`;
    if (id === 'prs') {
      const n = state.prs.filter(p => p.status === 'Open').length;
      return n ? `<span class="activity-badge">${n}</span>` : '';
    }
    if (id === 'governance') {
      const n = App.allGov().filter(g => /required|Waiting/i.test(g.state)).length;
      return n ? `<span class="activity-badge" style="background:var(--warn)">${n}</span>` : '';
    }
    if (id === 'agentruns' && state.runs.some(r => r.status === 'Running'))
      return `<span class="activity-badge" style="background:var(--safe)">●</span>`;
    return '';
  };
  const item = (s) => `
    <button class="activity-item ${state.section === s.id ? 'active' : ''}" onclick="App.setSection('${s.id}')" aria-label="${s.label}">
      <svg viewBox="0 0 16 16"><path fill="currentColor" d="${s.icon}"/></svg>
      ${badge(s.id)}<span class="tip">${s.label}</span>
    </button>`;
  bar.innerHTML = SECTIONS.map(item).join('') +
    `<div class="activity-flex"></div><div class="activity-sep"></div>` +
    SECTIONS_BOTTOM.map(item).join('');
};

App.setSection = function (id, open = true) {
  if (id === 'terminal') { App.togglePanel(true); return; }
  if (id === 'settings') { state.section = id; App.openSettings(); App.renderActivityBar(); App.renderSidebar(); return; }
  state.section = id;
  if (open) {
    if (id === 'home') App.openDashboard();
    if (id === 'governance') App.openGovernance();
  }
  App.renderActivityBar();
  App.renderSidebar();
};

App.renderSidebar = function () {
  const headEl = document.getElementById('sidebarHeader');
  const bodyEl = document.getElementById('sidebarBody');
  const sec = state.section === 'home' || state.section === 'settings' ? 'explorer' : state.section;
  const fn = Views.sidebar[sec];
  if (!fn) { headEl.textContent = sec.toUpperCase(); bodyEl.innerHTML = ''; return; }
  const { title, html } = fn();
  headEl.textContent = title;
  bodyEl.innerHTML = html;
};

/* ─────────── status bar ─────────── */
App.renderStatus = function () {
  const bar = document.getElementById('statusbar');
  bar.classList.toggle('safe-draft', state.onDraft);
  document.body.classList.toggle('on-safe-draft', state.onDraft);
  document.getElementById('statusBranchName').textContent = state.branch;
  document.getElementById('statusMode').textContent = state.onDraft
    ? 'PM Safe Draft — protected main untouched' : 'Shared Product — protected';
  document.getElementById('statusChanges').textContent = state.changes.length
    ? `● ${state.changes.length} changed` : '';
  const pending = App.allGov().filter(g => /required|Waiting/i.test(g.state)).length;
  document.getElementById('statusApprovals').textContent = pending ? `◔ ${pending} approvals pending` : '';
  document.getElementById('statusRole').textContent = 'Role: ' + state.role;
  const btn = document.getElementById('cmdSafeDraft');
  btn.classList.toggle('on-draft', state.onDraft);
  btn.innerHTML = state.onDraft
    ? `<svg viewBox="0 0 16 16" width="13" height="13"><path fill="currentColor" d="M6.5 12.5 2 8l1.4-1.4 3.1 3.1 6.1-6.1L14 5z"/></svg> On Safe Draft`
    : `<svg viewBox="0 0 16 16" width="13" height="13"><path fill="currentColor" d="M5 3.25a1.75 1.75 0 1 1-3.5 0 1.75 1.75 0 0 1 3.5 0zm0 9.5a1.75 1.75 0 1 1-3.5 0 1.75 1.75 0 0 1 3.5 0zm9.5-9.5a1.75 1.75 0 1 1-3.5 0 1.75 1.75 0 0 1 3.5 0zM3.25 5v6h1.5V5zm9.5 0v1.25c0 1.5-1.2 2.75-2.75 2.75H7.5V7.5H10c.7 0 1.25-.55 1.25-1.25V5z"/></svg> New Safe Draft`;
};

/* ─────────── global refresh ─────────── */
App.refresh = function () {
  App.renderActivityBar();
  App.renderSidebar();
  App.renderStatus();
  App.renderEditor();
  App.renderDemoGuide();
};

/* ─────────── toasts ─────────── */
App.toast = function (title, sub = '', tone = '') {
  const stack = document.getElementById('toastStack');
  const el = document.createElement('div');
  el.className = 'toast ' + tone;
  el.innerHTML = `<b>${esc(title)}</b>${sub ? `<div class="toast-sub">${esc(sub)}</div>` : ''}`;
  stack.appendChild(el);
  setTimeout(() => { el.classList.add('leaving'); setTimeout(() => el.remove(), 350); }, 5600);
};

/* ─────────── audit ─────────── */
App.audit = function (what, ref) {
  const t = new Date();
  state.audit.unshift({ time: t.toTimeString().slice(0, 5), user: 'j.alvarez', what, ref });
  App.renderPanelViews();
};

/* ─────────── terminal ─────────── */
const termQueue = [];
let termBusy = false;
App.term = function (lines) {
  termQueue.push(...lines);
  if (!termBusy) App._termTick();
  App.togglePanel(true, 'terminal');
};
App._termTick = function () {
  if (!termQueue.length) { termBusy = false; App._termCursor(); return; }
  termBusy = true;
  const line = termQueue.shift();
  setTimeout(() => {
    const scroll = document.getElementById('termScroll');
    scroll.querySelector('.term-cursor')?.parentElement?.remove();
    const div = document.createElement('div');
    div.className = 'term-line';
    div.innerHTML = line.html;
    scroll.appendChild(div);
    scroll.parentElement.scrollTop = scroll.parentElement.scrollHeight;
    App._termTick();
  }, line.delay ?? 120);
};
App._termCursor = function () {
  const scroll = document.getElementById('termScroll');
  if (!scroll || scroll.querySelector('.term-cursor')) return;
  const div = document.createElement('div');
  div.className = 'term-line';
  div.innerHTML = `<span class="t-prompt">jordan@pmide</span> <span class="t-branch">(${state.branch})</span> $ <span class="term-cursor"></span>`;
  scroll.appendChild(div);
  scroll.parentElement.scrollTop = scroll.parentElement.scrollHeight;
};

/* ─────────── bottom panel ─────────── */
App.togglePanel = function (show, tabName) {
  const panel = document.getElementById('bottomPanel');
  if (show === undefined) panel.classList.toggle('collapsed');
  else panel.classList.toggle('collapsed', !show);
  if (tabName) App.showPanelTab(tabName);
};
App.showPanelTab = function (name) {
  document.querySelectorAll('.panel-tab').forEach(t => t.classList.toggle('active', t.dataset.panel === name));
  ['terminal', 'problems', 'audit', 'output'].forEach(p => {
    document.getElementById('panel' + p[0].toUpperCase() + p.slice(1)).classList.toggle('hidden', p !== name);
  });
  App.renderPanelViews();
};
App.renderPanelViews = function () {
  const audit = document.getElementById('panelAudit');
  if (audit) audit.innerHTML = state.audit.map(a => `<div class="audit-row">
    <span class="audit-time">${esc(a.time)}</span><span class="audit-user">${esc(a.user)}</span>
    <span class="audit-what">${esc(a.what)}</span><span class="audit-ref">${esc(a.ref)}</span></div>`).join('');
  const problems = document.getElementById('panelProblems');
  if (problems) problems.innerHTML = state.flow.codeReady
    ? `<div class="problem-row"><span style="color:var(--warn)">⚠</span><span>Test coverage: suspended / restricted / risk-flagged statuses untested</span><span class="audit-ref">tests/billing-status-rule.test.ts</span></div>
       <div class="problem-row"><span style="color:var(--info)">ℹ</span><span>Support copy: help-center link pending (macro BILL-LOCKED-01)</span><span class="audit-ref">support/billing-status-copy.md</span></div>`
    : `<div class="problem-row dim">No problems detected in workspace.</div>`;
  const output = document.getElementById('panelOutput');
  if (output) output.innerHTML = `<div class="term-scroll">
    <div class="term-line t-dim">[pmide] workspace loaded: enterprise-sample-app</div>
    <div class="term-line t-dim">[pmide] governance profile: Enterprise (enforced)</div>
    <div class="term-line t-dim">[pmide] agent gateway: Claude connected · 4 simulated providers registered</div></div>`;
};

/* ─────────── command palette ─────────── */
const COMMANDS = [
  { label: 'PMIDE: Import Planning Session', run: () => Flows.importPlanning(), icon: '⇪' },
  { label: 'PMIDE: Start Safe Draft', run: () => Flows.startSafeDraft(), icon: '⌥' },
  { label: 'PMIDE: Update Context Library', run: () => Flows.updateContext(), icon: '◫' },
  { label: 'PMIDE: Create Work Package', run: () => Flows.createWorkPackage(), icon: '▣' },
  { label: 'PMIDE: Create Skill', run: () => Flows.createSkill(), icon: '★' },
  { label: 'PMIDE: Route to Agent', run: () => Flows.routeToAgent(), icon: '⇶' },
  { label: 'PMIDE: Review Product Intent', run: () => Flows.reviewIntent(), icon: '◉' },
  { label: 'PMIDE: Generate Release Story', run: () => Flows.generateReleaseStory(), icon: '➤' },
  { label: 'PMIDE: Open Governance Panel', run: () => App.openGovernance(), icon: '⛨' },
  { label: 'PMIDE: Save Version (Commit)', run: () => { App.setSection('scm'); }, icon: '✓' },
  { label: 'View: Toggle Terminal', run: () => App.togglePanel(), icon: '❯' },
  { label: 'View: Toggle AI Companion', run: () => Companion.toggle(), icon: '◗' },
  { label: 'View: Home Dashboard', run: () => App.setSection('home'), icon: '⌂' },
  { label: 'Preferences: Role-Based Layout', run: () => App.openSettings(), icon: '⚙' },
];
let paletteSel = 0;
App.openPalette = function () {
  document.getElementById('paletteOverlay').classList.remove('hidden');
  const input = document.getElementById('paletteInput');
  input.value = '';
  paletteSel = 0;
  App.renderPalette('');
  setTimeout(() => input.focus(), 30);
};
App.closePalette = function () {
  document.getElementById('paletteOverlay').classList.add('hidden');
};
App.renderPalette = function (q) {
  const results = document.getElementById('paletteResults');
  const query = q.trim().toLowerCase();
  const cmds = COMMANDS.filter(c => c.label.toLowerCase().includes(query))
    .map((c, i) => ({ type: 'cmd', ...c }));
  const files = query ? Object.keys(DATA.files).filter(f => f.toLowerCase().includes(query)).slice(0, 6)
    .map(f => ({ type: 'file', label: f, icon: '▤', run: () => App.openFile(f) })) : [];
  const all = [...cmds, ...files];
  App._paletteItems = all;
  if (paletteSel >= all.length) paletteSel = 0;
  results.innerHTML = all.length ? all.map((c, i) => `
    <div class="palette-item ${i === paletteSel ? 'selected' : ''}" onclick="App.runPalette(${i})">
      <span class="pi-icon">${c.icon}</span>
      <span class="pi-label">${c.type === 'cmd' ? esc(c.label).replace(/^PMIDE:/, '<b>PMIDE:</b>') : esc(c.label)}</span>
      <span class="pi-detail">${c.type === 'cmd' ? 'command' : 'file'}</span>
    </div>`).join('') + `<div class="palette-hint"><span>↑↓ navigate</span><span>↵ run</span><span>esc close</span></div>`
    : `<div class="palette-empty">No matching commands or files.</div>`;
};
App.runPalette = function (i) {
  const item = App._paletteItems[i];
  App.closePalette();
  if (item) setTimeout(() => item.run(), 60);
};

/* ─────────── AI Companion ─────────── */
const Companion = {};
Companion.el = () => document.getElementById('companionThread');
Companion.toggle = function () {
  document.getElementById('companion').classList.toggle('collapsed');
};
Companion.think = function () {
  document.getElementById('companionOrb').classList.add('thinking');
  const div = document.createElement('div');
  div.className = 'msg msg-ai typing-row';
  div.innerHTML = `<div class="typing"><i></i><i></i><i></i></div>`;
  Companion.el().appendChild(div);
  Companion._scroll();
};
Companion.done = function () {
  document.getElementById('companionOrb').classList.remove('thinking');
  Companion.el().querySelectorAll('.typing-row').forEach(e => e.remove());
};
Companion.say = function (html, sources = [], actions = []) {
  Companion.done();
  const div = document.createElement('div');
  div.className = 'msg msg-ai';
  div.innerHTML = `<div class="msg-ai-head"><span>◈</span> Companion</div>
    <div class="msg-body"></div>
    ${sources.length ? `<div class="msg-sources">Sources used: ${sources.map(s => `<span class="src">${esc(s)}</span>`).join('')}</div>` : ''}
    ${actions.length ? `<div class="msg-actions">${actions.map(a => `<button class="btn ghost sm" onclick="${a.go}">${esc(a.label)}</button>`).join('')}</div>` : ''}`;
  Companion.el().appendChild(div);
  // typewriter-ish reveal
  const body = div.querySelector('.msg-body');
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) { body.innerHTML = html; Companion._scroll(); return; }
  const tokens = html.split(/(<[^>]+>| )/g).filter(Boolean);
  let i = 0;
  const tick = () => {
    if (i >= tokens.length) return;
    body.innerHTML += tokens[i++];
    if (i % 4 === 0) Companion._scroll();
    setTimeout(tick, 11);
  };
  tick();
  Companion._scroll();
};
Companion._scroll = function () {
  const el = Companion.el();
  el.scrollTop = el.scrollHeight;
};
Companion.ask = function (text) {
  const q = text.trim();
  if (!q) return;
  const div = document.createElement('div');
  div.className = 'msg msg-user';
  div.textContent = q;
  Companion.el().appendChild(div);
  Companion._scroll();
  Companion.think();
  setTimeout(() => {
    const hit = DATA.companionAnswers.find(a => a.match.test(q)) || DATA.companionFallback;
    Companion.say(hit.text, hit.sources);
  }, 700 + Math.random() * 500);
};
Companion.renderSuggestions = function () {
  const box = document.getElementById('companionSuggestions');
  const f = state.flow;
  let chips;
  if (!f.planningImported) chips = ['What changed in context this week?', 'Explain safe draft branches', 'What is a work package?'];
  else if (!state.onDraft) chips = ['Why do I need a branch?', 'What did you extract?'];
  else if (!f.wpCreated) chips = ['What is a skill?', 'Show the BR-104 conflict'];
  else if (!f.routed) chips = ['Which agent should implement this?', 'What context goes to the agent?'];
  else if (!f.reviewed) chips = ['Summarize PR #128', 'What are the test gaps?'];
  else chips = ['Draft the release story', 'What approvals are still open?'];
  box.innerHTML = chips.map(c => `<button class="suggestion-chip" onclick="Companion.ask('${c.replace(/'/g, "\\'")}')">${esc(c)}</button>`).join('');
};

/* ─────────── demo guide ─────────── */
const GUIDE = [
  { title: 'Import Planning Session', sub: 'Notes → decisions, rules, work, skills', check: () => state.flow.planningImported, go: () => Flows.importPlanning() },
  { title: 'Start Safe Draft', sub: 'A branch, explained in product terms', check: () => state.onDraft, go: () => Flows.startSafeDraft() },
  { title: 'Accept Context Update', sub: 'BR-104 becomes governed, versioned context', check: () => state.flow.contextAccepted, go: () => Flows.importPlanning() },
  { title: 'Create Skill', sub: 'Billing Domain Reviewer, via guided wizard', check: () => state.flow.skillCreated, go: () => Flows.createSkill() },
  { title: 'Generate Work Package', sub: 'WP-0042, drafted with the companion', check: () => state.flow.wpCreated, go: () => Flows.createWorkPackage() },
  { title: 'Save · Share · Propose', sub: 'Commit, push, and open PR #127', check: () => state.prContext, go: () => App.setSection('scm') },
  { title: 'Route to Agent', sub: 'Claude refines, Copilot implements', check: () => state.flow.routed, go: () => Flows.routeToAgent() },
  { title: 'See the Code Change', sub: 'Real diff + product-readable summary', check: () => state.flow.codeReady, go: () => App.openCodeDiff() },
  { title: 'Review Product Intent', sub: 'Intent, not code quality — PR #128', check: () => state.flow.reviewed, go: () => Flows.reviewIntent() },
  { title: 'Generate Release Story', sub: 'Decision → code → communication, traced', check: () => state.flow.releaseStory, go: () => Flows.generateReleaseStory() },
];
App.renderDemoGuide = function () {
  const body = document.getElementById('demoGuideBody');
  if (!body) return;
  let currentFound = false;
  body.innerHTML = GUIDE.map((g, i) => {
    const done = g.check();
    const current = !done && !currentFound && (currentFound = true);
    return `<div class="guide-step ${done ? 'done' : ''} ${current ? 'current' : ''}">
      <span class="g-num">${done ? '✓' : i + 1}</span>
      <div><div class="g-title">${g.title}</div><div class="g-sub">${g.sub}</div></div>
      ${current ? `<button class="g-go" onclick="GUIDE[${i}].go()">Go</button>` : ''}
    </div>`;
  }).join('');
  Companion.renderSuggestions();
};

/* ─────────── role modes ─────────── */
App.setRole = function (role) {
  state.role = role;
  document.getElementById('roleLabel').textContent = role;
  const map = {
    'Product Manager': 'home', 'Engineering Lead': 'scm',
    'Developer': 'explorer', 'Governance Reviewer': 'governance',
  };
  App.setSection(map[role] || 'home');
  App.toast('Layout: ' + role, role === 'Product Manager'
    ? 'Context, work packages, skills, and product review up front.'
    : role === 'Developer' ? 'Explorer, terminal, and diffs up front — the classic IDE surface.'
    : role === 'Engineering Lead' ? 'Source control, PRs, and agent oversight up front.'
    : 'Approval queue, policies, and the audit trail up front.');
  App.refresh();
};

/* ─────────── branch popover ─────────── */
App.toggleBranchPop = function () {
  const pop = document.getElementById('branchPop');
  if (!pop.classList.contains('hidden')) { pop.classList.add('hidden'); return; }
  pop.innerHTML = state.onDraft ? `
    <h4><span class="pill safe">Safe Draft Branch</span></h4>
    <p class="mono">${esc(state.branch)}</p>
    <p>This is your safe place to propose changes. <b>Nothing changes in the shared product</b> until this branch is reviewed and approved through a pull request.</p>
    <div class="bp-row"><span>Compared to main</span><b>${state.commits.length ? '+' + (state.lastCommittedChanges.length || state.changes.length) + ' files ahead' : (state.changes.length ? state.changes.length + ' uncommitted changes' : 'no differences yet')}</b></div>
    <div class="bp-row"><span>Saved versions (commits)</span><b>${state.commits.length}</b></div>
    <div class="bp-row"><span>Shared to team (pushed)</span><b>${state.pushed ? 'yes' : 'not yet'}</b></div>` : `
    <h4><span class="pill approved">main — protected</span></h4>
    <p>This is the shared product everyone relies on. Direct commits are blocked in PM mode — start a <b>safe draft branch</b> to make changes.</p>
    <div class="bp-row"><span>Protection</span><b>reviewed PRs only</b></div>`;
  pop.classList.remove('hidden');
};

/* ─────────── menus ─────────── */
App.openMenu = function (btn, name) {
  document.querySelector('.dropdown')?.remove();
  const items = {
    File: [
      { label: 'New Context Item', go: () => Flows.newContextItem() },
      { label: 'New Work Package', go: () => Flows.createWorkPackage() },
      { label: 'New Skill', go: () => Flows.createSkill() },
      { sep: true },
      { label: 'Open File…', sub: 'Ctrl K', go: () => App.openPalette() },
    ],
    View: [
      { label: 'Home Dashboard', go: () => App.setSection('home') },
      { label: 'Toggle Terminal', go: () => App.togglePanel() },
      { label: 'Toggle AI Companion', go: () => Companion.toggle() },
      { label: 'Command Palette', sub: 'Ctrl K', go: () => App.openPalette() },
    ],
    Repo: [
      { label: 'Start Safe Draft', go: () => Flows.startSafeDraft() },
      { label: 'Compare Changes to Main', go: () => state.flow.contextAccepted ? App.openFileDiff('context/business-rules.md') : App.toast('No changes yet', 'Accept a context update first.') },
      { label: 'Propose Change (PR)', go: () => state.pushed && !state.prContext ? Flows.openPR() : App.setSection('scm') },
      { sep: true },
      { label: 'Open Repo on GitHub ↗', go: () => Flows.openInGitHub('the repository') },
    ],
    Agents: [
      { label: 'Route to Agent', go: () => Flows.routeToAgent() },
      { label: 'Agent Runs', go: () => App.setSection('agentruns') },
      { label: 'Generation model: Claude ✓', go: () => {} },
    ],
    Go: [
      { label: 'Context Library', go: () => App.setSection('context') },
      { label: 'Work Packages', go: () => App.setSection('workpackages') },
      { label: 'Skills', go: () => App.setSection('skills') },
      { label: 'Pull Requests', go: () => App.setSection('prs') },
      { label: 'Governance', go: () => App.setSection('governance') },
    ],
    Edit: [
      { label: 'Undo', sub: 'Ctrl Z', go: () => {} },
      { label: 'Find in Files', sub: 'Ctrl Shift F', go: () => App.openPalette() },
    ],
    Help: [
      { label: 'The Golden Demo Flow', go: () => App.toggleDemoGuide(true) },
      { label: 'Git in Product Language', go: () => App.openSettings() },
      { label: 'About PMIDE', go: () => App.toast('PMIDE — Vision MVP', 'The IDE rebuilt for product managers. Demo build.') },
    ],
  }[name] || [];
  const menu = document.createElement('div');
  menu.className = 'dropdown';
  const r = btn.getBoundingClientRect();
  menu.style.left = r.left + 'px';
  menu.style.top = (r.bottom + 4) + 'px';
  menu.innerHTML = items.map((it, i) => it.sep ? `<div class="dropdown-sep"></div>` :
    `<button class="dropdown-item" data-mi="${i}">${esc(it.label)}${it.sub ? `<span class="di-sub">${esc(it.sub)}</span>` : ''}</button>`).join('');
  document.body.appendChild(menu);
  menu.addEventListener('click', (e) => {
    const b = e.target.closest('[data-mi]');
    if (!b) return;
    menu.remove();
    items[+b.dataset.mi].go();
  });
  setTimeout(() => document.addEventListener('click', function close(e) {
    if (!menu.contains(e.target)) { menu.remove(); document.removeEventListener('click', close); }
  }), 30);
};

/* ─────────── role dropdown ─────────── */
App.openRoleMenu = function () {
  document.querySelector('.dropdown')?.remove();
  const btn = document.getElementById('roleSwitch');
  const roles = ['Product Manager', 'Engineering Lead', 'Developer', 'Governance Reviewer'];
  const menu = document.createElement('div');
  menu.className = 'dropdown';
  const r = btn.getBoundingClientRect();
  menu.style.right = (window.innerWidth - r.right) + 'px';
  menu.style.left = 'auto';
  menu.style.top = (r.bottom + 4) + 'px';
  menu.innerHTML = `<div class="dropdown-label">Role-based layout</div>` + roles.map(x =>
    `<button class="dropdown-item" data-role="${x}">${x === state.role ? '✓ ' : ''}${x}</button>`).join('');
  document.body.appendChild(menu);
  menu.addEventListener('click', (e) => {
    const b = e.target.closest('[data-role]');
    if (!b) return;
    menu.remove();
    App.setRole(b.dataset.role);
  });
  setTimeout(() => document.addEventListener('click', function close(e) {
    if (!menu.contains(e.target)) { menu.remove(); document.removeEventListener('click', close); }
  }), 30);
};

/* ─────────── demo guide toggle ─────────── */
App.toggleDemoGuide = function (show) {
  const g = document.getElementById('demoGuide');
  if (show === undefined) g.classList.toggle('hidden');
  else g.classList.toggle('hidden', !show);
  App.renderDemoGuide();
};

/* ─────────── command bar actions ─────────── */
const CMDBAR_ACTIONS = {
  startSafeDraft: () => Flows.startSafeDraft(),
  importPlanning: () => Flows.importPlanning(),
  updateContext: () => Flows.updateContext(),
  createWorkPackage: () => Flows.createWorkPackage(),
  createSkill: () => Flows.createSkill(),
  routeToAgent: () => Flows.routeToAgent(),
  openPullRequest: () => {
    if (state.prContext || state.flow.codeReady) { App.setSection('prs'); return; }
    if (!state.commits.length) { App.toast('Nothing to propose yet', 'Save a version first — commit your changes, share the draft, then propose.', 'warn'); App.setSection('scm'); return; }
    if (!state.pushed) { App.toast('Share your draft first', 'Push the branch so the team can see it, then propose the change.', 'warn'); App.setSection('scm'); return; }
    Flows.openPR();
  },
  reviewIntent: () => Flows.reviewIntent(),
  generateReleaseStory: () => Flows.generateReleaseStory(),
};

/* ─────────── init ─────────── */
function init() {
  // command bar
  document.querySelectorAll('.commandbar [data-action]').forEach(b =>
    b.addEventListener('click', () => CMDBAR_ACTIONS[b.dataset.action]()));

  // menus
  document.querySelectorAll('.menu-item').forEach(m =>
    m.addEventListener('click', () => App.openMenu(m, m.dataset.menu)));
  document.getElementById('roleSwitch').addEventListener('click', App.openRoleMenu);

  // palette
  document.getElementById('titlebarSearch').addEventListener('click', App.openPalette);
  document.getElementById('paletteOverlay').addEventListener('click', (e) => {
    if (e.target.id === 'paletteOverlay') App.closePalette();
  });
  const pInput = document.getElementById('paletteInput');
  pInput.addEventListener('input', () => { paletteSel = 0; App.renderPalette(pInput.value); });
  pInput.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { paletteSel = Math.min(paletteSel + 1, App._paletteItems.length - 1); App.renderPalette(pInput.value); e.preventDefault(); }
    if (e.key === 'ArrowUp') { paletteSel = Math.max(paletteSel - 1, 0); App.renderPalette(pInput.value); e.preventDefault(); }
    if (e.key === 'Enter') App.runPalette(paletteSel);
    if (e.key === 'Escape') App.closePalette();
  });
  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || (e.shiftKey && e.key === 'P'))) {
      e.preventDefault(); App.openPalette();
    }
    if (e.key === 'Escape') {
      closeModal(); App.closePalette();
      document.getElementById('branchPop').classList.add('hidden');
    }
  });

  // modal overlay click-out
  document.getElementById('modalOverlay').addEventListener('click', (e) => {
    if (e.target.id === 'modalOverlay') closeModal();
  });

  // bottom panel
  document.querySelectorAll('.panel-tab').forEach(t =>
    t.addEventListener('click', () => App.showPanelTab(t.dataset.panel)));
  document.getElementById('panelToggle').addEventListener('click', () => App.togglePanel());

  // status bar branch
  document.getElementById('statusBranch').addEventListener('click', App.toggleBranchPop);

  // companion
  document.getElementById('companionCollapse').addEventListener('click', Companion.toggle);
  document.getElementById('companionSend').addEventListener('click', () => {
    const i = document.getElementById('companionInput');
    Companion.ask(i.value); i.value = '';
  });
  document.getElementById('companionInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { Companion.ask(e.target.value); e.target.value = ''; }
  });
  document.getElementById('companionAgentBtn').addEventListener('click', () =>
    App.toast('Generation model: Claude', 'One real model powers generation in the MVP; other providers are represented in the router.'));

  // demo guide
  document.getElementById('demoGuideToggle').addEventListener('click', () => App.toggleDemoGuide());
  document.getElementById('demoGuideClose').addEventListener('click', () => App.toggleDemoGuide(false));

  // boot content
  App.setSection('home');
  App.openDashboard();
  App.renderStatus();
  App.renderPanelViews();
  App.togglePanel(true, 'terminal');
  App.term([
    { html: `<span class="t-dim">PMIDE 0.4 — the IDE rebuilt for product managers</span>` },
    { html: `<span class="t-dim">workspace: enterprise-sample-app · governance: enforced · agent: claude</span>`, delay: 200 },
  ]);
  setTimeout(() => {
    Companion.say(
      `Good morning, Jordan. I read the <b>2026-07-06 planning notes</b> you dropped in this morning — there's a billing decision in there that conflicts with approved context (<b>BR-104</b>). Want to import the session and review what I found?`,
      ['planning notes', 'business-rules.md'],
      [{ label: 'Import Planning Session', go: 'Flows.importPlanning()' }]
    );
  }, 900);
  App.renderDemoGuide();
  App.toggleDemoGuide(true);
}

document.addEventListener('DOMContentLoaded', init);
