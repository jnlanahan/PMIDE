/* ═══════════════════════════════════════════════════════════════
   PMIDE flows — the interactive golden-demo machinery.
   Modals, wizards, git workflow, agent routing, intent review.
   ═══════════════════════════════════════════════════════════════ */

const Flows = {};

/* ─────────── modal infrastructure ─────────── */
function openModal(html, size = '') {
  const ov = document.getElementById('modalOverlay');
  const box = document.getElementById('modalBox');
  box.className = 'modal ' + size;
  box.innerHTML = html;
  ov.classList.remove('hidden');
}
function closeModal() {
  document.getElementById('modalOverlay').classList.add('hidden');
}
function modalShell({ title, sub, body, foot }) {
  return `
    <div class="modal-head">
      <div><div class="modal-title">${title}</div>${sub ? `<div class="modal-sub">${sub}</div>` : ''}</div>
      <button class="icon-btn" onclick="closeModal()" title="Close">✕</button>
    </div>
    <div class="modal-body">${body}</div>
    ${foot ? `<div class="modal-foot">${foot}</div>` : ''}`;
}

/* ═══════════════ 1 · IMPORT PLANNING SESSION ═══════════════ */

Flows.importPlanning = function () {
  const sources = [
    { id: 'paste', title: 'Paste notes', sub: 'Paste raw planning notes or a transcript.', on: true },
    { id: 'repo', title: 'Import file from repo', sub: 'Pick a Markdown or text file already in the repo.', on: true },
    { id: 'meeting', title: 'Meeting transcript', sub: 'Teams / Zoom transcript source.', on: false },
    { id: 'slack', title: 'Pull from Slack', sub: 'Import a planning thread.', on: false },
    { id: 'confluence', title: 'Confluence page', sub: 'Import a planning doc.', on: false },
    { id: 'email', title: 'Email thread', sub: 'Import a decision email.', on: false },
  ];
  openModal(modalShell({
    title: 'Import Planning Session',
    sub: 'Turn planning input into context updates, decisions, work packages, and skills.',
    body: `
      <div class="choice-grid" style="margin-bottom:16px">
        ${sources.map(s => `<div class="choice-card ${s.id === 'paste' ? 'selected' : ''} ${s.on ? '' : 'disabled'}"
            ${s.on ? `onclick="Flows._pickSource(this)" data-src="${s.id}"` : ''}>
          <div class="choice-title">${s.title}${s.on ? '' : '<span class="sim-tag">FUTURE</span>'}</div>
          <div class="choice-sub">${s.sub}</div>
        </div>`).join('')}
      </div>
      <div class="field">
        <div class="field-label">Planning notes <span class="opt">Billing & Accounts weekly — prefilled for the demo</span></div>
        <textarea class="field-textarea mono" id="planNotes" style="min-height:220px">${DATA.planningNotes}</textarea>
      </div>`,
    foot: `
      <span class="foot-note">The companion reads the notes with your context library — nothing is written to the repo yet.</span>
      <button class="btn ghost" onclick="closeModal()">Cancel</button>
      <button class="btn primary" onclick="Flows.runExtraction()">Extract with Companion</button>`,
  }));
};
Flows._pickSource = function (el) {
  el.parentElement.querySelectorAll('.choice-card').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
};

Flows.runExtraction = function () {
  openModal(modalShell({
    title: 'Reading planning session…',
    sub: 'Claude · comparing against 8 context objects, 2 decisions, 1 skill',
    body: `<div id="extractProgress" style="font-family:var(--font-mono); font-size:12px; line-height:2; color:var(--text-dim)"></div>`,
  }), '');
  const steps = [
    'Reading notes (28 lines)…',
    'Loading context library: business-rules.md, domain-glossary.md, release-constraints.md…',
    'Matching against existing rules… <span style="color:var(--warn)">conflict found: BR-104</span>',
    'Extracting decisions, rules, work candidates, skill opportunities…',
    '<span style="color:var(--ok)">Done — 7 items found.</span>',
  ];
  const box = () => document.getElementById('extractProgress');
  let i = 0;
  const tick = () => {
    if (!box()) return;
    box().innerHTML += `<div>▸ ${steps[i]}</div>`;
    i++;
    if (i < steps.length) setTimeout(tick, 420);
    else setTimeout(() => Flows.showExtraction(), 500);
  };
  setTimeout(tick, 250);
  Companion.say(`Reading the planning session against the context library now. I'll flag anything that conflicts with approved context.`, ['business-rules.md', 'domain-glossary.md']);
};

Flows.showExtraction = function () {
  state.extraction = DATA.extraction.map(e => ({ ...e }));
  Flows.renderExtraction();
  state.flow.planningImported = true;
  App.refresh();
  Companion.say(`I found <b>7 items</b> in the planning session: 1 decision, 1 business-rule update, 1 work-package candidate, 1 skill suggestion, 1 context conflict, 1 open question, and 1 risk control. Review each one — nothing is written to the repo until you accept it and it rides a safe draft branch.`, ['planning notes', 'business-rules.md']);
};

Flows.renderExtraction = function () {
  const items = state.extraction;
  const kindLabel = { decision: 'Decision', rule: 'Business rule', wp: 'Work package', skill: 'Skill', risk: 'Risk control', conflict: 'Conflict', question: 'Open question' };
  const decided = items.filter(x => x.accepted !== null).length;
  openModal(modalShell({
    title: 'Detected from planning session',
    sub: `Review each item — accept, edit, reject, or defer. ${decided}/${items.length} decided.`,
    body: items.map((e, idx) => `
      <div class="extract-item ${e.accepted === true ? 'accepted' : e.accepted === false ? 'rejected' : e.accepted === 'defer' ? 'deferred' : ''}">
        <div class="extract-head">
          <span class="extract-kind ${e.kind}">${kindLabel[e.kind]}</span>
          <span class="extract-title">${esc(e.title)}</span>
          ${e.accepted === true ? '<span class="extract-verdict ok">✓ Accepted</span>' :
            e.accepted === false ? '<span class="extract-verdict no">✕ Rejected</span>' :
            e.accepted === 'defer' ? '<span class="extract-verdict defer">◔ Deferred</span>' : ''}
        </div>
        <div class="extract-body">${esc(e.body)}<div class="impact">Impact: ${esc(e.impact)}</div></div>
        <div class="extract-actions">
          <button class="btn safe sm" onclick="Flows.decideExtract(${idx}, true)">Accept</button>
          <button class="btn ghost sm" onclick="Flows.editExtract(${idx})">Edit</button>
          <button class="btn ghost sm" onclick="Flows.decideExtract(${idx}, 'defer')">Defer</button>
          <button class="btn danger-ghost sm" onclick="Flows.decideExtract(${idx}, false)">Reject</button>
          <span class="extract-target">→ ${e.target}</span>
        </div>
      </div>`).join(''),
    foot: `
      <span class="foot-note">Accepted items become repo files on a safe draft branch.</span>
      <button class="btn ghost" onclick="closeModal()">Close</button>
      <button class="btn primary" ${decided < items.length ? 'disabled title="Decide every item first"' : ''}
        onclick="Flows.finishExtraction()">Continue → files to be written</button>`,
  }), 'wide');
};

