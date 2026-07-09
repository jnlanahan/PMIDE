/********************************************************************************
 * PMIDE widgets — generic HTML-rendered widget base for main-area panels and
 * left-dock section views. Clicks on [data-cmd] delegate to the CommandService.
 * SPDX-License-Identifier: MIT
 ********************************************************************************/

import { CommandService } from '@theia/core';
import { BaseWidget, Message } from '@theia/core/lib/browser';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';

/** Escape a dynamic string for interpolation into widget HTML. */
export function esc(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/**
 * Base for widgets whose content is produced by our own `renderHtml()`
 * templates. Never feed untrusted strings into the template without `esc()`.
 */
@injectable()
export abstract class PmideHtmlWidget extends BaseWidget {

    @inject(CommandService)
    protected readonly commands: CommandService;

    protected abstract renderHtml(): string;

    @postConstruct()
    protected init(): void {
        this.node.classList.add('pmide-root');
        this.node.tabIndex = 0;
        this.node.addEventListener('click', e => {
            const target = (e.target as HTMLElement).closest('[data-cmd]') as HTMLElement | null;
            if (!target) {
                return;
            }
            const cmd = target.getAttribute('data-cmd')!;
            const arg = target.getAttribute('data-arg') ?? undefined;
            this.commands.executeCommand(cmd, arg);
        });
        this.refresh();
    }

    refresh(): void {
        this.node.innerHTML = this.renderHtml();
    }

    protected onActivateRequest(msg: Message): void {
        super.onActivateRequest(msg);
        this.node.focus();
    }
}

/** Left-dock section widget: adds the pmide-side class for compact styling. */
@injectable()
export abstract class PmideSideWidget extends PmideHtmlWidget {
    @postConstruct()
    protected init(): void {
        super.init();
        this.node.classList.add('pmide-side');
    }
}
