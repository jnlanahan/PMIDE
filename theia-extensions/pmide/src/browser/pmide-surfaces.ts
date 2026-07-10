/********************************************************************************
 * PMIDE surfaces — the six-surface left nav: Home, Ask, Specs, Workflows,
 * Code, Context. Ask and Context are real in Phase 1; Home, Specs,
 * Workflows, and Code are calm placeholders that say what is coming.
 * SPDX-License-Identifier: MIT
 ********************************************************************************/

import { Command, CommandContribution, CommandRegistry, MAIN_MENU_BAR, MenuContribution, MenuModelRegistry } from '@theia/core';
import { AbstractViewContribution, FrontendApplication, FrontendApplicationContribution, codicon } from '@theia/core/lib/browser';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import { PmideService, SpaceFacts } from '../common/protocol';
import { PmideAgentFrontend } from './pmide-agent-frontend';
import { PmideAskWidget } from './pmide-ask-widget';
import { PmideSpaceService } from './pmide-space';
import { PmideHtmlWidget, esc } from './pmide-widgets';

/* ─────────────────────────── placeholder surfaces ─────────────────────────── */

@injectable()
export abstract class PmidePlaceholderWidget extends PmideHtmlWidget {
    protected abstract heading: string;
    protected abstract body: string;
    protected abstract phase: string;

    protected renderHtml(): string {
        return `<div class="pmide-placeholder">
            <div class="ph-title">${esc(this.heading)}</div>
            <div class="ph-body">${esc(this.body)}</div>
            <div class="ph-phase">${esc(this.phase)}</div>
        </div>`;
    }
}

@injectable()
export class PmideHomeWidget extends PmidePlaceholderWidget {
    static readonly ID = 'pmide-home';
    protected heading = 'Home';
    protected body = 'Your command center: what changed, what needs your review, and current priorities — pulled from the space and connected sources.';
    protected phase = 'Coming in a later phase. Ask is ready today.';
    @postConstruct()
    protected init(): void {
        super.init();
        this.id = PmideHomeWidget.ID;
        this.title.label = 'Home';
        this.title.caption = 'Home — the PMIDE command center';
        this.title.iconClass = codicon('home');
        this.title.closable = true;
    }
}

@injectable()
export class PmideSpecsWidget extends PmidePlaceholderWidget {
    static readonly ID = 'pmide-specs';
    protected heading = 'Specs';
    protected body = 'The document workspace: clean editing over markdown in git, with version history as a friendly timeline — no git jargon.';
    protected phase = 'Coming in Phase 2.';
    @postConstruct()
    protected init(): void {
        super.init();
        this.id = PmideSpecsWidget.ID;
        this.title.label = 'Specs';
        this.title.caption = 'Specs — the document workspace';
        this.title.iconClass = codicon('book');
        this.title.closable = true;
    }
}

@injectable()
export class PmideWorkflowsWidget extends PmidePlaceholderWidget {
    static readonly ID = 'pmide-workflows';
    protected heading = 'Workflows';
    protected body = 'The library of packages and the runner for AI-embedded workflows — discovery synthesis, evidence-to-spec, stakeholder updates. You trigger, you review.';
    protected phase = 'Coming in Phase 3.';
    @postConstruct()
    protected init(): void {
        super.init();
        this.id = PmideWorkflowsWidget.ID;
        this.title.label = 'Workflows';
        this.title.caption = 'Workflows — packages and runs';
        this.title.iconClass = codicon('checklist');
        this.title.closable = true;
    }
}

@injectable()
export class PmideCodeWidget extends PmidePlaceholderWidget {
    static readonly ID = 'pmide-code';
    protected heading = 'Code';
    protected body = 'The full IDE: file tree, editor, terminal, diffs, and the developer chat — for prototyping and hands-on work. The Explorer on the left already works today.';
    protected phase = 'The dedicated Code mode switch comes in Phase 4.';
    @postConstruct()
    protected init(): void {
        super.init();
        this.id = PmideCodeWidget.ID;
        this.title.label = 'Code';
        this.title.caption = 'Code — the full IDE surface';
        this.title.iconClass = codicon('code');
        this.title.closable = true;
    }
}

/* ────────────────────────────── Context surface ────────────────────────────── */

@injectable()
export class PmideContextWidget extends PmideHtmlWidget {
    static readonly ID = 'pmide-context';

    @inject(PmideSpaceService) protected readonly spaces: PmideSpaceService;
    @inject(PmideService) protected readonly service: PmideService;
    @inject(PmideAgentFrontend) protected readonly agent: PmideAgentFrontend;

    protected facts: SpaceFacts | undefined;
    protected engine: { ok: boolean; detail: string } | undefined;

    @postConstruct()
    protected init(): void {
        super.init();
        this.id = PmideContextWidget.ID;
        this.title.label = 'Context';
        this.title.caption = 'Context — linked repos, sources, and index health';
        this.title.iconClass = codicon('plug');
        this.title.closable = true;
        this.addClass('pmide-side');
        this.toDispose.push(this.spaces.onChanged(() => this.reload()));
        this.reload();
    }

    protected async reload(): Promise<void> {
        const { roots } = this.spaces.space;
        try {
            this.engine = await this.agent.available();
        } catch (e) {
            this.engine = { ok: false, detail: String(e instanceof Error ? e.message : e) };
        }
        if (roots.length) {
            try {
                this.facts = await this.service.indexFacts(roots);
            } catch {
                this.facts = undefined;
            }
        } else {
            this.facts = undefined;
        }
        this.refresh();
    }