Flows.decideExtract = function (idx, verdict) {
  state.extraction[idx].accepted = verdict;
  Flows.renderExtraction();
};
Flows.editExtract = function (idx) {
  const e = state.extraction[idx];
  openModal(modalShell({
    title: 'Edit extracted item',
    sub: esc(e.title),
    body: `<div class="field"><div class="field-label">Title</div>
        <input class="field-input" id="editTitle" value="${esc(e.title).replace(/"/g, '&quot;')}"></div>
      <div class="field"><div class="field-label">Detail</div>
        <textarea class="field-textarea" id="editBody">${esc(e.body)}</textarea></div>`,
    foot: `<button class="btn ghost" onclick="Flows.renderExtraction()">Cancel</button>
      <button class="btn primary" onclick="Flows.saveExtract(${idx})">Save</button>`,
  }));
};
Flows.saveExtract = function (idx) {
  state.extraction[idx].title = document.getElementById('editTitle').value;
  state.extraction[idx].body = document.getElementById('editBody').value;
  state.extraction[idx].accepted = true;
  Flows.renderExtraction();
};

Flows.finishExtraction = function () {
  const accepted = state.extraction.filter(e => e.accepted === true);
  openModal(modalShell({
    title: 'Files that will change',
    sub: 'PMIDE shows exactly which repo files each accepted item writes — before anything is written.',
    body: `
      <ul class="plain">
        ${accepted.map(e => `<li><b>${esc(e.title)}</b><br><span class="mono dim" style="font-size:11.5px">→ ${esc(e.target)}</span></li>`).join('')}
      </ul>
      ${state.onDraft ? `<div class="callout safe"><span class="co-icon">✓</span><div>You're already on <b>${state.branch}</b>. Accepted items will be written there.</div></div>`
      : `<div class="callout warn"><span class="co-icon">⛿</span><div><b>You're on main, which is protected.</b> PMIDE will create a safe draft branch first — nothing changes in the shared product until it's reviewed and approved.</div></div>`}`,
    foot: `<button class="btn ghost" onclick="Flows.renderExtraction()">Back</button>
      ${state.onDraft
        ? `<button class="btn safe" onclick="Flows.applyExtraction()">Write to safe draft</button>`
        : `<button class="btn safe" onclick="closeModal(); Flows.startSafeDraft(true)">Start Safe Draft →</button>`}`,
  }));
};

/* ═══════════════ 2 · SAFE DRAFT BRANCH ═══════════════ */

Flows.startSafeDraft = function (thenApply = false) {
  if (state.onDraft) { App.toast('Already on a safe draft', `You're on ${state.branch}. Changes here never touch the shared product until reviewed.`); return; }
  openModal(modalShell({
    title: 'Create a safe draft branch?',
    sub: 'A branch is a safe place to propose changes before they affect the shared product.',
    body: `
      <div class="field"><div class="field-label">Recommended branch name <span class="opt">based on your planning session</span></div>
        <input class="field-input mono" id="branchName" value="safe-draft/billing-status-rule"></div>
      <div class="callout safe"><span class="co-icon">✓</span><div>
        <b>Nothing changes in the shared product</b> until this branch is reviewed and approved.
        Your team keeps working on <b>main</b> — you get a private copy to shape the change.</div></div>
      <div class="rail-note" style="margin-top:4px">Behind the scenes: <span class="mono">git checkout -b safe-draft/billing-status-rule</span>. PMIDE keeps the real Git term visible so the concept transfers to any tool.</div>`,
    foot: `<button class="btn ghost" onclick="closeModal()">Not now</button>
      <button class="btn safe" onclick="Flows.confirmSafeDraft(${thenApply})">Start Safe Draft</button>`,
  }), 'narrow');
};

Flows.confirmSafeDraft = function (thenApply) {
  const raw = document.getElementById('branchName').value.trim() || 'safe-draft/billing-status-rule';
  const name = esc(raw.replace(/[^\w\/.-]/g, '-'));
  closeModal();
  state.branch = name;
  state.onDraft = true;
  App.term([
    { html: `<span class="t-prompt">jordan@pmide</span> <span class="t-branch">(main)</span> $ <span class="t-cmd">git checkout -b ${name}</span>` },
    { html: `Switched to a new branch '<span class="t-ok">${name}</span>'`, delay: 350 },
    { html: `<span class="t-dim">pmide: branch registered as a Safe Draft — protected main is untouched</span>`, delay: 250 },
  ]);
  App.audit(`created safe draft branch ${name}`, 'BRANCH');
  App.toast('Safe draft branch created', `${name} — nothing changes in the shared product until this is reviewed.`, 'safe');
  App.refresh();
  Companion.say(`You're now on <b>${name}</b> — your safe draft. I'll route all accepted changes here. When you're done, you'll propose the change (a pull request) so the team can review it.`, ['git']);
  if (thenApply) setTimeout(() => Flows.applyExtraction(), 700);
};

/* ═══════════════ 3 · APPLY EXTRACTION → CONTEXT UPDATE ═══════════════ */

Flows.applyExtraction = function () {
  closeModal();
  // The context-diff acceptance moment — the requirements' Step 4.
  openModal(modalShell({
    title: 'Context update — review before writing',
    sub: 'Business rules are a high-risk category: this change will require product + risk approval at merge.',
    body: `
      <h2 class="sec" style="font-size:12px; font-weight:650; letter-spacing:.09em; text-transform:uppercase; color:var(--brand); margin-bottom:10px">${DATA.contextDiff.title}</h2>
      <div class="ba-diff">
        <div class="ba-col before"><div class="ba-label">Before</div>${DATA.contextDiff.before}</div>
        <div class="ba-col after"><div class="ba-label">After</div>${DATA.contextDiff.after}</div>
      </div>
      <div style="font-size:12px; font-weight:600; color:var(--text-dim); margin:14px 0 6px">Impacted areas</div>
      <div>${DATA.contextDiff.impacted.map(i => `<span class="pill cat" style="margin:0 4px 4px 0">${i}</span>`).join('')}</div>
      <div style="font-size:12px; font-weight:600; color:var(--text-dim); margin:14px 0 6px">Files written to ${state.branch}</div>
      ${DATA.contextDiff.files.map(f => `<div class="mono dim" style="font-size:11.5px; padding:2px 0">▸ ${f}</div>`).join('')}
      <div class="mono dim" style="font-size:11.5px; padding:2px 0">▸ decisions/DR-0017-inactive-account-payment-settings.md <span class="pill safe" style="margin-left:4px">new</span></div>`,
    foot: `<button class="btn ghost" onclick="closeModal()">Cancel</button>
      <button class="btn safe" onclick="Flows.acceptContextUpdate()">Accept Context Update</button>`,
  }));
};

Flows.acceptContextUpdate = function () {
  closeModal();
  state.flow.contextAccepted = true;

  // mutate repo files on the "draft"
  DATA.files['context/business-rules.md'].text = DATA.files['context/business-rules.md'].text.replace(
    'Payment settings can be updated by authenticated users.',
    'Payment settings can be updated only by authenticated users whose\naccount status is active. (DR-0017, 2026-07-06)');
  DATA.files['context/domain-glossary.md'].text += `\n**Inactive account** — any account whose status is suspended, closed,\nrestricted, or risk-flagged. Inactive accounts cannot change payment settings.\n`;
  DATA.files['context/release-constraints.md'].text += `\n- BR-104 enforcement (inactive-account payment lock) rides the\n  \`billing-safeguards\` flag and needs product + risk sign-off.\n`;
  DATA.files['decisions/DR-0017-inactive-account-payment-settings.md'] = { lang: 'md', text:
`# DR-0017 — Inactive accounts cannot update payment settings

**Date:** 2026-07-06 · **Owner:** J. Alvarez (PM) · **Status:** Proposed

## Decision
Inactive accounts cannot update payment settings.

## Context
Three support escalations where suspended accounts changed payment methods
and disputed charges after reactivation.

## Options considered
1. Block edits for inactive accounts (chosen)
2. Allow edits with extra verification
3. Manual support-only changes

## Rationale
Inactive accounts may represent suspended, closed, restricted, or
risk-flagged customer states. Allowing payment setting changes creates
downstream billing and support issues.

## Tradeoffs
Adds friction for users who need to reactivate first. Mitigated by the
restriction banner linking to reactivation help.

## Impacted areas
Account settings · Billing permissions · Checkout · Support workflows
` };
  App.treeAdd('decisions', { name: 'DR-0017-inactive-account-payment-settings.md', type: 'file', kind: 'md' });

  state.changes.push(
    { file: 'context/business-rules.md', status: 'M' },
    { file: 'context/domain-glossary.md', status: 'M' },
    { file: 'context/release-constraints.md', status: 'M' },
    { file: 'decisions/DR-0017-inactive-account-payment-settings.md', status: 'A' },
  );
  state.suggestedCommitMsg = 'Context: BR-104 requires active status for payment settings (DR-0017)';
  App.term([
    { html: `<span class="t-dim">pmide: wrote 4 files to ${state.branch}</span>` },
    { html: `<span class="t-dim">        M context/business-rules.md · M context/domain-glossary.md</span>` },
    { html: `<span class="t-dim">        M context/release-constraints.md · A decisions/DR-0017-…md</span>` },
  ]);
  App.audit('accepted context update BR-104 + DR-0017 on safe draft', 'CTX');
  App.toast('Context updated on your draft', '4 files changed. Source Control shows the compare-to-main view.', 'safe');
  App.refresh();
  Companion.say(`Context update written to your draft: <b>BR-104</b> now requires active status, the glossary defines <b>inactive account</b>, release constraints note the flag + risk sign-off, and decision <b>DR-0017</b> records why. Next: create the <b>Billing Domain Reviewer</b> skill the team asked for, then I'll generate the work package.`, ['business-rules.md', 'DR-0017', 'release-constraints.md']);
};

/* ═══════════════ 4 · SKILL BUILDER (9-step wizard) ═══════════════ */

const WIZ_STEPS = ['Purpose', 'Trigger', 'Inputs', 'Context', 'Workflow', 'Output', 'Scripts', 'Governance', 'Preview'];

Flows.createSkill = function () {
  state.wiz = {
    step: 0,
    name: 'Billing Domain Reviewer',
    purpose: 'Review work related to billing rules, account status, and payment setting changes.',
    trigger: 'When a work package or PR touches billing, payment methods, account status, or checkout.',
    inputs: ['Business rules', 'Domain glossary', 'Changed files', 'Work package', 'Acceptance signals'],
    context: ['context/business-rules.md', 'context/domain-glossary.md'],
    steps: ['Load business rules and glossary', 'Check terminology drift (script)', 'Compare change to acceptance signals', 'Check non-goals were not violated', 'Draft reviewer questions'],
    output: 'Product behavior review · risk notes · missing acceptance criteria · recommended reviewer questions',
    scripts: true, agents: ['Claude', 'Copilot', 'Codex'], approval: true, owner: 'J. Alvarez (PM)',
  };
  Flows.renderWizard();
};

Flows.renderWizard = function () {
  const w = state.wiz;
  const stepBar = `<div class="wizard-steps">${WIZ_STEPS.map((s, i) =>
    `<div class="wiz-step ${i < w.step ? 'done' : i === w.step ? 'current' : ''}">${i + 1} ${s}</div>`).join('')}</div>`;

  const listEditor = (items, key) => `
    ${items.map((it, i) => `<div style="display:flex; gap:7px; margin-bottom:7px">
      <input class="field-input" value="${it.replace(/"/g, '&quot;')}" onchange="state.wiz.${key}[${i}]=this.value">
      <button class="icon-btn" onclick="state.wiz.${key}.splice(${i},1); Flows.renderWizard()">✕</button></div>`).join('')}
    <button class="btn ghost sm" onclick="state.wiz.${key}.push(''); Flows.renderWizard()">+ Add</button>`;

  const bodies = [
    /* 0 Purpose */ `
      <div class="field"><div class="field-label">Skill name</div>
        <input class="field-input" value="${w.name}" onchange="state.wiz.name=this.value"></div>
      <div class="field"><div class="field-label">What should this skill help with?</div>
        <textarea class="field-textarea" onchange="state.wiz.purpose=this.value">${w.purpose}</textarea></div>
      <div class="callout info"><span class="co-icon">ℹ</span><div>A skill is a <b>reusable team capability</b> — a governed instruction package agents can use. You describe it in product language; PMIDE generates the technical files.</div></div>`,
    /* 1 Trigger */ `
      <div class="field"><div class="field-label">When should an agent use this skill?</div>
        <textarea class="field-textarea" onchange="state.wiz.trigger=this.value">${w.trigger}</textarea></div>
      <div class="field-hint">Prefilled from your planning session — Marcus asked for a reusable billing review capability.</div>`,
    /* 2 Inputs */ `
      <div class="field-label" style="margin-bottom:8px">What inputs does it need?</div>${listEditor(w.inputs, 'inputs')}`,
    /* 3 Context */ `
      <div class="field-label" style="margin-bottom:8px">Which governed context should it check?</div>
      ${['context/business-rules.md', 'context/domain-glossary.md', 'context/compliance-rules.md', 'context/ux-standards.md', 'context/release-constraints.md'].map(f =>
        `<div class="check-row ${w.context.includes(f) ? 'checked' : ''}" onclick="Flows.wizToggleCtx('${f}')">
          <span class="check-box">✓</span><div><div class="check-label mono" style="font-size:12px">${f}</div></div></div>`).join('')}
      <div class="field-hint" style="margin-top:8px">Skills declare their context so governance can see what they read.</div>`,
    /* 4 Workflow */ `
      <div class="field-label" style="margin-bottom:8px">What steps should it follow?</div>${listEditor(w.steps, 'steps')}`,
    /* 5 Output */ `
      <div class="field"><div class="field-label">What should it produce?</div>
        <textarea class="field-textarea" onchange="state.wiz.output=this.value">${w.output}</textarea></div>`,
    /* 6 Scripts */ `
      <div class="check-row ${w.scripts ? 'checked' : ''}" onclick="state.wiz.scripts=!state.wiz.scripts; Flows.renderWizard()">
        <span class="check-box">✓</span>
        <div><div class="check-label">Include the terminology-check script</div>
        <div class="check-sub">scripts/check-billing-terms.py — flags non-canonical billing terms in changed files.</div></div></div>
      ${w.scripts ? `<div class="callout warn"><span class="co-icon">⚠</span><div><b>Scripts require approval.</b> Skills that can run scripts stay blocked until a skill approver and risk reviewer sign off. The script is generated as a reviewed placeholder — it never runs silently.</div></div>` : ''}
      <div class="field-label" style="margin:14px 0 8px">Which agents can use this skill?</div>
      ${['Claude', 'Copilot', 'Codex', 'Gemini'].map(a => `<div class="check-row ${w.agents.includes(a) ? 'checked' : ''}"
        onclick="Flows.wizToggleAgent('${a}')"><span class="check-box">✓</span><div class="check-label">${a}</div></div>`).join('')}`,
    /* 7 Governance */ `
      <div class="rail-card" style="margin-bottom:12px"><div class="rail-title">Owner</div>
        <input class="field-input" value="${w.owner}" onchange="state.wiz.owner=this.value"></div>
      <div class="check-row checked" style="cursor:default"><span class="check-box">✓</span>
        <div><div class="check-label">Requires approval before organization-wide use</div>
        <div class="check-sub">Locked on: this skill touches the billing domain and includes a script (policies SKILL-SEC-001/002).</div></div></div>`,
    /* 8 Preview */ `
      <div class="callout safe"><span class="co-icon">✓</span><div>PMIDE generated <b>4 files</b> from your answers. Review, then create the skill on your safe draft.</div></div>
      ${Object.keys(DATA.newSkillFiles).map(f => `
        <div class="diff-file"><div class="diff-file-head" onclick="this.nextElementSibling.classList.toggle('hidden')">
          <span class="grow">${f}</span><span class="pill safe">new file</span></div>
        <div class="diff-body ${f.endsWith('SKILL.md') ? '' : 'hidden'}" style="padding:10px 14px; white-space:pre-wrap; color:#aeb6c4; font-size:11.5px; max-height:260px; overflow:auto">${DATA.newSkillFiles[f].text.replace(/</g, '&lt;')}</div></div>`).join('')}`,
  ];

  const last = w.step === WIZ_STEPS.length - 1;
  openModal(`
    <div class="modal-head">
      <div><div class="modal-title">Create Skill — ${w.name}</div>
      <div class="modal-sub">Step ${w.step + 1} of ${WIZ_STEPS.length} · ${WIZ_STEPS[w.step]}</div></div>
      <button class="icon-btn" onclick="closeModal()">✕</button>
    </div>
    ${stepBar}
    <div class="modal-body">${bodies[w.step]}</div>
    <div class="modal-foot">
      <span class="foot-note">${w.step < 8 ? 'Answers are prefilled from your planning session — edit anything.' : 'Files are written to your safe draft branch.'}</span>
      ${w.step > 0 ? `<button class="btn ghost" onclick="state.wiz.step--; Flows.renderWizard()">Back</button>` : ''}
      ${last ? `<button class="btn safe" onclick="Flows.finishSkill()">Create Skill on Safe Draft</button>`
             : `<button class="btn primary" onclick="state.wiz.step++; Flows.renderWizard()">Continue</button>`}
    </div>`, 'wide');
};
Flows.wizToggleCtx = function (f) {
  const c = state.wiz.context;
  c.includes(f) ? c.splice(c.indexOf(f), 1) : c.push(f);
  Flows.renderWizard();
};
Flows.wizToggleAgent = function (a) {
  const c = state.wiz.agents;
  c.includes(a) ? c.splice(c.indexOf(a), 1) : c.push(a);
  Flows.renderWizard();
};

