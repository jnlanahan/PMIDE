/********************************************************************************
 * PMIDE frontend state — the golden-flow state machine, backed by real git.
 * SPDX-License-Identifier: MIT
 ********************************************************************************/

import { Emitter, Event } from '@theia/core';
import { inject, injectable } from '@theia/core/shared/inversify';
import { ChangedFile, PmideService, RepoInfo } from '../common/protocol';
import { ExtractionItem, EXTRACTION } from '../common/demo-data';

export interface PrRecord {
    id: string;
    number: string;
    title: string;
    branch: string;
    author: string;
    status: 'Open' | 'Merged';
    needsProductReview: boolean;
    reviews: { name: string; done: boolean }[];
}

export interface AgentRunRecord {
    id: string;
    agent: string;
    user: string;
    started: string;
    task: string;
    status: 'Running' | 'Completed' | 'Merged' | 'Failed';
    skill: string;
    branch: string;
    context: string[];
    files: string[];
    pr?: string;
    simulated: boolean;
}

export interface AuditEntry { time: string; user: string; what: string; ref: string; }

export interface FlowFlags {
    planningImported: boolean;
    contextAccepted: boolean;
    skillCreated: boolean;
    wpCreated: boolean;
    committed: boolean;
    pushed: boolean;
    prOpened: boolean;
    routed: boolean;
    codeReady: boolean;
    reviewed: boolean;
    intentDecision?: 'approved' | 'revision' | 'engineer' | 'risk';
    releaseStory: boolean;
}

@injectable()
export class PmideState {

    @inject(PmideService)
    protected readonly service: PmideService;

    protected readonly onChangedEmitter = new Emitter<void>();
    readonly onChanged: Event<void> = this.onChangedEmitter.event;

    repo?: RepoInfo;
    branch = 'main';
    changes: ChangedFile[] = [];
    commits: { sha: string; msg: string }[] = [];

    flow: FlowFlags = {
        planningImported: false, contextAccepted: false, skillCreated: false,
        wpCreated: false, committed: false, pushed: false, prOpened: false,
        routed: false, codeReady: false, reviewed: false, releaseStory: false,
    };

    extraction: ExtractionItem[] = [];
    prs: PrRecord[] = [];
    runs: AgentRunRecord[] = [
        {
            id: 'AR-0089', agent: 'Claude', user: 'D. Chen', started: '2026-06-11 14:02',
            task: 'Generate release story for invoice-reissue window change',
            status: 'Merged', skill: 'release-story-writer',
            branch: 'safe-draft/release-story-invoice-window',
            context: ['business-rules.md#BR-097', 'WP-0038/work-package.md'],
            files: ['releases/2026-06-invoice-reissue-window.md'], pr: '#121', simulated: false,
        },
    ];
    audit: AuditEntry[] = [
        { time: '09:41', user: 'd.chen', what: 'merged PR #121 (release story — invoice reissue window)', ref: 'AR-0089' },
        { time: '09:12', user: 't.whitfield', what: 'approved agent run AR-0089 output', ref: 'AR-0089' },
        { time: 'Fri', user: 'm.steiner', what: 'completed risk review for WP-0038', ref: 'WP-0038' },
    ];

    get onDraft(): boolean {
        return this.branch !== 'main';
    }

    fireChanged(): void {
        this.onChangedEmitter.fire();
    }

    recordAudit(what: string, ref: string): void {
        const t = new Date();
        this.audit.unshift({
            time: t.toTimeString().slice(0, 5),
            user: 'j.alvarez', what, ref,
        });
    }

    async init(): Promise<RepoInfo> {
        this.repo = await this.service.ensureRepo();
        this.branch = this.repo.branch;
        await this.refreshGit();
        return this.repo;
    }

    async refreshGit(): Promise<void> {
        this.branch = await this.service.currentBranch();
        this.changes = await this.service.changedFiles();
        const log = await this.service.log(5);
        this.commits = log.map(line => {
            const idx = line.indexOf(' ');
            return { sha: line.slice(0, idx), msg: line.slice(idx + 1) };
        });
        this.fireChanged();
    }

    startExtraction(): ExtractionItem[] {
        if (!this.extraction.length) {
            this.extraction = EXTRACTION.map(e => ({ ...e }));
        }
        return this.extraction;
    }
}
