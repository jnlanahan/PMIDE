/********************************************************************************
 * PMIDE flows — the golden demo flow, wired to REAL file and git operations.
 * SPDX-License-Identifier: MIT
 ********************************************************************************/
/* eslint-disable max-len */

import { CommandService, MessageService } from '@theia/core';
import { ApplicationShell, WidgetManager, open, OpenerService } from '@theia/core/lib/browser';
import URI from '@theia/core/lib/common/uri';
import { DiffUris } from '@theia/core/lib/browser/diff-uris';
import { inject, injectable } from '@theia/core/shared/inversify';
import { OutputChannelManager, OutputChannelSeverity } from '@theia/output/lib/browser/output-channel';
import { PmideService } from '../common/protocol';
import {
    CONTEXT_UPDATE_WRITES, IMPLEMENTATION_WRITES, PLANNING_NOTES, RELEASE_STORY_WRITE,
    SKILL_SCAN, SKILL_WRITES, WP_WRITES,
} from '../common/demo-data';
import { PmideDialog } from './pmide-dialog';
import { PmideState } from './pmide-state';
import { esc, renderContextAccept, renderExtraction, renderRouter } from './render-html';
import { refUri } from './pmide-git-resource';
import { PMIDE_PANEL_FACTORY_ID, PmidePanelOptions } from './pmide-panels';

const AGENT_BRANCH = 'agent/wp-0042-implementation';

@injectable()
export class PmideFlows {

    @inject(PmideService) protected readonly service: PmideService;
    @inject(PmideState) protected readonly state: PmideState;
    @inject(MessageService) protected readonly messages: MessageService;
    @inject(CommandService) protected readonly commands: CommandService;
    @inject(WidgetManager) protected readonly widgets: WidgetManager;
    @inject(ApplicationShell) protected readonly shell: ApplicationShell;
    @inject(OpenerService) protected readonly openerService: OpenerService;
    @inject(OutputChannelManager) protected readonly outputChannels: OutputChannelManager;

    /* ─────────── panel helper ─────────── */

    async openPanel(panel: PmidePanelOptions['panel'], arg?: string): Promise<void> {
        const widget = await this.widgets.getOrCreateWidget(PMIDE_PANEL_FACTORY_ID, { panel, arg } as PmidePanelOptions);
        if (!widget.isAttached) {
            this.shell.addWidget(widget, { area: 'main' });
        }
        this.shell.activateWidget(widget.id);
        (widget as { refresh?: () => void }).refresh?.();
    }

    async openRepoFile(relPath: string): Promise<void> {
        if (!this.state.repo) { return; }
        const uri = new URI(this.state.repo.repoUri).resolve(relPath);
        await open(this.openerService, uri);
    }

    /* ─────────── 1 · Import Planning Session ─────────── */

    async importPlanning(): Promise<void> {
        const dialog = new PmideDialog({
            title: 'Import Planning Session',
            size: 'wide',
            html: `
              <p class="body dim" style="margin-top:0">Turn planning input into context updates, decisions, work packages, and skills.
              Paste notes, or import from the repo — Slack, meeting transcripts, Confluence, and email are future sources <span class="sim-tag">FUTURE</span>.</p>
              <div class="field">
                <div class="field-label">Planning notes <span class="opt">Billing &amp; Accounts weekly — prefilled from planning/2026-07-06 (a real repo file)</span></div>
                <textarea class="field-textarea mono" id="planNotes" style="min-height:230px">${esc(PLANNING_NOTES)}</textarea>
              </div>
              <div class="rail-note">The companion reads the notes with your context library — nothing is written to the repo yet.</div>`,
            buttons: [
                { id: 'cancel', label: 'Cancel', cls: 'ghost' },
                { id: 'extract', label: 'Extract with Companion', cls: 'primary' },
            ],
        });
        if (await dialog.open() !== 'extract') { return; }
        this.state.flow.planningImported = true;
        this.state.fireChanged();
        await this.reviewExtraction();
    }

