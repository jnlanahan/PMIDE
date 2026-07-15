/********************************************************************************
 * PMIDE Workflows — packages and the runner. A package is a Claude Code
 * plugin-shaped folder in the product repo (.pmide/packages/<id>/) scaffolded
 * from a baseline template ("use this template" — an independently owned
 * copy, no live tether). The runner is manifest-driven: it collects inputs,
 * runs the package's skill through the engine seam with read-only tools, and
 * shows the draft behind a human review gate — nothing lands in the repo
 * until the PM accepts it.
 * SPDX-License-Identifier: MIT
 ********************************************************************************/

import { Command, CommandContribution, CommandRegistry, CommandService, Emitter, Event, MessageService } from '@theia/core';
import { ApplicationShell, BaseWidget, Message, WidgetManager, codicon } from '@theia/core/lib/browser';
import { CoreMarkdownRenderer, MarkdownRenderer } from '@theia/core/lib/browser/markdown-rendering/markdown-renderer';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import { BASELINE_PACKAGES, PackageInput, PmidePackage, PmideService, SpecEntry } from '../common/protocol';
import { AgentMessage } from '../common/agent-protocol';
import { AgentRunHandle, PmideAgentFrontend } from './pmide-agent-frontend';
import { PmideSpaceService } from './pmide-space';
import { PmideSpecsFeed, SpecsCommands } from './pmide-specs';
import { PmideHtmlWidget, esc } from './pmide-widgets';

export namespace WorkflowCommands {
    export const OPEN_WORKFLOW: Command = { id: 'pmide.openWorkflow', label: 'Open Workflow', category: 'PMIDE' };
    export const ADD_PACKAGE: Command = { id: 'pmide.addPackage', label: 'Add Workflow Package', category: 'PMIDE' };
}

const READ_ONLY_TOOLS = [
    'Read', 'Grep', 'Glob',
    'mcp__space-index__pmide_search',
    'mcp__space-index__pmide_facts',
];

const ARTIFACT_PATTERN = /<<<ARTIFACT\s*\r?\n([\s\S]*?)\r?\nARTIFACT>>>/g;

/* ─────────────── shared feed: package installs ─────────────── */

@injectable()
export class PmideWorkflowsFeed {
    protected readonly emitter = new Emitter<void>();
    readonly onChanged: Event<void> = this.emitter.event;
    fire(): void {
        this.emitter.fire();
    }
}

/* ───────────────────────── the Workflows sidebar ───────────────────────── */

@injectable()
export class PmideWorkflowsWidget extends PmideHtmlWidget {
    static readonly ID = 'pmide-workflows';

    @inject(PmideSpaceService) protected readonly spaces: PmideSpaceService;
    @inject(PmideService) protected readonly service: PmideService;
    @inject(PmideWorkflowsFeed) protected readonly feed: PmideWorkflowsFeed;

    protected packages: PmidePackage[] = [];

    @postConstruct()
    protected init(): void {
        super.init();
        this.id = PmideWorkflowsWidget.ID;
        this.title.label = 'Workflows';
        this.title.caption = 'Workflows — packages and runs';
        this.title.iconClass = codicon('checklist');
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
            this.packages = [];
            this.refresh();
            return;
        }
        try {
            this.packages = await this.service.listPackages(productRoot);
        } catch {
            this.packages = [];
        }
        this.refresh();
    }

    protected renderHtml(): string {
        const { productRoot } = this.spaces.space;
        if (!productRoot) {
            return '<div class="empty-state">Open your product folder first —<br>workflow packages are installed there, in <code>.pmide/packages/</code>.</div>';
        }
        const parts: string[] = [];
        if (this.packages.length) {
            parts.push('<div class="side-section-label">Installed packages</div>');
            for (const p of this.packages) {
                parts.push(`<div class="side-card" data-cmd="${WorkflowCommands.OPEN_WORKFLOW.id}" data-arg="${esc(p.id)}" title="${esc(p.path)}">
                    <div class="side-card-title">${esc(p.name)}</div>
                    <div class="side-card-meta">${esc(p.description)}</div>
                </div>`);
            }
        }
        const installed = new Set(this.packages.map(p => p.id));
        const available = BASELINE_PACKAGES.filter(t => !installed.has(t.id));
        if (available.length) {
            parts.push('<div class="side-section-label">Templates</div>');
            if (!this.packages.length) {
                parts.push('<div class="ctx-note">A package bundles the instructions and structure for one kind of PM work. '
                    + 'Add one to get started — your copy lives in this repo and is yours to edit.</div>');
            }
            for (const t of available) {
                const addButton = `<button class="btn ghost sm" data-cmd="${WorkflowCommands.ADD_PACKAGE.id}" data-arg="${esc(t.id)}">Use this template</button>`;
                parts.push(`<div class="side-card wf-template">
                    <div class="side-card-title">${esc(t.name)}</div>
                    <div class="side-card-meta">${esc(t.description)}</div>
                    <div class="wf-template-actions">${addButton}</div>
                </div>`);
            }
        }
        return parts.join('');
    }
}

