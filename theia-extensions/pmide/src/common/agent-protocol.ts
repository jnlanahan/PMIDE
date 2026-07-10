/********************************************************************************
 * PMIDE agent protocol — the thin engine seam between PMIDE surfaces and the
 * Claude Agent SDK. Frontend sends a request; backend streams SDK messages
 * back over Theia RPC. If the engine is ever swapped, this contract is the
 * only thing the surfaces depend on.
 * SPDX-License-Identifier: MIT
 ********************************************************************************/

export const PMIDE_AGENT_SERVICE_PATH = '/services/pmide-agent';

export const PmideAgentService = Symbol('PmideAgentService');
export const PmideAgentClient = Symbol('PmideAgentClient');

/**
 * A single message streamed from the engine. `data` is the raw SDK message
 * (assistant / user / result / system / stream_event), passed through as-is;
 * surfaces pick out what they render.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AgentMessage = any;

export interface AgentRunOptions {
    /** Working directory for the session — usually the product repo root. */
    cwd: string;
    /** Additional directories the agent may read (linked code repos). */
    additionalDirectories?: string[];
    /** Replaces the default system prompt when set. */
    systemPrompt?: string;
    /** Restrict the run to these tools (e.g. read-only tools for Ask). */
    allowedTools?: string[];
    /** Named in-process PMIDE tool servers to attach (e.g. 'space-index'). */
    pmideToolServers?: string[];
    /** SDK permission mode. Ask runs 'bypassPermissions' with read-only tools. */
    permissionMode?: 'default' | 'acceptEdits' | 'bypassPermissions' | 'plan';
    /** Which filesystem settings to load. Defaults to none for PMIDE runs. */
    settingSources?: Array<'user' | 'project' | 'local'>;
    /** Claude Code plugins to load (packages), absolute paths. */
    plugins?: string[];
    /** Model override; defaults to the SDK default. */
    model?: string;
    /** Resume a previous SDK session by id (conversation continuity). */
    resumeSessionId?: string;
    /** Cap on agentic turns; a safety net, not a feature. */
    maxTurns?: number;
}

export interface AgentRunRequest {
    prompt: string;
    options: AgentRunOptions;
}

export interface PmideAgentClient {
    /** A streamed engine message for the given run. `undefined` closes the stream. */
    onMessage(runId: string, message: AgentMessage | undefined): void;
    /** Terminal error for the given run. */
    onError(runId: string, message: string): void;
}

export interface PmideAgentService {
    /** Start a run; messages stream to the client under runId. */
    run(runId: string, request: AgentRunRequest): Promise<void>;
    /** Cancel a run in flight. */
    cancel(runId: string): Promise<void>;
    /** True if the engine is reachable (SDK resolvable). */
    available(): Promise<{ ok: boolean; detail: string }>;
}