    protected async reviewExtraction(): Promise<void> {
        const items = this.state.startExtraction();
        const body = () => {
            const decided = items.filter(i => i.accepted !== null).length;
            return `<p class="body dim" style="margin-top:0">Detected from the planning session — review each item. <b>${decided}/${items.length} decided.</b></p>` + renderExtraction(items);
        };
        const dialog = new PmideDialog({
            title: 'Detected from planning session',
            size: 'wide',
            html: body(),
            buttons: [
                { id: 'close', label: 'Close', cls: 'ghost' },
                { id: 'continue', label: 'Continue → files to be written', cls: 'primary' },
            ],
            onAction: action => {
                const [verb, idxStr] = action.split(':');
                const idx = Number(idxStr);
                if (!items[idx]) { return undefined; }
                items[idx].accepted = verb === 'accept' ? true : verb === 'reject' ? false : 'defer';
                return body();
            },
        });
        if (await dialog.open() !== 'continue') { return; }
        if (items.some(i => i.accepted === null)) {
            this.messages.warn('Decide every extracted item first — accept, defer, or reject.');
            return this.reviewExtraction();
        }
        await this.confirmContextUpdate();
    }

    /* ─────────── 2+3 · Safe draft + context update ─────────── */

    protected async confirmContextUpdate(): Promise<void> {
        const dialog = new PmideDialog({
            title: 'Context update — review before writing',
            html: renderContextAccept(this.state.onDraft ? this.state.branch : 'safe-draft/billing-status-rule', this.state.onDraft),
            buttons: [
                { id: 'cancel', label: 'Cancel', cls: 'ghost' },
                { id: 'accept', label: this.state.onDraft ? 'Accept Context Update' : 'Start Safe Draft & Accept', cls: 'safe' },
            ],
        });
        if (await dialog.open() !== 'accept') { return; }
        if (!this.state.onDraft) {
            const ok = await this.startSafeDraft(true);
            if (!ok) { return; }
        }
        await this.applyContextUpdate();
    }

    async startSafeDraft(silentContinue = false): Promise<boolean> {
        if (this.state.onDraft) {
            this.messages.info(`Already on a safe draft: ${this.state.branch}. Nothing changes in the shared product until it's reviewed.`);
            return true;
        }
        const dialog = new PmideDialog({
            title: 'Create a safe draft branch?',
            size: 'narrow',
            html: `
              <div class="field"><div class="field-label">Recommended branch name <span class="opt">based on your planning session</span></div>
                <input class="field-input mono" id="branchName" value="safe-draft/billing-status-rule"></div>
              <div class="callout safe"><span class="co-icon">✓</span><div>
                <b>Nothing changes in the shared product</b> until this branch is reviewed and approved.
                Your team keeps working on <b>main</b> — you get a private copy to shape the change.</div></div>
              <div class="rail-note">Behind the scenes: <code>git checkout -b safe-draft/billing-status-rule</code> — a real branch in a real repo. PMIDE keeps the Git term visible so the concept transfers to any tool.</div>`,
            buttons: [
                { id: 'cancel', label: 'Not now', cls: 'ghost' },
                { id: 'create', label: 'Start Safe Draft', cls: 'safe' },
            ],
        });
        const name = await (async () => {
            const result = await dialog.open();
            return result === 'create' ? (dialog.readValue('branchName').trim() || 'safe-draft/billing-status-rule') : undefined;
        })();
        if (!name) { return false; }
        const safeName = name.replace(/[^\w/.-]/g, '-');
        const r = await this.service.createBranch(safeName);
        if (r.code !== 0) {
            this.messages.error(`Could not create branch: ${r.stderr}`);
            return false;
        }
        await this.state.refreshGit();
        this.state.recordAudit(`created safe draft branch ${safeName}`, 'BRANCH');
        this.messages.info(`Safe draft branch created: ${safeName} — nothing changes in the shared product until this is reviewed.`);
        return true;
    }

    protected async applyContextUpdate(): Promise<void> {
        await this.service.writeFiles(CONTEXT_UPDATE_WRITES);
        this.state.flow.contextAccepted = true;
        await this.state.refreshGit();
        this.state.recordAudit('accepted context update BR-104 + DR-0017 on safe draft', 'CTX');
        this.messages.info('Context updated on your draft — 4 real files changed. Check Source Control.');
        // Show the real diff of the rule change immediately.
        await this.compareChanges('context/business-rules.md');
        this.suggestNext('Context is now governed, versioned product data. Next: Create Skill (PMIDE: Create Skill).');
    }