Flows.finishSkill = function () {
  closeModal();
  if (!state.onDraft) { Flows.startSafeDraft(); return; }
  Object.assign(DATA.files, DATA.newSkillFiles);
  App.treeAdd('skills', {
    name: 'billing-domain-reviewer', type: 'dir', children: [
      { name: 'SKILL.md', type: 'file', kind: 'md' },
      { name: 'templates', type: 'dir', children: [{ name: 'review-output.md', type: 'file', kind: 'md' }] },
      { name: 'references', type: 'dir', children: [{ name: 'billing-rules.md', type: 'file', kind: 'md' }] },
      { name: 'scripts', type: 'dir', children: [{ name: 'check-billing-terms.py', type: 'file', kind: 'py' }] },
    ]
  });
  state.skills.push({ ...DATA.newSkill });
  Object.keys(DATA.newSkillFiles).forEach(f => state.changes.push({ file: f, status: 'A' }));
  state.flow.skillCreated = true;
  state.flow.skillProposed = true;
  state.suggestedCommitMsg = state.suggestedCommitMsg || 'Add billing-domain-reviewer skill';
  App.audit('created skill billing-domain-reviewer (proposed, approval pending)', 'SKILL');
  App.term([{ html: `<span class="t-dim">pmide: generated skill folder skills/billing-domain-reviewer (4 files) on ${state.branch}</span>` }]);
  App.setSection('skills');
  App.openSkill('skill-billing-reviewer');
  App.refresh();
  App.toast('Skill created on your draft', 'billing-domain-reviewer · validation passed · risk approval required before use.', 'safe');
  setTimeout(() => Flows.showSkillScan(), 550);
};

