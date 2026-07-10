/********************************************************************************
 * PMIDE agent service — the engine seam, backed by the Claude Agent SDK.
 *
 * Modeled on @theia/ai-claude-code's backend but exposing the full SDK
 * surface PMIDE needs: custom system prompts, restricted tool sets,
 * in-process MCP tool servers, plugins, and session resume. Surfaces talk
 * to this over Theia RPC; swapping the engine means swapping this file.
 * SPDX-License-Identifier: MIT
 ********************************************************************************/

import { ILogger } from '@theia/core';
import { inject, injectable } from '@theia/core/shared/inversify';
import { existsSync } from 'fs';
import * as path from 'path';
import { AgentRunRequest, PmideAgentClient, PmideAgentService } from '../common/agent-protocol';
import { PmideToolServerRegistry } from './pmide-tool-servers';

/** The subset of the Claude Agent SDK module PMIDE uses. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ClaudeAgentSdk = any;

@injectable()
export class PmideAgentServiceImpl implements PmideAgentService {

    @inject(ILogger)
    protected readonly logger: ILogger;

    @inject(PmideToolServerRegistry)
    protected readonly toolServers: PmideToolServerRegistry;

    protected client: PmideAgentClient | undefined;
    protected readonly abortControllers = new Map<string, AbortController>();
    protected sdkPromise: Promise<ClaudeAgentSdk> | undefined;

    setClient(client: PmideAgentClient): void {
        this.client = client;
    }

    async available(): Promise<{ ok: boolean; detail: string }> {
        try {
            const sdkPath = this.resolveSdkPath();
            return { ok: true, detail: sdkPath };
        } catch (e) {
            return { ok: false, detail: String(e instanceof Error ? e.message : e) };
        }
    }

    async run(runId: string, request: AgentRunRequest): Promise<void> {
        if (!this.client) {
            throw new Error('PMIDE agent client not initialized');
        }
        // Fire and forget: messages stream to the client. Errors are reported
        // through the client, never thrown across the RPC boundary.
        this.stream(runId, request);
    }

    async cancel(runId: string): Promise<void> {
        const controller = this.abortControllers.get(runId);
        if (controller) {
            controller.abort('user canceled');
            this.abortControllers.delete(runId);
        }
    }

    protected async stream(runId: string, request: AgentRunRequest): Promise<void> {
        const client = this.client!;
        const abortController = new AbortController();
        this.abortControllers.set(runId, abortController);
        try {
            const sdk = await this.importSdk();
            const o = request.options;

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const mcpServers: Record<string, any> = {};
            for (const name of o.pmideToolServers ?? []) {
                const server = this.toolServers.create(name, sdk, o);
                if (server) {
                    mcpServers[name] = server;
                }
            }

            const stream = sdk.query({
                prompt: request.prompt,
                options: {
                    abortController,
                    cwd: o.cwd,
                    additionalDirectories: o.additionalDirectories,
                    ...(o.systemPrompt ? { systemPrompt: o.systemPrompt } : {}),
                    ...(o.allowedTools ? { allowedTools: o.allowedTools } : {}),
                    ...(o.permissionMode ? { permissionMode: o.permissionMode } : {}),
                    ...(o.model ? { model: o.model } : {}),
                    ...(o.resumeSessionId ? { resume: o.resumeSessionId } : {}),
                    ...(o.plugins && o.plugins.length ? { plugins: o.plugins.map(p => ({ type: 'local', path: p })) } : {}),
                    maxTurns: o.maxTurns ?? 30,
                    // PMIDE controls its own context; do not slurp user/project
                    // Claude settings unless a run explicitly asks for them.
                    settingSources: o.settingSources ?? [],
                    ...(Object.keys(mcpServers).length ? { mcpServers } : {}),
                    env: { ...process.env, NODE_OPTIONS: '' },
                    stderr: (data: unknown) => {
                        const message = String(data);
                        if (message.toLowerCase().includes('error') && !message.startsWith('Spawning Claude Code process:')) {
                            this.logger.error('PMIDE agent stderr:', message);
                        } else {
                            this.logger.debug('PMIDE agent stderr:', message);
                        }
                    },
                },
            });

            for await (const message of stream) {
                client.onMessage(runId, message);
                if (message.type === 'result' || abortController.signal.aborted) {
                    break;
                }
            }
            abortController.abort('closed after result');
            client.onMessage(runId, undefined);
        } catch (e) {
            this.logger.error('PMIDE agent error:', e);
            client.onError(runId, e instanceof Error ? e.message : String(e));
        } finally {
            this.abortControllers.delete(runId);
        }
    }

    /**
     * Resolve the bundled Agent SDK. Preference order:
     * 1. the app's own node_modules (bundled with the installer via asarUnpack),
     * 2. a global npm install (developer fallback).
     */
    protected resolveSdkPath(): string {
        const candidates: string[] = [];
        try {
            candidates.push(path.dirname(require.resolve('@anthropic-ai/claude-agent-sdk/package.json')));
        } catch { /* not in module paths */ }
        for (const candidate of candidates) {
            if (existsSync(path.join(candidate, 'sdk.mjs'))) {
                return candidate;
            }
        }
        throw new Error(
            'PMIDE could not find the bundled Claude Agent SDK. '
            + 'Reinstall PMIDE, or install the SDK with: npm install -g @anthropic-ai/claude-agent-sdk');
    }

    protected importSdk(): Promise<ClaudeAgentSdk> {
        if (!this.sdkPromise) {
            this.sdkPromise = this.doImportSdk();
        }
        return this.sdkPromise;
    }

    protected async doImportSdk(): Promise<ClaudeAgentSdk> {
        const sdkDir = this.resolveSdkPath();
        const sdkMjs = path.join(sdkDir, 'sdk.mjs');
        // Indirect import so webpack does not try to bundle the SDK.
        const dynamicImport = new Function('p', 'return import(p)');
        const mod = await dynamicImport(`file://${sdkMjs.replace(/\\/g, '/')}`);
        // Load zod from the SDK's own dependency tree so tool schemas are
        // built with the exact zod instance the SDK validates against.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let z: any;
        try {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const zod = require(require.resolve('zod', { paths: [sdkDir, __dirname] }));
            z = zod.z ?? zod;
        } catch (e) {
            this.logger.warn('PMIDE: zod not resolvable next to the Agent SDK; in-process tools disabled.', e);
        }
        return { ...mod, z };
    }
}