    /* ─────────── 4 · Skill wizard ─────────── */

    async createSkill(): Promise<void> {
        if (this.state.flow.skillCreated) {
            return this.openPanel('skill');
        }
        const steps = ['Purpose', 'Trigger', 'Inputs', 'Context', 'Workflow', 'Output', 'Scripts', 'Governance', 'Preview'];
        let step = 0;
        const stepBar = () => `<div class="wizard-steps">${steps.map((s, i) =>
            `<div class="wiz-step ${i < step ? 'done' : i === step ? 'current' : ''}">${i + 1} ${s}</div>`).join('')}</div>`;
        const bodies: (() => string)[] = [
            () => `<div class="field"><div class="field-label">Skill name</div><input class="field-input" id="wName" value="Billing Domain Reviewer"></div>
              <div class="field"><div class="field-label">What should this skill help with?</div>
              <textarea class="field-textarea" id="wPurpose">Review work related to billing rules, account status, and payment setting changes.</textarea></div>
              <div class="callout info"><span class="co-icon">ℹ</span><div>A skill is a <b>reusable team capability</b> — a governed instruction package agents can use. You describe it in product language; PMIDE generates the technical files.</div></div>`,
            () => `<div class="field"><div class="field-label">When should an agent use this skill?</div>
              <textarea class="field-textarea">When a work package or PR touches billing, payment methods, account status, or checkout.</textarea></div>
              <div class="field-hint">Prefilled from your planning session — Marcus asked for a reusable billing review capability.</div>`,
            () => `<div class="field-label" style="margin-bottom:8px">Inputs the skill needs</div>
              <ul class="plain">${['Business rules', 'Domain glossary', 'Changed files', 'Work package', 'Acceptance signals'].map(i => `<li>${i}</li>`).join('')}</ul>`,
            () => `<div class="field-label" style="margin-bottom:8px">Governed context it checks</div>
              <ul class="plain"><li class="mono" style="font-size:12px">context/business-rules.md</li><li class="mono" style="font-size:12px">context/domain-glossary.md</li></ul>
              <div class="field-hint">Skills declare their context so governance can see what they read.</div>`,
            () => `<div class="field-label" style="margin-bottom:8px">Steps the skill follows</div>
              <ul class="plain">${['Load business rules and glossary', 'Check terminology drift (script)', 'Compare change to acceptance signals', 'Check non-goals were not violated', 'Draft reviewer questions'].map(i => `<li>${i}</li>`).join('')}</ul>`,
            () => `<div class="field"><div class="field-label">What should it produce?</div>
              <textarea class="field-textarea">Product behavior review · risk notes · missing acceptance criteria · recommended reviewer questions</textarea></div>`,
            () => `<div class="callout warn"><span class="co-icon">⚠</span><div><b>This skill includes a script</b> (scripts/check-billing-terms.py). Skills that can run scripts stay blocked until a skill approver and risk reviewer sign off. The script never runs silently.</div></div>
              <div class="field-label" style="margin:14px 0 8px">Compatible agents</div>
              <div>${['Claude', 'Copilot', 'Codex'].map(a => `<span class="pill cat" style="margin-right:5px">${a}</span>`).join('')}</div>`,
            () => `<div class="rail-card" style="margin-bottom:12px"><div class="rail-title">Owner</div><input class="field-input" value="J. Alvarez (PM)"></div>
              <div class="check-row checked" style="cursor:default"><span class="check-box">✓</span>
              <div><div class="check-label">Requires approval before organization-wide use</div>
              <div class="check-sub">Locked on: this skill touches the billing domain and includes a script (policies SKILL-SEC-001/002).</div></div></div>`,
            () => `<div class="callout safe"><span class="co-icon">✓</span><div>PMIDE will write <b>4 real files</b> to your safe draft branch.</div></div>
              <ul class="plain">${SKILL_WRITES.map(f => `<li class="mono" style="font-size:12px">${f.path} <span class="pill safe">new</span></li>`).join('')}</ul>
              <h2 class="sec">Validation scan <span class="sim-tag">simulated</span></h2>
              <ul class="plain checks">${SKILL_SCAN.passed.slice(0, 4).map(p => `<li><span class="ck ok">✓</span>${p}</li>`).join('')}</ul>
              <ul class="plain checks">${SKILL_SCAN.needsReview.map(p => `<li><span class="ck warn">!</span>${p}</li>`).join('')}</ul>`,
        ];
        const render = () => `${stepBar()}${bodies[step]()}
          <div style="display:flex; gap:8px; justify-content:flex-end; margin-top:16px; border-top:1px solid var(--pm-border); padding-top:12px">
            ${step > 0 ? '<button class="btn ghost" data-action="back">Back</button>' : ''}
            ${step < steps.length - 1
                ? '<button class="btn primary" data-action="next">Continue</button>'
                : '<button class="btn safe" data-action="finish">Create Skill on Safe Draft</button>'}
          </div>`;
        const dialog = new PmideDialog({
            title: 'Create Skill — Billing Domain Reviewer',
            size: 'wide',
            html: render(),
            buttons: [{ id: 'cancel', label: 'Cancel', cls: 'ghost' }],
            onAction: action => {
                if (action === 'back' && step > 0) { step--; return render(); }
                if (action === 'next' && step < steps.length - 1) { step++; return render(); }
                if (action === 'finish') { return 'close:finish'; }
                return undefined;
            },
        });
        if (await dialog.open() !== 'finish') { return; }
        if (!this.state.onDraft) {
            const ok = await this.startSafeDraft();
            if (!ok) { return; }
        }
        await this.service.writeFiles(SKILL_WRITES);
        this.state.flow.skillCreated = true;
        await this.state.refreshGit();
        this.state.recordAudit('created skill billing-domain-reviewer (proposed, approval pending)', 'SKILL');
        this.messages.info('Skill created — 4 real files on your draft. Risk approval required before agents may use it.');
        await this.openPanel('skill');
    }

