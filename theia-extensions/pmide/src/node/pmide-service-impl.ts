/********************************************************************************
 * PMIDE backend — generic, repo-scoped git operations.
 * SPDX-License-Identifier: MIT
 ********************************************************************************/

import { injectable } from '@theia/core/shared/inversify';
import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { ChangedFile, GitResult, PmideService } from '../common/protocol';

@injectable()
export class PmideServiceImpl implements PmideService {

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
        return r.stdout.split('\n').filter(l => l.trim()).map(line => {
            const x = line.slice(0, 2);
            const file = line.slice(3).trim().replace(/"/g, '');
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
}
