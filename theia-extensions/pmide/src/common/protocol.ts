/********************************************************************************
 * PMIDE — shared protocol between frontend and backend.
 * Generic, repo-scoped git operations: every call names the repository it
 * targets, so any linked repo in a Product Space can be served.
 * SPDX-License-Identifier: MIT
 ********************************************************************************/

export const PMIDE_SERVICE_PATH = '/services/pmide';

export const PmideService = Symbol('PmideService');

export interface GitResult {
    code: number;
    stdout: string;
    stderr: string;
}

export interface ChangedFile {
    path: string;
    status: 'M' | 'A' | 'D';
}

export interface SpaceFacts {
    roots: Array<{ path: string; documents: number }>;
    documents: number;
    chunks: number;
    byExtension: Record<string, number>;
    builtAt: string;
}

/** A markdown document under <productRoot>/specs/**. */
export interface SpecEntry {
    /** Repo-relative path, forward slashes (e.g. specs/refund-policy.md). */
    relPath: string;
    /** First `# ` heading, or the filename if none. */
    title: string;
    /** Last-modified time, ISO. */
    modified: string;
}

/** One saved version of a spec (a commit touching the file). */
export interface SpecVersion {
    sha: string;
    subject: string;
    author: string;
    /** Author date, ISO. */
    date: string;
}

export interface PmideService {
    /** Run git with the given args in the given repo working tree. */
    git(repoPath: string, args: string[]): Promise<GitResult>;
    /** Current branch name of the repo. */
    currentBranch(repoPath: string): Promise<string>;
    /** Read a repo file (working tree). */
    readFile(repoPath: string, relPath: string): Promise<string>;
    /** Write a repo file (working tree), creating parent directories. */
    writeFile(repoPath: string, relPath: string, content: string): Promise<void>;
    /** Read a file as it is on a ref (e.g. HEAD or main). Returns undefined if absent. */
    readFileAtRef(repoPath: string, relPath: string, ref: string): Promise<string | undefined>;
    /** git status --porcelain, parsed. */
    changedFiles(repoPath: string): Promise<ChangedFile[]>;
    /** Stage everything and commit. Returns short sha in stdout on success. */
    commitAll(repoPath: string, message: string): Promise<GitResult>;
    /** Stage and commit only the given paths. Returns short sha in stdout on success. */
    commitPaths(repoPath: string, paths: string[], message: string): Promise<GitResult>;
    /** Recent commits on current branch: `sha subject` lines. */
    log(repoPath: string, maxCount: number): Promise<string[]>;
    /** Commits that touched the given file, newest first (follows renames). */
    fileLog(repoPath: string, relPath: string, maxCount: number): Promise<SpecVersion[]>;
    /** Markdown documents under <repoPath>/specs/**, sorted by path. */
    listSpecs(repoPath: string): Promise<SpecEntry[]>;
    /** What the space index knows about these roots (builds/refreshes it). */
    indexFacts(roots: string[]): Promise<SpaceFacts>;
}
