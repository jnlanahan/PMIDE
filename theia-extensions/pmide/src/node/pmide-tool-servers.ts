/********************************************************************************
 * PMIDE in-process MCP tool servers — tools the engine can call without
 * leaving the app process (createSdkMcpServer). Phase 1 ships 'space-index'
 * (pmide_search / pmide_facts) over the local space index.
 * SPDX-License-Identifier: MIT
 ********************************************************************************/

import { ILogger } from '@theia/core';
import { inject, injectable } from '@theia/core/shared/inversify';
import { AgentRunOptions } from '../common/agent-protocol';
import { PmideSpaceIndex } from './pmide-space-index';
import type { ClaudeAgentSdk } from './pmide-agent-service-impl';

@injectable()
export class PmideToolServerRegistry {

    @inject(ILogger)
    protected readonly logger: ILogger;

    @inject(PmideSpaceIndex)
    protected readonly index: PmideSpaceIndex;

    /**
     * Create the named in-process MCP server instance for a run.
     * Returns undefined for unknown names (logged, not fatal).
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    create(name: string, sdk: ClaudeAgentSdk, options: AgentRunOptions): any {
        switch (name) {
            case 'space-index':
                return this.createSpaceIndexServer(sdk, options);
            default:
                this.logger.warn(`Unknown PMIDE tool server requested: ${name}`);
                return undefined;
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    protected createSpaceIndexServer(sdk: ClaudeAgentSdk, options: AgentRunOptions): any {
        const index = this.index;
        const roots = [options.cwd, ...(options.additionalDirectories ?? [])];
        const z = sdk.z ?? undefined;
        // The SDK re-exports zod as `z` in recent versions; if absent, fall
        // back to plain JSON-schema-free tools (SDK accepts zod schemas only,
        // so we require it — surfaced as a hard error to catch upgrades).
        if (!z) {
            throw new Error('Claude Agent SDK did not expose zod (sdk.z); cannot register PMIDE tools.');
        }
        return sdk.createSdkMcpServer({
            name: 'space-index',
            version: '1.0.0',
            tools: [
                sdk.tool(
                    'pmide_search',
                    'Full-text search across every document indexed in this Product Space '
                    + '(specs, decisions, docs, source files of all linked repos). '
                    + 'Returns the best-matching chunks with their source paths and line ranges. '
                    + 'Always cite results you use.',
                    {
                        query: z.string().describe('Search query — keywords, phrases, or an identifier'),
                        limit: z.number().optional().describe('Maximum results, default 8'),
                    },
                    async (args: { query: string; limit?: number }) => {
                        const results = await index.search(roots, args.query, args.limit ?? 8);
                        return {
                            content: [{
                                type: 'text',
                                text: results.length === 0
                                    ? 'No matches in the space index.'
                                    : JSON.stringify(results, undefined, 1),
                            }],
                        };
                    }
                ),
                sdk.tool(
                    'pmide_facts',
                    'List what is in this Product Space: linked repositories, indexed document '
                    + 'counts by type, and index freshness. Use to understand what sources exist '
                    + 'before searching.',
                    {},
                    async () => {
                        const facts = await index.facts(roots);
                        return { content: [{ type: 'text', text: JSON.stringify(facts, undefined, 1) }] };
                    }
                ),
            ],
        });
    }
}