/* ───────────────────────────── the runner ───────────────────────────── */

export interface WorkflowRunnerOptions {
    repo: string;
    packageId: string;
}

@injectable()
export class PmideWorkflowRunnerWidget extends BaseWidget {

    static readonly FACTORY_ID = 'pmide-workflow-runner';

    @inject(PmideService) protected readonly service: PmideService;
    @inject(PmideAgentFrontend) protected readonly agent: PmideAgentFrontend;
    @inject(PmideSpaceService) protected readonly spaces: PmideSpaceService;
    @inject(PmideSpecsFeed) protected readonly specsFeed: PmideSpecsFeed;
    @inject(MessageService) protected readonly messages: MessageService;
    @inject(CoreMarkdownRenderer) protected readonly markdown: MarkdownRenderer;
    @inject(CommandService) protected readonly commands: CommandService;

    protected repo!: string;
    protected packageId!: string;
    protected pkg: PmidePackage | undefined;
    protected specs: SpecEntry[] = [];
    protected run: AgentRunHandle | undefined;
    protected artifact = '';

    protected formNode!: HTMLElement;
    protected runButton!: HTMLButtonElement;
    protected statusNode!: HTMLElement;
    protected reviewNode!: HTMLElement;
    protected renderDisposable: { dispose(): void } | undefined;

    configure(options: WorkflowRunnerOptions): void {
        this.repo = options.repo;
        this.packageId = options.packageId;
        this.id = `${PmideWorkflowRunnerWidget.FACTORY_ID}:${this.packageId}`;
        this.title.label = this.packageId;
        this.title.iconClass = codicon('checklist');
        this.title.closable = true;
        this.addClass('pmide-root');
        this.addClass('pmide-workflow-runner');
        this.load();
    }

    protected async load(): Promise<void> {
        const [packages, specs] = await Promise.all([
            this.service.listPackages(this.repo),
            this.service.listSpecs(this.repo).catch(() => [] as SpecEntry[]),
        ]);
        this.pkg = packages.find(p => p.id === this.packageId);
        this.specs = specs;
        if (!this.pkg) {
            this.node.textContent = `The package "${this.packageId}" is not installed in this space.`;
            return;
        }
        this.title.label = this.pkg.name;
        this.title.caption = this.pkg.description;
        this.buildDom();
    }

    protected buildDom(): void {
        const pkg = this.pkg!;
        this.node.textContent = '';
        this.node.tabIndex = 0;

        const scroll = document.createElement('div');
        scroll.className = 'wf-scroll';

        const header = document.createElement('div');
        header.className = 'wf-header';
        const title = document.createElement('div');
        title.className = 'wf-title';
        title.textContent = pkg.name;
        const description = document.createElement('div');
        description.className = 'wf-description';
        description.textContent = pkg.description;
        const gate = document.createElement('div');
        gate.className = 'wf-gate-note';
        gate.textContent = 'Runs read-only. You review the draft before anything is saved.';
        header.append(title, description, gate);

        this.formNode = document.createElement('div');
        this.formNode.className = 'wf-form';
        for (const input of pkg.inputs) {
            this.formNode.appendChild(this.buildField(input));
        }

        const controls = document.createElement('div');
        controls.className = 'wf-controls';
        this.runButton = document.createElement('button');
        this.runButton.className = 'btn primary';
        this.runButton.textContent = 'Run workflow';
        this.runButton.addEventListener('click', () => this.run ? this.cancelRun() : this.startRun());
        this.statusNode = document.createElement('div');
        this.statusNode.className = 'wf-status';
        controls.append(this.runButton, this.statusNode);

        this.reviewNode = document.createElement('div');
        this.reviewNode.className = 'wf-review';

        scroll.append(header, this.formNode, controls, this.reviewNode);
        this.node.appendChild(scroll);
    }

