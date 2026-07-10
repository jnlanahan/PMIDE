/********************************************************************************
 * PMIDE backend DI module.
 * SPDX-License-Identifier: MIT
 ********************************************************************************/

import { ConnectionHandler, RpcConnectionHandler } from '@theia/core';
import { ConnectionContainerModule } from '@theia/core/lib/node/messaging/connection-container-module';
import { ContainerModule } from '@theia/core/shared/inversify';
import { PMIDE_AGENT_SERVICE_PATH, PmideAgentClient, PmideAgentService } from '../common/agent-protocol';
import { PMIDE_SERVICE_PATH, PmideService } from '../common/protocol';
import { PmideAgentServiceImpl } from './pmide-agent-service-impl';
import { PmideServiceImpl } from './pmide-service-impl';
import { PmideSpaceIndex } from './pmide-space-index';
import { PmideToolServerRegistry } from './pmide-tool-servers';

const pmideConnectionModule = ConnectionContainerModule.create(({ bind }) => {
    // Repo-scoped git service (stateless; plain handler)
    bind(PmideServiceImpl).toSelf().inSingletonScope();
    bind(PmideService).toService(PmideServiceImpl);
    bind(ConnectionHandler).toDynamicValue(ctx =>
        new RpcConnectionHandler(PMIDE_SERVICE_PATH, () => ctx.container.get<PmideService>(PmideService))
    ).inSingletonScope();

    // Engine seam (streams to a per-connection client)
    bind(PmideAgentServiceImpl).toSelf().inSingletonScope();
    bind(PmideAgentService).toService(PmideAgentServiceImpl);
    bind(ConnectionHandler).toDynamicValue(ctx =>
        new RpcConnectionHandler<PmideAgentClient>(PMIDE_AGENT_SERVICE_PATH, client => {
            const server = ctx.container.get(PmideAgentServiceImpl);
            server.setClient(client);
            return server;
        })
    ).inSingletonScope();
});

export default new ContainerModule(bind => {
    // Space index + tool servers are app-wide singletons (index survives reconnects)
    bind(PmideSpaceIndex).toSelf().inSingletonScope();
    bind(PmideToolServerRegistry).toSelf().inSingletonScope();
    bind(ConnectionContainerModule).toConstantValue(pmideConnectionModule);
});
