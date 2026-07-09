/* ═══════════════════════════════════════════════════════════════
   PMIDE views — sidebar + editor renderers for every section.
   Pure render functions; state & wiring live in main.js / flows.js.
   ═══════════════════════════════════════════════════════════════ */

const Views = {};

/* ─────────── tiny helpers ─────────── */
function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function pillClass(status) {
  const map = {
    'Approved': 'approved', 'Draft': 'draft', 'Proposed': 'proposed',
    'In Review': 'in-review', 'Waiting for approval': 'waiting', 'Waiting for Approval': 'waiting',
    'Blocked': 'blocked', 'Superseded': 'superseded', 'Deprecated': 'deprecated',
    'Merged': 'merged', 'Completed': 'completed', 'Running': 'running', 'Failed': 'failed',
    'Review required': 'review-required', 'Enforced': 'approved', 'Needs review': 'needs-review',
    'Open': 'proposed',
  };
  return map[status] || 'draft';
}
function pill(status) { return `<span class="pill ${pillClass(status)}">${esc(status)}</span>`; }

function fileIcon(kind) {
  return { md: '▤', json: '{}', ts: 'TS', tsx: '⟨⟩', py: 'PY', dir: '' }[kind] || '▢';
}

/* ─────────── mini markdown renderer ─────────── */
function renderMd(text) {
  const lines = text.split('\n');
  let html = '', inCode = false, inList = false, inTable = false, tableRows = [];
  const closeList = () => { if (inList) { html += '</ul>'; inList = false; } };
  const flushTable = () => {
    if (!inTable) return;
    const [head, ...rows] = tableRows;
    html += '<table><thead><tr>' + head.map(c => `<th>${inline(c)}</th>`).join('') + '</tr></thead><tbody>';
    rows.forEach(r => { html += '<tr>' + r.map(c => `<td>${inline(c)}</td>`).join('') + '</tr>'; });
    html += '</tbody></table>';
    inTable = false; tableRows = [];
  };
  const inline = (s) => esc(s)
    .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
    .replace(/\*(.+?)\*/g, '<i>$1</i>')
    .replace(/`([^`]+)`/g, '<code>$1</code>');

  for (const raw of lines) {
    if (raw.startsWith('```')) {
      flushTable(); closeList();
      html += inCode ? '</code></pre>' : '<pre><code>';
      inCode = !inCode; continue;
    }
    if (inCode) { html += esc(raw) + '\n'; continue; }
    if (/^\|/.test(raw)) {
      closeList();
      const cells = raw.split('|').slice(1, -1).map(c => c.trim());
      if (/^[-\s|:]+$/.test(raw)) continue;
      inTable = true; tableRows.push(cells); continue;
    }
    flushTable();
    if (/^---\s*$/.test(raw)) { closeList(); html += '<hr>'; continue; }
    if (/^### /.test(raw)) { closeList(); html += `<h3>${inline(raw.slice(4))}</h3>`; continue; }
    if (/^## /.test(raw)) { closeList(); html += `<h2>${inline(raw.slice(3))}</h2>`; continue; }
    if (/^# /.test(raw)) { closeList(); html += `<h1>${inline(raw.slice(2))}</h1>`; continue; }
    if (/^> /.test(raw)) { closeList(); html += `<blockquote>${inline(raw.slice(2))}</blockquote>`; continue; }
    if (/^[-*] /.test(raw)) {
      if (!inList) { html += '<ul>'; inList = true; }
      html += `<li>${inline(raw.slice(2))}</li>`; continue;
    }
    if (/^\d+\. /.test(raw)) {
      if (!inList) { html += '<ul>'; inList = true; }
      html += `<li>${inline(raw.replace(/^\d+\. /, ''))}</li>`; continue;
    }
    closeList();
    if (raw.trim() === '') continue;
    html += `<p>${inline(raw)}</p>`;
  }
  closeList(); flushTable();
  if (inCode) html += '</code></pre>';
  return html;
}

/* ─────────── naive code highlighter ─────────── */
function highlightCode(text, lang) {
  const kw = /\b(import|export|from|function|return|const|let|var|if|else|type|interface|new|class|extends|async|await|for|of|in|def|print|not|and|or|True|False|None|describe|it|expect)\b/g;
  return text.split('\n').map((line, i) => {
    let h = esc(line);
    // order matters: comments swallow the rest
    if (/^\s*(\/\/|#)/.test(line) || /^\s*\*/.test(line) || /^\s*\/\*\*?/.test(line) || /^\s*"""/.test(line)) {
      h = `<span class="tok-cm">${h}</span>`;
    } else {
      h = h
        .replace(/(&quot;[^&]*?&quot;|&#39;[^&]*?&#39;|"[^"]*"|'[^']*')/g, '<span class="tok-str">$1</span>')
        .replace(kw, '<span class="tok-kw">$1</span>')
        .replace(/\b(\d[\d_.]*)\b/g, '<span class="tok-num">$1</span>')
        .replace(/\b([A-Z][A-Za-z0-9]+)\b/g, '<span class="tok-type">$1</span>')
        .replace(/\b([a-z][A-Za-z0-9]*)\(/g, '<span class="tok-fn">$1</span>(');
    }
    return `<div class="code-line"><span class="code-ln">${i + 1}</span><span class="code-text">${h}</span></div>`;
  }).join('');
}

/* ─────────── diff renderer ─────────── */
function renderDiffFile(d) {
  const rows = d.lines.map(l => {
    if (l.t === 'hunk') return `<div class="diff-line hunk">${esc(l.text)}</div>`;
    const cls = l.t === 'add' ? 'add' : l.t === 'del' ? 'del' : 'ctx';
    const sign = l.t === 'add' ? '+' : l.t === 'del' ? '−' : '';
    return `<div class="diff-line ${cls}">
      <span class="diff-gutter">${l.old ?? ''}</span>
      <span class="diff-gutter">${l.neu ?? ''}</span>
      <span class="diff-sign">${sign}</span>
      <span class="diff-code">${esc(l.text)}</span>
    </div>`;
  }).join('');
  return `<div class="diff-file">
    <div class="diff-file-head">
      <span class="grow">${esc(d.file)}${d.isNew ? ' <span class="pill safe" style="margin-left:6px">new file</span>' : ''}</span>
      <span class="diff-stat-add">+${d.add}</span><span class="diff-stat-del">−${d.del}</span>
    </div>
    <div class="diff-body">${rows}</div>
  </div>`;
}

/* ═══════════════ ACTIVITY BAR DEFINITION ═══════════════ */

const SECTIONS = [
  { id: 'home', label: 'Home', icon: 'M8 1.8 14 7v7h-4.4V9.8H6.4V14H2V7z' },
  { id: 'explorer', label: 'Explorer', icon: 'M3 2h5l1.5 1.5H13c.8 0 1.5.7 1.5 1.5v7c0 .8-.7 1.5-1.5 1.5H3c-.8 0-1.5-.7-1.5-1.5V3.5C1.5 2.7 2.2 2 3 2zm0 1.5v8.5h10V5H8.9L7.4 3.5z' },
  { id: 'context', label: 'Context Library', icon: 'M3.5 1.5h7L13 4v10.5H3.5zm6.5 1v2h2zM5 7h6v1.2H5zm0 2.5h6v1.2H5zM5 12h4v1.2H5z' },
  { id: 'workpackages', label: 'Work Packages', icon: 'M8 1.2 14.3 4.8v6.4L8 14.8 1.7 11.2V4.8zM3.2 5.7v4.6L7.25 12.6V8zm9.6 0L8.75 8v4.6l4.05-2.3zM8 2.9 4 5.1l4 2.3 4-2.3z' },
  { id: 'skills', label: 'Skills', icon: 'M8 .9l2 4.6 5 .5-3.8 3.3 1.1 4.9L8 11.6l-4.3 2.6 1.1-4.9L1 6l5-.5z' },
  { id: 'agentruns', label: 'Agent Runs', icon: 'M6 1.5h4V5h3.5v4H10v3.5H6V9H2.5V5H6zm1.5 1.5V6.5H4v1h3.5V11h1V7.5H12v-1H8.5V3z' },
  { id: 'scm', label: 'Source Control', icon: 'M5 3.2a1.8 1.8 0 1 1-3.6 0 1.8 1.8 0 0 1 3.6 0zm0 9.6a1.8 1.8 0 1 1-3.6 0 1.8 1.8 0 0 1 3.6 0zm9.6-9.6a1.8 1.8 0 1 1-3.6 0 1.8 1.8 0 0 1 3.6 0zM2.4 5v6h1.6V5zm9.6 0v1.4c0 1.6-1.3 2.9-2.9 2.9H7.5V7.7h1.6c.7 0 1.3-.6 1.3-1.3V5z' },
  { id: 'prs', label: 'Pull Requests', icon: 'M4.8 3a1.8 1.8 0 1 0-2.6 1.6v6.8a1.8 1.8 0 1 0 1.6 0V4.6c.6-.3 1-.9 1-1.6zM3 12.5a.8.8 0 1 1 0 1.6.8.8 0 0 1 0-1.6zm0-10.3a.8.8 0 1 1 0 1.6.8.8 0 0 1 0-1.6zM11.8 2 9 4.8h2v6.6a1.8 1.8 0 1 0 1.6 0V4.8h2zm.8 10.5a.8.8 0 1 1 0 1.6.8.8 0 0 1 0-1.6z' },
  { id: 'releases', label: 'Releases', icon: 'M8 1.5c2 0 4.5 1 5.5 2L9.8 7.2c.2.9 0 1.9-.8 2.6-.7.7-1.6 1-2.5.8L3 14 2 13l3.5-3.5c-.2-.9 0-1.8.8-2.5.7-.8 1.7-1 2.6-.8L12.5 2.5c-1-.6-2.9-1-4.5-1z' },
  { id: 'governance', label: 'Governance', icon: 'M8 1l5.8 2.1v4.2c0 3.7-2.4 6.9-5.8 8.2C4.6 14.2 2.2 11 2.2 7.3V3.1zM8 2.7 3.7 4.2v3.1c0 2.9 1.7 5.5 4.3 6.6 2.6-1.1 4.3-3.7 4.3-6.6V4.2zM7.2 9.4 5.4 7.6l-1 1 2.8 2.8 4.4-4.4-1-1z' },
];
// bottom items rendered separately
const SECTIONS_BOTTOM = [
  { id: 'terminal', label: 'Terminal', icon: 'M2 3h12v10H2zm1.5 1.5v7h9v-7zm1.6 1.2 2.3 2.3-2.3 2.3-.9-.9 1.4-1.4-1.4-1.4zM8 9.6h3v1.2H8z' },
  { id: 'settings', label: 'Settings', icon: 'M8 5.5A2.5 2.5 0 1 1 8 10.5 2.5 2.5 0 0 1 8 5.5zm0 1.3a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4zM6.9 1.3h2.2l.4 1.7c.4.1.8.3 1.1.6l1.7-.6 1.1 1.9-1.3 1.2c0 .2.1.4.1.6l1.4 1.2-1.1 1.9-1.7-.5c-.3.3-.7.5-1.1.6l-.4 1.7H6.9l-.4-1.7a4 4 0 0 1-1.1-.6l-1.7.5-1.1-1.9 1.3-1.2c0-.2-.1-.4-.1-.6L2.5 4.9l1.1-1.9 1.7.6c.3-.3.7-.5 1.1-.6z' },
];

/* ═══════════════ SIDEBARS ═══════════════ */

Views.sidebar = {};

Views.sidebar.explorer = function () {
  const walk = (nodes, depth, prefix) => nodes.map(n => {
    const path = prefix ? `${prefix}/${n.name}` : n.name;
    if (n.type === 'dir') {
      const open = state.openDirs.has(path);
      const changed = state.changes.some(c => c.file.startsWith(path + '/'));
      return `<div class="tree-item" style="padding-left:${8 + depth * 14}px" onclick="App.toggleDir('${path}')">
          <span class="twisty ${open ? 'open' : ''}">▶</span>
          <span class="ticon" style="color:#7a91b8">${open ? '▾' : '▸'}</span>
          <span class="${changed ? '' : ''}">${esc(n.name)}</span>
          ${changed ? '<span class="badge-m">●</span>' : ''}
        </div>` + (open ? walk(n.children, depth + 1, path) : '');
    }
    const ch = state.changes.find(c => c.file === path);
    return `<div class="tree-item ${state.activeFile === path ? 'active' : ''}" style="padding-left:${26 + depth * 14}px"
        onclick="App.openFile('${path}')">
        <span class="ticon" style="color:${{ md: '#8bb8f8', json: '#e8c477', ts: '#7fd6c2', tsx: '#c5a8f5', py: '#9fe0b8' }[n.kind] || '#9aa1ad'}">${fileIcon(n.kind)}</span>
        <span>${esc(n.name)}</span>
        ${ch ? `<span class="badge-${ch.status === 'A' ? 'a' : 'm'}">${ch.status}</span>` : ''}
      </div>`;
  }).join('');
  return { title: 'EXPLORER · ENTERPRISE-SAMPLE-APP', html: `<div style="padding-top:4px">${walk(App.currentTree(), 0, '')}</div>` };
};

Views.sidebar.context = function () {
  const cats = {};
  App.allContext().forEach(c => { (cats[c.category] = cats[c.category] || []).push(c); });
  let html = `
    <div style="padding:10px 12px 2px; display:flex; gap:6px; flex-wrap:wrap">
      <button class="btn primary sm" onclick="Flows.importPlanning()">Import Planning Session</button>
      <button class="btn ghost sm" onclick="Flows.newContextItem()">New Item</button>
    </div>`;
  Object.entries(cats).forEach(([cat, items]) => {
    html += `<div class="side-section-label">${esc(cat)}</div>`;
    items.forEach(c => {
      html += `<div class="side-card ${state.activeDetail === c.id ? 'active' : ''}" onclick="App.openContext('${c.id}')">
        <div class="side-card-title">${esc(c.title)}</div>
        <div class="side-card-meta">${pill(c.status)}
          <span>·</span><span>${esc(c.owner.split(' (')[0])}</span>
          <span>·</span><span>${esc(c.updated)}</span>
          ${c.freshness === 'stale' ? '<span class="pill needs-review">stale</span>' : ''}
        </div>
      </div>`;
    });
  });
  return { title: 'CONTEXT LIBRARY', html };
};

Views.sidebar.workpackages = function () {
  let html = `<div style="padding:10px 12px 2px; display:flex; gap:6px">
    <button class="btn primary sm" onclick="Flows.createWorkPackage()">Create Work Package</button>
  </div>`;
  const wps = App.allWPs();
  if (!wps.length) html += `<div class="empty-state"><div class="es-icon">▣</div>
    <div class="es-title">No work packages yet</div>
    <div class="es-sub">Generate one from planning notes and context, or start blank.</div></div>`;
  wps.forEach(w => {
    html += `<div class="side-card ${state.activeDetail === w.id ? 'active' : ''}" onclick="App.openWP('${w.id}')">
      <div class="side-card-title"><span class="mono-id">${w.id}</span>${esc(w.title)}</div>
      <div class="side-card-meta">${pill(w.status)} <span>·</span> <span>${esc(w.owner)}</span>
        ${w.pr ? `<span>·</span><span class="mono" style="font-size:10.5px">${w.pr}</span>` : ''}</div>
    </div>`;
  });
  return { title: 'WORK PACKAGES', html };
};

Views.sidebar.skills = function () {
  let html = `<div style="padding:10px 12px 2px"><button class="btn primary sm" onclick="Flows.createSkill()">Create Skill</button></div>`;
  App.allSkills().forEach(s => {
    html += `<div class="side-card ${state.activeDetail === s.id ? 'active' : ''}" onclick="App.openSkill('${s.id}')">
      <div class="side-card-title">${esc(s.name)}</div>
      <div class="side-card-meta">${pill(s.status)} <span>·</span> <span>${esc(s.owner.split(' (')[0])}</span>
        ${s.scripts ? '<span class="pill needs-review">script</span>' : ''}</div>
    </div>`;
  });
  return { title: 'SKILLS', html };
};

Views.sidebar.agentruns = function () {
  let html = `<div style="padding:10px 12px 2px"><button class="btn primary sm" onclick="Flows.routeToAgent()">Route to Agent</button></div>`;
  const runs = App.allRuns();
  if (!runs.length) html += `<div class="empty-state"><div class="es-title">No agent runs</div></div>`;
  runs.forEach(r => {
    html += `<div class="side-card ${state.activeDetail === r.id ? 'active' : ''}" onclick="App.openRun('${r.id}')">
      <div class="side-card-title"><span class="mono-id">${r.id}</span>${esc(r.agent)}</div>
      <div class="side-card-meta">${pill(r.status)} <span>·</span> <span class="grow" style="overflow:hidden;text-overflow:ellipsis">${esc(r.task)}</span></div>
    </div>`;
  });
  return { title: 'AGENT RUNS', html };
};

Views.sidebar.scm = function () {
  const changes = state.changes;
  let html = '';
  if (!state.onDraft) {
    html += `<div style="padding:12px 14px">
      <div class="callout warn" style="margin:0"><span class="co-icon">⛿</span>
        <div>You're on <b>main</b>, the protected shared branch. Start a <b>safe draft branch</b> to make changes.</div></div>
      <button class="btn safe" style="width:100%; justify-content:center; margin-top:10px" onclick="Flows.startSafeDraft()">Start Safe Draft</button>
    </div>`;
  } else {
    html += `<div style="padding:10px 14px 0">
      <div class="callout safe" style="margin:0 0 4px"><span class="co-icon">✓</span>
        <div><b>Safe draft branch.</b> Nothing changes in the shared product until this is reviewed and approved.</div></div>
    </div>`;
  }
  if (changes.length) {
    html += `<textarea class="scm-input" id="commitMsg" placeholder="Describe this saved version… (commit message)">${esc(state.suggestedCommitMsg || '')}</textarea>
      <div style="padding:0 10px; display:flex; gap:7px">
        <button class="btn primary sm" style="flex:1; justify-content:center" onclick="Flows.commit()">✓ Save Version <span class="dim" style="font-weight:400">· commit</span></button>
      </div>
      <div class="side-section-label" style="display:flex; justify-content:space-between">Changes <span>${changes.length}</span></div>`;
    changes.forEach(c => {
      const parts = c.file.split('/'); const fname = parts.pop();
      html += `<div class="scm-file" onclick="App.openFileDiff('${c.file}')">
        <span class="ticon" style="color:#8bb8f8">▤</span>
        <span class="fname">${esc(fname)}</span>
        <span class="fdir">${esc(parts.join('/'))}</span>
        <span class="scm-status ${c.status}">${c.status}</span>
      </div>`;
    });
  } else if (state.onDraft) {
    if (state.commits.length && !state.pushed) {
      html += `<div style="padding:8px 14px">
        <button class="btn safe" style="width:100%; justify-content:center" onclick="Flows.push()">↑ Share Draft <span style="font-weight:400; opacity:.75">· push</span></button>
        <div class="rail-note" style="margin-top:8px">Publishes your safe draft branch so the team can see and review it. Still nothing changes in the shared product.</div></div>`;
    } else if (state.pushed && !state.prContext) {
      html += `<div style="padding:8px 14px">
        <button class="btn primary" style="width:100%; justify-content:center" onclick="Flows.openPR()">⇄ Propose Change <span style="font-weight:400; opacity:.8">· pull request</span></button></div>`;
    } else {
      html += `<div class="empty-state"><div class="es-title">No local changes</div>
        <div class="es-sub">Accept a context update, create a skill, or generate a work package — changes will appear here.</div></div>`;
    }
  }
  if (state.commits.length) {
    html += `<div class="side-section-label">Saved versions on this branch</div>`;
    state.commits.forEach(c => {
      html += `<div class="side-item"><span class="mono" style="color:var(--text-faint); font-size:10.5px">${c.sha}</span>
        <span class="grow">${esc(c.msg)}</span></div>`;
    });
  }
  return { title: 'SOURCE CONTROL', html };
};

Views.sidebar.prs = function () {
  let html = '';
  const prs = App.allPRs();
  if (!prs.length) {
    html = `<div class="empty-state"><div class="es-icon">⇄</div>
      <div class="es-title">No open proposed changes</div>
      <div class="es-sub">When you propose a change (open a pull request), it shows up here for product and engineering review.</div></div>`;
  }
  prs.forEach(p => {
    html += `<div class="side-card ${state.activeDetail === p.id ? 'active' : ''}" onclick="App.openPRView('${p.id}')">
      <div class="side-card-title"><span class="mono-id">${p.number}</span>${esc(p.title)}</div>
      <div class="side-card-meta">${pill(p.status)} <span>·</span> <span>${esc(p.branch)}</span></div>
      <div class="side-card-meta" style="margin-top:4px">${p.reviews.map(r =>
        `<span class="pill ${r.done ? 'approved' : 'waiting'}">${esc(r.name)}</span>`).join(' ')}</div>
    </div>`;
  });
  return { title: 'PULL REQUESTS · PROPOSED CHANGES', html };
};

Views.sidebar.releases = function () {
  let html = `<div style="padding:10px 12px 2px"><button class="btn primary sm" onclick="Flows.generateReleaseStory()">Generate Release Story</button></div>`;
  App.allReleases().forEach(r => {
    html += `<div class="side-card ${state.activeDetail === r.id ? 'active' : ''}" onclick="App.openRelease('${r.id}')">
      <div class="side-card-title">${esc(r.title)}</div>
      <div class="side-card-meta"><span>${esc(r.date)}</span></div>
    </div>`;
  });
  return { title: 'RELEASES', html };
};

Views.sidebar.governance = function () {
  let html = `<div style="padding:10px 12px 4px" class="rail-note">Enterprise governance for this repo. Approvals, policies, and blocked actions.</div>`;
  App.allGov().forEach(g => {
    html += `<div class="side-card" onclick="App.openGovernance()">
      <div class="side-card-title">${esc(g.title)}</div>
      <div class="side-card-meta">${pill(g.state)}</div>
    </div>`;
  });
  html += `<div style="padding:10px 12px"><button class="btn ghost sm" onclick="App.openGovernance()">Open governance panel</button></div>`;
  return { title: 'GOVERNANCE', html };
};

/* ═══════════════ EDITOR VIEWS ═══════════════ */

/* ---------- Home dashboard ---------- */
Views.dashboard = function () {
  const s = state;
  const f = s.flow;
  const card = (title, icon, items, cta) => `
    <div class="dash-card">
      <div class="dash-card-head"><div class="dash-card-title">${icon}${title}</div>
      <span class="dash-count">${items.length}</span></div>
      ${items.length ? items.map(i => `
        <div class="dash-item" onclick="${i.go}">
          <span class="dash-item-dot" style="background:${i.color || 'var(--brand)'}"></span>
          <div><div class="dash-item-title">${i.title}</div><div class="dash-item-sub">${i.sub}</div></div>
        </div>`).join('') : `<div class="dash-empty">Nothing waiting.</div>`}
      ${cta ? `<span class="dash-cta" onclick="${cta.go}">${cta.label} →</span>` : ''}
    </div>`;

  const ctxItems = f.contextAccepted
    ? [{ title: 'BR-104 updated on your safe draft', sub: 'business-rules.md · awaiting proposal', go: "App.openContext('ctx-rules')", color: 'var(--safe)' }]
    : [{ title: 'Billing account status rule found in planning notes', sub: 'From 2026-07-06 planning session · not yet imported', go: 'Flows.importPlanning()', color: 'var(--warn)' }];

  const wpItems = f.wpCreated
    ? [{ title: 'WP-0042 · Enforce billing-status rule in account settings', sub: `Readiness 87 · ${f.routed ? 'routed to agents' : 'ready to route'}`, go: "App.openWP('WP-0042')", color: 'var(--safe)' }]
    : [{ title: 'Enforce billing-status rule in account settings', sub: 'Candidate from planning session — generate after context update', go: 'Flows.importPlanning()', color: 'var(--warn)' }];

  const runItems = App.allRuns().filter(r => r.status === 'Running' || r.status === 'Completed' && r.id === 'AR-0092')
    .map(r => ({ title: `${r.id} · ${r.agent}`, sub: r.task, go: `App.openRun('${r.id}')`, color: r.status === 'Running' ? 'var(--brand)' : 'var(--safe)' }));

  const prItems = App.allPRs().filter(p => p.status === 'Open' && p.needsProductReview)
    .map(p => ({ title: `${p.number} · ${p.title}`, sub: 'Waiting on product intent review', go: `App.openPRView('${p.id}')`, color: 'var(--warn)' }));

  const govItems = [{
    title: f.skillProposed ? '2 items in the approval queue' : '1 context change requires review before merge',
    sub: 'Billing is a high-risk category — product + risk approval required',
    go: 'App.openGovernance()', color: 'var(--danger)',
  }];

  const decisionItems = (f.contextAccepted
    ? [{ title: 'DR-0017 · Inactive accounts cannot update payment settings', sub: 'Captured today from planning session', go: "App.openFile('decisions/DR-0017-inactive-account-payment-settings.md')", color: 'var(--safe)' }]
    : []
  ).concat([{ title: 'DR-0016 · Guest checkout stays disabled for enterprise SKUs', sub: 'Approved · 2026-05-18', go: "App.openFile('decisions/DR-0016-checkout-guest-flow.md')" }]);

  const skillItems = f.skillProposed
    ? [{ title: 'Billing Domain Reviewer', sub: 'Proposed · risk approval pending (contains script)', go: "App.openSkill('skill-billing-reviewer')", color: 'var(--warn)' }]
    : [];

  const flowSteps = [
    ['Planning session', f.planningImported], ['Context update', f.contextAccepted],
    ['Safe draft branch', s.onDraft], ['Skill creation', f.skillCreated],
    ['Work Package', f.wpCreated], ['Agent routing', f.routed],
    ['Code change', f.codeReady], ['Product Intent Review', f.reviewed],
    ['GitHub PR', f.prOpenedInGitHub], ['Governed delivery', f.releaseStory],
  ];
  let nextFound = false;
  const flowHtml = flowSteps.map(([label, done], i) => {
    let cls = done ? 'done' : (!nextFound ? (nextFound = true, 'next') : '');
    return `<div class="flow-step ${cls}"><span class="flow-num">${done ? '✓' : i + 1}</span>${label}</div>` +
      (i < flowSteps.length - 1 ? '<span class="flow-arrow">→</span>' : '');
  }).join('');

  const svg = (d) => `<svg viewBox="0 0 16 16" width="13" height="13"><path fill="currentColor" d="${d}"/></svg>`;

  return `<div class="dash">
    <div class="dash-eyebrow">Today in your product workspace</div>
    <div class="dash-title">Good morning, Jordan</div>
    <div class="dash-sub">enterprise-sample-app · ${s.onDraft
      ? `you're on <span class="safe-word">safe-draft/billing-status-rule</span> — nothing changes in the shared product until it's reviewed`
      : `you're viewing <b>main</b>, the protected shared product`}</div>

    <div class="dash-grid">
      ${card('Context updates suggested', svg('M3.5 1.5h7L13 4v10.5H3.5zm6.5 1v2h2zM5 7h6v1.2H5zm0 2.5h6v1.2H5z'), ctxItems,
        f.contextAccepted ? null : { label: 'Import planning session', go: 'Flows.importPlanning()' })}
      ${card('Work packages', svg('M8 1.2 14.3 4.8v6.4L8 14.8 1.7 11.2V4.8z'), wpItems,
        f.wpCreated ? null : null)}
      ${card('Agent runs', svg('M6 1.5h4V5h3.5v4H10v3.5H6V9H2.5V5H6z'), runItems.length ? runItems : [],
        f.routed ? null : { label: 'Route work to an agent', go: 'Flows.routeToAgent()' })}
      ${card('Pull requests needing product review', svg('M4.8 3a1.8 1.8 0 1 0-2.6 1.6v6.8a1.8 1.8 0 1 0 1.6 0V4.6z'), prItems)}
      ${card('Skills pending approval', svg('M8 .9l2 4.6 5 .5-3.8 3.3 1.1 4.9L8 11.6l-4.3 2.6 1.1-4.9L1 6l5-.5z'), skillItems)}
      ${card('Governance', svg('M8 1l5.8 2.1v4.2c0 3.7-2.4 6.9-5.8 8.2C4.6 14.2 2.2 11 2.2 7.3V3.1z'), govItems)}
      ${card('Recent decisions', svg('M8 1.5a6.5 6.5 0 1 1 0 13 6.5 6.5 0 0 1 0-13zM7 9.9 4.9 7.8l-1 1L7 11.9l5-5-1-1z'), decisionItems)}
    </div>

    <div class="dash-flow">
      <div class="dash-flow-title">The operating flow this workspace is built around</div>
      <div class="flow-steps">${flowHtml}</div>
    </div>
  </div>`;
};

/* ---------- File viewer ---------- */
Views.file = function (path) {
  const f = App.getFile(path);
  if (!f) return `<div class="empty-state"><div class="es-title">File not found</div></div>`;
  if (f.lang === 'md') {
    return `<div style="display:flex; justify-content:flex-end; padding:10px 22px 0">
        <button class="btn ghost sm" onclick="App.toggleRaw('${path}')">${state.rawView[path] ? 'Rendered view' : 'View raw Markdown'}</button>
      </div>` + (state.rawView[path]
        ? `<div class="code-view">${highlightCode(f.text, 'md')}</div>`
        : `<div class="md-render">${renderMd(f.text)}</div>`);
  }
  return `<div class="code-view">${highlightCode(f.text, f.lang)}</div>`;
};

/* ---------- Context detail ---------- */
Views.contextDetail = function (id) {
  const c = App.allContext().find(x => x.id === id);
  if (!c) return '';
  const isBilling = c.id === 'ctx-rules';
  const updatedOnDraft = isBilling && state.flow.contextAccepted;
  const rules = (c.rules || []).map(r => {
    const isChanged = updatedOnDraft && r.id === 'BR-104';
    return `<li>${isChanged
      ? `<b>${r.id}</b> — Payment settings can be updated only by authenticated users whose account status is <b>active</b>. <span class="pill safe">updated on draft</span>`
      : `<b>${r.id}</b> — ${esc(r.text)}`}</li>`;
  }).join('');
  return `<div class="detail-split">
    <div class="detail-main">
      <div class="doc-topline">${pill(updatedOnDraft ? 'In Review' : c.status)}<span class="pill cat">${esc(c.category)}</span>
        ${c.freshness === 'stale' ? '<span class="pill needs-review">stale — review recommended</span>' : ''}</div>
      <div class="doc-title">${esc(c.title)}</div>
      <div class="doc-meta-row"><span>Owner <b>${esc(c.owner)}</b></span><span>Updated <b>${updatedOnDraft ? 'today (on safe draft)' : esc(c.updated)}</b></span>
        <span>Used by agents <b>${c.agentUsage}×</b> this quarter</span></div>
      <div class="doc-actions">
        ${isBilling && !state.flow.contextAccepted ? `<button class="btn primary sm" onclick="Flows.importPlanning()">Import Planning Session</button>` : ''}
        ${updatedOnDraft ? `<button class="btn ghost sm" onclick="App.openFileDiff('context/business-rules.md')">Compare to main</button>` : ''}
        <button class="btn ghost sm" onclick="App.openFile('${c.file}')">Open file</button>
        <button class="btn ghost sm" onclick="App.openFile('${c.file}', true)">View raw Markdown</button>
      </div>
      <h2 class="sec">Summary</h2>
      <p class="body">${esc(c.summary)}</p>
      ${c.rules ? `<h2 class="sec">Rules</h2><ul class="plain">${rules}</ul>` : ''}
      ${updatedOnDraft && isBilling ? `
        <h2 class="sec">Change on this draft</h2>
        <div class="ba-diff">
          <div class="ba-col before"><div class="ba-label">Before — on main</div>${esc(DATA.contextDiff.before)}</div>
          <div class="ba-col after"><div class="ba-label">After — on your draft</div>${esc(DATA.contextDiff.after)}</div>
        </div>` : ''}
      ${isBilling && !state.flow.contextAccepted && state.flow.planningImported ? `
        <div class="callout warn"><span class="co-icon">△</span><div><b>Conflict detected.</b> The planning session on 2026-07-06 proposed a rule that conflicts with BR-104. Import the planning session to review and accept the update.</div></div>` : ''}
    </div>
    <div class="detail-rail">
      <div class="rail-card"><div class="rail-title">Governance</div>
        <div class="rail-note">${esc(c.governance)}</div></div>
      <div class="rail-card"><div class="rail-title">Source of truth</div>
        <a class="rail-link" onclick="App.openFile('${c.file}')">${esc(c.file)}</a>
        <div class="rail-note mt8">This object is a friendly view of a version-controlled Markdown file. The file is the durable source of truth.</div></div>
      <div class="rail-card"><div class="rail-title">Linked</div>
        ${c.linkedDecisions.length ? c.linkedDecisions.map(d => `<a class="rail-link" onclick="App.openFile('decisions/DR-0016-checkout-guest-flow.md')">${d} — decision</a>`).join('') : ''}
        ${c.linkedWPs.length ? c.linkedWPs.map(w => `<a class="rail-link" onclick="App.openWP('WP-0038')">${w} — work package</a>`).join('') : ''}
        ${updatedOnDraft ? `<a class="rail-link" onclick="App.openFile('decisions/DR-0017-inactive-account-payment-settings.md')">DR-0017 — decision (new)</a>
          <a class="rail-link" onclick="App.openWP('WP-0042')">WP-0042 — work package</a>` : ''}
        ${!c.linkedDecisions.length && !c.linkedWPs.length && !updatedOnDraft ? '<div class="rail-note">No linked artifacts.</div>' : ''}
      </div>
    </div>
  </div>`;
};

/* ---------- Work Package detail ---------- */
Views.wpDetail = function (id) {
  const w = App.allWPs().find(x => x.id === id);
  if (!w) return '';
  const isNew = w.id === 'WP-0042';
  const li = arr => arr.map(a => `<li>${esc(a)}</li>`).join('');
  return `<div class="detail-split">
    <div class="detail-main">
      <div class="doc-topline"><span class="doc-id">${w.id}</span>${pill(w.status)}
        ${w.branch ? `<span class="pill safe">⌥ ${esc(w.branch)}</span>` : ''}</div>
      <div class="doc-title">${esc(w.title)}</div>
      <div class="doc-meta-row"><span>Owner <b>${esc(w.owner)}</b></span><span>Updated <b>${esc(w.updated)}</b></span>
        ${w.pr ? `<span>PR <b>${esc(w.pr)}</b></span>` : ''}</div>
      <div class="doc-actions">
        ${isNew && !state.flow.routed ? `<button class="btn primary sm" onclick="Flows.routeToAgent()">Route to Agent</button>` : ''}
        ${isNew && state.flow.codeReady && !state.flow.reviewed ? `<button class="btn primary sm" onclick="Flows.reviewIntent()">Review Product Intent</button>` : ''}
        <button class="btn ghost sm" onclick="Flows.askCompanionAbout('work package ${w.id}')">Ask Companion</button>
        <button class="btn ghost sm" onclick="App.openFile('work-packages/${w.id}-${w.slug}/work-package.md')">Open files</button>
      </div>

      <h2 class="sec">Goal</h2><p class="body">${esc(w.goal)}</p>
      <h2 class="sec">Problem statement</h2><p class="body">${esc(w.problem)}</p>
      <h2 class="sec">Acceptance signals</h2><ul class="plain checks">${w.acceptance.map(a =>
        `<li><span class="ck ok">✓</span>${esc(a)}</li>`).join('')}</ul>
      <h2 class="sec">Non-goals</h2><ul class="plain">${li(w.nonGoals)}</ul>
      <h2 class="sec">Agent instructions</h2><p class="body mono" style="font-size:12px; background:var(--bg-inset); border:1px solid var(--border-soft); border-radius:6px; padding:12px 14px">${esc(w.agentInstructions)}</p>
      <h2 class="sec">Risk controls</h2><ul class="plain">${li(w.risks)}</ul>
      <h2 class="sec">Test expectations</h2><ul class="plain">${li(w.tests)}</ul>
      <h2 class="sec">Review plan</h2><ul class="plain">${li(w.reviewPlan)}</ul>
    </div>
    <div class="detail-rail">
      <div class="rail-card"><div class="rail-title">Work readiness <span class="sim-tag" style="float:right">simulated</span></div>
        <div class="readiness"><div class="readiness-bar"><div class="readiness-fill" style="width:${w.readiness}%"></div></div>
        <span class="readiness-num">${w.readiness}</span></div>
        <div class="rail-note mt8">Goal, acceptance signals, non-goals, and risk controls present. Add suspended-status detail to reach 95+.</div></div>
      <div class="rail-card"><div class="rail-title">Context used</div>
        ${w.contextUsed.map(c => `<div class="rail-note" style="padding:3px 0">▸ ${esc(c)}</div>`).join('')}
        <button class="btn ghost sm mt8" onclick="App.toast('Context sources are managed in the Context Library.','Open the Context Library to add or remove sources.')">Add context source</button></div>
      <div class="rail-card"><div class="rail-title">Decisions used</div>
        ${w.decisionsUsed.length ? w.decisionsUsed.map(d => `<div class="rail-note" style="padding:3px 0">▸ ${esc(d)}</div>`).join('') : '<div class="rail-note">None linked.</div>'}</div>
      <div class="rail-card"><div class="rail-title">Trace</div>
        <div class="rail-row"><span>Branch</span><b>${w.branch ? esc(w.branch) : '—'}</b></div>
        <div class="rail-row"><span>Issue</span><b>${state.flow.routed && isNew ? '#341 (generated)' : '—'}</b></div>
        <div class="rail-row"><span>PR</span><b>${w.pr || (isNew && state.flow.codeReady ? '#128' : '—')}</b></div>
        <div class="rail-row"><span>Agent runs</span><b>${(w.runs || []).length + (isNew && state.flow.routed ? 1 : 0)}</b></div></div>
    </div>
  </div>`;
};

/* ---------- Skill detail ---------- */
Views.skillDetail = function (id) {
  const s = App.allSkills().find(x => x.id === id);
  if (!s) return '';
  const isNew = s.id === 'skill-billing-reviewer';
  return `<div class="detail-split">
    <div class="detail-main">
      <div class="doc-topline">${pill(s.status)}${s.scripts ? '<span class="pill needs-review">contains script</span>' : ''}</div>
      <div class="doc-title">${esc(s.name)}</div>
      <div class="doc-meta-row"><span>Owner <b>${esc(s.owner)}</b></span><span>Updated <b>${esc(s.updated)}</b></span>
        <span>Used <b>${s.usage}×</b></span></div>
      <div class="doc-actions">
        ${isNew ? `<button class="btn ghost sm" onclick="Flows.showSkillScan()">Validation report</button>` : ''}
        <button class="btn ghost sm" onclick="App.openFile('${s.files[0]}')">View raw files</button>
        ${isNew && state.flow.skillProposed ? `<button class="btn warn-ghost sm" onclick="App.openGovernance()">Approval pending — governance</button>` : ''}
      </div>
      <h2 class="sec">Purpose</h2><p class="body">${esc(s.purpose)}</p>
      <h2 class="sec">When agents use it</h2><p class="body">${esc(s.trigger)}</p>
      <h2 class="sec">Inputs</h2><ul class="plain">${s.inputs.map(i => `<li>${esc(i)}</li>`).join('')}</ul>
      <h2 class="sec">Output</h2><p class="body">${esc(s.output)}</p>
      <h2 class="sec">Security & permissions</h2>
      <div class="callout ${s.scripts ? 'warn' : 'safe'}"><span class="co-icon">${s.scripts ? '⚠' : '✓'}</span>
        <div>${esc(s.approval)}${s.scripts ? ' Scripts never run without an explicit approval.' : ''}</div></div>
      <h2 class="sec">Compatible agents</h2>
      <p class="body">${s.agents.map(a => `<span class="pill cat">${esc(a)}</span>`).join(' ')}</p>
    </div>
    <div class="detail-rail">
      <div class="rail-card"><div class="rail-title">Files</div>
        ${s.files.map(f => `<a class="rail-link" onclick="App.openFile('${f}')">${esc(f.replace('skills/' + s.slug + '/', ''))}</a>`).join('')}
        <div class="rail-note mt8">The skill folder is the source of truth — a friendly view of real repo files.</div></div>
      <div class="rail-card"><div class="rail-title">Governance</div>
        <div class="rail-row"><span>Status</span><b>${esc(s.status)}</b></div>
        <div class="rail-row"><span>Scripts</span><b>${s.scripts ? 'Yes — approval required' : 'None'}</b></div>
        <div class="rail-row"><span>Sensitive domain</span><b>${isNew ? 'Billing' : 'No'}</b></div></div>
    </div>
  </div>`;
};

/* ---------- Agent run detail ---------- */
Views.runDetail = function (id) {
  const r = App.allRuns().find(x => x.id === id);
  if (!r) return '';
  return `<div class="detail-split">
    <div class="detail-main">
      <div class="doc-topline"><span class="doc-id">${r.id}</span>${pill(r.status)}
        ${r.simulated ? '<span class="sim-tag">SIMULATED RUN</span>' : ''}</div>
      <div class="doc-title">${esc(r.task)}</div>
      <div class="doc-meta-row"><span>Agent <b>${esc(r.agent)}</b></span><span>Initiated by <b>${esc(r.user)}</b></span>
        <span>Started <b>${esc(r.started)}</b></span></div>
      <div class="doc-actions">
        ${r.pr ? `<button class="btn primary sm" onclick="App.openPRView('${r.pr === '#128' ? 'pr-128' : 'pr-121'}')">Open linked PR ${r.pr}</button>` : ''}
        ${r.id === 'AR-0092' && state.flow.codeReady ? `<button class="btn ghost sm" onclick="App.openCodeDiff()">Compare changes</button>` : ''}
      </div>
      <h2 class="sec">Context sent to the agent</h2>
      <ul class="plain">${r.context.map(c => `<li class="mono" style="font-size:12px">${esc(c)}</li>`).join('')}</ul>
      <h2 class="sec">Skill used</h2><p class="body">${r.skill ? `<span class="pill cat">${esc(r.skill)}</span>` : 'None'}</p>
      <h2 class="sec">Files changed</h2>
      <ul class="plain">${r.files.map(f => `<li class="mono" style="font-size:12px">${esc(f)}</li>`).join('')}</ul>
      <h2 class="sec">Commands run</h2>
      <ul class="plain">${r.commands.map(c => `<li class="mono" style="font-size:12px">${esc(c)}</li>`).join('')}</ul>
      <h2 class="sec">Errors</h2><p class="body">${esc(r.errors)}</p>
      <h2 class="sec">Human approvals</h2>
      <ul class="plain">${r.approvals.map(a => `<li>${esc(a)}</li>`).join('')}</ul>
    </div>
    <div class="detail-rail">
      <div class="rail-card"><div class="rail-title">Trace</div>
        <div class="rail-row"><span>Branch</span><b class="mono" style="font-size:10.5px">${esc(r.branch)}</b></div>
        <div class="rail-row"><span>PR</span><b>${r.pr || '—'}</b></div>
        <div class="rail-row"><span>Status</span><b>${esc(r.status)}</b></div></div>
      <div class="rail-card"><div class="rail-title">Why runs are recorded</div>
        <div class="rail-note">Every AI execution is traceable: who asked, what context it saw, which skill it used, and what changed. Product, engineering, and risk can audit any run.</div></div>
    </div>
  </div>`;
};

/* ---------- PR view (with product intent review) ---------- */
Views.prView = function (id) {
  const p = App.allPRs().find(x => x.id === id);
  if (!p) return '';
  if (p.id === 'pr-128') return Views.reviewPacket(p);
  return `<div class="detail-split">
    <div class="detail-main">
      <div class="doc-topline"><span class="doc-id">${p.number}</span>${pill(p.status)}
        <span class="pill safe">⌥ ${esc(p.branch)}</span> <span class="dim">→ main</span></div>
      <div class="doc-title">${esc(p.title)}</div>
      <div class="doc-meta-row"><span>Opened by <b>${esc(p.author)}</b></span><span><b>${p.files.length}</b> files changed</span></div>
      <div class="doc-actions">
        <button class="btn ghost sm" onclick="Flows.openInGitHub('${p.number}')">Open in GitHub ↗</button>
      </div>
      <h2 class="sec">Summary</h2><p class="body">${esc(p.summary)}</p>
      <h2 class="sec">Why</h2><p class="body">${esc(p.why)}</p>
      <h2 class="sec">Linked</h2>
      <ul class="plain">${p.linked.map(l => `<li>${esc(l)}</li>`).join('')}</ul>
      <h2 class="sec">Files changed</h2>
      ${p.diff ? p.diff.map(renderDiffFile).join('') :
        `<ul class="plain">${p.files.map(f => `<li class="mono" style="font-size:12px">${esc(f)}</li>`).join('')}</ul>`}
      <h2 class="sec">Risk notes</h2><p class="body">${esc(p.riskNotes)}</p>
    </div>
    <div class="detail-rail">
      <div class="rail-card"><div class="rail-title">Required reviews</div>
        ${p.reviews.map(r => `<div class="rail-row"><span>${esc(r.name)}</span><b style="color:${r.done ? 'var(--ok)' : 'var(--warn)'}">${r.done ? '✓ approved' : 'waiting'}</b></div>`).join('')}
        <div class="rail-note mt8">Merging needs every required review. PMIDE never bypasses engineering review.</div></div>
    </div>
  </div>`;
};

/* ---------- Product Intent Review packet ---------- */
Views.reviewPacket = function (p) {
  const rp = DATA.reviewPacket;
  const decided = state.flow.intentDecision;
  return `<div class="detail-split">
    <div class="detail-main">
      <div class="doc-topline"><span class="doc-id">${rp.pr}</span>${pill(p.status)}
        <span class="pill safe">⌥ agent/wp-0042-implementation</span><span class="pill info">Product Intent Review</span></div>
      <div class="doc-title">${esc(rp.prTitle)}</div>
      <div class="doc-meta-row"><span>Agent <b>Copilot (simulated)</b></span><span>Run <b>AR-0092</b></span>
        <span>Work package <b>WP-0042</b></span></div>

      <div class="intent-score" style="--ring:${rp.ring}%">
        <div class="intent-ring">${rp.ring}%</div>
        <div><div class="intent-score-label">Intent match: ${rp.intent}</div>
        <div class="intent-score-sub">The change substantially satisfies the work package. You review product intent — engineers still review the code.</div></div>
      </div>

      <h2 class="sec">Satisfied</h2>
      <ul class="plain checks">${rp.satisfied.map(s => `<li><span class="ck ok">✓</span>${esc(s)}</li>`).join('')}</ul>
      <h2 class="sec">Needs review</h2>
      <ul class="plain checks">${rp.needsReview.map(s => `<li><span class="ck warn">!</span>${esc(s)}</li>`).join('')}</ul>
      <h2 class="sec">Non-goal check</h2>
      <div class="callout safe"><span class="co-icon">✓</span><div>${esc(rp.nonGoalCheck)}</div></div>
      <h2 class="sec">Changed areas — in product language</h2>
      <ul class="plain">${rp.changedAreas.map(a =>
        `<li>${esc(a.area)} <span class="mono dim" style="font-size:11px">· ${esc(a.file)}</span></li>`).join('')}</ul>
      <h2 class="sec">Risks</h2>
      <ul class="plain checks">${rp.risks.map(s => `<li><span class="ck warn">△</span>${esc(s)}</li>`).join('')}</ul>
      <h2 class="sec">Questions for reviewers</h2>
      <p class="body"><b>Engineering:</b> ${esc(rp.questions.engineering[0])}</p>
      <p class="body"><b>Risk:</b> ${esc(rp.questions.risk[0])}</p>
      <h2 class="sec">Recommended action <span class="sim-tag">simulated</span></h2>
      <div class="callout warn"><span class="co-icon">→</span><div>${esc(rp.recommendation)}</div></div>

      <h2 class="sec">Code diff</h2>
      <p class="body dim" style="font-size:12px">The real diff, for when you want to look under the product summary.</p>
      ${DATA.codeDiff.map(renderDiffFile).join('')}
    </div>
    <div class="detail-rail">
      <div class="rail-card"><div class="rail-title">Your decision</div>
        ${decided ? `<div class="callout ${decided === 'approved' ? 'safe' : 'warn'}" style="margin:0"><span class="co-icon">${decided === 'approved' ? '✓' : '↻'}</span>
          <div>${decided === 'approved' ? '<b>Product intent approved.</b> Sent to engineering review.' : '<b>Agent revision requested.</b> Copilot will extend test coverage to all inactive statuses.'}</div></div>`
        : `<button class="btn safe" style="width:100%; justify-content:center; margin-bottom:7px" onclick="Flows.decideIntent('approved')">Approve Product Intent</button>
          <button class="btn warn-ghost" style="width:100%; justify-content:center; margin-bottom:7px" onclick="Flows.decideIntent('revision')">Request Agent Revision</button>
          <button class="btn ghost" style="width:100%; justify-content:center; margin-bottom:7px" onclick="Flows.decideIntent('engineer')">Send to Engineer Review</button>
          <button class="btn danger-ghost" style="width:100%; justify-content:center" onclick="Flows.decideIntent('risk')">Escalate to Risk Review</button>`}
        <button class="btn ghost sm" style="width:100%; justify-content:center; margin-top:10px" onclick="Flows.openInGitHub('#128')">Open in GitHub ↗</button></div>
      <div class="rail-card"><div class="rail-title">Acceptance signals</div>
        ${App.allWPs().find(w => w.id === 'WP-0042').acceptance.map((a, i) =>
          `<div class="rail-note" style="padding:3px 0">${i === 4 ? '<span style="color:var(--warn)">◐</span>' : '<span style="color:var(--ok)">●</span>'} ${esc(a)}</div>`).join('')}</div>
      <div class="rail-card"><div class="rail-title">Required reviews</div>
        <div class="rail-row"><span>Product intent</span><b style="color:${decided ? 'var(--ok)' : 'var(--warn)'}">${decided ? '✓ done' : 'you, now'}</b></div>
        <div class="rail-row"><span>Engineering code</span><b style="color:var(--warn)">waiting</b></div>
        <div class="rail-row"><span>Risk (billing)</span><b style="color:var(--warn)">waiting</b></div></div>
    </div>
  </div>`;
};

/* ---------- Code diff tab ---------- */
Views.codeDiff = function () {
  return `<div class="doc">
    <div class="doc-topline"><span class="pill safe">⌥ agent/wp-0042-implementation</span><span class="dim">Compare changes vs. main</span></div>
    <div class="doc-title">Implementation diff — WP-0042</div>
    <div class="doc-meta-row"><span><b>4</b> files changed</span><span style="color:var(--ok)">+55</span><span style="color:var(--danger)">−3</span>
      <span class="sim-tag">GENERATED BY SIMULATED AGENT RUN AR-0092</span></div>
    <div class="callout info"><span class="co-icon">ℹ</span><div><b>Product summary:</b> payment settings become read-only for inactive accounts behind the billing-safeguards flag; a restriction banner explains why and links to reactivation help; saved payment methods are untouched; a new test covers the permission gate; support copy is drafted.</div></div>
    ${DATA.codeDiff.map(renderDiffFile).join('')}
  </div>`;
};

/* ---------- Single-file friendly diff (context etc.) ---------- */
Views.fileDiff = function (path) {
  if (path === 'context/business-rules.md') {
    return `<div class="doc">
      <div class="doc-topline"><span class="pill safe">⌥ safe-draft/billing-status-rule</span><span class="dim">Compare changes vs. main</span></div>
      <div class="doc-title">business-rules.md — what changed</div>
      <h2 class="sec">Plain-language change</h2>
      <div class="ba-diff">
        <div class="ba-col before"><div class="ba-label">Before — on main</div>${esc(DATA.contextDiff.before)}</div>
        <div class="ba-col after"><div class="ba-label">After — on your draft</div>${esc(DATA.contextDiff.after)}</div>
      </div>
      <h2 class="sec">Impacted areas</h2>
      <ul class="plain">${DATA.contextDiff.impacted.map(i => `<li>${esc(i)}</li>`).join('')}</ul>
      <h2 class="sec">Raw diff</h2>
      ${renderDiffFile({
        file: 'context/business-rules.md', add: 2, del: 1, lines: [
          { t: 'hunk', text: '@@ -3,4 +3,5 @@ ## BR-104 — Payment settings access' },
          { t: 'del', old: 4, text: 'Payment settings can be updated by authenticated users.' },
          { t: 'add', neu: 4, text: 'Payment settings can be updated only by authenticated users whose' },
          { t: 'add', neu: 5, text: 'account status is active. (DR-0017, 2026-07-06)' },
        ]
      })}
    </div>`;
  }
  const f = App.getFile(path);
  const isNew = state.changes.find(c => c.file === path && c.status === 'A');
  if (f && isNew) {
    const lines = f.text.split('\n').map((l, i) => ({ t: 'add', neu: i + 1, text: l }));
    return `<div class="doc">
      <div class="doc-topline"><span class="pill safe">⌥ ${esc(state.branch)}</span><span class="dim">New file on this draft</span></div>
      <div class="doc-title">${esc(path.split('/').pop())}</div>
      ${renderDiffFile({ file: path, add: lines.length, del: 0, isNew: true, lines: [{ t: 'hunk', text: `@@ -0,0 +1,${lines.length} @@ (new file)` }, ...lines] })}
    </div>`;
  }
  return Views.file(path);
};

/* ---------- Release story ---------- */
Views.releaseDetail = function (id) {
  const r = App.allReleases().find(x => x.id === id);
  if (!r) return '';
  return `<div class="detail-split">
    <div class="detail-main">
      <div class="doc-topline"><span class="pill approved">Release story</span><span class="dim">${esc(r.date)}</span></div>
      <div class="doc-title">${esc(r.title)}</div>
      <div class="doc-actions">
        <button class="btn ghost sm" onclick="App.toast('Copied for stakeholders.','Business-readable summary copied to clipboard (simulated).')">Copy for stakeholders</button>
      </div>
      <h2 class="sec">What changed</h2><p class="body">${esc(r.what)}</p>
      <h2 class="sec">Why it changed</h2><p class="body">${esc(r.why)}</p>
      <h2 class="sec">Who is affected</h2><p class="body">${esc(r.affected)}</p>
      <h2 class="sec">Customer impact</h2><p class="body">${esc(r.impact)}</p>
      <h2 class="sec">Support notes</h2><p class="body">${esc(r.support)}</p>
      <h2 class="sec">Risk notes</h2><p class="body">${esc(r.risk)}</p>
    </div>
    <div class="detail-rail">
      <div class="rail-card"><div class="rail-title">Links</div>
        ${r.links.map(l => `<div class="rail-note" style="padding:3px 0">▸ ${esc(l)}</div>`).join('')}</div>
      <div class="rail-card"><div class="rail-title">Source file</div>
        <a class="rail-link">${esc(r.file)}</a></div>
    </div>
  </div>`;
};

/* ---------- Governance panel ---------- */
Views.governance = function () {
  return `<div class="doc" style="max-width:1000px">
    <div class="doc-topline"><span class="pill approved">Governance: Enforced</span><span class="sim-tag">APPROVAL BACKEND SIMULATED</span></div>
    <div class="doc-title">Governance</div>
    <p class="body dim">Approvals, policies, blocked actions, and the audit trail for enterprise-sample-app.</p>

    <h2 class="sec">Checks on your current branch</h2>
    ${App.allGov().map(g => `<div class="gov-row">
      <span class="gov-icon">${g.icon}</span>
      <div class="gov-main"><div class="gov-title">${esc(g.title)}</div>
        <div class="gov-sub">${esc(g.sub)}</div>
        <div class="gov-sub" style="margin-top:5px; color:var(--info)">${esc(g.policy)}</div></div>
      <div class="gov-side">${pill(g.state)}<span class="dim" style="font-size:11px">${esc(g.who)}</span></div>
    </div>`).join('')}

    <h2 class="sec">Who must approve what</h2>
    <div class="md-render" style="padding:0; max-width:none">
    <table><thead><tr><th>Artifact</th><th>Required approver</th></tr></thead><tbody>
      ${DATA.governanceApprovalMatrix.map(m => `<tr><td>${esc(m.artifact)}</td><td>${esc(m.approver)}</td></tr>`).join('')}
    </tbody></table></div>

    <h2 class="sec">Audit trail</h2>
    ${state.audit.map(a => `<div class="audit-row"><span class="audit-time">${esc(a.time)}</span>
      <span class="audit-user">${esc(a.user)}</span><span class="audit-what">${esc(a.what)}</span>
      <span class="audit-ref">${esc(a.ref)}</span></div>`).join('')}
  </div>`;
};

/* ---------- Settings ---------- */
Views.settings = function () {
  return `<div class="doc" style="max-width:820px">
    <div class="doc-title">Settings</div>
    <p class="body dim">Enterprise configuration for this workspace. Most controls are placeholders in this MVP — they show where the capability lives.</p>
    <h2 class="sec">Role-based layout</h2>
    <div class="choice-grid">
      ${['Product Manager', 'Engineering Lead', 'Developer', 'Governance Reviewer'].map(r =>
        `<button class="choice-card ${state.role === r ? 'selected' : ''}" onclick="App.setRole('${r}')">
          <div class="choice-title">${r}</div>
          <div class="choice-sub">${{
            'Product Manager': 'Context, work packages, skills, and product review up front.',
            'Engineering Lead': 'Source control, PRs, work-package review, agent oversight.',
            'Developer': 'Explorer, terminal, tests, diffs — the classic IDE surface.',
            'Governance Reviewer': 'Approval queue, policies, audit trail, blocked actions.',
          }[r]}</div>
        </button>`).join('')}
    </div>
    <h2 class="sec">Agent connections</h2>
    <div class="choice-grid">
      ${DATA.agents.filter(a => a.id !== 'human').map(a => `<div class="choice-card ${a.real ? 'selected' : 'disabled'}">
        <div class="choice-title"><span class="agent-avatar" style="width:20px;height:20px;font-size:10px;border-radius:5px;background:${a.color}">${a.name[0]}</span>
        ${a.name}${a.real ? '' : '<span class="sim-tag">SIMULATED</span>'}</div>
        <div class="choice-sub">${a.real ? 'Connected — used for generation in this demo.' : 'Visible in the router; execution simulated in MVP.'}</div>
      </div>`).join('')}
    </div>
    <h2 class="sec">Enterprise connectors <span class="sim-tag">UI ONLY IN MVP</span></h2>
    <div class="choice-grid">
      ${['Jira', 'Confluence', 'Slack', 'Teams', 'SharePoint', 'Figma', 'ServiceNow', 'Data catalog'].map(c =>
        `<div class="choice-card disabled"><div class="choice-title">${c}</div><div class="choice-sub">Planned via MCP / enterprise connector.</div></div>`).join('')}
    </div>
    <h2 class="sec">Git terms, in product language</h2>
    <div class="md-render" style="padding:0; max-width:none">
    <table><thead><tr><th>Git term</th><th>PMIDE assisted label</th></tr></thead><tbody>
      ${DATA.gitLabels.map(g => `<tr><td class="mono" style="font-size:12px">${g.git}</td><td>${g.pm}</td></tr>`).join('')}
    </tbody></table></div>
  </div>`;
};
