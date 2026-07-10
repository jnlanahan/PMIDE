/********************************************************************************
 * PMIDE Product Space — the set of linked repositories a PM works over.
 * A space is a Theia multi-root workspace; link metadata lives in
 * .pmide/workspace.json inside the product repo (first root), versioned.
 * SPDX-License-Identifier: MIT
 ********************************************************************************/

import { Emitter, Event, MessageService } from '@theia/core';
import URI from '@theia/core/lib/common/uri';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import { FileDialogService, OpenFileDialogProps } from '@theia/filesystem/lib/browser';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { WorkspaceService } from '@theia/workspace/lib/browser';

export interface SpaceInfo {
    /** Absolute path of the product repo (first workspace root), if any. */
    productRoot?: string;
    /** Absolute paths of all workspace roots (product repo first). */
    roots: string[];
}

interface PmideWorkspaceFile {
    version: 1;
    /** Paths of linked repos, absolute or relative to the product repo. */
    linkedRepos: string[];
}

@injectable()
export class PmideSpaceService {

    @inject(WorkspaceService) protected readonly workspace: WorkspaceService;
    @inject(FileService) protected readonly files: FileService;
    @inject(FileDialogService) protected readonly dialogs: FileDialogService;
    @inject(MessageService) protected readonly messages: MessageService;

    protected readonly onChangedEmitter = new Emitter<void>();
    readonly onChanged: Event<void> = this.onChangedEmitter.event;

    @postConstruct()
    protected init(): void {
        this.workspace.onWorkspaceChanged(() => this.onChangedEmitter.fire());
        this.workspace.onWorkspaceLocationChanged(() => this.onChangedEmitter.fire());
    }

    get space(): SpaceInfo {
        const roots = this.workspace.tryGetRoots().map(r => r.resource.path.fsPath());
        return { productRoot: roots[0], roots };
    }

    /** Pick a folder and link it into the space (adds a workspace root + records it). */
    async linkRepository(): Promise<void> {
        const props: OpenFileDialogProps = {
            title: 'Link a repository into this Product Space',
            canSelectFolders: true,
            canSelectFiles: false,
            openLabel: 'Link',
        };
        const selection = await this.dialogs.showOpenDialog(props);
        if (!selection) {
            return;
        }
        const current = this.space;
        if (!current.productRoot) {
            // No workspace open yet: the picked folder becomes the product repo.
            this.workspace.open(selection, { preserveWindow: true });
            return;
        }
        if (current.roots.some(r => r.toLowerCase() === selection.path.fsPath().toLowerCase())) {
            this.messages.info('That repository is already part of this space.');
            return;
        }
        await this.workspace.addRoot(selection);
        await this.recordLink(selection.path.fsPath());
        this.messages.info(`Linked ${selection.path.base}. Ask can now see it.`);
        this.onChangedEmitter.fire();
    }

    /** Persist the link in .pmide/workspace.json in the product repo. */
    protected async recordLink(repoPath: string): Promise<void> {
        const productRoot = this.space.productRoot;
        if (!productRoot) {
            return;
        }
        const fileUri = new URI(`file:///${productRoot.replace(/\\/g, '/')}`).resolve('.pmide/workspace.json');
        let data: PmideWorkspaceFile = { version: 1, linkedRepos: [] };
        try {
            const existing = await this.files.read(fileUri);
            const parsed = JSON.parse(existing.value);
            if (parsed && Array.isArray(parsed.linkedRepos)) {
                data = { version: 1, linkedRepos: parsed.linkedRepos };
            }
        } catch { /* absent or unreadable: start fresh */ }
        if (!data.linkedRepos.includes(repoPath)) {
            data.linkedRepos.push(repoPath);
        }
        await this.files.write(fileUri, JSON.stringify(data, undefined, 2) + '\n');
    }

    /**
     * On product-repo open, restore linked repos recorded in
     * .pmide/workspace.json that are not yet workspace roots.
     */
    async restoreLinks(): Promise<void> {
        const { productRoot, roots } = this.space;
        if (!productRoot) {
            return;
        }
        const fileUri = new URI(`file:///${productRoot.replace(/\\/g, '/')}`).resolve('.pmide/workspace.json');
        let linked: string[] = [];
        try {
            const content = await this.files.read(fileUri);
            const parsed = JSON.parse(content.value);
            if (parsed && Array.isArray(parsed.linkedRepos)) {
                linked = parsed.linkedRepos.filter((p: unknown) => typeof p === 'string');
            }
        } catch {
            return; // no space file — nothing to restore
        }
        const have = new Set(roots.map(r => r.toLowerCase()));
        for (const repo of linked) {
            const abs = repo.match(/^[a-zA-Z]:[\\/]/) ? repo : `${productRoot}/${repo}`;
            if (!have.has(abs.toLowerCase())) {
                const uri = new URI(`file:///${abs.replace(/\\/g, '/')}`);
                try {
                    if (await this.files.exists(uri)) {
                        await this.workspace.addRoot(uri);
                    }
                } catch { /* missing repo: leave it recorded, surface later in Context */ }
            }
        }
    }
}