    protected buildField(input: PackageInput): HTMLElement {
        const field = document.createElement('div');
        field.className = 'field';
        const label = document.createElement('div');
        label.className = 'field-label';
        label.textContent = input.label;
        field.appendChild(label);
        let control: HTMLElement;
        if (input.type === 'multiline') {
            const textarea = document.createElement('textarea');
            textarea.className = 'field-textarea';
            control = textarea;
        } else if (input.type === 'spec') {
            const select = document.createElement('select');
            select.className = 'field-select';
            for (const spec of this.specs) {
                const option = document.createElement('option');
                option.value = spec.relPath;
                option.textContent = `${spec.title} (${spec.relPath})`;
                select.appendChild(option);
            }
            if (!this.specs.length) {
                const option = document.createElement('option');
                option.value = '';
                option.textContent = 'No documents in specs/ yet';
                select.appendChild(option);
            }
            control = select;
        } else {
            const text = document.createElement('input');
            text.className = 'field-input';
            text.type = 'text';
            control = text;
        }
        control.setAttribute('data-input-id', input.id);
        field.appendChild(control);
        if (input.hint) {
            const hint = document.createElement('div');
            hint.className = 'field-hint';
            hint.textContent = input.hint;
            field.appendChild(hint);
        }
        return field;
    }

    protected readInputs(): Map<string, string> {
        const values = new Map<string, string>();
        this.formNode.querySelectorAll('[data-input-id]').forEach(el => {
            values.set(el.getAttribute('data-input-id')!, (el as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement).value.trim());
        });
        return values;
    }

    /* ───────────── running ───────────── */

    protected async startRun(): Promise<void> {
        const pkg = this.pkg!;
        const values = this.readInputs();
        for (const input of pkg.inputs) {
            if (!input.optional && !values.get(input.id)) {
                this.messages.info(`Fill in “${input.label}” first.`);
                return;
            }
        }
        let specContent = '';
        const specPath = values.get('spec');
        if (pkg.mode === 'revise-spec') {
            if (!specPath) {
                this.messages.info('Pick the spec to revise first.');
                return;
            }
            specContent = await this.service.readFile(this.repo, specPath);
        }
        const skill = await this.service.readPackageSkill(this.repo, this.packageId);

        const systemPrompt = [
            `You are running the "${pkg.name}" workflow inside PMIDE, an IDE for product managers.`,
            'The person triggering you is a product manager; they review your draft before anything is saved.',
            '',
            skill,
            '',
            'Workflow contract (mandatory):',
            '- Use only read-only tools (Read, Grep, Glob, and the space tools pmide_search / pmide_facts) to ground your work in this Product Space.',
            '- You cannot change files. You produce a draft; a human reviews and saves it.',
            '- Finish by writing the complete artifact as markdown between these exact markers, each on its own line:',
            '<<<ARTIFACT',
            '# <title>',
            '…the artifact…',
            'ARTIFACT>>>',
            '- The artifact must begin with a single `# ` title line. Nothing outside the markers is saved.',
        ].join('\n');

        const promptParts: string[] = ['Run the workflow with these inputs:', ''];
        for (const input of pkg.inputs) {
            const value = values.get(input.id) ?? '';
            if (!value) {
                continue;
            }
            if (input.type === 'multiline') {
                promptParts.push(`${input.label}:`, '<<<', value, '>>>', '');
            } else {
                promptParts.push(`${input.label}: ${value}`, '');
            }
        }
        if (pkg.mode === 'revise-spec' && specPath) {
            promptParts.push(`Current content of ${specPath}:`, '<<<SPEC', specContent, 'SPEC>>>', '');
        }

        const { roots } = this.spaces.space;
        this.artifact = '';
        this.clearReview();
        this.setStatus('Working — grounding the draft in this space…');
        this.runButton.textContent = 'Cancel';

        let streamed = '';
        const handle = this.agent.run(promptParts.join('\n'), {
            cwd: this.repo,
            additionalDirectories: roots.slice(1),
            systemPrompt,
            allowedTools: READ_ONLY_TOOLS,
            pmideToolServers: ['space-index'],
            maxTurns: 40,
        });
        this.run = handle;
        handle.onMessage(m => {
            streamed += this.consumeMessage(m);
        });
        handle.onError(err => {
            this.setStatus('');
            this.messages.error('The workflow could not finish: ' + err);
        });
        handle.onClose(() => {
            this.run = undefined;
            this.runButton.textContent = 'Run workflow';
            this.setStatus('');
            this.finishRun(streamed);
        });
    }

