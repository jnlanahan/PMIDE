/********************************************************************************
 * PMIDE backend — demo repo bootstrap + real git operations.
 * SPDX-License-Identifier: MIT
 ********************************************************************************/

import { injectable } from '@theia/core/shared/inversify';
import { spawn } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { ChangedFile, FileWrite, GitResult, PmideService, RepoInfo } from '../common/protocol';
import { AGENT_RUN_WRITES, IMPLEMENTATION_WRITES, REPO_FILES } from '../common/demo-data';

const DEMO_ROOT = path.join(os.homedir(), 'pmide-demo');
const REPO_PATH = path.join(DEMO_ROOT, 'enterprise-sample-app');
const REMOTE_PATH = path.join(DEMO_ROOT, 'remotes', 'enterprise-sample-app.git');

@injectable()
export class PmideServiceImpl implements PmideService {

    protected runGit(args: string[], cwd: string = REPO_PATH): Promise<GitResult> {
        return new Promise(resolve => {
            const child = spawn('git', args, { cwd, shell: false });
            let stdout = '';
            let stderr = '';
            child.stdout.on('data', d => { stdout += d.toString(); });
            child.stderr.on('data', d => { stderr += d.toString(); });
            child.on('error', err => resolve({ code: -1, stdout, stderr: String(err) }));
            child.on('close', code => resolve({ code: code ?? -1, stdout: stdout.trim(), stderr: stderr.trim() }));
        });
    }

    async git(args: string[]): Promise<GitResult> {
        return this.runGit(args);
    }

    async ensureRepo(): Promise<RepoInfo> {
        const created = !fs.existsSync(path.join(REPO_PATH, '.git'));
        if (created) {
            fs.mkdirSync(REPO_PATH, { recursive: true });
            for (const file of REPO_FILES) {
                this.writeFileSync(file.path, file.content);
            }
            await this.runGit(['init', '-b', 'main']);
            await this.runGit(['config', 'user.name', 'PMIDE']);
            await this.runGit(['config', 'user.email', 'pmide@demo.local']);
            await this.runGit(['add', '-A']);
            await this.runGit(['commit', '-m', 'Initial product workspace: context, skills, planning, source']);
            // Local bare remote so "Share Draft" is a real push without network.
            fs.mkdirSync(path.dirname(REMOTE_PATH), { recursive: true });
            if (!fs.existsSync(REMOTE_PATH)) {
                await this.runGit(['init', '--bare', REMOTE_PATH], DEMO_ROOT);
            }
            await this.runGit(['remote', 'add', 'origin', REMOTE_PATH]);
            await this.runGit(['push', '-u', 'origin', 'main']);
        }
        const branch = await this.currentBranch();
        return {
            repoPath: REPO_PATH,
            repoUri: 'file:///' + REPO_PATH.replace(/\\/g, '/'),
            created,
            branch,
        };
    }

    protected writeFileSync(relPath: string, content: string, append = false): void {
        const abs = path.join(REPO_PATH, relPath);
        fs.mkdirSync(path.dirname(abs), { recursive: true });
        if (append && fs.existsSync(abs)) {
            fs.appendFileSync(abs, content, 'utf8');
        } else {
            fs.writeFileSync(abs, content, 'utf8');
        }
    }

    async currentBranch(): Promise<string> {
        const r = await this.runGit(['rev-parse', '--abbrev-ref', 'HEAD']);
        return r.code === 0 ? r.stdout : 'main';
    }

    async createBranch(name: string): Promise<GitResult> {
        return this.runGit(['checkout', '-b', name]);
    }

    async writeFiles(files: FileWrite[]): Promise<void> {
        for (const f of files) {
            this.writeFileSync(f.path, f.content, f.append);
        }
    }

    async readFile(relPath: string): Promise<string> {
        return fs.promises.readFile(path.join(REPO_PATH, relPath), 'utf8');
    }

    async readFileAtRef(relPath: string, ref: string): Promise<string | undefined> {
        const r = await this.runGit(['show', `${ref}:${relPath.replace(/\\/g, '/')}`]);
        return r.code === 0 ? r.stdout : undefined;
    }

    async changedFiles(): Promise<ChangedFile[]> {
        const r = await this.runGit(['status', '--porcelain', '--untracked-files=all']);
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

    async commitAll(message: string): Promise<GitResult> {
        const add = await this.runGit(['add', '-A']);
        if (add.code !== 0) {
            return add;
        }
        const commit = await this.runGit(['commit', '-m', message]);
        if (commit.code !== 0) {
            return commit;
        }
        const sha = await this.runGit(['rev-parse', '--short', 'HEAD']);
        return { code: 0, stdout: sha.stdout, stderr: '' };
    }

    async push(): Promise<GitResult> {
        const branch = await this.currentBranch();
        return this.runGit(['push', '-u', 'origin', branch]);
    }

    async log(maxCount: number): Promise<string[]> {
        const r = await this.runGit(['log', `--max-count=${maxCount}`, '--pretty=%h %s']);
        return r.code === 0 && r.stdout ? r.stdout.split('\n') : [];
    }

    async applyAgentImplementation(agentBranch: string): Promise<GitResult> {
        const previous = await this.currentBranch();
        const co = await this.runGit(['checkout', '-b', agentBranch]);
        if (co.code !== 0) {
            return co;
        }
        for (const f of IMPLEMENTATION_WRITES) {
            this.writeFileSync(f.path, f.content);
        }
        for (const f of AGENT_RUN_WRITES) {
            this.writeFileSync(f.path, f.content);
        }
        await this.runGit(['add', '-A']);
        const commit = await this.runGit(['commit', '-m', 'WP-0042: enforce billing status rule in account settings (agent run AR-0092)']);
        if (commit.code !== 0) {
            return commit;
        }
        await this.runGit(['push', '-u', 'origin', agentBranch]);
        const diffStat = await this.runGit(['diff', '--stat', `${previous}...${agentBranch}`]);
        await this.runGit(['checkout', previous]);
        return { code: 0, stdout: diffStat.stdout, stderr: '' };
    }
}