Flows.showSkillScan = function () {
  const scan = DATA.skillScan;
  openModal(modalShell({
    title: 'Skill validation — Billing Domain Reviewer',
    sub: 'Static validation + security scan · simulated in MVP, realistic result shape',
    body: `
      <h2 class="sec" style="font-size:11px; letter-spacing:.09em; text-transform:uppercase; color:var(--ok); margin-bottom:8px">Passed</h2>
      <ul class="plain checks">${scan.passed.map(s => `<li><span class="ck ok">✓</span>${s}</li>`).join('')}</ul>
      <h2 class="sec" style="font-size:11px; letter-spacing:.09em; text-transform:uppercase; color:var(--warn); margin:16px 0 8px">Needs review</h2>
      <ul class="plain checks">${scan.needsReview.map(s => `<li><span class="ck warn">!</span>${s}</li>`).join('')}</ul>
      <div class="callout safe" style="margin-top:16px"><span class="co-icon">✓</span><div><b>Status: ${scan.verdict}.</b> The skill is queued for risk + engineering approval in Governance. Agents can't invoke it (or its script) until approved.</div></div>`,
    foot: `<button class="btn ghost" onclick="closeModal(); App.openGovernance()">View in Governance</button>
      <button class="btn primary" onclick="closeModal(); Flows.createWorkPackage()">Next: Generate Work Package →</button>`,
  }));
};