    /* ─────────── 5 · Work Package ─────────── */

    async createWorkPackage(): Promise<void> {
        if (this.state.flow.wpCreated) {
            return this.openPanel('wp');
        }
        const dialog = new PmideDialog({
            title: 'Create Work Package',
            html: `
              <p class="body dim" style="margin-top:0">The companion drafts WP-0042 from your accepted context — you stay in control of every section.</p>
              <div class="rail-card"><div class="rail-title">Context sources the companion will use</div>
                ${['Business rule BR-104 (updated on your draft)', 'Decision DR-0017', 'Domain term: inactive account', 'Release constraint: billing review + feature flag', 'UX standard: restriction banner'].map(c =>
                    `<div class="rail-note" style="padding:3px 0">▸ ${c}</div>`).join('')}</div>
              <div class="rail-note" style="margin-top:12px">Files written (real): ${WP_WRITES.map(w => `<code>${w.path.split('/').pop()}</code>`).join(' · ')}</div>`,
            buttons: [
                { id: 'cancel', label: 'Cancel', cls: 'ghost' },
                { id: 'generate', label: 'Generate with Companion', cls: 'primary' },
            ],
        });
        if (await dialog.open() !== 'generate') { return; }
        if (!this.state.onDraft) {
            const ok = await this.startSafeDraft();
            if (!ok) { return; }
        }
        await this.service.writeFiles(WP_WRITES);
        this.state.flow.wpCreated = true;
        await this.state.refreshGit();
        this.state.recordAudit('generated work package WP-0042 from context', 'WP');
        this.messages.info('WP-0042 generated — readiness 87. Every section traces to a context source.');
        await this.openPanel('wp');
        this.suggestNext('Save Version → Share Draft → Propose Change, then Route to Agent.');
    }

    /* ─────────── 6 · Save / Share / Propose ─────────── */

