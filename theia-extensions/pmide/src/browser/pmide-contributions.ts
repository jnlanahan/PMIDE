/********************************************************************************
 * PMIDE commands, menus, status bar, preferences, and demo-mode bootstrap.
 *
 * PMIDE runs as a clean, general-purpose IDE by default. The golden demo
 * (demo repo bootstrap, PM section views, scripted flows) is gated behind
 * the `pmide.demoMode` preference and the PMIDE: Enable Demo Mode command.
 * SPDX-License-Identifier: MIT
 ********************************************************************************/

import { Command, CommandContribution, CommandRegistry, MAIN_MENU_BAR, MenuContribution, MenuModelRegistry, MessageService } from '@theia/core';
import { ApplicationShell, FrontendApplication, FrontendApplicationContribution, WidgetManager } from '@theia/core/lib/browser';
import { PreferenceService } from '@theia/core/lib/common/preferences/preference-service';
import { PreferenceScope } from '@theia/core/lib/common/preferences/preference-scope';
import { PreferenceContribution, PreferenceSchema } from '@theia/core/lib/common/preferences/preference-schema';
import { StatusBar, StatusBarAlignment } from '@theia/core/lib/browser/status-bar/status-bar';
import URI from '@theia/core/lib/common/uri';
import { inject, injectable } from '@theia/core/shared/inversify';
import { WorkspaceService } from '@theia/workspace/lib/browser';
import { PmideFlows } from './pmide-flows';
import { PmideState } from './pmide-state';

export const DEMO_MODE_PREF = 'pmide.demoMode';

export const pmidePreferenceSchema: PreferenceSchema = {
    properties: {
        [DEMO_MODE_PREF]: {
            type: 'boolean',
            default: false,
            description: 'Enable the PMIDE golden demo: bootstraps the enterprise-sample-app demo repository, '
                + 'docks the PM section views (Context Library, Work Packages, Skills, Agent Runs, Pull Requests, '
                + 'Releases, Governance), and activates the scripted demo flows. Turn off to use PMIDE as a regular IDE.',
        },
    },
};

const category = 'PMIDE';
const cmd = (id: string, label: string): Command => ({ id, label, category });

export const PMIDE_COMMANDS = {
    ENABLE_DEMO: cmd('pmide.enableDemoMode', 'Enable Demo Mode'),
    DISABLE_DEMO: cmd('pmide.disableDemoMode', 'Disable Demo Mode'),
    OPEN_DASHBOARD: cmd('pmide.openDashboard', 'Open Dashboard'),
    IMPORT_PLANNING: cmd('pmide.importPlanningSession', 'Import Planning Session'),
    START_SAFE_DRAFT: cmd('pmide.startSafeDraft', 'Start Safe Draft'),
    UPDATE_CONTEXT: cmd('pmide.updateContext', 'Update Context Library'),
    CREATE_WP: cmd('pmide.createWorkPackage', 'Create Work Package'),
    CREATE_SKILL: cmd('pmide.createSkill', 'Create Skill'),
    ROUTE_TO_AGENT: cmd('pmide.routeToAgent', 'Route to Agent'),
    SAVE_VERSION: cmd('pmide.saveVersion', 'Save Version (Commit)'),
    SHARE_DRAFT: cmd('pmide.shareDraft', 'Share Draft (Push)'),
    PROPOSE_CHANGE: cmd('pmide.proposeChange', 'Propose Change (Pull Request)'),
    REVIEW_INTENT: cmd('pmide.reviewProductIntent', 'Review Product Intent'),
    RELEASE_STORY: cmd('pmide.generateReleaseStory', 'Generate Release Story'),
    COMPARE: cmd('pmide.compareChanges', 'Compare Changes to Main'),
    OPEN_FILE: cmd('pmide.openRepoFile', 'Open Repo File'),
    DECIDE_INTENT: { id: 'pmide.decideIntent', label: undefined, category } as Command,
    PANEL_WP: { id: 'pmide.openPanel.wp', category } as Command,
    PANEL_SKILL: { id: 'pmide.openPanel.skill', category } as Command,
    PANEL_RUN: { id: 'pmide.openPanel.run', category } as Command,
    PANEL_GOV: { id: 'pmide.openPanel.governance', category } as Command,
    PANEL_RELEASE: { id: 'pmide.openPanel.release', category } as Command,
    PANEL_CONTEXT: { id: 'pmide.openPanel.context', category } as Command,
};

