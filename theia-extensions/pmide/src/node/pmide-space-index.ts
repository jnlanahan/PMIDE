/********************************************************************************
 * PMIDE space index — full-text search over every linked repo in a Product
 * Space. Pure-TypeScript BM25 over heading/window chunks, cached per space
 * under ~/.pmide/index. A rebuildable cache, never committed.
 *
 * This is the Phase-1 FTS slice. The interface (search/facts) is the seam:
 * a SQLite FTS5 + vector implementation can replace the internals without
 * touching callers (tool servers, surfaces).
 * SPDX-License-Identifier: MIT
 ********************************************************************************/

import { injectable } from '@theia/core/shared/inversify';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

export interface SearchHit {
    /** Absolute path of the source file. */
    file: string;
    /** Repo root this file belongs to. */
    root: string;
    startLine: number;
    endLine: number;
    /** Heading trail for markdown chunks, e.g. "Spec > Refunds > Eligibility". */
    section?: string;
    score: number;
    excerpt: string;
}

export interface SpaceFacts {
    roots: Array<{ path: string; documents: number }>;
    documents: number;
    chunks: number;
    byExtension: Record<string, number>;
    builtAt: string;
}

interface Chunk {
    file: string;
    root: string;
    startLine: number;
    endLine: number;
    section?: string;
    text: string;
    /** term -> frequency */
    tf: Map<string, number>;
    length: number;
}

interface FileEntry {
    mtimeMs: number;
    chunks: Chunk[];
}

const TEXT_EXTENSIONS = new Set([
    '.md', '.markdown', '.txt', '.rst',
    '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs',
    '.py', '.java', '.kt', '.cs', '.go', '.rb', '.rs', '.php', '.swift',
    '.c', '.h', '.cpp', '.hpp',
    '.json', '.yaml', '.yml', '.toml', '.xml', '.html', '.css', '.scss',
    '.sql', '.sh', '.ps1', '.bat', '.env.example', '.graphql', '.proto',
]);

const IGNORED_DIRS = new Set([
    'node_modules', '.git', 'lib', 'dist', 'build', 'out', 'target', 'coverage',
    '.next', '.nuxt', '.venv', 'venv', '__pycache__', '.idea', '.vscode',
    'gen-webpack', 'bundles', '.pmide-cache',
]);

const MAX_FILE_BYTES = 1_500_000;
const CODE_WINDOW = 60;
const CODE_OVERLAP = 10;

@injectable()
export class PmideSpaceIndex {

    /** space key (hash of sorted roots) -> file index */
    protected spaces = new Map<string, Map<string, FileEntry>>();
    protected builtAt = new Map<string, string>();

    protected spaceKey(roots: string[]): string {
        const normalized = [...roots].map(r => path.resolve(r).toLowerCase()).sort().join('|');
        return crypto.createHash('sha1').update(normalized).digest('hex').slice(0, 16);
    }

    protected cacheDir(key: string): string {
        return path.join(os.homedir(), '.pmide', 'index', key);
    }

    /** Ensure the index for these roots is loaded and fresh (incremental by mtime). */
    async ensure(roots: string[]): Promise<Map<string, FileEntry>> {
        const key = this.spaceKey(roots);
        let files = this.spaces.get(key);
        if (!files) {
            files = new Map();
            this.spaces.set(key, files);
        }
        const seen = new Set<string>();
        for (const root of roots) {
            if (fs.existsSync(root)) {
                await this.walk(root, root, files, seen);
            }
        }
        // Drop entries for files that disappeared
        for (const file of [...files.keys()]) {
            if (!seen.has(file)) {
                files.delete(file);
            }
        }
        this.builtAt.set(key, new Date().toISOString());
        return files;
    }

