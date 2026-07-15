/********************************************************************************
 * PMIDE Specs — the document workspace. A clean reader over markdown specs in
 * git: an editorial preview, editing in the real editor, "Save version" as a
 * git commit with a Claude-drafted plain-language note, and version history
 * as a friendly timeline with diffs. No git jargon in reader mode.
 * SPDX-License-Identifier: MIT
 ********************************************************************************/

import { Command, CommandContribution, CommandRegistry, Emitter, Event, MAIN_MENU_BAR, MenuContribution, MenuModelRegistry, MessageService } from '@theia/core';
import {
    ApplicationShell, BaseWidget, Message, QuickInputService, Saveable, WidgetManager, codicon, open, OpenerService,
} from '@theia/core/lib/browser';
import { DiffUris } from '@theia/core/lib/browser/diff-uris';
import { CoreMarkdownRenderer, MarkdownRenderer } from '@theia/core/lib/browser/markdown-rendering/markdown-renderer';
import URI from '@theia/core/lib/common/uri';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import { EditorManager } from '@theia/editor/lib/browser';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { PmideService, SpecEntry, SpecVersion } from '../common/protocol';
import { PmideAgentFrontend } from './pmide-agent-frontend';
import { PmideDialog } from './pmide-dialog';
import { refUri } from './pmide-git-resource';
import { PmideSpaceService } from './pmide-space';
import { PmideHtmlWidget, esc } from './pmide-widgets';

export namespace SpecsCommands {
    export const OPEN_SPEC: Command = { id: 'pmide.openSpec', label: 'Open Spec', category: 'PMIDE' };
    export const NEW_SPEC: Command = { id: 'pmide.newSpec', label: 'New Spec…', category: 'PMIDE' };
}

