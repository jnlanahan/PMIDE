/********************************************************************************
 * PMIDE backend — generic, repo-scoped git operations.
 * SPDX-License-Identifier: MIT
 ********************************************************************************/

import { inject, injectable } from '@theia/core/shared/inversify';
import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { ChangedFile, GitResult, PmideService, SpaceFacts, SpecEntry, SpecVersion } from '../common/protocol';
import { PmideSpaceIndex } from './pmide-space-index';

@injectable()
export class PmideServiceImpl implements PmideService {

    @inject(PmideSpaceIndex)
    protected readonly index: PmideSpaceIndex;

    async indexFacts(roots: string[]): Promise<SpaceFacts> {
        return this.index.facts(roots);
    }

    protected runGit(repoPath: string, args: string[]): Promise<GitResult> {
        if (!repoPath || !fs.existsSync(repoPath)) {
            return Promise.resolve({ code: -1, stdout: '', stderr: 'Repository path does not exist: ' + repoPath });
        }
        return new Promise(resolve => {
            const child = spawn('git', args, { cwd: repoPath, shell: false });
            let stdout = '';
            let stderr = '';
            child.stdout.on('data', d => { stdout += d.toString(); });
            child.stderr.on('data', d => { stderr += d.toString(); });
            child.on('error', err => resolve({ code: -1, stdout, stderr: String(err) }));
            child.on('close', code => resolve({ code: code ?? -1, stdout: stdout.trim(), stderr: stderr.trim() }));
        });
    }

    async git(repoPath: string, args: string[]): Promise<GitResult> {
        return this.runGit(repoPath, args);
    }

    async currentBranch(repoPath: string): Promise<string> {
        const r = await this.runGit(repoPath, ['rev-parse', '--abbrev-ref', 'HEAD']);
        return r.code === 0 ? r.stdout : 'main';
    }

    async readFile(repoPath: string, relPath: string): Promise<string> {
        return fs.promises.readFile(path.join(repoPath, relPath), 'utf8');
    }

    async writeFile(repoPath: string, relPath: string, content: string): Promise<void> {
        const abs = path.join(repoPath, relPath);
        await fs.promises.mkdir(path.dirname(abs), { recursive: true });
        await fs.promises.writeFile(abs, content, 'utf8');
    }

    async readFileAtRef(repoPath: string, relPath: string, ref: string): Promise<string | undefined> {
        const r = await this.runGit(repoPath, ['show', `${ref}:${relPath.replace(/\\/g, '/')}`]);
        return r.code === 0 ? r.stdout : undefined;
    }

    async changedFiles(repoPath: string): Promise<ChangedFile[]> {
        const r = await this.runGit(repoPath, ['status', '--porcelain', '--untracked-files=all']);
        if (r.code !== 0 || !r.stdout) {
            return [];
        }
        // Note: runGit trims stdout, so the first line may have lost its
        // leading status space — parse each line by its first whitespace gap.
        return r.stdout.split('\n').filter(l => l.trim()).map(line => {
            const trimmed = line.trim();
            const gap = trimmed.search(/\s/);
            const x = gap > 0 ? trimmed.slice(0, gap) : trimmed;
            let file = (gap > 0 ? trimmed.slice(gap + 1) : '').trim().replace(/"/g, '');
            const arrow = file.indexOf(' -> ');
            if (arrow >= 0) {
                file = file.slice(arrow + 4);
            }
            const status: ChangedFile['status'] = x.includes('D') ? 'D' : (x.includes('?') || x.includes('A')) ? 'A' : 'M';
            return { path: file, status };
        });
    }

    async commitAll(repoPath: string, message: string): Promise<GitResult> {
        const add = await this.runGit(repoPath, ['add', '-A']);
        if (add.code !== 0) {
            return add;
        }
        const commit = await this.runGit(repoPath, ['commit', '-m', message]);
        if (commit.code !== 0) {
            return commit;
        }
        const sha = await this.runGit(repoPath, ['rev-parse', '--short', 'HEAD']);
        return { code: 0, stdout: sha.stdout, stderr: '' };
    }

    async log(repoPath: string, maxCount: number): Promise<string[]> {
        const r = await this.runGit(repoPath, ['log', `--max-count=${maxCount}`, '--pretty=%h %s']);
        return r.code === 0 && r.stdout ? r.stdout.split('\n') : [];
    }

    async commitPaths(repoPath: string, paths: string[], message: string): Promise<GitResult> {
        if (!paths.length) {
            return { code: -1, stdout: '', stderr: 'No paths to commit' };
        }
        const add = await this.runGit(repoPath, ['add', '--', ...paths]);
        if (add.code !== 0) {
            return add;
        }
        const commit = await this.runGit(repoPath, ['commit', '-m', message, '--', ...paths]);
        if (commit.code !== 0) {
            return commit;
        }
        const sha = await this.runGit(repoPath, ['rev-parse', '--short', 'HEAD']);
        return { code: 0, stdout: sha.stdout, stderr: '' };
    }

    async fileLog(repoPath: string, relPath: string, maxCount: number): Promise<SpecVersion[]> {
        const r = await this.runGit(repoPath, [
            'log', '--follow', `--max-count=${maxCount}`,
            '--pretty=%H%x1f%s%x1f%an%x1f%aI',
            '--', relPath.replace(/\\/g, '/'),
        ]);
        if (r.code !== 0 || !r.stdout) {
            return [];
        }
        return r.stdout.split('\n').filter(l => l.trim()).map(line => {
            const [sha, subject, author, date] = line.split('\x1f');
            return { sha, subject: subject ?? '', author: author ?? '', date: date ?? '' };
        });
    }

    async listSpecs(repoPath: string): Promise<SpecEntry[]> {
        const specsDir = path.join(repoPath, 'specs');
        const entries: SpecEntry[] = [];
        const walk = async (dir: string): Promise<void> => {
            let children: fs.Dirent[];
            try {
                children = await fs.promises.readdir(dir, { withFileTypes: true });
            } catch {
                return;
            }
            for (const child of children) {
                if (child.name.startsWith('.') || child.name === 'node_modules') {
                    continue;
                }
                const abs = path.join(dir, child.name);
                if (child.isDirectory()) {
                    await walk(abs);
                } else if (child.isFile() && /\.(md|markdown)$/i.test(child.name)) {
                    const [stat, title] = await Promise.all([
                        fs.promises.stat(abs),
                        this.readTitle(abs, child.name),
                    ]);
                    entries.push({
                        relPath: path.relative(repoPath, abs).replace(/\\/g, '/'),
                        title,
                        modified: stat.mtime.toISOString(),
                    });
                }
            }
        };
        await walk(specsDir);
        return entries.sort((a, b) => a.relPath.localeCompare(b.relPath));
    }

    /** First `# ` heading of a markdown file, or the filename without extension. */
    protected async readTitle(absPath: string, fileName: string): Promise<string> {
        try {
            const head = (await fs.promises.readFile(absPath, 'utf8')).slice(0, 4096);
            const match = /^#\s+(.+)$/m.exec(head);
            if (match) {
                return match[1].trim();
            }
        } catch { /* unreadable: fall through to filename */ }
        return fileName.replace(/\.(md|markdown)$/i, '');
    }
}