    protected consumeMessage(m: AgentMessage): string {
        if (!m || typeof m !== 'object') {
            return '';
        }
        let text = '';
        if (m.type === 'assistant' && m.message?.content) {
            for (const block of m.message.content) {
                if (block.type === 'text' && block.text) {
                    text += block.text;
                } else if (block.type === 'tool_use') {
                    this.setStatus(this.describeTool(block.name, block.input));
                }
            }
        }
        if (m.type === 'result' && !text && typeof m.result === 'string') {
            text = m.result;
        }
        return text;
    }

    protected describeTool(name: string, input: unknown): string {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const i = (input ?? {}) as any;
        switch (name) {
            case 'mcp__space-index__pmide_search': return `Searching the space for “${String(i.query ?? '').slice(0, 60)}”…`;
            case 'mcp__space-index__pmide_facts': return 'Checking what sources this space has…';
            case 'Read': return `Reading ${String(i.file_path ?? '').split(/[\\/]/).pop()}…`;
            case 'Grep': return `Scanning for “${String(i.pattern ?? '').slice(0, 40)}”…`;
            case 'Glob': return 'Listing files…';
            default: return 'Working…';
        }
    }

    protected cancelRun(): void {
        this.run?.cancel();
    }

    protected setStatus(text: string): void {
        this.statusNode.textContent = text;
    }

    /* ───────────── the review gate ───────────── */

    protected finishRun(streamed: string): void {
        let artifact: string | undefined;
        let match: RegExpExecArray | undefined;
        ARTIFACT_PATTERN.lastIndex = 0;
        for (let m = ARTIFACT_PATTERN.exec(streamed); m; m = ARTIFACT_PATTERN.exec(streamed)) {
            match = m;
        }
        if (match) {
            artifact = match[1].trim();
        } else if (streamed.trim().startsWith('# ')) {
            artifact = streamed.trim();
        }
        if (!artifact) {
            if (streamed.trim()) {
                this.messages.warn('The run finished without producing an artifact. Its notes: ' + streamed.trim().slice(0, 200));
            }
            return;
        }
        this.artifact = artifact;
        this.renderReview();
    }

    protected clearReview(): void {
        this.renderDisposable?.dispose();
        this.renderDisposable = undefined;
        this.reviewNode.textContent = '';
    }