/* ─────────── demo-mode bootstrap (no-op unless pmide.demoMode is on) ─────────── */

@injectable()
export class PmideWorkspaceInit implements FrontendApplicationContribution {

    @inject(PmideState) protected readonly state: PmideState;
    @inject(WorkspaceService) protected readonly workspace: WorkspaceService;
    @inject(MessageService) protected readonly messages: MessageService;
    @inject(PmideFlows) protected readonly flows: PmideFlows;
    @inject(WidgetManager) protected readonly widgets: WidgetManager;
    @inject(ApplicationShell) protected readonly shell: ApplicationShell;
    @inject(PreferenceService) protected readonly preferences: PreferenceService;

    async onDidInitializeLayout(app: FrontendApplication): Promise<void> {
        await this.preferences.ready;
        if (!this.preferences.get(DEMO_MODE_PREF, false)) {
            return; // clean IDE — no demo bootstrap, no forced workspace
        }
        await this.startDemo(false);
    }

    /** Turn Demo Mode on (persists the preference) and start the demo. */
    async enableDemo(): Promise<void> {
        await this.preferences.set(DEMO_MODE_PREF, true, PreferenceScope.User);
        await this.startDemo(true);
    }

    /** Turn Demo Mode off. Views/status disappear; a reload gives a fully clean shell. */
    async disableDemo(): Promise<void> {
        await this.preferences.set(DEMO_MODE_PREF, false, PreferenceScope.User);
        for (const id of PmideWorkspaceInit.VIEW_IDS) {
            const widget = await this.widgets.getWidget(id);
            widget?.close();
        }
        this.messages.info('Demo Mode is off. PMIDE now behaves as a regular IDE — reload the window for a fully clean layout.');
    }

    protected async startDemo(announce: boolean): Promise<void> {
        try {
            const repo = await this.state.init();
            const repoUri = new URI(repo.repoUri);
            const opened = this.workspace.tryGetRoots().some(r => r.resource.toString() === repoUri.toString());
            if (!opened) {
                this.messages.info(repo.created
                    ? 'PMIDE bootstrapped the demo workspace: enterprise-sample-app (real repo, real git). Opening it now…'
                    : 'Opening the demo workspace: enterprise-sample-app…');
                await this.workspace.open(repoUri, { preserveWindow: true });
                return; // window reloads into the workspace; demo continues there
            }
            await this.attachPmideViews();
            await this.flows.openPanel('dashboard');
            if (announce) {
                this.messages.info('Demo Mode is on. Follow the golden flow from the PMIDE menu, starting with Import Planning Session.');
            }
        } catch (e) {
            this.messages.error('PMIDE could not prepare the demo workspace: ' + String(e));
        }
    }

    static readonly VIEW_IDS = [
        'pmide-context-view', 'pmide-wp-view', 'pmide-skills-view', 'pmide-runs-view',
        'pmide-prs-view', 'pmide-releases-view', 'pmide-governance-view',
    ];

    /** Dock the PM-native section views so their icons live in the activity bar. */
    protected async attachPmideViews(): Promise<void> {
        let rank = 210;
        for (const id of PmideWorkspaceInit.VIEW_IDS) {
            const widget = await this.widgets.getOrCreateWidget(id);
            if (!widget.isAttached) {
                this.shell.addWidget(widget, { area: 'left', rank });
            }
            rank += 10;
        }
    }
}

@injectable()
export class PmideCommandContribution implements CommandContribution {

