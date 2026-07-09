/********************************************************************************
 * PMIDE dialog — a Theia AbstractDialog that renders HTML-string bodies with
 * declarative footer buttons and in-body [data-action] delegation.
 * SPDX-License-Identifier: MIT
 ********************************************************************************/

import { AbstractDialog } from '@theia/core/lib/browser/dialogs';

export interface PmideDialogButton {
    id: string;
    label: string;
    /** btn class suffix: 'primary' | 'safe' | 'ghost' | 'warn-ghost' | 'danger-ghost' */
    cls?: string;
}

export interface PmideDialogOptions {
    title: string;
    html: string;
    buttons: PmideDialogButton[];
    size?: 'narrow' | 'wide' | '';
    /**
     * Called for clicks on [data-action] elements inside the body.
     * Return an HTML string to re-render the body, 'close:<id>' to resolve
     * the dialog with <id>, or undefined to do nothing.
     */
    onAction?: (action: string, dialog: PmideDialog) => string | undefined;
}

export class PmideDialog extends AbstractDialog<string> {

    protected result = '';
    protected readonly opts: PmideDialogOptions;

    constructor(opts: PmideDialogOptions) {
        super({ title: opts.title });
        this.opts = opts;
        this.addClass('pmide-dialog');
        if (opts.size) {
            this.addClass(opts.size);
        }
        this.contentNode.classList.add('pmide-root');
        this.setBody(opts.html);

        this.contentNode.addEventListener('click', e => {
            const target = (e.target as HTMLElement).closest('[data-action]') as HTMLElement | null;
            if (!target || !this.opts.onAction) {
                return;
            }
            const action = target.getAttribute('data-action')!;
            const outcome = this.opts.onAction(action, this);
            if (outcome === undefined) {
                return;
            }
            if (outcome.startsWith('close:')) {
                this.result = outcome.slice('close:'.length);
                this.accept();
            } else {
                this.setBody(outcome);
            }
        });

        for (const b of opts.buttons) {
            const button = this.createButton(b.label);
            button.classList.add('pmide-btn-' + (b.cls || 'ghost'));
            if (b.cls === 'primary' || b.cls === 'safe') {
                button.classList.add('main');
            } else {
                button.classList.add('secondary');
            }
            this.controlPanel.appendChild(button);
            button.addEventListener('click', () => {
                this.result = b.id;
                this.accept();
            });
        }
    }

    setBody(html: string): void {
        this.contentNode.innerHTML = html;
    }

    /** Read an input/textarea value from the dialog body by element id. */
    readValue(id: string): string {
        const el = this.contentNode.querySelector('#' + id) as HTMLInputElement | HTMLTextAreaElement | null;
        return el ? el.value : '';
    }

    get value(): string {
        return this.result;
    }
}
