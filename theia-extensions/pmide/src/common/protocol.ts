/********************************************************************************
 * PMIDE — shared protocol between frontend and backend.
 * SPDX-License-Identifier: MIT
 ********************************************************************************/

export const PMIDE_SERVICE_PATH = '/services/pmide';

export const PmideService = Symbol('PmideService');

export interface GitResult {
    code: number;
    stdout: string;
    stderr: string;
}

export interface RepoInfo {
    /** Absolute path of the demo repo working tree. */
    repoPath: string;
    /** file:// URI of the repo root. */
    repoUri: string;
    /** True if this call created the repo (first launch). */
    created: boolean;
    branch: string;
}

export interface FileWrite {
    /** Repo-relative path, forward slashes. */
    path: string;
    content: string;
    /** Append instead of overwrite. */
    append?: boolean;
}

export interface ChangedFile {
    path: string;
    status: 'M' | 'A' | 'D';
}

export interface PmideService {
    /** Ensure the demo repo exists (bootstrap on first launch). */
    ensureRepo(): Promise<RepoInfo>;
    /** Current branch name. */
    currentBranch(): Promise<string>;
    /** Create and switch to a branch. */
    createBranch(name: string): Promise<GitResult>;
    /** Write files into the repo working tree. */
    writeFiles(files: FileWrite[]): Promise<void>;
    /** Read a repo file (working tree). */
    readFile(path: string): Promise<string>;
    /** Read a file as it is on a ref (e.g. HEAD or main). Returns undefined if absent. */
    readFileAtRef(path: string, ref: string): Promise<string | undefined>;
    /** git status --porcelain, parsed. */
    changedFiles(): Promise<ChangedFile[]>;
    /** Stage everything and commit. Returns short sha in stdout on success. */
    commitAll(message: string): Promise<GitResult>;
    /** Push current branch to origin (local bare repo). */
    push(): Promise<GitResult>;
    /** Recent commits on current branch: `sha subject` lines. */
    log(maxCount: number): Promise<string[]>;
    /**
     * Simulated agent implementation made real: creates the agent branch from the
     * current branch, writes the implementation files, commits, and returns to the
     * previous branch. Returns the diff summary of the agent branch vs its base.
     */
    applyAgentImplementation(agentBranch: string): Promise<GitResult>;
    /** Raw git escape hatch for flows that need it. */
    git(args: string[]): Promise<GitResult>;
}