    protected async walk(dir: string, root: string, files: Map<string, FileEntry>, seen: Set<string>): Promise<void> {
        let entries: fs.Dirent[];
        try {
            entries = await fs.promises.readdir(dir, { withFileTypes: true });
        } catch {
            return;
        }
        for (const entry of entries) {
            if (entry.name.startsWith('.') && entry.name !== '.pmide') {
                continue;
            }
            const abs = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                if (!IGNORED_DIRS.has(entry.name)) {
                    await this.walk(abs, root, files, seen);
                }
                continue;
            }
            const ext = path.extname(entry.name).toLowerCase();
            if (!TEXT_EXTENSIONS.has(ext)) {
                continue;
            }
            seen.add(abs);
            let stat: fs.Stats;
            try {
                stat = await fs.promises.stat(abs);
            } catch {
                continue;
            }
            if (stat.size > MAX_FILE_BYTES) {
                continue;
            }
            const existing = files.get(abs);
            if (existing && existing.mtimeMs === stat.mtimeMs) {
                continue;
            }
            try {
                const text = await fs.promises.readFile(abs, 'utf8');
                files.set(abs, { mtimeMs: stat.mtimeMs, chunks: this.chunk(abs, root, ext, text) });
            } catch {
                files.delete(abs);
            }
        }
    }

    protected chunk(file: string, root: string, ext: string, text: string): Chunk[] {
        const lines = text.split(/\r?\n/);
        const chunks: Chunk[] = [];
        const push = (startLine: number, endLine: number, body: string[], section?: string): void => {
            const raw = body.join('\n').trim();
            if (!raw) {
                return;
            }
            const tf = this.termFrequencies(raw + (section ? ' ' + section : '') + ' ' + path.basename(file));
            let length = 0;
            tf.forEach(v => { length += v; });
            chunks.push({ file, root, startLine, endLine, section, text: raw, tf, length });
        };

        if (ext === '.md' || ext === '.markdown' || ext === '.rst' || ext === '.txt') {
            // Split by markdown headings, keeping the heading trail.
            const trail: string[] = [];
            let start = 1;
            let body: string[] = [];
            for (let i = 0; i < lines.length; i++) {
                const m = /^(#{1,4})\s+(.*)$/.exec(lines[i]);
                if (m) {
                    push(start, i, body, trail.join(' > ') || undefined);
                    const depth = m[1].length;
                    trail.splice(depth - 1);
                    trail[depth - 1] = m[2].trim();
                    start = i + 1;
                    body = [lines[i]];
                } else {
                    body.push(lines[i]);
                }
            }
            push(start, lines.length, body, trail.join(' > ') || undefined);
        } else {
            for (let i = 0; i < lines.length; i += (CODE_WINDOW - CODE_OVERLAP)) {
                const end = Math.min(i + CODE_WINDOW, lines.length);
                push(i + 1, end, lines.slice(i, end));
                if (end >= lines.length) {
                    break;
                }
            }
        }
        return chunks;
    }

    protected termFrequencies(text: string): Map<string, number> {
        const tf = new Map<string, number>();
        for (const token of this.tokenize(text)) {
            tf.set(token, (tf.get(token) ?? 0) + 1);
        }
        return tf;
    }

    protected tokenize(text: string): string[] {
        const tokens: string[] = [];
        for (const raw of text.toLowerCase().split(/[^a-z0-9_]+/)) {
            if (raw.length < 2 || raw.length > 40) {
                continue;
            }
            tokens.push(raw);
            // split snake_case and add parts
            if (raw.includes('_')) {
                for (const part of raw.split('_')) {
                    if (part.length >= 2) {
                        tokens.push(part);
                    }
                }
            }
        }
        return tokens;
    }

    async search(roots: string[], query: string, limit: number): Promise<SearchHit[]> {
        const files = await this.ensure(roots);
        const queryTerms = [...new Set(this.tokenize(query))];
        if (queryTerms.length === 0) {
            return [];
        }
        const all: Chunk[] = [];
        files.forEach(entry => all.push(...entry.chunks));
        const n = all.length;
        if (n === 0) {
            return [];
        }
        let totalLength = 0;
        for (const c of all) {
            totalLength += c.length;
        }
        const avgLength = totalLength / n || 1;
        // document frequency per query term
        const df = new Map<string, number>();
        for (const term of queryTerms) {
            let count = 0;
            for (const c of all) {
                if (c.tf.has(term)) {
                    count++;
                }
            }
            df.set(term, count);
        }
        const k1 = 1.4;
        const b = 0.75;
        const scored: Array<{ chunk: Chunk; score: number }> = [];
        for (const chunk of all) {
            let score = 0;
            for (const term of queryTerms) {
                const f = chunk.tf.get(term);
                if (!f) {
                    continue;
                }
                const idf = Math.log(1 + (n - df.get(term)! + 0.5) / (df.get(term)! + 0.5));
                score += idf * (f * (k1 + 1)) / (f + k1 * (1 - b + b * chunk.length / avgLength));
            }
            if (score > 0) {
                scored.push({ chunk, score });
            }
        }
        scored.sort((a, c) => c.score - a.score);
        return scored.slice(0, Math.max(1, Math.min(limit, 50))).map(({ chunk, score }) => ({
            file: chunk.file,
            root: chunk.root,
            startLine: chunk.startLine,
            endLine: chunk.endLine,
            section: chunk.section,
            score: Math.round(score * 100) / 100,
            excerpt: chunk.text.length > 700 ? chunk.text.slice(0, 700) + '…' : chunk.text,
        }));
    }

    async facts(roots: string[]): Promise<SpaceFacts> {
        const files = await this.ensure(roots);
        const byExtension: Record<string, number> = {};
        let chunks = 0;
        const perRoot = new Map<string, number>();
        files.forEach((entry, file) => {
            const ext = path.extname(file).toLowerCase() || '(none)';
            byExtension[ext] = (byExtension[ext] ?? 0) + 1;
            chunks += entry.chunks.length;
            const root = entry.chunks[0]?.root;
            if (root) {
                perRoot.set(root, (perRoot.get(root) ?? 0) + 1);
            }
        });
        return {
            roots: roots.map(r => ({ path: r, documents: perRoot.get(r) ?? 0 })),
            documents: files.size,
            chunks,
            byExtension,
            builtAt: this.builtAt.get(this.spaceKey(roots)) ?? new Date().toISOString(),
        };
    }
}
