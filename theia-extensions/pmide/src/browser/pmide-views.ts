/********************************************************************************
 * PMIDE activity-bar views — Context Library, Work Packages, Skills,
 * Agent Runs, Pull Requests, Releases, Governance.
 * SPDX-License-Identifier: MIT
 ********************************************************************************/

import { AbstractViewContribution } from '@theia/core/lib/browser/shell/view-contribution';
import { injectable } from '@theia/core/shared/inversify';
import { PmideSideWidget } from './pmide-widgets';
import {
    renderContextSide, renderGovernanceSide, renderPrsSide, renderReleasesSide,
    renderRunsSide, renderSkillsSide, renderWpSide,
} from './render-html';

/* ─────────── widgets ─────────── */

@injectable()
export class PmideContextViewWidget extends PmideSideWidget {
    static ID = 'pmide-context-view';
    protected init(): void {
        this.id = PmideContextViewWidget.ID;
        this.title.label = 'Context Library';
        this.title.caption = 'PMIDE — Context Library';
        this.title.iconClass = 'codicon codicon-library';
        this.title.closable = true;
        super.init();
    }
    protected renderHtml(): string { return renderContextSide(this.state); }
}

@injectable()
export class PmideWpViewWidget extends PmideSideWidget {
    static ID = 'pmide-wp-view';
    protected init(): void {
        this.id = PmideWpViewWidget.ID;
        this.title.label = 'Work Packages';
        this.title.caption = 'PMIDE — Work Packages';
        this.title.iconClass = 'codicon codicon-package';
        this.title.closable = true;
        super.init();
    }
    protected renderHtml(): string { return renderWpSide(this.state); }
}

@injectable()
export class PmideSkillsViewWidget extends PmideSideWidget {
    static ID = 'pmide-skills-view';
    protected init(): void {
        this.id = PmideSkillsViewWidget.ID;
        this.title.label = 'Skills';
        this.title.caption = 'PMIDE — Skills';
        this.title.iconClass = 'codicon codicon-star';
        this.title.closable = true;
        super.init();
    }
    protected renderHtml(): string { return renderSkillsSide(this.state); }
}

@injectable()
export class PmideRunsViewWidget extends PmideSideWidget {
    static ID = 'pmide-runs-view';
    protected init(): void {
        this.id = PmideRunsViewWidget.ID;
        this.title.label = 'Agent Runs';
        this.title.caption = 'PMIDE — Agent Runs';
        this.title.iconClass = 'codicon codicon-hubot';
        this.title.closable = true;
        super.init();
    }
    protected renderHtml(): string { return renderRunsSide(this.state); }
}

@injectable()
export class PmidePrsViewWidget extends PmideSideWidget {
    static ID = 'pmide-prs-view';
    protected init(): void {
        this.id = PmidePrsViewWidget.ID;
        this.title.label = 'Pull Requests';
        this.title.caption = 'PMIDE — Pull Requests · Proposed Changes';
        this.title.iconClass = 'codicon codicon-git-pull-request';
        this.title.closable = true;
        super.init();
    }
    protected renderHtml(): string { return renderPrsSide(this.state); }
}

@injectable()
export class PmideReleasesViewWidget extends PmideSideWidget {
    static ID = 'pmide-releases-view';
    protected init(): void {
        this.id = PmideReleasesViewWidget.ID;
        this.title.label = 'Releases';
        this.title.caption = 'PMIDE — Releases';
        this.title.iconClass = 'codicon codicon-rocket';
        this.title.closable = true;
        super.init();
    }
    protected renderHtml(): string { return renderReleasesSide(this.state); }
}

@injectable()
export class PmideGovernanceViewWidget extends PmideSideWidget {
    static ID = 'pmide-governance-view';
    protected init(): void {
        this.id = PmideGovernanceViewWidget.ID;
        this.title.label = 'Governance';
        this.title.caption = 'PMIDE — Governance';
        this.title.iconClass = 'codicon codicon-shield';
        this.title.closable = true;
        super.init();
    }
    protected renderHtml(): string { return renderGovernanceSide(this.state); }
}

/* ─────────── view contributions (activity bar placement) ─────────── */

function options(widgetId: string, widgetName: string, rank: number) {
    return {
        widgetId,
        widgetName,
        defaultWidgetOptions: { area: 'left' as const, rank },
        toggleCommandId: widgetId + ':toggle',
    };
}

@injectable()
export class PmideContextViewContribution extends AbstractViewContribution<PmideContextViewWidget> {
    constructor() { super(options(PmideContextViewWidget.ID, 'Context Library', 210)); }
}
@injectable()
export class PmideWpViewContribution extends AbstractViewContribution<PmideWpViewWidget> {
    constructor() { super(options(PmideWpViewWidget.ID, 'Work Packages', 220)); }
}
@injectable()
export class PmideSkillsViewContribution extends AbstractViewContribution<PmideSkillsViewWidget> {
    constructor() { super(options(PmideSkillsViewWidget.ID, 'Skills', 230)); }
}
@injectable()
export class PmideRunsViewContribution extends AbstractViewContribution<PmideRunsViewWidget> {
    constructor() { super(options(PmideRunsViewWidget.ID, 'Agent Runs', 240)); }
}
@injectable()
export class PmidePrsViewContribution extends AbstractViewContribution<PmidePrsViewWidget> {
    constructor() { super(options(PmidePrsViewWidget.ID, 'Pull Requests', 250)); }
}
@injectable()
export class PmideReleasesViewContribution extends AbstractViewContribution<PmideReleasesViewWidget> {
    constructor() { super(options(PmideReleasesViewWidget.ID, 'Releases', 260)); }
}
@injectable()
export class PmideGovernanceViewContribution extends AbstractViewContribution<PmideGovernanceViewWidget> {
    constructor() { super(options(PmideGovernanceViewWidget.ID, 'Governance', 270)); }
}