/* ────────────────────────────── friendly time ────────────────────────────── */

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export function friendlyDate(iso: string): string {
    const d = new Date(iso);
    if (isNaN(d.getTime())) {
        return iso;
    }
    return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

export function timeAgo(iso: string): string {
    const d = new Date(iso);
    if (isNaN(d.getTime())) {
        return iso;
    }
    const days = Math.floor((Date.now() - d.getTime()) / 86_400_000);
    if (days <= 0) {
        return 'today';
    }
    if (days === 1) {
        return 'yesterday';
    }
    if (days < 30) {
        return `${days} days ago`;
    }
    return friendlyDate(iso);
}

/* ─────────────── shared change feed (commits, new documents) ─────────────── */

@injectable()
export class PmideSpecsFeed {
    protected readonly emitter = new Emitter<void>();
    readonly onChanged: Event<void> = this.emitter.event;
    fire(): void {
        this.emitter.fire();
    }
}

/* ───────────────────────────── the Specs sidebar ───────────────────────────── */

@injectable()
export class PmideSpecsWidget extends PmideHtmlWidget {
    static readonly ID = 'pmide-specs';

    @inject(PmideSpaceService) protected readonly spaces: PmideSpaceService;
    @inject(PmideService) protected readonly service: PmideService;
    @inject(PmideSpecsFeed) protected readonly feed: PmideSpecsFeed;

    protected specs: SpecEntry[] = [];
    protected changed = new Set<string>();

    @postConstruct()
    protected init(): void {
        super.init();
        this.id = PmideSpecsWidget.ID;
        this.title.label = 'Specs';
        this.title.caption = 'Specs — the document workspace';
        this.title.iconClass = codicon('book');
        this.title.closable = true;
        this.addClass('pmide-side');
        this.toDispose.push(this.spaces.onChanged(() => this.reload()));
        this.toDispose.push(this.feed.onChanged(() => this.reload()));
        this.reload();
    }

    protected onAfterShow(msg: Message): void {
        super.onAfterShow(msg);
        this.reload();
    }

    protected async reload(): Promise<void> {
        const { productRoot } = this.spaces.space;
        if (!productRoot) {
            this.specs = [];
            this.changed.clear();
            this.refresh();
            return;
        }
        try {
            const [specs, changes] = await Promise.all([
                this.service.listSpecs(productRoot),
                this.service.changedFiles(productRoot),
            ]);
            this.specs = specs;
            this.changed = new Set(changes.map(c => c.path.replace(/\\/g, '/')));
        } catch {
            this.specs = [];
            this.changed.clear();
        }
        this.refresh();
    }

    protected renderHtml(): string {
        const { productRoot } = this.spaces.space;
        if (!productRoot) {
            return '<div class="empty-state">Open your product folder first —<br>your documents will live there, in <code>specs/</code>.</div>';
        }
        const parts: string[] = [];
        parts.push('<div class="side-section-label">Documents</div>');
        if (!this.specs.length) {
            parts.push('<div class="empty-state">No documents yet.<br>Every document you create is saved and versioned in your product repository.</div>');
        }
        for (const spec of this.specs) {
            const dirty = this.changed.has(spec.relPath);
            const folder = spec.relPath.includes('/') ? spec.relPath.slice(0, spec.relPath.lastIndexOf('/')) : '';
            const folderNote = folder && folder !== 'specs' ? ` · ${esc(folder.replace(/^specs\//, ''))}` : '';
            const dirtyNote = dirty ? ' <span class="spec-dirty-tag">unsaved changes</span>' : '';
            parts.push(`<div class="side-card" data-cmd="${SpecsCommands.OPEN_SPEC.id}" data-arg="${esc(spec.relPath)}" title="${esc(spec.relPath)}">
                <div class="side-card-title">${esc(spec.title)}</div>
                <div class="side-card-meta">${esc(timeAgo(spec.modified))}${folderNote}${dirtyNote}</div>
            </div>`);
        }
        parts.push(`<div class="ctx-actions"><button class="btn primary sm" data-cmd="${SpecsCommands.NEW_SPEC.id}">New document…</button></div>`);
        return parts.join('');
    }
}

/* ───────────────────────────── the spec reader ───────────────────────────── */

export interface SpecEditorOptions {
    repo: string;
    relPath: string;
}

@injectable()
export class PmideSpecEditorWidget extends BaseWidget {

    static readonly FACTORY_ID = 'pmide-spec-editor';

    @inject(PmideService) protected readonly service: PmideService;
    @inject(PmideAgentFrontend) protected readonly agent: PmideAgentFrontend;
    @inject(PmideSpecsFeed) protected readonly feed: PmideSpecsFeed;
    @inject(EditorManager) protected readonly editors: EditorManager;
    @inject(OpenerService) protected readonly openers: OpenerService;
    @inject(MessageService) protected readonly messages: MessageService;
    @inject(FileService) protected readonly files: FileService;
    @inject(CoreMarkdownRenderer) protected readonly markdown: MarkdownRenderer;

    protected repo!: string;
    protected relPath!: string;
    protected specTitle = '';
    protected dirty = false;
    protected saving = false;
    protected versions: SpecVersion[] = [];
    protected historyOpen = false;

    protected titleNode!: HTMLElement;
    protected metaNode!: HTMLElement;
    protected saveButton!: HTMLButtonElement;
    protected articleNode!: HTMLElement;
    protected historyNode!: HTMLElement;
    protected renderDisposable: { dispose(): void } | undefined;

    configure(options: SpecEditorOptions): void {
        this.repo = options.repo;
        this.relPath = options.relPath.replace(/\\/g, '/');
        this.id = `${PmideSpecEditorWidget.FACTORY_ID}:${this.relPath}`;
        this.specTitle = this.basename(this.relPath);
        this.title.label = this.specTitle;
        this.title.caption = this.relPath;
        this.title.iconClass = codicon('book');
        this.title.closable = true;
        this.addClass('pmide-root');
        this.addClass('pmide-spec-editor');
        this.buildDom();
        const uri = this.fileUri();
        this.toDispose.push(this.files.watch(uri));
        this.toDispose.push(this.files.onDidFilesChange(e => {
            if (e.contains(uri)) {
                this.reload();
            }
        }));
        this.reload();
    }

    protected fileUri(): URI {
        return new URI(`file:///${this.repo.replace(/\\/g, '/')}`).resolve(this.relPath);
    }

    protected basename(p: string): string {
        return (p.split('/').pop() ?? p).replace(/\.(md|markdown)$/i, '');
    }

    protected buildDom(): void {
        this.node.tabIndex = 0;

        const header = document.createElement('div');
        header.className = 'spec-header';
        const headText = document.createElement('div');
        headText.className = 'spec-head-text';
        this.titleNode = document.createElement('div');
        this.titleNode.className = 'spec-title';
        this.metaNode = document.createElement('div');
        this.metaNode.className = 'spec-meta';
        headText.append(this.titleNode, this.metaNode);

        const actions = document.createElement('div');
        actions.className = 'spec-actions';
        const historyButton = this.makeButton('History', 'btn ghost sm', () => this.toggleHistory());
        const editButton = this.makeButton('Edit', 'btn ghost sm', () => this.openInEditor());
        this.saveButton = this.makeButton('Save version', 'btn primary sm', () => this.saveVersion());
        actions.append(historyButton, editButton, this.saveButton);
        header.append(headText, actions);

        const body = document.createElement('div');
        body.className = 'spec-body';
        const scroll = document.createElement('div');
        scroll.className = 'spec-scroll';
        this.articleNode = document.createElement('article');
        this.articleNode.className = 'pmide-reader';
        scroll.appendChild(this.articleNode);
        this.historyNode = document.createElement('aside');
        this.historyNode.className = 'spec-history';
        this.historyNode.style.display = 'none';
        body.append(scroll, this.historyNode);

        this.node.append(header, body);
    }

    protected makeButton(label: string, cls: string, onClick: () => void): HTMLButtonElement {
        const button = document.createElement('button');
        button.className = cls;
        button.textContent = label;
        button.addEventListener('click', onClick);
        return button;
    }

    protected async reload(): Promise<void> {
        let content = '';
        try {
            content = await this.service.readFile(this.repo, this.relPath);
        } catch {
            this.articleNode.textContent = 'This document could not be read — it may have been moved or deleted.';
            return;
        }
        const heading = /^#\s+(.+)$/m.exec(content.slice(0, 4096));
        this.specTitle = heading ? heading[1].trim() : this.basename(this.relPath);
        this.title.label = this.specTitle;
        this.titleNode.textContent = this.specTitle;

        this.renderDisposable?.dispose();
        this.articleNode.textContent = '';
        const rendered = this.markdown.render({ value: content });
        this.renderDisposable = rendered;
        this.articleNode.appendChild(rendered.element);

        try {
            const status = await this.service.git(this.repo, ['status', '--porcelain', '--', this.relPath]);
            this.dirty = status.code === 0 && !!status.stdout.trim();
        } catch {
            this.dirty = false;
        }
        await this.loadVersions();
        this.renderMeta();
        if (this.historyOpen) {
            this.renderHistory();
        }
    }

    protected async loadVersions(): Promise<void> {
        try {
            this.versions = await this.service.fileLog(this.repo, this.relPath, 50);
        } catch {
            this.versions = [];
        }
    }

    protected renderMeta(): void {
        this.metaNode.textContent = '';
        const last = this.versions[0];
        const state = document.createElement('span');
        if (this.dirty) {
            state.className = 'spec-dirty-tag';
            state.textContent = 'unsaved changes';
        } else if (last) {
            state.textContent = `Saved ${timeAgo(last.date)} — “${last.subject}”`;
        } else {
            state.textContent = 'Not saved as a version yet';
        }
        this.metaNode.appendChild(state);
        if (this.dirty && this.versions.length) {
            const review = document.createElement('span');
            review.className = 'spec-review-link';
            review.textContent = 'review changes';
            review.addEventListener('click', () => this.openUnsavedDiff());
            this.metaNode.appendChild(review);
        }
    }

    protected toggleHistory(): void {
        this.historyOpen = !this.historyOpen;
        this.historyNode.style.display = this.historyOpen ? '' : 'none';
        if (this.historyOpen) {
            this.renderHistory();
        }
    }

    protected renderHistory(): void {
        this.historyNode.textContent = '';
        const label = document.createElement('div');
        label.className = 'spec-history-label';
        label.textContent = 'Version history';
        this.historyNode.appendChild(label);

        if (this.dirty) {
            const entry = document.createElement('div');
            entry.className = 'spec-version current';
            const subject = document.createElement('div');
            subject.className = 'spec-version-subject';
            subject.textContent = 'Unsaved changes';
            const meta = document.createElement('div');
            meta.className = 'spec-version-meta';
            meta.textContent = 'Being edited now — click to review what changed';
            entry.append(subject, meta);
            entry.addEventListener('click', () => this.openUnsavedDiff());
            this.historyNode.appendChild(entry);
        }
        if (!this.versions.length) {
            const none = document.createElement('div');
            none.className = 'spec-version-meta';
            none.style.padding = '8px 14px';
            none.textContent = 'No saved versions yet. “Save version” records one.';
            this.historyNode.appendChild(none);
            return;
        }
        this.versions.forEach((version, i) => {
            const entry = document.createElement('div');
            entry.className = 'spec-version';
            const subject = document.createElement('div');
            subject.className = 'spec-version-subject';
            subject.textContent = version.subject || '(no note)';
            const meta = document.createElement('div');
            meta.className = 'spec-version-meta';
            meta.textContent = `${friendlyDate(version.date)} · ${version.author}${i === 0 ? ' · latest' : ''}`;
            entry.append(subject, meta);
            entry.title = 'Click to see what changed in this version';
            entry.addEventListener('click', () => this.openVersionDiff(version));
            this.historyNode.appendChild(entry);
        });
    }

    protected async openVersionDiff(version: SpecVersion): Promise<void> {
        const left = refUri(this.repo, this.relPath, `${version.sha}^`);
        const right = refUri(this.repo, this.relPath, version.sha);
        const label = `${this.specTitle} — ${friendlyDate(version.date)}`;
        await open(this.openers, DiffUris.encode(left, right, label));
    }

    protected async openUnsavedDiff(): Promise<void> {
        const left = refUri(this.repo, this.relPath, 'HEAD');
        const label = `${this.specTitle} — unsaved changes`;
        await open(this.openers, DiffUris.encode(left, this.fileUri(), label));
    }

    protected async openInEditor(): Promise<void> {
        await this.editors.open(this.fileUri(), { mode: 'activate' });
    }

    /* ────────────── Save version: diff → drafted note → review → commit ────────────── */

    protected async saveVersion(): Promise<void> {
        if (this.saving) {
            return;
        }
        this.saving = true;
        this.saveButton.disabled = true;
        this.saveButton.textContent = 'Saving…';
        try {
            await this.doSaveVersion();
        } finally {
            this.saving = false;
            this.saveButton.disabled = false;
            this.saveButton.textContent = 'Save version';
        }
    }

    protected async doSaveVersion(): Promise<void> {
        // Flush any unsaved editor buffer for this file first.
        const editorWidget = await this.editors.getByUri(this.fileUri());
        if (editorWidget && Saveable.isDirty(editorWidget)) {
            await Saveable.save(editorWidget);
        }
        const status = await this.service.git(this.repo, ['status', '--porcelain', '--', this.relPath]);
        if (status.code !== 0) {
            this.messages.error('Could not check this document’s state: ' + (status.stderr || 'git failed'));
            return;
        }
        if (!status.stdout.trim()) {
            this.messages.info('Nothing to save — this document matches its last saved version.');
            return;
        }
        const untracked = status.stdout.trimStart().startsWith('??');
        let diff: string;
        if (untracked) {
            const content = await this.service.readFile(this.repo, this.relPath);
            diff = `(new document)\n\n${content}`;
        } else {
            const d = await this.service.git(this.repo, ['diff', 'HEAD', '--', this.relPath]);
            diff = d.stdout;
        }
        this.saveButton.textContent = 'Drafting a note…';
        const drafted = await this.draftVersionNote(diff);
        const note = await this.confirmVersionNote(drafted ?? `Update ${this.specTitle}`);
        if (note === undefined) {
            return;
        }
        const result = await this.service.commitPaths(this.repo, [this.relPath], note);
        if (result.code !== 0) {
            this.messages.error('Saving the version failed: ' + (result.stderr || result.stdout || 'git commit failed'));
            return;
        }
        this.messages.info(`Version saved — “${note}”`);
        this.feed.fire();
        await this.reload();
    }

    /** Ask the engine for a one-line plain-language version note. Undefined on any failure. */
    protected async draftVersionNote(diff: string): Promise<string | undefined> {
        const truncated = diff.length > 6000 ? diff.slice(0, 6000) + '\n…(truncated)' : diff;
        const prompt = `The product document "${this.specTitle}" (${this.relPath}) changed as follows:\n\n${truncated}\n\n`
            + 'Write the one-line version note now.';
        const systemPrompt = [
            'You draft one-line version notes for product documents written by product managers.',
            'Respond with ONLY the note itself — no quotes, no preamble, no explanation.',
            'Plain language a non-technical teammate understands; describe what changed in the document, not file mechanics.',
            'At most 80 characters.',
        ].join('\n');
        return new Promise<string | undefined>(resolve => {
            let text = '';
            let done = false;
            const finish = (value: string | undefined): void => {
                if (!done) {
                    done = true;
                    resolve(value);
                }
            };
            const handle = this.agent.run(prompt, {
                cwd: this.repo,
                systemPrompt,
                allowedTools: [],
                maxTurns: 1,
            });
            const timeout = setTimeout(() => {
                handle.cancel();
                finish(undefined);
            }, 30_000);
            handle.onMessage(m => {
                if (m?.type === 'assistant' && m.message?.content) {
                    for (const block of m.message.content) {
                        if (block.type === 'text' && block.text) {
                            text += block.text;
                        }
                    }
                }
                if (m?.type === 'result' && !text && typeof m.result === 'string') {
                    text = m.result;
                }
            });
            handle.onClose(() => {
                clearTimeout(timeout);
                const note = text.trim().split('\n')[0].replace(/^["'“”]+|["'“”]+$/g, '').trim();
                finish(note ? note.slice(0, 120) : undefined);
            });
            handle.onError(() => {
                clearTimeout(timeout);
                finish(undefined);
            });
        });
    }

    /** Show the drafted note for review. Returns the final note, or undefined if canceled. */
    protected async confirmVersionNote(drafted: string): Promise<string | undefined> {
        const dialog = new PmideDialog({
            title: 'Save a version',
            size: 'narrow',
            html: `<div class="field">
                <div class="field-label">Version note</div>
                <textarea id="spec-version-note" class="field-textarea" style="min-height:64px">${esc(drafted)}</textarea>
                <div class="field-hint">A short plain-language note describing this version — your teammates (and you, later) will read it in the timeline.</div>
            </div>`,
            buttons: [
                { id: 'cancel', label: 'Cancel', cls: 'ghost' },
                { id: 'save', label: 'Save version', cls: 'primary' },
            ],
        });
        const outcome = await dialog.open();
        if (outcome !== 'save') {
            return undefined;
        }
        const note = dialog.readValue('spec-version-note').trim().split('\n')[0].trim();
        return note || drafted;
    }

    protected onActivateRequest(msg: Message): void {
        super.onActivateRequest(msg);
        this.node.focus();
    }

    dispose(): void {
        this.renderDisposable?.dispose();
        super.dispose();
    }
}

/* ─────────────────────── commands: open + new document ─────────────────────── */

@injectable()
export class PmideSpecsContribution implements CommandContribution, MenuContribution {

    @inject(PmideSpaceService) protected readonly spaces: PmideSpaceService;
    @inject(PmideService) protected readonly service: PmideService;
    @inject(WidgetManager) protected readonly widgets: WidgetManager;
    @inject(ApplicationShell) protected readonly shell: ApplicationShell;
    @inject(MessageService) protected readonly messages: MessageService;
    @inject(QuickInputService) protected readonly quickInput: QuickInputService;
    @inject(PmideSpecsFeed) protected readonly feed: PmideSpecsFeed;

    registerCommands(registry: CommandRegistry): void {
        registry.registerCommand(SpecsCommands.OPEN_SPEC, {
            execute: (relPath: string) => this.openSpec(relPath),
        });
        registry.registerCommand(SpecsCommands.NEW_SPEC, {
            execute: () => this.newSpec(),
        });
    }

    registerMenus(menus: MenuModelRegistry): void {
        const PMIDE_MENU = [...MAIN_MENU_BAR, '4_pmide'];
        menus.registerMenuAction(PMIDE_MENU, { commandId: SpecsCommands.NEW_SPEC.id, order: '02' });
    }

    async openSpec(relPath: string): Promise<void> {
        const { productRoot } = this.spaces.space;
        if (!productRoot || !relPath) {
            return;
        }
        const options: SpecEditorOptions = { repo: productRoot, relPath };
        const widget = await this.widgets.getOrCreateWidget<PmideSpecEditorWidget>(PmideSpecEditorWidget.FACTORY_ID, options);
        if (!widget.isAttached) {
            this.shell.addWidget(widget, { area: 'main' });
        }
        await this.shell.activateWidget(widget.id);
    }

    async newSpec(): Promise<void> {
        const { productRoot } = this.spaces.space;
        if (!productRoot) {
            this.messages.info('Open your product folder first — new documents are created there, in specs/.');
            return;
        }
        const title = (await this.quickInput.input({
            prompt: 'Name the new document',
            placeHolder: 'e.g. Refund policy',
        }))?.trim();
        if (!title) {
            return;
        }
        const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'untitled';
        const existing = new Set((await this.service.listSpecs(productRoot)).map(s => s.relPath));
        let relPath = `specs/${slug}.md`;
        for (let i = 2; existing.has(relPath); i++) {
            relPath = `specs/${slug}-${i}.md`;
        }
        await this.service.writeFile(productRoot, relPath, `# ${title}\n\n`);
        this.feed.fire();
        await this.openSpec(relPath);
    }
}
