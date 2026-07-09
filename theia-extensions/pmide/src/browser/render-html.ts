/********************************************************************************
 * PMIDE screen renderers — HTML-string views ported from the PMIDE web demo.
 * Buttons carry data-cmd (a Theia command id) and optional data-arg; the host
 * widget/dialog delegates clicks to the CommandService.
 * SPDX-License-Identifier: MIT
 ********************************************************************************/
/* eslint-disable max-len */

import { AGENTS, CONTEXT_DIFF, CONTEXT_OBJECTS, GOVERNANCE_MATRIX, GIT_LABELS, REVIEW_PACKET, SKILL_SCAN, WP_0042, ExtractionItem } from '../common/demo-data';
import { PmideState } from './pmide-state';

export function esc(s: unknown): string {
    return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function pill(status: string): string {
    const map: Record<string, string> = {
        'Approved': 'approved', 'Draft': 'draft', 'Proposed': 'proposed', 'In Review': 'in-review',
        'Waiting for approval': 'waiting', 'Blocked': 'blocked', 'Merged': 'merged',
        'Completed': 'completed', 'Running': 'running', 'Failed': 'failed', 'Open': 'open',
        'Review required': 'review-required', 'Enforced': 'approved',
    };
    return `<span class="pill ${map[status] || 'draft'}">${esc(status)}</span>`;
}

const CMD = {
    openDashboard: 'pmide.openDashboard',
    importPlanning: 'pmide.importPlanningSession',
    startSafeDraft: 'pmide.startSafeDraft',
    createSkill: 'pmide.createSkill',
    createWP: 'pmide.createWorkPackage',
    routeToAgent: 'pmide.routeToAgent',
    saveVersion: 'pmide.saveVersion',
    shareDraft: 'pmide.shareDraft',
    proposeChange: 'pmide.proposeChange',
    reviewIntent: 'pmide.reviewProductIntent',
    releaseStory: 'pmide.generateReleaseStory',
    openFile: 'pmide.openRepoFile',
    compare: 'pmide.compareChanges',
    openWpPanel: 'pmide.openPanel.wp',
    openSkillPanel: 'pmide.openPanel.skill',
    openRunPanel: 'pmide.openPanel.run',
    openGovPanel: 'pmide.openPanel.governance',
    openReleasePanel: 'pmide.openPanel.release',
    decideIntent: 'pmide.decideIntent',
    openContextPanel: 'pmide.openPanel.context',
};
export { CMD };

function btn(label: string, cmd: string, cls = 'ghost sm', arg?: string): string {
    return `<button class="btn ${cls}" data-cmd="${cmd}"${arg !== undefined ? ` data-arg="${esc(arg)}"` : ''}>${label}</button>`;
}

/* ═══════════ Dashboard ═══════════ */

export function renderDashboard(s: PmideState): string {
    const f = s.flow;
    const card = (title: string, items: { title: string; sub: string; cmd: string; arg?: string; color?: string }[], cta?: { label: string; cmd: string }) => `
    <div class="dash-card">
      <div class="dash-card-head"><div class="dash-card-title">${title}</div>
      <span class="dash-count">${items.length}</span></div>
      ${items.length ? items.map(i => `
        <div class="dash-item" data-cmd="${i.cmd}"${i.arg ? ` data-arg="${esc(i.arg)}"` : ''}>
          <span class="dash-item-dot" style="background:${i.color || 'var(--pm-brand)'}"></span>
          <div><div class="dash-item-title">${esc(i.title)}</div><div class="dash-item-sub">${esc(i.sub)}</div></div>
        </div>`).join('') : '<div class="dash-empty">Nothing waiting.</div>'}
      ${cta ? `<div style="margin-top:8px">${btn(cta.label + ' →', cta.cmd, 'ghost sm')}</div>` : ''}
    </div>`;

    const ctxItems = f.contextAccepted
        ? [{ title: 'BR-104 updated on your safe draft', sub: 'business-rules.md · awaiting proposal', cmd: CMD.openFile, arg: 'context/business-rules.md', color: 'var(--pm-safe)' }]
        : [{ title: 'Billing account status rule found in planning notes', sub: 'From 2026-07-06 planning session · not yet imported', cmd: CMD.importPlanning, color: 'var(--pm-warn)' }];

    const wpItems = f.wpCreated
        ? [{ title: 'WP-0042 · Enforce billing-status rule in account settings', sub: `Readiness 87 · ${f.routed ? 'routed to agents' : 'ready to route'}`, cmd: CMD.openWpPanel, color: 'var(--pm-safe)' }]
        : [{ title: 'Enforce billing-status rule in account settings', sub: 'Candidate from planning session — generate after context update', cmd: CMD.importPlanning, color: 'var(--pm-warn)' }];

    const runItems = s.runs.filter(r => r.status === 'Running' || r.id === 'AR-0092')
        .map(r => ({ title: `${r.id} · ${r.agent}`, sub: r.task, cmd: CMD.openRunPanel, arg: r.id, color: r.status === 'Running' ? 'var(--pm-brand)' : 'var(--pm-safe)' }));

    const prItems = s.prs.filter(p => p.needsProductReview)
        .map(p => ({ title: `${p.number} · ${p.title}`, sub: 'Waiting on product intent review', cmd: CMD.reviewIntent, color: 'var(--pm-warn)' }));

    const govItems = [{
        title: f.skillCreated ? '2 items in the approval queue' : '1 context change requires review before merge',
        sub: 'Billing is a high-risk category — product + risk approval required',
        cmd: CMD.openGovPanel, color: 'var(--pm-danger)',
    }];

    const skillItems = f.skillCreated
        ? [{ title: 'Billing Domain Reviewer', sub: 'Proposed · risk approval pending (contains script)', cmd: CMD.openSkillPanel, color: 'var(--pm-warn)' }]
        : [];

    const decisions = (f.contextAccepted
        ? [{ title: 'DR-0017 · Inactive accounts cannot update payment settings', sub: 'Captured today from planning session', cmd: CMD.openFile, arg: 'decisions/DR-0017-inactive-account-payment-settings.md', color: 'var(--pm-safe)' }] : []
    ).concat([{ title: 'DR-0016 · Guest checkout stays disabled for enterprise SKUs', sub: 'Approved · 2026-05-18', cmd: CMD.openFile, arg: 'decisions/DR-0016-checkout-guest-flow.md', color: 'var(--pm-brand)' }]);

    const flowSteps: [string, boolean][] = [
        ['Planning session', f.planningImported], ['Context update', f.contextAccepted],
        ['Safe draft branch', s.onDraft], ['Skill creation', f.skillCreated],
        ['Work Package', f.wpCreated], ['Agent routing', f.routed],
        ['Code change', f.codeReady], ['Product Intent Review', f.reviewed],
        ['Release story', f.releaseStory], ['Governed delivery', f.releaseStory && f.reviewed],
    ];
    let nextFound = false;
    const flowHtml = flowSteps.map(([label, done], i) => {
        let cls = '';
        if (done) { cls = 'done'; } else if (!nextFound) { nextFound = true; cls = 'next'; }
        return `<div class="flow-step ${cls}"><span class="flow-num">${done ? '✓' : i + 1}</span>${label}</div>`
            + (i < flowSteps.length - 1 ? '<span class="flow-arrow">→</span>' : '');
    }).join('');

    return `<div class="dash">
    <div class="dash-eyebrow">Today in your product workspace</div>
    <div class="dash-title">Good morning, Jordan</div>
    <div class="dash-sub">enterprise-sample-app · ${s.onDraft
        ? `you're on <span class="safe-word">${esc(s.branch)}</span> — nothing changes in the shared product until it's reviewed`
        : 'you\'re viewing <b>main</b>, the protected shared product'}</div>
    <div class="dash-grid">
      ${card('Context updates suggested', ctxItems, f.contextAccepted ? undefined : { label: 'Import planning session', cmd: CMD.importPlanning })}
      ${card('Work packages', wpItems)}
      ${card('Agent runs', runItems.length ? runItems : [], f.routed ? undefined : { label: 'Route work to an agent', cmd: CMD.routeToAgent })}
      ${card('Pull requests needing product review', prItems)}
      ${card('Skills pending approval', skillItems)}
      ${card('Governance', govItems)}
      ${card('Recent decisions', decisions)}
    </div>
    <div class="dash-flow">
      <div class="dash-flow-title">The operating flow this workspace is built around</div>
      <div class="flow-steps">${flowHtml}</div>
    </div>
  </div>`;
}

/* ═══════════ Extraction review (dialog body) ═══════════ */

export function renderExtraction(items: ExtractionItem[]): string {
    const kindLabel: Record<string, string> = { decision: 'Decision', rule: 'Business rule', wp: 'Work package', skill: 'Skill', risk: 'Risk control', conflict: 'Conflict', question: 'Open question' };
    return items.map((e, idx) => `
      <div class="extract-item ${e.accepted === true ? 'accepted' : e.accepted === false ? 'rejected' : e.accepted === 'defer' ? 'deferred' : ''}">
        <div class="extract-head">
          <span class="extract-kind ${e.kind}">${kindLabel[e.kind]}</span>
          <span class="extract-title">${esc(e.title)}</span>
          ${e.accepted === true ? '<span class="extract-verdict ok">✓ Accepted</span>'
            : e.accepted === false ? '<span class="extract-verdict no">✕ Rejected</span>'
            : e.accepted === 'defer' ? '<span class="extract-verdict defer">◔ Deferred</span>' : ''}
        </div>
        <div class="extract-body">${esc(e.body)}<div class="impact">Impact: ${esc(e.impact)}</div></div>
        <div class="extract-actions">
          <button class="btn safe sm" data-action="accept:${idx}">Accept</button>
          <button class="btn ghost sm" data-action="defer:${idx}">Defer</button>
          <button class="btn danger-ghost sm" data-action="reject:${idx}">Reject</button>
          <span class="extract-target">→ ${esc(e.target)}</span>
        </div>
      </div>`).join('');
}

/* ═══════════ Context accept (dialog body) ═══════════ */

export function renderContextAccept(branch: string, onDraft: boolean): string {
    return `
      <h2 class="sec" style="margin-top:0">${esc(CONTEXT_DIFF.title)}</h2>
      <div class="ba-diff">
        <div class="ba-col before"><div class="ba-label">Before</div>${esc(CONTEXT_DIFF.before)}</div>
        <div class="ba-col after"><div class="ba-label">After</div>${esc(CONTEXT_DIFF.after)}</div>
      </div>
      <div style="font-size:12px; font-weight:600; margin:14px 0 6px" class="dim">Impacted areas</div>
      <div>${CONTEXT_DIFF.impacted.map(i => `<span class="pill cat" style="margin:0 4px 4px 0">${esc(i)}</span>`).join('')}</div>
      <div style="font-size:12px; font-weight:600; margin:14px 0 6px" class="dim">Files written to ${esc(branch)}</div>
      ${CONTEXT_DIFF.files.map(f => `<div class="mono dim" style="font-size:11.5px; padding:2px 0">▸ ${esc(f)}${f.startsWith('decisions/DR-0017') ? ' <span class="pill safe">new</span>' : ''}</div>`).join('')}
      ${onDraft
        ? '<div class="callout safe"><span class="co-icon">✓</span><div>These are <b>real file writes and a real branch</b> — check Source Control after accepting.</div></div>'
        : '<div class="callout warn"><span class="co-icon">⛿</span><div><b>You\'re on main, which is protected.</b> PMIDE will create a safe draft branch first — nothing changes in the shared product until it\'s reviewed and approved.</div></div>'}`;
}

/* ═══════════ Work package panel ═══════════ */

export function renderWpDetail(s: PmideState): string {
    const w = WP_0042;
    const f = s.flow;
    const li = (arr: string[]) => arr.map(a => `<li>${esc(a)}</li>`).join('');
    return `<div class="detail-split">
    <div class="detail-main">
      <div class="doc-topline"><span class="doc-id">${w.id}</span>${pill(f.codeReady ? 'In Review' : 'Draft')}
        <span class="pill safe">⌥ ${esc(s.branch)}</span></div>
      <h1 class="doc-title">${esc(w.title)}</h1>
      <div class="doc-meta-row"><span>Owner <b>${esc(w.owner)}</b></span><span>Updated <b>today</b></span>
        ${f.codeReady ? '<span>PR <b>#128</b></span>' : ''}</div>
      <div class="doc-actions">
        ${!f.routed ? btn('Route to Agent', CMD.routeToAgent, 'primary sm') : ''}
        ${f.codeReady && !f.reviewed ? btn('Review Product Intent', CMD.reviewIntent, 'primary sm') : ''}
        ${btn('Open files', CMD.openFile, 'ghost sm', 'work-packages/WP-0042-billing-status-rule/work-package.md')}
      </div>
      <h2 class="sec">Goal</h2><p class="body">${esc(w.goal)}</p>
      <h2 class="sec">Problem statement</h2><p class="body">${esc(w.problem)}</p>
      <h2 class="sec">Acceptance signals</h2><ul class="plain checks">${w.acceptance.map(a => `<li><span class="ck ok">✓</span>${esc(a)}</li>`).join('')}</ul>
      <h2 class="sec">Non-goals</h2><ul class="plain">${li(w.nonGoals)}</ul>
      <h2 class="sec">Agent instructions</h2><pre class="mono-block">${esc(w.agentInstructions)}</pre>
      <h2 class="sec">Risk controls</h2><ul class="plain">${li(w.risks)}</ul>
      <h2 class="sec">Test expectations</h2><ul class="plain">${li(w.tests)}</ul>
      <h2 class="sec">Review plan</h2><ul class="plain">${li(w.reviewPlan)}</ul>
    </div>
    <div class="detail-rail">
      <div class="rail-card"><div class="rail-title">Work readiness <span class="sim-tag" style="float:right">simulated</span></div>
        <div class="readiness"><div class="readiness-bar"><div class="readiness-fill" style="width:${w.readiness}%"></div></div>
        <span class="readiness-num">${w.readiness}</span></div>
        <div class="rail-note" style="margin-top:8px">Goal, acceptance signals, non-goals, and risk controls present. Add suspended-status detail to reach 95+.</div></div>
      <div class="rail-card"><div class="rail-title">Context used</div>
        ${w.contextUsed.map(c => `<div class="rail-note" style="padding:3px 0">▸ ${esc(c)}</div>`).join('')}</div>
      <div class="rail-card"><div class="rail-title">Trace</div>
        <div class="rail-row"><span>Branch</span><b>${esc(s.branch)}</b></div>
        <div class="rail-row"><span>Issue</span><b>${f.routed ? '#341 (generated)' : '—'}</b></div>
        <div class="rail-row"><span>PR</span><b>${f.codeReady ? '#128' : '—'}</b></div>
        <div class="rail-row"><span>Agent runs</span><b>${f.routed ? 1 : 0}</b></div></div>
    </div>
  </div>`;
}

/* ═══════════ Skill panel ═══════════ */

export function renderSkillDetail(s: PmideState): string {
    return `<div class="detail-split">
    <div class="detail-main">
      <div class="doc-topline">${pill('Proposed')}<span class="pill needs-review">contains script</span></div>
      <h1 class="doc-title">Billing Domain Reviewer</h1>
      <div class="doc-meta-row"><span>Owner <b>J. Alvarez (PM)</b></span><span>Created <b>today</b></span><span>Used <b>0×</b></span></div>
      <div class="doc-actions">
        ${btn('View raw files', CMD.openFile, 'ghost sm', 'skills/billing-domain-reviewer/SKILL.md')}
        ${btn('Approval pending — governance', CMD.openGovPanel, 'warn-ghost sm')}
      </div>
      <h2 class="sec">Purpose</h2><p class="body">Review work related to billing rules, account status, and payment setting changes.</p>
      <h2 class="sec">When agents use it</h2><p class="body">When a work package or PR touches billing, payment methods, account status, or checkout.</p>
      <h2 class="sec">Validation scan <span class="sim-tag">simulated</span></h2>
      <ul class="plain checks">${SKILL_SCAN.passed.map(p => `<li><span class="ck ok">✓</span>${esc(p)}</li>`).join('')}</ul>
      <ul class="plain checks">${SKILL_SCAN.needsReview.map(p => `<li><span class="ck warn">!</span>${esc(p)}</li>`).join('')}</ul>
      <div class="callout safe"><span class="co-icon">✓</span><div><b>Status: ${SKILL_SCAN.verdict}.</b> Queued for risk + engineering approval. Agents can't invoke it (or its script) until approved.</div></div>
      <h2 class="sec">Security & permissions</h2>
      <div class="callout warn"><span class="co-icon">⚠</span><div>Risk approval required — touches billing domain and references a script. Scripts never run without an explicit approval.</div></div>
    </div>
    <div class="detail-rail">
      <div class="rail-card"><div class="rail-title">Files (real, on your draft)</div>
        ${['SKILL.md', 'templates/review-output.md', 'references/billing-rules.md', 'scripts/check-billing-terms.py'].map(f =>
          `<a class="rail-link" data-cmd="${CMD.openFile}" data-arg="skills/billing-domain-reviewer/${f}">${esc(f)}</a>`).join('')}
        <div class="rail-note" style="margin-top:8px">The skill folder is the source of truth — these are real repo files.</div></div>
      <div class="rail-card"><div class="rail-title">Compatible agents</div>
        <div>${['Claude', 'Copilot', 'Codex'].map(a => `<span class="pill cat" style="margin:0 4px 4px 0">${a}</span>`).join('')}</div></div>
    </div>
  </div>`;
}

/* ═══════════ Agent run panel ═══════════ */

export function renderRunDetail(s: PmideState, runId: string): string {
    const r = s.runs.find(x => x.id === runId) || s.runs[0];
    return `<div class="detail-split">
    <div class="detail-main">
      <div class="doc-topline"><span class="doc-id">${r.id}</span>${pill(r.status)}
        ${r.simulated ? '<span class="sim-tag">SIMULATED RUN</span>' : ''}</div>
      <h1 class="doc-title">${esc(r.task)}</h1>
      <div class="doc-meta-row"><span>Agent <b>${esc(r.agent)}</b></span><span>Initiated by <b>${esc(r.user)}</b></span>
        <span>Started <b>${esc(r.started)}</b></span></div>
      <div class="doc-actions">
        ${r.id === 'AR-0092' && s.flow.codeReady ? btn('Review Product Intent — PR #128', CMD.reviewIntent, 'primary sm') : ''}
        ${r.id === 'AR-0092' && s.flow.codeReady ? btn('Compare changes (real git diff)', CMD.compare, 'ghost sm', 'agent') : ''}
        ${r.id === 'AR-0092' && s.flow.codeReady ? btn('Open run record', CMD.openFile, 'ghost sm', 'agent-runs/AR-0092/run-summary.md') : ''}
      </div>
      <h2 class="sec">Context sent to the agent</h2>
      <ul class="plain">${r.context.map(c => `<li class="mono" style="font-size:12px">${esc(c)}</li>`).join('')}</ul>
      <h2 class="sec">Skill used</h2><p class="body"><span class="pill cat">${esc(r.skill)}</span></p>
      <h2 class="sec">Files changed</h2>
      <ul class="plain">${(r.files.length ? r.files : ['— run in progress —']).map(f => `<li class="mono" style="font-size:12px">${esc(f)}</li>`).join('')}</ul>
      <h2 class="sec">Human approvals</h2>
      <ul class="plain"><li>j.alvarez — Agent Operator (routing approval)</li></ul>
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
}

/* ═══════════ Product Intent Review panel ═══════════ */

export function renderReviewPacket(s: PmideState): string {
    const rp = REVIEW_PACKET;
    const decided = s.flow.intentDecision;
    return `<div class="detail-split">
    <div class="detail-main">
      <div class="doc-topline"><span class="doc-id">${rp.pr}</span>${pill('Open')}
        <span class="pill safe">⌥ agent/wp-0042-implementation</span><span class="pill info">Product Intent Review</span></div>
      <h1 class="doc-title">${esc(rp.prTitle)}</h1>
      <div class="doc-meta-row"><span>Agent <b>Copilot (simulated)</b></span><span>Run <b>AR-0092</b></span>
        <span>Work package <b>WP-0042</b></span></div>
      <div class="intent-score">
        <div class="intent-ring">${rp.ring}%</div>
        <div><div class="intent-score-label">Intent match: ${rp.intent}</div>
        <div class="intent-score-sub">The change substantially satisfies the work package. You review product intent — engineers still review the code.</div></div>
      </div>
      <h2 class="sec">Satisfied</h2>
      <ul class="plain checks">${rp.satisfied.map(x => `<li><span class="ck ok">✓</span>${esc(x)}</li>`).join('')}</ul>
      <h2 class="sec">Needs review</h2>
      <ul class="plain checks">${rp.needsReview.map(x => `<li><span class="ck warn">!</span>${esc(x)}</li>`).join('')}</ul>
      <h2 class="sec">Non-goal check</h2>
      <div class="callout safe"><span class="co-icon">✓</span><div>${esc(rp.nonGoalCheck)}</div></div>
      <h2 class="sec">Changed areas — in product language</h2>
      <ul class="plain">${rp.changedAreas.map(a =>
        `<li>${esc(a.area)} <a class="rail-link" style="display:inline" data-cmd="${CMD.compare}" data-arg="${esc(a.file)}">· view real diff</a></li>`).join('')}</ul>
      <h2 class="sec">Risks</h2>
      <ul class="plain checks">${rp.risks.map(x => `<li><span class="ck warn">△</span>${esc(x)}</li>`).join('')}</ul>
      <h2 class="sec">Questions for reviewers</h2>
      <p class="body"><b>Engineering:</b> ${esc(rp.questions.engineering)}</p>
      <p class="body"><b>Risk:</b> ${esc(rp.questions.risk)}</p>
      <h2 class="sec">Recommended action <span class="sim-tag">simulated</span></h2>
      <div class="callout warn"><span class="co-icon">→</span><div>${esc(rp.recommendation)}</div></div>
    </div>
    <div class="detail-rail">
      <div class="rail-card"><div class="rail-title">Your decision</div>
        ${decided ? `<div class="callout ${decided === 'approved' ? 'safe' : 'warn'}" style="margin:0"><span class="co-icon">${decided === 'approved' ? '✓' : '↻'}</span>
          <div>${decided === 'approved' ? '<b>Product intent approved.</b> Sent to engineering review.' : decided === 'revision' ? '<b>Agent revision requested.</b> The agent will extend test coverage to all inactive statuses.' : decided === 'risk' ? '<b>Escalated to risk review.</b>' : '<b>Sent to engineering review.</b>'}</div></div>`
        : `<button class="btn safe block" data-cmd="${CMD.decideIntent}" data-arg="approved">Approve Product Intent</button>
          <button class="btn warn-ghost block" data-cmd="${CMD.decideIntent}" data-arg="revision">Request Agent Revision</button>
          <button class="btn ghost block" data-cmd="${CMD.decideIntent}" data-arg="engineer">Send to Engineer Review</button>
          <button class="btn danger-ghost block" data-cmd="${CMD.decideIntent}" data-arg="risk">Escalate to Risk Review</button>`}
        <button class="btn ghost sm block" style="margin-top:10px" data-cmd="${CMD.compare}" data-arg="agent">Compare changes — real git diff</button></div>
      <div class="rail-card"><div class="rail-title">Required reviews</div>
        <div class="rail-row"><span>Product intent</span><b style="color:${decided ? 'var(--pm-ok)' : 'var(--pm-warn)'}">${decided ? '✓ done' : 'you, now'}</b></div>
        <div class="rail-row"><span>Engineering code</span><b style="color:var(--pm-warn)">waiting</b></div>
        <div class="rail-row"><span>Risk (billing)</span><b style="color:var(--pm-warn)">waiting</b></div>
        <div class="rail-note" style="margin-top:8px">Merging needs every required review. PMIDE never bypasses engineering review.</div></div>
    </div>
  </div>`;
}

/* ═══════════ Governance panel ═══════════ */

export function renderGovernance(s: PmideState): string {
    const rows = [
        {
            icon: '⛨', title: 'Context change: business-rules.md (BR-104)',
            sub: 'High-risk category (billing). Requires product owner + risk approval before merge.',
            state: 'Review required', who: 'M. Steiner (Risk)',
            policy: 'Policy CTX-GOV-004: high-risk context categories require approval.',
            show: s.flow.contextAccepted,
        },
        {
            icon: '⚙', title: 'Skill proposal: billing-domain-reviewer',
            sub: 'Contains a script and touches the billing domain. Script execution stays blocked until approved.',
            state: 'Waiting for approval', who: 'M. Steiner (Risk) + T. Whitfield (Eng Lead)',
            policy: 'Policy SKILL-SEC-001/002: scripts and sensitive context require approval.',
            show: s.flow.skillCreated,
        },
        {
            icon: '⛿', title: 'Protected branch: main',
            sub: 'Direct commits are blocked in PM mode. All changes flow through safe draft branches and PRs.',
            state: 'Enforced', who: 'Repository policy',
            policy: 'Policy BRANCH-004: protected branches accept reviewed PRs only.',
            show: true,
        },
    ].filter(r => r.show);
    return `<div class="doc" style="max-width:1000px">
    <div class="doc-topline">${pill('Enforced')}<span class="sim-tag">APPROVAL BACKEND SIMULATED</span></div>
    <h1 class="doc-title">Governance</h1>
    <p class="body dim">Approvals, policies, blocked actions, and the audit trail for enterprise-sample-app.</p>
    <h2 class="sec">Checks on your current branch</h2>
    ${rows.map(g => `<div class="gov-row">
      <span class="gov-icon">${g.icon}</span>
      <div class="gov-main"><div class="gov-title">${esc(g.title)}</div>
        <div class="gov-sub">${esc(g.sub)}</div>
        <div class="gov-policy">${esc(g.policy)}</div></div>
      <div class="gov-side">${pill(g.state)}<span class="dim" style="font-size:11px">${esc(g.who)}</span></div>
    </div>`).join('')}
    <h2 class="sec">Who must approve what</h2>
    <table class="pm-table"><thead><tr><th>Artifact</th><th>Required approver</th></tr></thead><tbody>
      ${GOVERNANCE_MATRIX.map(m => `<tr><td>${esc(m.artifact)}</td><td>${esc(m.approver)}</td></tr>`).join('')}
    </tbody></table>
    <h2 class="sec">Git terms, in product language</h2>
    <table class="pm-table"><thead><tr><th>Git term</th><th>PMIDE assisted label</th></tr></thead><tbody>
      ${GIT_LABELS.map(g => `<tr><td class="mono" style="font-size:12px">${g.git}</td><td>${g.pm}</td></tr>`).join('')}
    </tbody></table>
    <h2 class="sec">Audit trail</h2>
    ${s.audit.map(a => `<div class="audit-row"><span class="audit-time">${esc(a.time)}</span>
      <span class="audit-user">${esc(a.user)}</span><span>${esc(a.what)}</span>
      <span class="audit-ref">${esc(a.ref)}</span></div>`).join('')}
  </div>`;
}

/* ═══════════ Release story panel ═══════════ */

export function renderReleaseStory(): string {
    return `<div class="doc">
    <div class="doc-topline"><span class="pill approved">Release story</span><span class="dim">2026-07-06</span></div>
    <h1 class="doc-title">Payment settings locked for inactive accounts</h1>
    <div class="doc-actions">${btn('Open source file', CMD.openFile, 'ghost sm', 'releases/2026-07-billing-status-rule.md')}</div>
    <h2 class="sec">What changed</h2><p class="body">Accounts that are suspended, closed, restricted, or risk-flagged can no longer change payment settings. Saved payment methods stay exactly as they are, and a clear banner explains how to reactivate.</p>
    <h2 class="sec">Why it changed</h2><p class="body">Three support escalations showed suspended accounts changing payment methods and disputing charges after reactivation (decision DR-0017).</p>
    <h2 class="sec">Who is affected</h2><p class="body">All markets. Only accounts in a non-active status see any change.</p>
    <h2 class="sec">Customer impact</h2><p class="body">Inactive-account holders see a restriction banner with a reactivation link instead of editable payment forms.</p>
    <h2 class="sec">Support notes</h2><p class="body">Macro BILL-LOCKED-01 ships with this change. Help-center article link pending — flagged in product intent review.</p>
    <h2 class="sec">Risk notes</h2><p class="body">Rides the billing-safeguards flag. Risk review in progress on PR #128; EU banner copy queued for legal (CR-014).</p>
    <h2 class="sec">Links</h2><p class="body">WP-0042 · PR #128 · DR-0017 · AR-0092</p>
  </div>`;
}

/* ═══════════ Agent router (dialog body) ═══════════ */

export function renderRouter(selected: Record<string, boolean>): string {
    return `
      <div class="rail-card" style="margin-bottom:14px"><div class="rail-title">Task risk assessment <span class="sim-tag" style="float:right">simulated</span></div>
        <div class="rail-row"><span>Domain</span><b>Billing — high-risk</b></div>
        <div class="rail-row"><span>Blast radius</span><b>Account settings, permissions</b></div>
        <div class="rail-row"><span>Risk level</span><b>Medium — flag + reviews required</b></div>
        <div class="rail-row"><span>Human approval</span><b>Required before agents start</b></div></div>
      ${AGENTS.map(a => `<div class="agent-card ${selected[a.id] ? 'selected' : ''} ${a.recommend ? 'recommended' : ''}" data-action="toggle:${a.id}">
        <div class="agent-avatar" style="background:${a.color}">${a.name[0]}</div>
        <div class="agent-info">
          <div class="agent-name">${esc(a.name)}
            ${a.recommend ? `<span class="rec-tag">RECOMMENDED — ${esc(a.recommend)}</span>` : ''}
            ${a.real ? '' : '<span class="sim-tag">SIMULATED IN MVP</span>'}</div>
          <div class="agent-why">${esc(a.strength)}</div>
          <div class="agent-tags">${a.tags.map(t => `<span class="pill cat">${esc(t)}</span>`).join('')}</div>
        </div>
        <span class="check-box" style="${selected[a.id] ? 'background:var(--pm-brand); border-color:var(--pm-brand); color:#0e1015' : ''}">✓</span>
      </div>`).join('')}
      <div class="rail-card" style="margin-top:14px"><div class="rail-title">Context package sent to agents</div>
        ${['work-packages/WP-0042-billing-status-rule/ (all files)', 'context/business-rules.md#BR-104', 'context/domain-glossary.md#inactive-account', 'context/ux-standards.md#restriction-banner', 'AGENTS.md (ground rules)'].map(c =>
          `<div class="rail-note mono" style="font-size:11px; padding:2px 0">▸ ${esc(c)}</div>`).join('')}
        <div class="rail-note" style="margin-top:8px">Skill available: <b>billing-domain-reviewer</b> <span class="pill waiting">approval pending — script blocked</span></div></div>`;
}

/* ═══════════ Sidebar lists ═══════════ */

export function renderContextSide(s: PmideState): string {
    const cats: Record<string, typeof CONTEXT_OBJECTS> = {};
    CONTEXT_OBJECTS.forEach(c => { (cats[c.category] = cats[c.category] || [] as any).push(c); });
    let html = `<div class="side-actions">${btn('Import Planning Session', CMD.importPlanning, 'primary sm')}</div>`;
    for (const [cat, items] of Object.entries(cats)) {
        html += `<div class="side-section-label">${esc(cat)}</div>`;
        for (const c of items) {
            const updated = c.id === 'ctx-rules' && s.flow.contextAccepted;
            html += `<div class="side-card" data-cmd="${CMD.openFile}" data-arg="${esc(c.file)}">
              <div class="side-card-title">${esc(c.title)}</div>
              <div class="side-card-meta">${pill(updated ? 'In Review' : c.status)}
                <span>·</span><span>${esc(c.owner.split(' (')[0])}</span>
                <span>·</span><span>${updated ? 'today (draft)' : esc(c.updated)}</span>
                ${c.freshness === 'stale' ? '<span class="pill needs-review">stale</span>' : ''}</div>
            </div>`;
        }
    }
    return html;
}

export function renderWpSide(s: PmideState): string {
    let html = `<div class="side-actions">${btn('Create Work Package', CMD.createWP, 'primary sm')}</div>`;
    html += `<div class="side-card" data-cmd="${CMD.openFile}" data-arg="work-packages/WP-0038-invoice-reissue-window/work-package.md">
      <div class="side-card-title"><span class="mono-id">WP-0038</span>Extend invoice reissue window to 90 days</div>
      <div class="side-card-meta">${pill('Merged')} <span>·</span> <span>D. Chen</span> <span>·</span> <span class="mono" style="font-size:10.5px">#121</span></div></div>`;
    if (s.flow.wpCreated) {
        html += `<div class="side-card" data-cmd="${CMD.openWpPanel}">
          <div class="side-card-title"><span class="mono-id">WP-0042</span>Enforce Billing Status Rule in Account Settings</div>
          <div class="side-card-meta">${pill(s.flow.codeReady ? 'In Review' : 'Draft')} <span>·</span> <span>J. Alvarez</span>
            ${s.flow.codeReady ? '<span>·</span> <span class="mono" style="font-size:10.5px">#128</span>' : ''}</div></div>`;
    }
    return html;
}

export function renderSkillsSide(s: PmideState): string {
    let html = `<div class="side-actions">${btn('Create Skill', CMD.createSkill, 'primary sm')}</div>`;
    html += `<div class="side-card" data-cmd="${CMD.openFile}" data-arg="skills/release-story-writer/SKILL.md">
      <div class="side-card-title">Release Story Writer</div>
      <div class="side-card-meta">${pill('Approved')} <span>·</span> <span>Product Ops</span></div></div>`;
    if (s.flow.skillCreated) {
        html += `<div class="side-card" data-cmd="${CMD.openSkillPanel}">
          <div class="side-card-title">Billing Domain Reviewer</div>
          <div class="side-card-meta">${pill('Proposed')} <span>·</span> <span>J. Alvarez</span> <span class="pill needs-review">script</span></div></div>`;
    }
    return html;
}

export function renderRunsSide(s: PmideState): string {
    let html = `<div class="side-actions">${btn('Route to Agent', CMD.routeToAgent, 'primary sm')}</div>`;
    for (const r of s.runs) {
        html += `<div class="side-card" data-cmd="${CMD.openRunPanel}" data-arg="${r.id}">
          <div class="side-card-title"><span class="mono-id">${r.id}</span>${esc(r.agent)}</div>
          <div class="side-card-meta">${pill(r.status)} <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(r.task)}</span></div></div>`;
    }
    return html;
}

export function renderPrsSide(s: PmideState): string {
    if (!s.prs.length) {
        return '<div class="empty-state">No open proposed changes.<br>When you propose a change (open a pull request), it shows up here for product and engineering review.</div>';
    }
    return s.prs.map(p => `<div class="side-card" data-cmd="${p.id === 'pr-128' ? CMD.reviewIntent : CMD.openGovPanel}">
      <div class="side-card-title"><span class="mono-id">${p.number}</span>${esc(p.title)}</div>
      <div class="side-card-meta">${pill(p.status)} <span>·</span> <span class="mono" style="font-size:10px">${esc(p.branch)}</span></div>
      <div class="side-card-meta" style="margin-top:4px">${p.reviews.map(r =>
        `<span class="pill ${r.done ? 'approved' : 'waiting'}">${esc(r.name)}</span>`).join(' ')}</div>
    </div>`).join('');
}

export function renderReleasesSide(s: PmideState): string {
    let html = `<div class="side-actions">${btn('Generate Release Story', CMD.releaseStory, 'primary sm')}</div>`;
    html += `<div class="side-card" data-cmd="${CMD.openFile}" data-arg="releases/release-story-template.md">
      <div class="side-card-title">Invoice reissue window extended to 90 days</div>
      <div class="side-card-meta"><span>2026-06-12</span></div></div>`;
    if (s.flow.releaseStory) {
        html += `<div class="side-card" data-cmd="${CMD.openReleasePanel}">
          <div class="side-card-title">Payment settings locked for inactive accounts</div>
          <div class="side-card-meta"><span>2026-07-06</span> <span class="pill safe">new</span></div></div>`;
    }
    return html;
}

export function renderGovernanceSide(s: PmideState): string {
    let html = '<div class="gov-note">Enterprise governance for this repo. Approvals, policies, and blocked actions.</div>';
    const items = [
        { t: 'Context change: business-rules.md (BR-104)', st: 'Review required', show: s.flow.contextAccepted },
        { t: 'Skill proposal: billing-domain-reviewer', st: 'Waiting for approval', show: s.flow.skillCreated },
        { t: 'Protected branch: main', st: 'Enforced', show: true },
    ].filter(i => i.show);
    for (const i of items) {
        html += `<div class="side-card" data-cmd="${CMD.openGovPanel}">
          <div class="side-card-title">${esc(i.t)}</div>
          <div class="side-card-meta">${pill(i.st)}</div></div>`;
    }
    html += `<div class="side-actions">${btn('Open governance panel', CMD.openGovPanel, 'ghost sm')}</div>`;
    return html;
}