    @inject(PmideFlows) protected readonly flows: PmideFlows;
    @inject(PmideState) protected readonly state: PmideState;
    @inject(PreferenceService) protected readonly preferences: PreferenceService;
    @inject(MessageService) protected readonly messages: MessageService;
    @inject(PmideWorkspaceInit) protected readonly demoInit: PmideWorkspaceInit;

    protected get demoOn(): boolean {
        return this.preferences.get(DEMO_MODE_PREF, false);
    }

    /** Run a demo flow, or offer to enable Demo Mode first. */
    protected async demo(run: () => unknown): Promise<void> {
        if (this.demoOn) {
            await run();
            return;
        }
        const choice = await this.messages.info(
            'This command is part of the PMIDE golden demo, and Demo Mode is off.',
            'Enable Demo Mode');
        if (choice === 'Enable Demo Mode') {
            await this.demoInit.enableDemo();
        }
    }

    registerCommands(registry: CommandRegistry): void {
        const C = PMIDE_COMMANDS;
        registry.registerCommand(C.ENABLE_DEMO, {
            execute: () => this.demoInit.enableDemo(),
            isEnabled: () => !this.demoOn,
        });
        registry.registerCommand(C.DISABLE_DEMO, {
            execute: () => this.demoInit.disableDemo(),
            isEnabled: () => this.demoOn,
        });
        registry.registerCommand(C.OPEN_DASHBOARD, { execute: () => this.demo(() => this.flows.openPanel('dashboard')) });
        registry.registerCommand(C.IMPORT_PLANNING, { execute: () => this.demo(() => this.flows.importPlanning()) });
        registry.registerCommand(C.START_SAFE_DRAFT, { execute: () => this.demo(() => this.flows.startSafeDraft()) });
        registry.registerCommand(C.UPDATE_CONTEXT, { execute: () => this.demo(() => this.flows.importPlanning()) });
        registry.registerCommand(C.CREATE_WP, { execute: () => this.demo(() => this.flows.createWorkPackage()) });
        registry.registerCommand(C.CREATE_SKILL, { execute: () => this.demo(() => this.flows.createSkill()) });
        registry.registerCommand(C.ROUTE_TO_AGENT, { execute: () => this.demo(() => this.flows.routeToAgent()) });
        registry.registerCommand(C.SAVE_VERSION, { execute: () => this.demo(() => this.flows.saveVersion()) });
        registry.registerCommand(C.SHARE_DRAFT, { execute: () => this.demo(() => this.flows.shareDraft()) });
        registry.registerCommand(C.PROPOSE_CHANGE, { execute: () => this.demo(() => this.flows.proposeChange()) });
        registry.registerCommand(C.REVIEW_INTENT, { execute: () => this.demo(() => this.flows.reviewIntent()) });
        registry.registerCommand(C.RELEASE_STORY, { execute: () => this.demo(() => this.flows.generateReleaseStory()) });
        registry.registerCommand(C.COMPARE, { execute: (arg?: string) => this.demo(() => this.flows.compareChanges(arg)) });
        registry.registerCommand(C.OPEN_FILE, { execute: (arg?: string) => arg && this.flows.openRepoFile(arg) });
        registry.registerCommand(C.DECIDE_INTENT, { execute: (arg?: string) => arg && this.flows.decideIntent(arg) });
        registry.registerCommand(C.PANEL_WP, { execute: () => this.flows.openPanel('wp') });
        registry.registerCommand(C.PANEL_SKILL, { execute: () => this.flows.openPanel('skill') });
        registry.registerCommand(C.PANEL_RUN, { execute: (arg?: string) => this.flows.openPanel('run', arg) });
        registry.registerCommand(C.PANEL_GOV, { execute: () => this.flows.openPanel('governance') });
        registry.registerCommand(C.PANEL_RELEASE, { execute: () => this.flows.openPanel('release') });
        registry.registerCommand(C.PANEL_CONTEXT, { execute: () => this.flows.openPanel('dashboard') });
    }
}