    protected renderHtml(): string {
        const { roots } = this.spaces.space;
        const parts: string[] = [];

        parts.push('<div class="side-section-label">Engine</div>');
        if (this.engine?.ok) {
            parts.push('<div class="ctx-health ok"><span class="dot"></span>Claude engine ready</div>');
        } else {
            parts.push(`<div class="ctx-health bad"><span class="dot"></span>Claude engine unavailable</div>
                <div class="ctx-note">${esc(this.engine?.detail ?? 'Checking…')}</div>`);
        }

        parts.push('<div class="side-section-label">Linked repositories</div>');
        if (!roots.length) {
            parts.push('<div class="empty-state">No repositories yet.<br>Open your product folder, then link the code repos next to it.</div>');
        } else {
            for (const root of roots) {
                const docs = this.facts?.roots.find(r => r.path === root)?.documents;
                const name = root.split(/[\\/]/).pop() ?? root;
                parts.push(`<div class="side-card" title="${esc(root)}">
                    <div class="side-card-title">${esc(name)}${roots[0] === root ? ' <span class="ctx-tag">product</span>' : ''}</div>
                    <div class="side-card-meta">${docs !== undefined ? `${docs} documents indexed` : 'indexing…'}</div>
                </div>`);
            }
        }
        parts.push('<div class="ctx-actions"><button class="btn primary sm" data-cmd="pmide.linkRepository">Link a repository…</button></div>');

        if (this.facts) {
            parts.push('<div class="side-section-label">Space index</div>');
            parts.push(`<div class="ctx-note">${this.facts.documents} documents, ${this.facts.chunks} sections — searchable by Ask. Rebuilt on demand; never committed.</div>`);
        }

        return parts.join('');
    }
}

/* ───────────────────────── view contributions & menu ───────────────────────── */

export namespace PmideCommands {
    export const ASK: Command = { id: 'pmide.ask', label: 'Ask a Question', category: 'PMIDE' };
    export const LINK_REPO: Command = { id: 'pmide.linkRepository', label: 'Link Repository…', category: 'PMIDE' };
}

class PmideSurfaceContribution<T extends { id: string } & import('@theia/core/lib/browser').Widget> extends AbstractViewContribution<T> {
    constructor(widgetId: string, label: string, rank: number) {
        super({
            widgetId,
            widgetName: label,
            defaultWidgetOptions: { area: 'left', rank },
            toggleCommandId: `${widgetId}.toggle`,
        });
    }
}

@injectable()
export class PmideHomeViewContribution extends PmideSurfaceContribution<PmideHomeWidget> {
    constructor() { super(PmideHomeWidget.ID, 'Home', 10); }
}
@injectable()
export class PmideAskViewContribution extends PmideSurfaceContribution<PmideAskWidget> {
    constructor() { super(PmideAskWidget.ID, 'Ask', 20); }
}
@injectable()
export class PmideSpecsViewContribution extends PmideSurfaceContribution<PmideSpecsWidget> {
    constructor() { super(PmideSpecsWidget.ID, 'Specs', 30); }
}
@injectable()
export class PmideWorkflowsViewContribution extends PmideSurfaceContribution<PmideWorkflowsWidget> {
    constructor() { super(PmideWorkflowsWidget.ID, 'Workflows', 40); }
}
@injectable()
export class PmideCodeViewContribution extends PmideSurfaceContribution<PmideCodeWidget> {
    constructor() { super(PmideCodeWidget.ID, 'Code', 50); }
}
@injectable()
export class PmideContextViewContribution extends PmideSurfaceContribution<PmideContextWidget> {
    constructor() { super(PmideContextWidget.ID, 'Context', 60); }
}

/* ───────────────── commands, menu, and startup attachment ───────────────── */

@injectable()
export class PmideSurfacesFrontendContribution implements FrontendApplicationContribution, CommandContribution, MenuContribution {

    @inject(PmideSpaceService) protected readonly spaces: PmideSpaceService;
    @inject(PmideAskViewContribution) protected readonly askView: PmideAskViewContribution;
    @inject(PmideHomeViewContribution) protected readonly homeView: PmideHomeViewContribution;
    @inject(PmideSpecsViewContribution) protected readonly specsView: PmideSpecsViewContribution;
    @inject(PmideWorkflowsViewContribution) protected readonly workflowsView: PmideWorkflowsViewContribution;
    @inject(PmideCodeViewContribution) protected readonly codeView: PmideCodeViewContribution;
    @inject(PmideContextViewContribution) protected readonly contextView: PmideContextViewContribution;

    async onDidInitializeLayout(app: FrontendApplication): Promise<void> {
        // Dock the six surfaces so their icons live in the activity bar.
        await this.homeView.openView();
        await this.askView.openView();
        await this.specsView.openView();
        await this.workflowsView.openView();
        await this.codeView.openView();
        await this.contextView.openView();
        // Restore linked repos recorded in the product repo, then land on Ask.
        await this.spaces.restoreLinks();
        await this.askView.openView({ activate: true });
    }

    registerCommands(registry: CommandRegistry): void {
        registry.registerCommand(PmideCommands.ASK, {
            execute: () => this.askView.openView({ activate: true }),
        });
        registry.registerCommand(PmideCommands.LINK_REPO, {
            execute: () => this.spaces.linkRepository(),
        });
    }

    registerMenus(menus: MenuModelRegistry): void {
        const PMIDE_MENU = [...MAIN_MENU_BAR, '4_pmide'];
        menus.registerSubmenu(PMIDE_MENU, 'PMIDE');
        menus.registerMenuAction(PMIDE_MENU, { commandId: PmideCommands.ASK.id, order: '00' });
        menus.registerMenuAction(PMIDE_MENU, { commandId: PmideCommands.LINK_REPO.id, order: '01' });
    }
}
