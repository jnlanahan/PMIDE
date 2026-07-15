/********************************************************************************
 * PMIDE UI mode — progressive disclosure between the two visual modes.
 * Reader mode (default) keeps the calm document surface: only the six PMIDE
 * surfaces show in the activity bar. Code mode reveals the full IDE —
 * Explorer, Search, Source Control, Debug, terminal — for prototyping and
 * hands-on work. The mode is a preference (pmide.uiMode) applied as a body
 * class; reader-mode hiding is pure CSS, so nothing is ever unloaded.
 * SPDX-License-Identifier: MIT
 ********************************************************************************/

import { Command, CommandContribution, CommandRegistry, CommandService, Emitter, Event, MAIN_MENU_BAR, MenuContribution, MenuModelRegistry } from '@theia/core';
import { ApplicationShell, FrontendApplicationContribution } from '@theia/core/lib/browser';
import { PreferenceChange, PreferenceContribution, PreferenceSchema, PreferenceService } from '@theia/core/lib/common/preferences';
import { inject, injectable, interfaces } from '@theia/core/shared/inversify';

export type PmideUiMode = 'reader' | 'code';

export const PMIDE_UI_MODE_PREF = 'pmide.uiMode';

export const pmideModePreferenceSchema: PreferenceSchema = {
    properties: {
        [PMIDE_UI_MODE_PREF]: {
            type: 'string',
            enum: ['reader', 'code'],
            default: 'reader',
            description: 'PMIDE surface depth: "reader" shows the calm document workspace; "code" reveals the full IDE (Explorer, Search, Source Control, terminal).',
        },
    },
};

export namespace ModeCommands {
    export const ENTER_CODE_MODE: Command = { id: 'pmide.enterCodeMode', label: 'Enter Code Mode', category: 'PMIDE' };
    export const EXIT_CODE_MODE: Command = { id: 'pmide.exitCodeMode', label: 'Back to Reader Mode', category: 'PMIDE' };
}

const READER_MODE_CLASS = 'pmide-reader-mode';

@injectable()
export class PmideModeService implements FrontendApplicationContribution, CommandContribution, MenuContribution {

    @inject(PreferenceService) protected readonly preferences: PreferenceService;
    @inject(ApplicationShell) protected readonly shell: ApplicationShell;
    @inject(CommandService) protected readonly commands: CommandService;

    protected readonly onChangedEmitter = new Emitter<PmideUiMode>();
    readonly onChanged: Event<PmideUiMode> = this.onChangedEmitter.event;

    get mode(): PmideUiMode {
        return this.preferences.get<PmideUiMode>(PMIDE_UI_MODE_PREF, 'reader');
    }

    onStart(): void {
        this.preferences.ready.then(() => this.applyClass(this.mode));
        this.preferences.onPreferenceChanged((e: PreferenceChange) => {
            if (e.preferenceName === PMIDE_UI_MODE_PREF) {
                const mode = this.mode;
                this.applyClass(mode);
                this.onChangedEmitter.fire(mode);
            }
        });
    }

    protected applyClass(mode: PmideUiMode): void {
        document.body.classList.toggle(READER_MODE_CLASS, mode === 'reader');
    }

    async setMode(mode: PmideUiMode): Promise<void> {
        await this.preferences.set(PMIDE_UI_MODE_PREF, mode);
        if (mode === 'code') {
            // Reveal the developer chrome the PM just asked for.
            try {
                await this.commands.executeCommand('workbench.view.explorer');
            } catch {
                try {
                    await this.commands.executeCommand('fileNavigator:toggle');
                } catch { /* navigator not available: the activity bar is enough */ }
            }
        } else {
            // Back to the calm surface: land on Ask, tuck the bottom panel away.
            this.shell.collapsePanel('bottom');
            const ask = this.shell.getWidgetById('pmide-ask');
            if (ask) {
                this.shell.activateWidget(ask.id);
            }
        }
    }

    registerCommands(registry: CommandRegistry): void {
        registry.registerCommand(ModeCommands.ENTER_CODE_MODE, {
            execute: () => this.setMode('code'),
            isEnabled: () => this.mode !== 'code',
        });
        registry.registerCommand(ModeCommands.EXIT_CODE_MODE, {
            execute: () => this.setMode('reader'),
            isEnabled: () => this.mode !== 'reader',
        });
    }

    registerMenus(menus: MenuModelRegistry): void {
        const PMIDE_MENU = [...MAIN_MENU_BAR, '4_pmide'];
        menus.registerMenuAction(PMIDE_MENU, { commandId: ModeCommands.ENTER_CODE_MODE.id, order: '10' });
        menus.registerMenuAction(PMIDE_MENU, { commandId: ModeCommands.EXIT_CODE_MODE.id, order: '11' });
    }
}

export function bindPmideMode(bind: interfaces.Bind): void {
    bind(PreferenceContribution).toConstantValue({ schema: pmideModePreferenceSchema });
    bind(PmideModeService).toSelf().inSingletonScope();
    bind(FrontendApplicationContribution).toService(PmideModeService);
    bind(CommandContribution).toService(PmideModeService);
    bind(MenuContribution).toService(PmideModeService);
}
