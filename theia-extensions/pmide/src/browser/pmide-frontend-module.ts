/********************************************************************************
 * PMIDE frontend DI module.
 * SPDX-License-Identifier: MIT
 ********************************************************************************/

import { ResourceResolver } from '@theia/core';
import { ServiceConnectionProvider } from '@theia/core/lib/browser/messaging/service-connection-provider';
import { ContainerModule } from '@theia/core/shared/inversify';
import { PMIDE_SERVICE_PATH, PmideService } from '../common/protocol';
import { PmideGitResourceResolver } from './pmide-git-resource';

import '../../src/browser/style/pmide.css';

export default new ContainerModule(bind => {
    // Backend proxy
    bind(PmideService).toDynamicValue(ctx =>
        ServiceConnectionProvider.createProxy<PmideService>(ctx.container, PMIDE_SERVICE_PATH)
    ).inSingletonScope();

    // Git-ref resource resolver (friendly diffs)
    bind(PmideGitResourceResolver).toSelf().inSingletonScope();
    bind(ResourceResolver).toService(PmideGitResourceResolver);
});
