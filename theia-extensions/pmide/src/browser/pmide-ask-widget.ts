/********************************************************************************
 * PMIDE Ask — the translator surface. Natural-language questions over the
 * linked repos, answered in plain language with source citations and drift
 * flags. The single-player wedge.
 *
 * Answer contract (enforced via system prompt, parsed here):
 *   [[cite:<path>:<start>-<end>]]  -> clickable source chip
 *   [[drift:<one-line summary>]]   -> calm amber drift callout
 * SPDX-License-Identifier: MIT
 ********************************************************************************/

import { MessageService } from '@theia/core';
import { BaseWidget, Message, codicon } from '@theia/core/lib/browser';
import URI from '@theia/core/lib/common/uri';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import { EditorManager } from '@theia/editor/lib/browser';
import { AgentMessage } from '../common/agent-protocol';
import { AgentRunHandle, PmideAgentFrontend } from './pmide-agent-frontend';
import { PmideSpaceService } from './pmide-space';

export const ASK_WIDGET_ID = 'pmide-ask';

const ASK_SYSTEM_PROMPT = [
    'You are Ask, the translator inside PMIDE — an IDE for product managers.',
    'You answer questions about this product using its linked repositories: code, specs, decisions, and docs.',
    'Your reader is often non-technical. Answer in plain language. Explain code behavior in terms of what the',
    'product does, not how the code is shaped. Keep answers short and direct; use short paragraphs and simple lists.',
    '',
    'Ground rules:',
    '1. Search before you answer. Use pmide_search (and pmide_facts to see what sources exist).',
    '   Read the actual files behind the best hits before making claims.',
    '2. Cite every substantive claim. Immediately after a claim, add a citation marker:',
    '   [[cite:<absolute-file-path>:<startLine>-<endLine>]].',
    '   Use the exact absolute paths returned by search or the files you read. Multiple citations are encouraged.',
    '3. Surface drift. If the current spec or docs disagree with what the code actually does, say so plainly and',
    '   add a marker: [[drift:<one-line summary of the disagreement>]]. Never silently pick a side.',
    '4. Never invent sources. If you cannot find an answer in the linked repos, say what you looked for and what',
    '   is missing. An honest "not in this space" beats a guess.',
    '5. Stay read-only. You explain and connect; you never change anything.',
].join('\n');

const READ_ONLY_TOOLS = [
    'Read', 'Grep', 'Glob',
    'mcp__space-index__pmide_search',
    'mcp__space-index__pmide_facts',
];

interface Turn {
    question: string;
    answerNode: HTMLElement;
    statusNode: HTMLElement;
    rawAnswer: string;
    drifts: string[];
}

@injectable()
export class PmideAskWidget extends BaseWidget {

    static readonly ID = ASK_WIDGET_ID;

    @inject(PmideAgentFrontend) protected readonly agent: PmideAgentFrontend;
    @inject(PmideSpaceService) protected readonly spaces: PmideSpaceService;
    @inject(EditorManager) protected readonly editors: EditorManager;
    @inject(MessageService) protected readonly messages: MessageService;

    protected conversation!: HTMLElement;
    protected input!: HTMLTextAreaElement;
    protected sendButton!: HTMLButtonElement;
    protected current: { handle: AgentRunHandle; turn: Turn } | undefined;
    protected sessionId: string | undefined;

    @postConstruct()
    protected init(): void {
        this.id = PmideAskWidget.ID;
        this.title.label = 'Ask';
        this.title.caption = 'Ask — plain-language answers about this product, with sources';
        this.title.iconClass = codicon('comment-discussion');
        this.title.closable = true;
        this.addClass('pmide-root');
        this.addClass('pmide-ask');
        this.buildDom();
    }

