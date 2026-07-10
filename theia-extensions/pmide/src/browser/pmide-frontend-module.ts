/********************************************************************************
 * PMIDE frontend DI module.
 * SPDX-License-Identifier: MIT
 ********************************************************************************/

import { ResourceResolver } from '@theia/core';
import { RemoteConnectionProvider, ServiceConnectionProvider } from '@theia/core/lib/browser/messaging/service-connection-provider';
import { ContainerModule } from '@theia/core/shared/inversify';
import { PMIDE_AGENT_SERVICE_PATH, PmideAgentClient, PmideAgentService } from '../common/agent-protocol';
import { PMIDE_SERVICE_PATH, PmideService } from '../common/protocol';
import { PmideAgentClientImpl, PmideAgentFrontend } from './pmide-agent-frontend';
import { PmideGitResourceResolver } from './pmide-git-resource';

import '../../src/browser/style/pmide.css';

export default new ContainerModule(bind => {
    // Repo-scoped git backend proxy
    bind(PmideService).toDynamicValue(ctx =>
        ServiceConnectionProvider.createProxy<PmideService>(ctx.container, PMIDE_SERVICE_PATH)
    ).inSingletonScope();

    // Git-ref resource resolver (friendly diffs)
    bind(PmideGitResourceResolver).toSelf().inSingletonScope();
    bind(ResourceResolver).toService(PmideGitResourceResolver);

    // Engine seam: backend proxy with a streaming client
    bind(PmideAgentClientImpl).toSelf().inSingletonScope();
    bind(PmideAgentClient).toService(PmideAgentClientImpl);
    bind(PmideAgentService).toDynamicValue(ctx => {
        const connection = ctx.container.get<ServiceConnectionProvider>(RemoteConnectionProvider);
        const client = ctx.container.get<PmideAgentClient>(PmideAgentClient);
        return connection.createProxy<PmideAgentService>(PMIDE_AGENT_SERVICE_PATH, client);
    }).inSingletonScope();
    bind(PmideAgentFrontend).toSelf().inSingletonScope();
});