    async saveVersion(): Promise<void> {
        await this.state.refreshGit();
        if (!this.state.changes.length) {
            this.messages.warn('No local changes to save. Accept a context update, create a skill, or generate a work package first.');
            return;
        }
        const dialog = new PmideDialog({
            title: 'Save Version — commit',
            size: 'narrow',
            html: `
              <div class="field"><div class="field-label">Describe this saved version <span class="opt">commit message</span></div>
                <textarea class="field-textarea" id="msg">Context + skill + WP-0042: billing status rule package</textarea></div>
              <div class="rail-note">${this.state.changes.length} changed files on <code>${esc(this.state.branch)}</code>. A commit is a saved checkpoint — it stays on your draft.</div>`,
            buttons: [
                { id: 'cancel', label: 'Cancel', cls: 'ghost' },
                { id: 'commit', label: '✓ Save Version', cls: 'primary' },
            ],
        });
        const result = await dialog.open();
        if (result !== 'commit') { return; }
        const msg = dialog.readValue('msg').trim() || 'Update product artifacts';
        const r = await this.service.commitAll(msg);
        if (r.code !== 0) {
            this.messages.error('Commit failed: ' + r.stderr);
            return;
        }
        this.state.flow.committed = true;
        await this.state.refreshGit();
        this.state.recordAudit(`saved version "${msg}"`, 'COMMIT');
        this.messages.info(`Version saved — commit ${r.stdout} on ${this.state.branch}. Next: Share Draft (push).`);
    }

    async shareDraft(): Promise<void> {
        if (!this.state.flow.committed) {
            this.messages.warn('Save a version first (commit), then share the draft.');
            return;
        }
        const r = await this.service.push();
        if (r.code !== 0) {
            this.messages.error('Push failed: ' + r.stderr);
            return;
        }
        this.state.flow.pushed = true;
        this.state.fireChanged();
        this.state.recordAudit(`shared draft branch ${this.state.branch} to origin`, 'PUSH');
        this.messages.info('Draft shared — a real push to the origin repository. Still nothing changes in the shared product.');
    }

    async proposeChange(): Promise<void> {
        if (!this.state.flow.pushed) {
            this.messages.warn('Share your draft first (push), then propose the change.');
            return;
        }
        if (this.state.flow.prOpened) {
            return this.openPanel('governance');
        }
        const dialog = new PmideDialog({
            title: 'Propose Change — open a pull request',
            html: `
              <div class="field"><div class="field-label">Title</div>
                <input class="field-input" id="prTitle" value="Product: billing status rule — context, skill, and WP-0042"></div>
              <div class="field"><div class="field-label">Description <span class="opt">generated — edit freely</span></div>
                <textarea class="field-textarea mono" id="prBody" style="min-height:180px">## Summary
Context, skill, and work package for the inactive-account payment lock.

## Why
Three support escalations: suspended accounts changed payment methods and
disputed charges after reactivation (planning session 2026-07-06).

## Requested review
- [x] Product intent review
- [ ] Engineering review (T. Whitfield)
- [ ] Risk review — billing (M. Steiner)</textarea></div>
              <div class="callout info"><span class="co-icon">ℹ</span><div>Required reviews are pulled from governance: <b>product owner + risk</b> for billing context, <b>skill approver + risk</b> for the script skill. The PR record is simulated in the MVP; the branch behind it is real.</div></div>`,
            buttons: [
                { id: 'cancel', label: 'Cancel', cls: 'ghost' },
                { id: 'open', label: 'Open Pull Request', cls: 'primary' },
            ],
        });
        if (await dialog.open() !== 'open') { return; }
        this.state.prs.push({
            id: 'pr-127', number: '#127',
            title: 'Product: billing status rule — context, skill, and WP-0042',
            branch: this.state.branch, author: 'J. Alvarez', status: 'Open',
            needsProductReview: false,
            reviews: [
                { name: 'Product owner', done: true },
                { name: 'Risk (billing)', done: false },
                { name: 'Engineering', done: false },
            ],
        });
        this.state.flow.prOpened = true;
        this.state.fireChanged();
        this.state.recordAudit('opened PR #127 (context + skill + WP-0042)', 'PR');
        this.messages.info('Pull request #127 opened — your proposed change is ready for product, risk, and engineering review.');
        this.suggestNext('Now the fun part: Route to Agent (PMIDE: Route to Agent).');
    }