/* ═══════════════ 5 · WORK PACKAGE ═══════════════ */

Flows.createWorkPackage = function () {
  if (state.flow.wpCreated) { App.setSection('workpackages'); App.openWP('WP-0042'); return; }
  openModal(modalShell({
    title: 'Create Work Package',
    sub: 'The companion drafts it from your accepted context — you stay in control of every section.',
    body: `
      <div class="choice-grid" style="margin-bottom:14px">
        <div class="choice-card selected"><div class="choice-title">From planning session + context</div>
          <div class="choice-sub">Uses BR-104, DR-0017, the glossary, and release constraints.</div></div>
        <div class="choice-card"><div class="choice-title">From an existing issue</div><div class="choice-sub">Import a Jira or GitHub issue.</div></div>
        <div class="choice-card"><div class="choice-title">Blank</div><div class="choice-sub">Write every section yourself.</div></div>
      </div>
      <div class="rail-card"><div class="rail-title">Context sources the companion will use</div>
        ${['Business rule BR-104 (updated on your draft)', 'Decision DR-0017', 'Domain term: inactive account', 'Release constraint: billing review + feature flag', 'UX standard: restriction banner'].map(c =>
          `<div class="rail-note" style="padding:3px 0">▸ ${c}</div>`).join('')}</div>`,
    foot: `<button class="btn ghost" onclick="closeModal()">Cancel</button>
      <button class="btn primary" onclick="Flows.generateWP()">Generate with Companion</button>`,
  }));
};

Flows.generateWP = function () {
  closeModal();
  if (!state.onDraft) { Flows.startSafeDraft(); return; }
  Companion.think();
  Companion.say(`Drafting <b>WP-0042 — Enforce Billing Status Rule in Account Settings</b> from the updated context… goal, acceptance signals, non-goals, risk controls, agent instructions, and a review plan. One moment.`, []);
  setTimeout(() => {
    state.wps.push({ ...DATA.newWP });
    state.flow.wpCreated = true;
    DATA.files['work-packages/WP-0042-billing-status-rule/work-package.md'] = { lang: 'md', text: Flows._wpMarkdown() };
    DATA.files['work-packages/WP-0042-billing-status-rule/context-map.json'] = { lang: 'json', text: Flows._wpContextMap() };
    DATA.files['work-packages/WP-0042-billing-status-rule/review-plan.md'] = { lang: 'md', text: Flows._wpReviewPlan() };
    App.treeAdd('work-packages', {
      name: 'WP-0042-billing-status-rule', type: 'dir', children: [
        { name: 'work-package.md', type: 'file', kind: 'md' },
        { name: 'context-map.json', type: 'file', kind: 'json' },
        { name: 'review-plan.md', type: 'file', kind: 'md' },
      ]
    });
    state.changes.push(
      { file: 'work-packages/WP-0042-billing-status-rule/work-package.md', status: 'A' },
      { file: 'work-packages/WP-0042-billing-status-rule/context-map.json', status: 'A' },
      { file: 'work-packages/WP-0042-billing-status-rule/review-plan.md', status: 'A' },
    );
    state.suggestedCommitMsg = 'Context + skill + WP-0042: billing status rule package';
    App.audit('generated work package WP-0042 from context', 'WP');
    App.term([{ html: `<span class="t-dim">pmide: wrote work-packages/WP-0042-billing-status-rule (3 files) on ${state.branch}</span>` }]);
    App.setSection('workpackages');
    App.openWP('WP-0042');
    App.toast('Work Package generated', 'WP-0042 · readiness 87 · every section traces to a context source.', 'safe');
    Companion.done();
    Companion.say(`<b>WP-0042 is ready</b> — readiness 87/100. Each acceptance signal traces to context: the status rule from BR-104, the banner from your UX standards, the flag from release constraints. Review it, then <b>Save Version → Share Draft → Propose Change</b>, and route implementation to an agent.`, ['WP-0042', 'business-rules.md', 'ux-standards.md']);
  }, 1600);
};

Flows._wpMarkdown = () => `# WP-0042 — Enforce Billing Status Rule in Account Settings

**Status:** Draft · **Owner:** J. Alvarez · **Branch:** safe-draft/billing-status-rule

## Goal
Prevent inactive accounts from changing payment settings.

## Context used
- Business rule BR-104 (updated): payment settings require active account status
- Domain term: inactive account
- Release constraint: billing changes require product and risk review
- UX standard: restriction banner with help-center link

## Acceptance signals
- Active users can update payment settings
- Inactive users cannot update payment settings
- Inactive users see clear explanatory copy
- Existing saved payment methods are not deleted
- Support flow language is updated

## Non-goals
- Do not change checkout payment authorization
- Do not remove existing payment methods
- Do not redesign account settings

## Risk controls
- Ships behind the billing-safeguards feature flag
- Product + risk review before merge
`;
Flows._wpContextMap = () => `{
  "workPackage": "WP-0042",
  "sources": [
    { "file": "context/business-rules.md", "anchor": "BR-104", "informs": ["goal", "acceptance"] },
    { "file": "decisions/DR-0017-inactive-account-payment-settings.md", "informs": ["goal", "rationale"] },
    { "file": "context/domain-glossary.md", "anchor": "inactive account", "informs": ["definitions"] },
    { "file": "context/release-constraints.md", "informs": ["risk-controls", "review-plan"] },
    { "file": "context/ux-standards.md", "anchor": "restriction banner", "informs": ["acceptance"] }
  ]
}`;
Flows._wpReviewPlan = () => `# Review plan — WP-0042

1. Product intent review (J. Alvarez)
2. Engineering code review (T. Whitfield)
3. Risk review for billing behavior (M. Steiner)

Risk controls: billing-safeguards flag · no Friday release · support notes required.
`;

