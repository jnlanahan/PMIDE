/********************************************************************************
 * PMIDE main-area panels — dashboard, work package, skill, agent run,
 * product intent review, governance, release story.
 * SPDX-License-Identifier: MIT
 ********************************************************************************/

import { injectable } from '@theia/core/shared/inversify';
import { PmideHtmlWidget } from './pmide-widgets';
import {
    renderDashboard, renderGovernance, renderReleaseStory, renderReviewPacket,
    renderRunDetail, renderSkillDetail, renderWpDetail,
} from './render-html';

export const PMIDE_PANEL_FACTORY_ID = 'pmide-panel';

export type PmidePanelKind = 'dashboard' | 'wp' | 'skill' | 'run' | 'review' | 'governance' | 'release';

export interface PmidePanelOptions {
    panel: PmidePanelKind;
    arg?: string;
}

const PANEL_META: Record<PmidePanelKind, { title: string; icon: string }> = {
    dashboard: { title: 'PMIDE — Home', icon: 'codicon-home' },
    wp: { title: 'WP-0042 — Enforce Billing Status Rule', icon: 'codicon-package' },
    skill: { title: 'Skill — Billing Domain Reviewer', icon: 'codicon-star' },
    run: { title: 'Agent Run', icon: 'codicon-hubot' },
    review: { title: '#128 — Product Intent Review', icon: 'codicon-eye' },
    governance: { title: 'Governance', icon: 'codicon-shield' },
    release: { title: 'Release Story', icon: 'codicon-rocket' },
};

@injectable()
export class PmidePanelWidget extends PmideHtmlWidget {

    panel: PmidePanelKind = 'dashboard';
    arg?: string;

    configure(options: PmidePanelOptions): void {
        this.panel = options.panel;
        this.arg = options.arg;
        const meta = PANEL_META[this.panel];
        this.id = `${PMIDE_PANEL_FACTORY_ID}:${this.panel}${this.arg ? ':' + this.arg : ''}`;
        this.title.label = this.panel === 'run' ? `Agent Run ${this.arg ?? ''}` : meta.title;
        this.title.caption = this.title.label;
        this.title.closable = true;
        this.title.iconClass = 'codicon ' + meta.icon;
        this.refresh();
    }

    protected renderHtml(): string {
        switch (this.panel) {
            case 'dashboard': return renderDashboard(this.state);
            case 'wp': return renderWpDetail(this.state);
            case 'skill': return renderSkillDetail(this.state);
            case 'run': return renderRunDetail(this.state, this.arg ?? 'AR-0092');
            case 'review': return renderReviewPacket(this.state);
            case 'governance': return renderGovernance(this.state);
            case 'release': return renderReleaseStory();
            default: return '';
        }
    }
}
