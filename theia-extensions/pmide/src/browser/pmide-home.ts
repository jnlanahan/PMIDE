/********************************************************************************
 * PMIDE Home — the command center. Composes what the other surfaces already
 * know: documents waiting on the PM (unsaved changes), recent activity in the
 * product repo, space and engine health, and the two most common actions.
 * No new stores — everything here is read live from existing services.
 * SPDX-License-Identifier: MIT
 ********************************************************************************/

import { codicon } from '@theia/core/lib/browser';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import { Message } from '@theia/core/lib/browser';
import { PmideService, SpaceFacts, SpecEntry } from '../common/protocol';
import { PmideAgentFrontend } from './pmide-agent-frontend';
import { PmideSpaceService } from './pmide-space';
import { PmideSpecsFeed, SpecsCommands, timeAgo } from './pmide-specs';
import { PmideHtmlWidget, esc } from './pmide-widgets';

interface HomeActivity {
    subject: string;
    author: string;
    date: string;
}

@injectable()
export class PmideHomeWidget extends PmideHtmlWidget {
    static readonly ID = 'pmide-home';

    @inject(PmideSpaceService) protected readonly spaces: PmideSpaceService;
    @inject(PmideService) protected readonly service: PmideService;
    @inject(PmideSpecsFeed) protected readonly specsFeed: PmideSpecsFeed;
    @inject(PmideAgentFrontend) protected readonly agent: PmideAgentFrontend;

    protected pending: SpecEntry[] = [];
    protected activity: HomeActivity[] = [];
    protected facts: SpaceFacts | undefined;
    protected engineOk: boolean | undefined;

    @postConstruct()
    protected init(): void {
        super.init();
        this.id = PmideHomeWidget.ID;
        this.title.label = 'Home';
        this.title.caption = 'Home — the PMIDE command center';
        this.title.iconClass = codicon('home');
        this.title.closable = true;
        this.addClass('pmide-side');
        this.toDispose.push(this.spaces.onChanged(() => this.reload()));
        this.toDispose.push(this.specsFeed.onChanged(() => this.reload()));
        this.reload();
    }

    protected onAfterShow(msg: Message): void {
        super.onAfterShow(msg);
        this.reload();
    }

    protected async reload(): Promise<void> {
        const { productRoot, roots } = this.spaces.space;
        if (!productRoot) {
            this.pending = [];
            this.activity = [];
            this.facts = undefined;
            this.refresh();
            return;
        }
        const [specs, changes, log, engine] = await Promise.all([
            this.service.listSpecs(productRoot).catch(() => [] as SpecEntry[]),
            this.service.changedFiles(productRoot).catch(() => []),
            this.service.git(productRoot, ['log', '--max-count=8', '--pretty=%s%x1f%an%x1f%aI']).catch(() => undefined),
            this.agent.available().catch(() => ({ ok: false, detail: '' })),
        ]);
        const changed = new Set(changes.map(c => c.path.replace(/\\/g, '/')));
        this.pending = specs.filter(s => changed.has(s.relPath));
        this.activity = log && log.code === 0 && log.stdout
            ? log.stdout.split('\n').filter(l => l.trim()).map(line => {
                const [subject, author, date] = line.split('\x1f');
                return { subject: subject ?? '', author: author ?? '', date: date ?? '' };
            })
            : [];
        this.engineOk = engine.ok;
        try {
            this.facts = roots.length ? await this.service.indexFacts(roots) : undefined;
        } catch {
            this.facts = undefined;
        }
        this.refresh();
    }

    protected renderHtml(): string {
        const { productRoot, roots } = this.spaces.space;
        if (!productRoot) {
            return `<div class="empty-state">Welcome to PMIDE.<br><br>Open your product folder to get started —
                everything you write is versioned there, and Ask can answer questions across every repository you link.</div>`;
        }
        const parts: string[] = [];

        parts.push('<div class="home-actions">'
            + '<button class="btn primary block" data-cmd="pmide.ask">Ask a question</button>'
            + `<button class="btn ghost block" data-cmd="${SpecsCommands.NEW_SPEC.id}">New document</button>`
            + '</div>');

        parts.push('<div class="side-section-label">Waiting on you</div>');
        if (this.pending.length) {
            for (const spec of this.pending) {
                parts.push(`<div class="side-card" data-cmd="${SpecsCommands.OPEN_SPEC.id}" data-arg="${esc(spec.relPath)}">
                    <div class="side-card-title">${esc(spec.title)}</div>
                    <div class="side-card-meta"><span class="spec-dirty-tag">unsaved changes</span> review and save a version</div>
                </div>`);
            }
        } else {
            parts.push('<div class="ctx-note">Nothing waiting on you. Every document matches its last saved version.</div>');
        }

        if (this.activity.length) {
            parts.push('<div class="side-section-label">Recent activity</div>');
            for (const a of this.activity.slice(0, 6)) {
                parts.push(`<div class="home-activity">
                    <div class="home-activity-subject">${esc(a.subject)}</div>
                    <div class="home-activity-meta">${esc(a.author)} · ${esc(timeAgo(a.date))}</div>
                </div>`);
            }
        }

        parts.push('<div class="side-section-label">This space</div>');
        const engine = this.engineOk === undefined
            ? 'checking…'
            : this.engineOk ? 'Claude engine ready' : 'Claude engine unavailable';
        const engineCls = this.engineOk ? 'ok' : 'bad';
        parts.push(`<div class="ctx-health ${engineCls}"><span class="dot"></span>${esc(engine)}</div>`);
        if (this.facts) {
            const repoNote = roots.length === 1 ? '1 repository' : `${roots.length} repositories`;
            parts.push(`<div class="ctx-note">${esc(repoNote)} linked — ${this.facts.documents} documents,
                ${this.facts.chunks} sections searchable by Ask.</div>`);
        }

        return parts.join('');
    }
}