/* ═══════════════ 6 · COMMIT / PUSH / PR ═══════════════ */

Flows.commit = function () {
  const msg = esc((document.getElementById('commitMsg')?.value || state.suggestedCommitMsg || 'Update product artifacts').trim());
  const n = state.changes.length;
  const sha = 'a' + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0');
  state.commits.push({ sha, msg });
  App.term([
    { html: `<span class="t-prompt">jordan@pmide</span> <span class="t-branch">(${state.branch})</span> $ <span class="t-cmd">git add -A && git commit -m "${msg}"</span>` },
    { html: `[${state.branch} <span class="t-ok">${sha}</span>] ${msg}`, delay: 400 },
    { html: ` ${n} files changed, 208 insertions(+), 1 deletion(-)`, delay: 150 },
  ]);
  state.lastCommittedChanges = state.changes.slice();
  state.changes = [];
  state.suggestedCommitMsg = '';
  App.audit(`saved version "${msg}" (${n} files)`, 'COMMIT');
  App.toast('Version saved', `Commit ${sha} on ${state.branch}. Next: Share Draft to publish the branch.`, 'safe');
  App.refresh();
};

Flows.push = function () {
  state.pushed = true;
  App.term([
    { html: `<span class="t-prompt">jordan@pmide</span> <span class="t-branch">(${state.branch})</span> $ <span class="t-cmd">git push -u origin ${state.branch}</span>` },
    { html: `Enumerating objects: 24, done.`, delay: 420 },
    { html: `To github.com:meridian/enterprise-sample-app.git`, delay: 320 },
    { html: ` * [new branch]      <span class="t-ok">${state.branch} → ${state.branch}</span>`, delay: 120 },
  ]);
  App.audit(`shared draft branch ${state.branch} to origin`, 'PUSH');
  App.toast('Draft shared', 'Your branch is on GitHub. Still nothing changes in the shared product — propose the change to start review.', 'safe');
  App.refresh();
};

Flows.openPR = function () {
  openModal(modalShell({
    title: 'Propose Change — open a pull request',
    sub: 'A reviewable package of your context, skill, and work-package changes.',
    body: `
      <div class="field"><div class="field-label">Title</div>
        <input class="field-input" id="prTitle" value="Product: billing status rule — context, skill, and WP-0042"></div>
      <div class="field"><div class="field-label">Description <span class="opt">generated — edit freely</span></div>
        <textarea class="field-textarea mono" id="prBody" style="min-height:190px">## Summary
Context, skill, and work package for the inactive-account payment lock.

## Why
Three support escalations: suspended accounts changed payment methods and
disputed charges after reactivation (planning session 2026-07-06).

## Files changed
- context: BR-104 update, glossary, release constraints, decision DR-0017
- skill: billing-domain-reviewer (approval pending)
- work package: WP-0042 (readiness 87)

## Requested review
- [x] Product intent review
- [ ] Engineering review (T. Whitfield)
- [ ] Risk review — billing (M. Steiner)

## Risk notes
Billing is a high-risk context category. Skill contains a script (blocked
until approved). Implementation will ride the billing-safeguards flag.</textarea></div>
      <div class="callout info"><span class="co-icon">ℹ</span><div>Required reviews are pulled from governance: <b>product owner + risk</b> for billing context, <b>skill approver + risk</b> for the script skill.</div></div>`,
    foot: `<button class="btn ghost" onclick="closeModal()">Cancel</button>
      <button class="btn primary" onclick="Flows.confirmPR()">Open Pull Request</button>`,
  }));
};

Flows.confirmPR = function () {
  closeModal();
  state.prContext = true;
  state.prs.push({
    id: 'pr-127', number: '#127', status: 'Open',
    title: 'Product: billing status rule — context, skill, and WP-0042',
    branch: state.branch, author: 'J. Alvarez',
    summary: 'Context, skill, and work package for the inactive-account payment lock.',
    why: 'Three support escalations: suspended accounts changed payment methods and disputed charges after reactivation.',
    linked: ['Work package WP-0042', 'Decision DR-0017', 'Context: business-rules.md (BR-104)', 'Skill: billing-domain-reviewer'],
    files: state.lastCommittedChanges.map(c => c.file),
    riskNotes: 'Billing is a high-risk context category; risk review required before merge. Skill script stays blocked until approved.',
    reviews: [
      { name: 'Product owner', done: true },
      { name: 'Risk (billing)', done: false },
      { name: 'Engineering', done: false },
    ],
    needsProductReview: false,
  });
  App.term([
    { html: `<span class="t-prompt">jordan@pmide</span> <span class="t-branch">(${state.branch})</span> $ <span class="t-cmd">gh pr create --title "Product: billing status rule…"</span>` },
    { html: `<span class="t-ok">https://github.com/meridian/enterprise-sample-app/pull/127</span>`, delay: 500 },
  ]);
  App.audit('opened PR #127 (context + skill + WP-0042)', 'PR');
  App.setSection('prs');
  App.openPRView('pr-127');
  App.toast('Pull request #127 opened', 'Your proposed change is ready for product, risk, and engineering review.', 'safe');
  Companion.say(`<b>PR #127 is open.</b> It packages the context update, the proposed skill, and WP-0042. Risk and engineering are requested automatically from governance rules. Now the fun part: <b>route the implementation work to an agent</b>.`, ['PR #127']);
};

/* ═══════════════ 7 · AGENT ROUTER ═══════════════ */

Flows.routeToAgent = function () {
  if (!state.flow.wpCreated) {
    App.toast('No work package yet', 'Generate WP-0042 first — agents need an agent-ready package, not a chat prompt.', 'warn');
    Flows.createWorkPackage(); return;
  }
  if (state.flow.routed) { App.setSection('agentruns'); App.openRun('AR-0092'); return; }
  state.routeSel = { claude: true, copilot: true };
  Flows.renderRouter();
};