    /* ─────────── 7+8 · Agent routing + real implementation ─────────── */

    async routeToAgent(): Promise<void> {
        if (!this.state.flow.wpCreated) {
            this.messages.warn('Generate WP-0042 first — agents need an agent-ready package, not a chat prompt.');
            return this.createWorkPackage();
        }
        if (this.state.flow.routed) {
            return this.openPanel('run', 'AR-0092');
        }
        const selected: Record<string, boolean> = { claude: true, copilot: true };
        const dialog = new PmideDialog({
            title: 'Route to Agent — WP-0042',
            size: 'wide',
            html: renderRouter(selected),
            buttons: [
                { id: 'cancel', label: 'Cancel', cls: 'ghost' },
                { id: 'start', label: 'Approve & Start Agent Run', cls: 'primary' },
            ],
            onAction: action => {
                if (action.startsWith('toggle:')) {
                    const id = action.slice('toggle:'.length);
                    selected[id] = !selected[id];
                    return renderRouter(selected);
                }
                return undefined;
            },
        });
        if (await dialog.open() !== 'start') { return; }
        await this.startAgentRun();
    }

    protected async startAgentRun(): Promise<void> {
        this.state.flow.routed = true;
        const run = {
            id: 'AR-0092', agent: 'Claude → Copilot', user: 'J. Alvarez',
            started: 'today ' + new Date().toTimeString().slice(0, 5),
            task: 'Refine WP-0042, then implement billing status rule (issue #341 → PR #128)',
            status: 'Running' as const, skill: 'billing-domain-reviewer (pending approval — instructions only)',
            branch: AGENT_BRANCH,
            context: ['WP-0042 (all files)', 'business-rules.md#BR-104', 'domain-glossary.md#inactive-account', 'ux-standards.md#restriction-banner', 'AGENTS.md'],
            files: [] as string[], simulated: true,
        };
        this.state.runs.unshift(run);
        this.state.recordAudit('approved agent run AR-0092 (Claude + Copilot) for WP-0042', 'RUN');
        this.state.fireChanged();
        await this.openPanel('run', 'AR-0092');

        const channel = this.outputChannels.getChannel('PMIDE Agent Runs');
        channel.show({ preserveFocus: true });
        const say = (line: string, severity = OutputChannelSeverity.Info) => channel.appendLine(line, severity);
        say('AR-0092 · run started — agents: claude (refine), copilot (implement) [SIMULATED EXECUTION]');
        say('AR-0092 · issue #341 created · branch ' + AGENT_BRANCH);

        const wait = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));
        await wait(1400);
        say('AR-0092 · claude: acceptance signals verified against context — no gaps');
        await wait(1400);
        say('AR-0092 · copilot: editing src/billing/permissions.ts, payment-settings.tsx…');
        await wait(1200);

        // The real part: branch, write, commit, push — actual git history.
        const result = await this.service.applyAgentImplementation(AGENT_BRANCH);
        if (result.code !== 0) {
            say('AR-0092 · FAILED: ' + result.stderr, OutputChannelSeverity.Error);
            run.status = 'Failed' as never;
            this.state.fireChanged();
            this.messages.error('Agent run failed: ' + result.stderr);
            return;
        }
        say('AR-0092 · tests passing (3/3) · committing on ' + AGENT_BRANCH);
        say('AR-0092 · real git diff vs ' + this.state.branch + ':');
        result.stdout.split('\n').forEach(l => say('    ' + l));
        say('AR-0092 · PR #128 opened → needs Product Intent Review', OutputChannelSeverity.Warning);

        run.status = 'Completed' as never;
        (run as { pr?: string }).pr = '#128';
        run.files = IMPLEMENTATION_WRITES.map(f => f.path);
        this.state.flow.codeReady = true;
        this.state.prs.push({
            id: 'pr-128', number: '#128',
            title: 'WP-0042: Enforce billing status rule in account settings',
            branch: AGENT_BRANCH, author: 'Copilot (agent) · run AR-0092', status: 'Open',
            needsProductReview: true,
            reviews: [
                { name: 'Product intent', done: false },
                { name: 'Engineering', done: false },
                { name: 'Risk (billing)', done: false },
            ],
        });
        this.state.recordAudit('agent run AR-0092 completed — PR #128 opened', 'RUN');
        await this.state.refreshGit();
        this.messages.warn('PR #128 needs Product Intent Review — the agent finished on a real branch with real commits.');
    }

    /* ─────────── 9 · Product Intent Review ─────────── */

    async reviewIntent(): Promise<void> {
        if (!this.state.flow.codeReady) {
            this.messages.warn('Nothing to review yet — route WP-0042 to an agent first. The review packet is generated from the resulting PR.');
            return;
        }
        await this.openPanel('review');
    }

    async decideIntent(decision: string): Promise<void> {
        this.state.flow.reviewed = true;
        this.state.flow.intentDecision = decision as never;
        const pr = this.state.prs.find(p => p.id === 'pr-128');
        if (decision === 'approved' && pr) {
            pr.reviews[0].done = true;
            pr.needsProductReview = false;
            this.state.recordAudit('approved product intent on PR #128', 'REVIEW');
            this.messages.info('Product intent approved. Engineering + risk review still required — PMIDE never bypasses them.');
        } else if (decision === 'revision') {
            this.state.recordAudit('requested agent revision on PR #128 (test coverage)', 'REVIEW');
            this.messages.warn('Agent revision requested: extend the test matrix to all inactive statuses.');
        } else if (decision === 'risk') {
            this.state.recordAudit('escalated PR #128 to risk review', 'REVIEW');
            this.messages.warn('Escalated to risk review — M. Steiner is requested on PR #128.');
        } else {
            this.state.recordAudit('sent PR #128 to engineering review', 'REVIEW');
            this.messages.info('Sent to engineering review — T. Whitfield is requested on PR #128.');
        }
        this.state.fireChanged();
        this.suggestNext('Generate the Release Story to close the trace (PMIDE: Generate Release Story).');
    }

    /* ─────────── 10 · Release story ─────────── */

    async generateReleaseStory(): Promise<void> {
        if (!this.state.flow.reviewed) {
            this.messages.warn('Review product intent first, so the release story reflects the final shape.');
            return;
        }
        if (this.state.flow.releaseStory) {
            return this.openPanel('release');
        }
        await this.service.writeFiles([RELEASE_STORY_WRITE]);
        this.state.flow.releaseStory = true;
        await this.state.refreshGit();
        this.state.recordAudit('generated release story for WP-0042', 'RELEASE');
        this.messages.info('Release story drafted from WP-0042 + PR #128 + DR-0017 — the full trace from planning decision to release communication lives in the repo.');
        await this.openPanel('release');
    }

    /* ─────────── Compare Changes (real diffs) ─────────── */

    async compareChanges(arg?: string): Promise<void> {
        if (!this.state.repo) { return; }
        const repoUri = new URI(this.state.repo.repoUri);
        if (arg === 'agent') {
            // Open real diffs of all agent-changed files: base branch vs agent branch.
            for (const f of IMPLEMENTATION_WRITES) {
                await this.openRefDiff(f.path, this.state.branch, AGENT_BRANCH);
            }
            return;
        }
        if (arg && this.state.flow.codeReady && IMPLEMENTATION_WRITES.some(f => f.path === arg)) {
            return this.openRefDiff(arg, this.state.branch, AGENT_BRANCH);
        }
        const target = arg || 'context/business-rules.md';
        const left = refUri(target, 'main');
        const right = repoUri.resolve(target);
        const diff = DiffUris.encode(left, right, `Compare Changes — ${target.split('/').pop()} (main ↔ your draft)`);
        await open(this.openerService, diff);
    }

    protected async openRefDiff(path: string, baseRef: string, ref: string): Promise<void> {
        const left = refUri(path, baseRef);
        const right = refUri(path, ref);
        const diff = DiffUris.encode(left, right, `Compare Changes — ${path.split('/').pop()} (${baseRef} ↔ agent)`);
        await open(this.openerService, diff);
    }

    protected suggestNext(text: string): void {
        this.messages.info('Next: ' + text);
    }
}
