/********************************************************************************
 * PMIDE agent frontend — browser-side handle on the engine seam.
 * Surfaces call run() and get a stream of SDK messages via events.
 * SPDX-License-Identifier: MIT
 ********************************************************************************/

import { Emitter, Event, generateUuid } from '@theia/core';
import { inject, injectable } from '@theia/core/shared/inversify';
import {
    AgentMessage, AgentRunOptions, PmideAgentClient, PmideAgentService,
} from '../common/agent-protocol';

export interface AgentRunHandle {
    readonly runId: string;
    readonly onMessage: Event<AgentMessage>;
    readonly onError: Event<string>;
    /** Fires exactly once when the stream ends (result, error, or cancel). */
    readonly onClose: Event<void>;
    cancel(): Promise<void>;
}

interface RunChannels {
    message: Emitter<AgentMessage>;
    error: Emitter<string>;
    close: Emitter<void>;
    closed: boolean;
}

@injectable()
export class PmideAgentClientImpl implements PmideAgentClient {

    protected readonly runs = new Map<string, RunChannels>();

    register(runId: string): RunChannels {
        const channels: RunChannels = {
            message: new Emitter<AgentMessage>(),
            error: new Emitter<string>(),
            close: new Emitter<void>(),
            closed: false,
        };
        this.runs.set(runId, channels);
        return channels;
    }

    onMessage(runId: string, message: AgentMessage | undefined): void {
        const channels = this.runs.get(runId);
        if (!channels) {
            return;
        }
        if (message === undefined) {
            this.finish(runId, channels);
        } else {
            channels.message.fire(message);
        }
    }

    onError(runId: string, message: string): void {
        const channels = this.runs.get(runId);
        if (!channels) {
            return;
        }
        channels.error.fire(message);
        this.finish(runId, channels);
    }

    protected finish(runId: string, channels: RunChannels): void {
        if (!channels.closed) {
            channels.closed = true;
            channels.close.fire();
        }
        this.runs.delete(runId);
    }
}

@injectable()
export class PmideAgentFrontend {

    @inject(PmideAgentService)
    protected readonly service: PmideAgentService;

    @inject(PmideAgentClientImpl)
    protected readonly client: PmideAgentClientImpl;

    /** Start an engine run; subscribe to the handle before awaiting anything else. */
    run(prompt: string, options: AgentRunOptions): AgentRunHandle {
        const runId = generateUuid();
        const channels = this.client.register(runId);
        const handle: AgentRunHandle = {
            runId,
            onMessage: channels.message.event,
            onError: channels.error.event,
            onClose: channels.close.event,
            cancel: () => this.service.cancel(runId),
        };
        this.service.run(runId, { prompt, options }).catch(e => {
            this.client.onError(runId, e instanceof Error ? e.message : String(e));
        });
        return handle;
    }

    available(): Promise<{ ok: boolean; detail: string }> {
        return this.service.available();
    }
}