Flows.renderRouter = function () {
  const sel = state.routeSel;
  const rec = { claude: 'Refine Work Package', copilot: 'Create Implementation PR', codex: 'Generate tests', human: 'Architecture review' };
  openModal(modalShell({
    title: 'Route to Agent',
    sub: 'WP-0042 · Enforce billing status rule — PMIDE recommends a flow, you approve it.',
    body: `
      <div class="rail-card" style="margin-bottom:14px"><div class="rail-title">Task risk assessment <span class="sim-tag" style="float:right">simulated</span></div>
        <div class="rail-row"><span>Domain</span><b>Billing — high-risk</b></div>
        <div class="rail-row"><span>Blast radius</span><b>Account settings, permissions</b></div>
        <div class="rail-row"><span>Risk level</span><b><span class="risk-dot medium"></span> Medium — flag + reviews required</b></div>
        <div class="rail-row"><span>Human approval</span><b>Required before agents start</b></div></div>

      ${DATA.agents.map(a => {
        const isRec = a.id === 'claude' || a.id === 'copilot';
        const isSel = !!sel[a.id];
        return `<div class="agent-card ${isSel ? 'selected' : ''} ${isRec ? 'recommended' : ''}" onclick="Flows.toggleAgent('${a.id}')">
          <div class="agent-avatar" style="background:${a.color}">${a.name[0]}</div>
          <div class="agent-info">
            <div class="agent-name">${a.name}
              ${isRec ? `<span class="rec-tag">RECOMMENDED — ${rec[a.id]}</span>` : ''}
              ${a.real ? '' : '<span class="sim-tag">SIMULATED IN MVP</span>'}</div>
            <div class="agent-why">${a.strength}</div>
            <div class="agent-tags">${a.tags.map(t => `<span class="pill cat">${t}</span>`).join('')}</div>
          </div>
          <span class="check-box ${isSel ? '' : ''}" style="${isSel ? 'background:var(--brand); border-color:var(--brand); color:#0e1015' : ''}">✓</span>
        </div>`;
      }).join('')}

      <div class="rail-card mt16"><div class="rail-title">Context package sent to agents</div>
        ${['work-packages/WP-0042-billing-status-rule/ (all files)', 'context/business-rules.md#BR-104', 'context/domain-glossary.md#inactive-account', 'context/ux-standards.md#restriction-banner', 'AGENTS.md (ground rules)'].map(c =>
          `<div class="rail-note mono" style="font-size:11px; padding:2px 0">▸ ${c}</div>`).join('')}
        <div class="rail-note mt8">Skill available: <b>billing-domain-reviewer</b> <span class="pill waiting">approval pending — script blocked</span></div></div>`,
    foot: `<span class="foot-note">Agents work on a new branch. Nothing merges without reviews.</span>
      <button class="btn ghost" onclick="closeModal()">Cancel</button>
      <button class="btn primary" onclick="Flows.startAgentRun()">Approve & Start Agent Run</button>`,
  }), 'wide');
};
Flows.toggleAgent = function (id) {
  state.routeSel[id] = !state.routeSel[id];
  Flows.renderRouter();
};

Flows.startAgentRun = function () {
  closeModal();
  state.flow.routed = true;
  const run = {
    id: 'AR-0092', agent: 'Claude → Copilot', user: 'J. Alvarez', started: 'today ' + new Date().toTimeString().slice(0, 5),
    task: 'Refine WP-0042, then implement billing status rule (issue #341 → PR #128)',
    status: 'Running', skill: 'billing-domain-reviewer (pending approval — instructions only)',
    branch: 'agent/wp-0042-implementation',
    context: ['WP-0042 (all files)', 'business-rules.md#BR-104', 'domain-glossary.md#inactive-account', 'ux-standards.md#restriction-banner', 'AGENTS.md'],
    files: [], commands: ['create issue #341', 'checkout agent/wp-0042-implementation'],
    pr: null, errors: 'None', approvals: ['j.alvarez — Agent Operator (routing approval)'],
    simulated: true,
  };
  state.runs.unshift(run);
  App.audit('approved agent run AR-0092 (Claude + Copilot) for WP-0042', 'RUN');
  App.setSection('agentruns');
  App.openRun('AR-0092');
  App.toast('Agent run AR-0092 started', 'Claude refines the package; Copilot implements on a fresh branch.', 'safe');
  App.term([
    { html: `<span class="t-dim">pmide: agent run <span class="t-info">AR-0092</span> started — issue #341 created, branch agent/wp-0042-implementation</span>` },
  ]);
  Companion.think();

  // simulated progress
  setTimeout(() => {
    App.term([{ html: `<span class="t-dim">AR-0092 · claude: acceptance signals verified against context — no gaps</span>` }]);
  }, 1500);
  setTimeout(() => {
    App.term([{ html: `<span class="t-dim">AR-0092 · copilot: editing src/billing/permissions.ts, payment-settings.tsx…</span>` }]);
  }, 3000);
  setTimeout(() => {
    App.term([
      { html: `<span class="t-dim">AR-0092 · copilot: tests passing (3/3) · opening PR</span>` },
      { html: `<span class="t-ok">AR-0092 · PR #128 opened → needs Product Intent Review</span>`, delay: 300 },
    ]);
    run.status = 'Completed';
    run.pr = '#128';
    run.files = DATA.codeDiff.map(d => d.file);
    run.commands.push('edit 2 files', 'add 2 files', 'run tests (3 passed)', 'open PR #128');
    state.flow.codeReady = true;
    state.prs.push({
      id: 'pr-128', number: '#128', status: 'Open',
      title: 'WP-0042: Enforce billing status rule in account settings',
      branch: 'agent/wp-0042-implementation', author: 'Copilot (agent) · run AR-0092',
      summary: 'Implements the inactive-account payment lock behind the billing-safeguards flag.',
      why: 'WP-0042 / DR-0017.',
      linked: ['WP-0042', 'AR-0092', 'DR-0017'],
      files: DATA.codeDiff.map(d => d.file),
      riskNotes: 'Billing behavior change — risk review required.',
      reviews: [
        { name: 'Product intent', done: false },
        { name: 'Engineering', done: false },
        { name: 'Risk (billing)', done: false },
      ],
      needsProductReview: true,
      diff: DATA.codeDiff,
    });
    const wp = state.wps.find(w => w.id === 'WP-0042');
    if (wp) { wp.status = 'In Review'; wp.pr = '#128'; wp.runs = ['AR-0092']; }
    App.audit('agent run AR-0092 completed — PR #128 opened', 'RUN');
    App.refresh();
    App.toast('PR #128 needs Product Intent Review', 'The agent finished. Review whether the change satisfies WP-0042.', 'warn');
    Companion.done();
    Companion.say(`<b>AR-0092 finished.</b> Copilot changed 4 files on <span class="mono" style="font-size:11px">agent/wp-0042-implementation</span> and opened <b>PR #128</b>. I've drafted a Product Intent Review packet — it checks the diff against your acceptance signals, not code quality. One test gap flagged: only <i>inactive</i> status is covered.`, ['AR-0092', 'PR #128', 'WP-0042']);
  }, 4600);
};