    protected renderReview(): void {
        const pkg = this.pkg!;
        this.clearReview();

        const bar = document.createElement('div');
        bar.className = 'wf-review-bar';
        const note = document.createElement('div');
        note.className = 'wf-review-note';
        note.textContent = pkg.mode === 'revise-spec'
            ? 'Draft revision — nothing has been changed yet. Applying updates the document for your review; you still choose when to save a version.'
            : 'Draft — nothing has been saved yet.';
        const actions = document.createElement('div');
        actions.className = 'wf-review-actions';
        const discard = document.createElement('button');
        discard.className = 'btn ghost sm';
        discard.textContent = 'Discard';
        discard.addEventListener('click', () => {
            this.artifact = '';
            this.clearReview();
        });
        const accept = document.createElement('button');
        accept.className = 'btn primary sm';
        accept.textContent = pkg.mode === 'revise-spec' ? 'Apply to the document' : 'Save to the space';
        accept.addEventListener('click', () => this.accept());
        actions.append(discard, accept);
        bar.append(note, actions);

        const preview = document.createElement('article');
        preview.className = 'pmide-reader wf-preview';
        const rendered = this.markdown.render({ value: this.artifact });
        this.renderDisposable = rendered;
        preview.appendChild(rendered.element);

        this.reviewNode.append(bar, preview);
        this.reviewNode.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    protected async accept(): Promise<void> {
        const pkg = this.pkg!;
        if (!this.artifact) {
            return;
        }
        try {
            let relPath: string;
            if (pkg.mode === 'revise-spec') {
                relPath = this.readInputs().get('spec') ?? '';
                if (!relPath) {
                    return;
                }
            } else {
                relPath = await this.newDocPath(pkg);
            }
            await this.service.writeFile(this.repo, relPath, this.artifact.endsWith('\n') ? this.artifact : this.artifact + '\n');
            this.specsFeed.fire();
            this.messages.info(pkg.mode === 'revise-spec'
                ? 'Applied. Review the changes in the document, then save a version when it looks right.'
                : `Saved to ${relPath}. Save a version when it looks right.`);
            this.artifact = '';
            this.clearReview();
            await this.openSpec(relPath);
        } catch (e) {
            this.messages.error('Could not save the draft: ' + (e instanceof Error ? e.message : e));
        }
    }

    protected async newDocPath(pkg: PmidePackage): Promise<string> {
        const dir = pkg.output?.dir || 'specs';
        const name = pkg.output?.name || pkg.id;
        const date = new Date().toISOString().slice(0, 10);
        const existing = new Set((await this.service.listSpecs(this.repo)).map(s => s.relPath));
        let relPath = `${dir}/${date}-${name}.md`;
        for (let i = 2; existing.has(relPath); i++) {
            relPath = `${dir}/${date}-${name}-${i}.md`;
        }
        return relPath;
    }

    protected async openSpec(relPath: string): Promise<void> {
        // Reuse the Specs surface so the PM lands in the reader with history.
        await this.commands.executeCommand(SpecsCommands.OPEN_SPEC.id, relPath);
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

/* ─────────────────────── commands ─────────────────────── */

@injectable()
export class PmideWorkflowsContribution implements CommandContribution {

    @inject(PmideSpaceService) protected readonly spaces: PmideSpaceService;
    @inject(PmideService) protected readonly service: PmideService;
    @inject(WidgetManager) protected readonly widgets: WidgetManager;
    @inject(ApplicationShell) protected readonly shell: ApplicationShell;
    @inject(MessageService) protected readonly messages: MessageService;
    @inject(PmideWorkflowsFeed) protected readonly feed: PmideWorkflowsFeed;

    registerCommands(registry: CommandRegistry): void {
        registry.registerCommand(WorkflowCommands.OPEN_WORKFLOW, {
            execute: (packageId: string) => this.openWorkflow(packageId),
        });
        registry.registerCommand(WorkflowCommands.ADD_PACKAGE, {
            execute: (templateId: string) => this.addPackage(templateId),
        });
    }

    async openWorkflow(packageId: string): Promise<void> {
        const { productRoot } = this.spaces.space;
        if (!productRoot || !packageId) {
            return;
        }
        const options: WorkflowRunnerOptions = { repo: productRoot, packageId };
        const widget = await this.widgets.getOrCreateWidget<PmideWorkflowRunnerWidget>(PmideWorkflowRunnerWidget.FACTORY_ID, options);
        if (!widget.isAttached) {
            this.shell.addWidget(widget, { area: 'main' });
        }
        await this.shell.activateWidget(widget.id);
    }

    async addPackage(templateId: string): Promise<void> {
        const { productRoot } = this.spaces.space;
        if (!productRoot || !templateId) {
            return;
        }
        try {
            const pkg = await this.service.scaffoldPackage(productRoot, templateId);
            this.feed.fire();
            this.messages.info(`Added ${pkg.name}. The package is yours now — its instructions live in ${pkg.path}.`);
            await this.openWorkflow(pkg.id);
        } catch (e) {
            this.messages.error(e instanceof Error ? e.message : String(e));
        }
    }
}