@injectable()
export class PmideMenuContribution implements MenuContribution {
    registerMenus(menus: MenuModelRegistry): void {
        const PMIDE_MENU = [...MAIN_MENU_BAR, '4_pmide'];
        menus.registerSubmenu(PMIDE_MENU, 'PMIDE');
        const C = PMIDE_COMMANDS;
        const order = [
            C.OPEN_DASHBOARD, C.IMPORT_PLANNING, C.START_SAFE_DRAFT, C.CREATE_WP, C.CREATE_SKILL,
            C.ROUTE_TO_AGENT, C.SAVE_VERSION, C.SHARE_DRAFT, C.PROPOSE_CHANGE, C.REVIEW_INTENT,
            C.RELEASE_STORY, C.COMPARE,
        ];
        order.forEach((command, i) => menus.registerMenuAction(PMIDE_MENU, {
            commandId: command.id, order: '1_demo/' + String(i).padStart(2, '0'),
        }));
        menus.registerMenuAction(PMIDE_MENU, { commandId: C.ENABLE_DEMO.id, order: '9_mode/00' });
        menus.registerMenuAction(PMIDE_MENU, { commandId: C.DISABLE_DEMO.id, order: '9_mode/01' });
    }
}

/* ─────────── status bar: the branch-safety signature (demo mode only) ─────────── */

@injectable()
export class PmideStatusBarContribution implements FrontendApplicationContribution {

    @inject(StatusBar) protected readonly statusBar: StatusBar;
    @inject(PmideState) protected readonly state: PmideState;
    @inject(PreferenceService) protected readonly preferences: PreferenceService;

    onStart(): void {
        this.state.onChanged(() => this.update());
        this.preferences.onPreferenceChanged((e: { preferenceName: string }) => {
            if (e.preferenceName === DEMO_MODE_PREF) {
                this.update();
            }
        });
        this.preferences.ready.then(() => this.update());
    }

    protected update(): void {
        if (!this.preferences.get(DEMO_MODE_PREF, false)) {
            this.statusBar.removeElement('pmide-mode');
            this.statusBar.removeElement('pmide-governance');
            this.statusBar.removeElement('pmide-changes');
            return;
        }
        const onDraft = this.state.onDraft;
        this.statusBar.setElement('pmide-mode', {
            text: onDraft
                ? '$(git-branch) PM Safe Draft — protected main untouched'
                : '$(shield) Shared Product — protected',
            alignment: StatusBarAlignment.LEFT,
            priority: 1000,
            className: onDraft ? 'pmide-safe-draft' : 'pmide-protected',
            tooltip: onDraft
                ? `You're on ${this.state.branch}. Nothing changes in the shared product until this branch is reviewed and approved.`
                : 'main only accepts reviewed pull requests. Start a Safe Draft to make changes.',
            command: PMIDE_COMMANDS.START_SAFE_DRAFT.id,
        } as never);
        this.statusBar.setElement('pmide-governance', {
            text: '$(law) Governance: Enforced',
            alignment: StatusBarAlignment.RIGHT,
            priority: 150,
            tooltip: 'Enterprise governance is active: approvals for high-risk context, script skills, and agent runs.',
            command: PMIDE_COMMANDS.PANEL_GOV.id,
        });
        const n = this.state.changes.length;
        if (n > 0) {
            this.statusBar.setElement('pmide-changes', {
                text: `$(request-changes) ${n} changed`,
                alignment: StatusBarAlignment.LEFT,
                priority: 990,
                tooltip: `${n} files changed on ${this.state.branch} — Save Version to commit.`,
                command: PMIDE_COMMANDS.SAVE_VERSION.id,
            });
        } else {
            this.statusBar.removeElement('pmide-changes');
        }
    }
}

export const pmidePreferenceContribution: PreferenceContribution = { schema: pmidePreferenceSchema };