/* ═══════════════ 8 · PRODUCT INTENT REVIEW ═══════════════ */

Flows.reviewIntent = function () {
  if (!state.flow.codeReady) {
    App.toast('Nothing to review yet', 'Route WP-0042 to an agent first — the review packet is generated from the resulting PR.', 'warn');
    return;
  }
  App.setSection('prs');
  App.openPRView('pr-128');
};

Flows.decideIntent = function (decision) {
  state.flow.reviewed = true;
  state.flow.intentDecision = decision === 'approved' ? 'approved' : decision === 'revision' ? 'revision' : decision;
  const pr = state.prs.find(p => p.id === 'pr-128');
  if (decision === 'approved') {
    pr.reviews[0].done = true;
    pr.needsProductReview = false;
    App.audit('approved product intent on PR #128', 'REVIEW');
    App.toast('Product intent approved', 'PR #128 moves to engineering + risk review. PMs review intent; engineers review code.', 'safe');
    Companion.say(`Product intent approved on <b>#128</b>. Engineering and risk reviews are still required before merge — PMIDE never bypasses them. Want me to draft the <b>release story</b> now so support and stakeholders are ready?`, ['PR #128']);
  } else if (decision === 'revision') {
    state.flow.intentDecision = 'revision';
    App.audit('requested agent revision on PR #128 (test coverage)', 'REVIEW');
    App.toast('Agent revision requested', 'Copilot will extend tests to suspended, restricted, and risk-flagged statuses.', 'warn');
    App.term([{ html: `<span class="t-dim">AR-0092 · revision requested: extend status test matrix — queued</span>` }]);
    Companion.say(`Revision request sent to the agent: extend the test matrix to <b>all inactive statuses</b>. This is the healthy loop — product intent review catches gaps before engineering time is spent.`, ['PR #128', 'WP-0042']);
  } else if (decision === 'engineer') {
    App.audit('sent PR #128 to engineering review', 'REVIEW');
    App.toast('Sent to engineering review', 'T. Whitfield is requested as reviewer on PR #128.');
  } else {
    App.audit('escalated PR #128 to risk review', 'REVIEW');
    App.toast('Escalated to risk review', 'M. Steiner (Risk) is requested on PR #128.', 'warn');
  }
  App.refresh();
};

/* ═══════════════ 9 · RELEASE STORY ═══════════════ */

Flows.generateReleaseStory = function () {
  if (!state.flow.reviewed) {
    App.toast('Review first', 'Generate the release story after the product intent review, so it reflects the final shape.', 'warn');
    return;
  }
  if (state.flow.releaseStory) { App.setSection('releases'); App.openRelease('rel-2'); return; }
  Companion.think();
  setTimeout(() => {
    state.releases.unshift({
      id: 'rel-2', title: 'Payment settings locked for inactive accounts', date: '2026-07-06',
      file: 'releases/2026-07-billing-status-rule.md',
      what: 'Accounts that are suspended, closed, restricted, or risk-flagged can no longer change payment settings. Saved payment methods stay exactly as they are, and a clear banner explains how to reactivate.',
      why: 'Three support escalations showed suspended accounts changing payment methods and disputing charges after reactivation (decision DR-0017).',
      affected: 'All markets. Only accounts in a non-active status see any change.',
      impact: 'Inactive-account holders see a restriction banner with a reactivation link instead of editable payment forms.',
      support: 'Macro BILL-LOCKED-01 ships with this change. Help-center article link pending — flagged in product intent review.',
      risk: 'Rides the billing-safeguards flag. Risk review in progress on PR #128; EU banner copy queued for legal (CR-014).',
      links: ['WP-0042', 'PR #128', 'DR-0017', 'AR-0092'],
    });
    state.flow.releaseStory = true;
    DATA.files['releases/2026-07-billing-status-rule.md'] = { lang: 'md', text: '# Release story — payment settings locked for inactive accounts\n\nGenerated by PMIDE from WP-0042, PR #128, and DR-0017.' };
    App.treeAdd('releases', { name: '2026-07-billing-status-rule.md', type: 'file', kind: 'md' });
    App.audit('generated release story for WP-0042', 'RELEASE');
    App.setSection('releases');
    App.openRelease('rel-2');
    App.toast('Release story ready', 'Business-readable summary generated from the work package, PR, and decision.', 'safe');
    Companion.done();
    Companion.say(`Release story drafted from <b>WP-0042 + PR #128 + DR-0017</b> — what changed, why, who's affected, support notes, and risk notes. The full trace from planning decision to release communication now lives in the repo.`, ['releases/2026-07-billing-status-rule.md']);
  }, 1400);
};

/* ═══════════════ 10 · GITHUB + MISC ═══════════════ */

Flows.openInGitHub = function (n) {
  state.flow.prOpenedInGitHub = true;
  App.audit(`opened ${n} in GitHub`, 'GITHUB');
  App.toast(`Opening ${n} on GitHub ↗`, 'github.com/meridian/enterprise-sample-app — normal branch, commits, files changed, and review threads. PMIDE adds the product layer; GitHub stays the review platform.', 'safe');
  App.refresh();
};

Flows.newContextItem = function () {
  openModal(modalShell({
    title: 'New context item',
    sub: 'Creates a Markdown-backed context object on a safe draft branch.',
    body: `
      <div class="field"><div class="field-label">Title</div><input class="field-input" placeholder="e.g. Enterprise onboarding constraints"></div>
      <div class="field"><div class="field-label">Category</div>
        <select class="field-select">${DATA.contextCategories.map(c => `<option>${c}</option>`).join('')}</select></div>
      <div class="field"><div class="field-label">Content</div><textarea class="field-textarea" placeholder="Write in plain product language — this becomes governed context agents can use."></textarea></div>`,
    foot: `<button class="btn ghost" onclick="closeModal()">Cancel</button>
      <button class="btn primary" onclick="closeModal(); App.toast('Demo path','For the golden demo, use Import Planning Session — it exercises the full extraction flow.','warn')">Create</button>`,
  }));
};

Flows.askCompanionAbout = function (topic) {
  Companion.ask(`Explain ${topic}`);
};

Flows.updateContext = function () {
  App.setSection('context');
  if (!state.flow.planningImported) Flows.importPlanning();
};