    protected buildDom(): void {
        this.node.tabIndex = 0;

        this.conversation = document.createElement('div');
        this.conversation.className = 'ask-conversation';

        const empty = document.createElement('div');
        empty.className = 'ask-empty';
        const emptyTitle = document.createElement('div');
        emptyTitle.className = 'ask-empty-title';
        emptyTitle.textContent = 'Ask about this product';
        const emptyBody = document.createElement('div');
        emptyBody.className = 'ask-empty-body';
        emptyBody.textContent = 'Plain-language questions, answered from the linked repositories with sources you can open. '
            + 'Try: “How does sign-up work?” or “Where is the refund rule enforced?”';
        empty.append(emptyTitle, emptyBody);
        this.conversation.appendChild(empty);

        const footer = document.createElement('div');
        footer.className = 'ask-footer';
        this.input = document.createElement('textarea');
        this.input.className = 'ask-input';
        this.input.placeholder = 'Ask a question about this product…';
        this.input.rows = 2;
        this.input.addEventListener('keydown', e => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.submit();
            }
        });
        this.sendButton = document.createElement('button');
        this.sendButton.className = 'ask-send';
        this.sendButton.textContent = 'Ask';
        this.sendButton.addEventListener('click', () => this.submit());
        footer.append(this.input, this.sendButton);

        this.node.append(this.conversation, footer);
    }

    protected async submit(): Promise<void> {
        const question = this.input.value.trim();
        if (!question) {
            return;
        }
        if (this.current) {
            this.messages.info('Ask is still answering — cancel it or wait for it to finish.');
            return;
        }
        const { productRoot, roots } = this.spaces.space;
        if (!productRoot) {
            this.messages.info('Open a folder (your product repo) first, then Ask can search it.');
            return;
        }
        this.input.value = '';
        const empty = this.conversation.querySelector('.ask-empty');
        empty?.remove();

        const turn = this.appendTurn(question);
        const handle = this.agent.run(question, {
            cwd: productRoot,
            additionalDirectories: roots.slice(1),
            systemPrompt: ASK_SYSTEM_PROMPT,
            allowedTools: READ_ONLY_TOOLS,
            permissionMode: 'default',
            pmideToolServers: ['space-index'],
            maxTurns: 25,
            resumeSessionId: this.sessionId,
        });
        this.current = { handle, turn };
        this.sendButton.textContent = 'Cancel';
        this.sendButton.onclick = () => { handle.cancel(); };

        handle.onMessage(m => this.onEngineMessage(turn, m));
        handle.onError(err => {
            this.setStatus(turn, '');
            this.appendErrorBubble(turn, err);
        });
        handle.onClose(() => {
            this.setStatus(turn, '');
            this.finishTurn(turn);
            this.current = undefined;
            this.sendButton.textContent = 'Ask';
            this.sendButton.onclick = () => this.submit();
        });
    }

    protected appendTurn(question: string): Turn {
        const qBubble = document.createElement('div');
        qBubble.className = 'ask-q';
        qBubble.textContent = question;

        const aBubble = document.createElement('div');
        aBubble.className = 'ask-a';
        const statusNode = document.createElement('div');
        statusNode.className = 'ask-status';
        statusNode.textContent = 'Looking through the linked repositories…';
        const answerNode = document.createElement('div');
        answerNode.className = 'ask-answer';
        aBubble.append(statusNode, answerNode);

        this.conversation.append(qBubble, aBubble);
        this.conversation.scrollTop = this.conversation.scrollHeight;
        return { question, answerNode, statusNode, rawAnswer: '', drifts: [] };
    }

    protected onEngineMessage(turn: Turn, m: AgentMessage): void {
        if (!m || typeof m !== 'object') {
            return;
        }
        if (m.type === 'system' && m.session_id) {
            this.sessionId = m.session_id;
        }
        if (m.type === 'assistant' && m.message?.content) {
            for (const block of m.message.content) {
                if (block.type === 'text' && block.text) {
                    turn.rawAnswer += block.text;
                    this.renderAnswer(turn, false);
                } else if (block.type === 'tool_use') {
                    this.setStatus(turn, this.describeTool(block.name, block.input));
                }
            }
        }
        if (m.type === 'result') {
            // Final answer: prefer the result text if the stream produced none.
            if (!turn.rawAnswer && typeof m.result === 'string') {
                turn.rawAnswer = m.result;
            }
            this.renderAnswer(turn, true);
        }
        this.conversation.scrollTop = this.conversation.scrollHeight;
    }

    protected describeTool(name: string, input: unknown): string {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const i = (input ?? {}) as any;
        switch (name) {
            case 'mcp__space-index__pmide_search': return `Searching the space for “${String(i.query ?? '').slice(0, 60)}”…`;
            case 'mcp__space-index__pmide_facts': return 'Checking what sources this space has…';
            case 'Read': return `Reading ${this.basename(String(i.file_path ?? ''))}…`;
            case 'Grep': return `Scanning code for “${String(i.pattern ?? '').slice(0, 40)}”…`;
            case 'Glob': return 'Listing files…';
            default: return 'Working…';
        }
    }

    protected basename(p: string): string {
        return p.split(/[\\/]/).pop() ?? p;
    }

    protected setStatus(turn: Turn, text: string): void {
        turn.statusNode.textContent = text;
        turn.statusNode.style.display = text ? '' : 'none';
    }

    /** Render rawAnswer into answerNode: text + cite chips + drift callouts. All programmatic DOM. */
    protected renderAnswer(turn: Turn, final: boolean): void {
        turn.answerNode.textContent = '';
        turn.drifts = [];
        const marker = /\[\[(cite|drift):([\s\S]*?)\]\]/g;
        const text = turn.rawAnswer;
        let last = 0;
        const flow = document.createElement('div');
        for (;;) {
            const match = marker.exec(text);
            if (!match) {
                break;
            }
            this.appendText(flow, text.slice(last, match.index));
            if (match[1] === 'cite') {
                const chip = this.buildCiteChip(match[2].trim());
                if (chip) {
                    flow.appendChild(chip);
                }
            } else {
                turn.drifts.push(match[2].trim());
            }
            last = match.index + match[0].length;
        }
        this.appendText(flow, text.slice(last));
        turn.answerNode.appendChild(flow);

        if (final && turn.drifts.length) {
            const callout = document.createElement('div');
            callout.className = 'ask-drift';
            const title = document.createElement('div');
            title.className = 'ask-drift-title';
            title.textContent = turn.drifts.length === 1
                ? 'The code and the documentation disagree here'
                : `The code and the documentation disagree in ${turn.drifts.length} places`;
            callout.appendChild(title);
            for (const drift of turn.drifts) {
                const line = document.createElement('div');
                line.className = 'ask-drift-line';
                line.textContent = drift;
                callout.appendChild(line);
            }
            turn.answerNode.appendChild(callout);
        }
    }

    /** Append plain text preserving paragraphs and simple lists; no HTML interpretation. */
    protected appendText(parent: HTMLElement, text: string): void {
        if (!text) {
            return;
        }
        const lines = text.split('\n');
        for (let i = 0; i < lines.length; i++) {
            if (i > 0) {
                parent.appendChild(document.createElement('br'));
            }
            if (lines[i]) {
                parent.appendChild(document.createTextNode(lines[i]));
            }
        }
    }

    /** cite payload: <path>:<start>-<end> (line part optional). */
    protected buildCiteChip(payload: string): HTMLElement | undefined {
        const m = /^(.*?)(?::(\d+)(?:-(\d+))?)?$/.exec(payload);
        if (!m || !m[1]) {
            return undefined;
        }
        const file = m[1].trim();
        const start = m[2] ? parseInt(m[2], 10) : undefined;
        const end = m[3] ? parseInt(m[3], 10) : start;
        const chip = document.createElement('span');
        chip.className = 'ask-cite';
        chip.title = file + (start ? `:${start}-${end}` : '');
        const icon = document.createElement('span');
        icon.className = codicon('file');
        const label = document.createElement('span');
        label.textContent = this.basename(file) + (start ? `:${start}` : '');
        chip.append(icon, label);
        chip.addEventListener('click', () => this.openCitation(file, start, end));
        return chip;
    }

    protected async openCitation(file: string, start?: number, end?: number): Promise<void> {
        try {
            const uri = new URI(`file:///${file.replace(/\\/g, '/').replace(/^\//, '')}`);
            await this.editors.open(uri, {
                selection: start ? {
                    start: { line: start - 1, character: 0 },
                    end: { line: (end ?? start) - 1, character: 1_000 },
                } : undefined,
                mode: 'reveal',
            });
        } catch (e) {
            this.messages.warn(`Could not open ${this.basename(file)}: ${e instanceof Error ? e.message : e}`);
        }
    }

    protected appendErrorBubble(turn: Turn, err: string): void {
        const box = document.createElement('div');
        box.className = 'ask-error';
        box.textContent = 'Ask could not finish: ' + err;
        turn.answerNode.appendChild(box);
    }

    protected finishTurn(turn: Turn): void {
        this.renderAnswer(turn, true);
        if (!turn.rawAnswer.trim() && turn.statusNode) {
            this.setStatus(turn, '');
            if (!turn.answerNode.querySelector('.ask-error')) {
                this.appendErrorBubble(turn, 'no answer was produced (run may have been canceled).');
            }
        }
    }

    protected onActivateRequest(msg: Message): void {
        super.onActivateRequest(msg);
        this.input?.focus();
    }
}
