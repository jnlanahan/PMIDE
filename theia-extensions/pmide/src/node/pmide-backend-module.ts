/********************************************************************************
 * PMIDE backend DI module.
 * SPDX-License-Identifier: MIT
 ********************************************************************************/

import { ConnectionHandler, RpcConnectionHandler } from '@theia/core';
import { ContainerModule } from '@theia/core/shared/inversify';
import { PMIDE_SERVICE_PATH, PmideService } from '../common/protocol';
import { PmideServiceImpl } from './pmide-service-impl';

export default new ContainerModule(bind => {
    bind(PmideServiceImpl).toSelf().inSingletonScope();
    bind(PmideService).toService(PmideServiceImpl);
    bind(ConnectionHandler).toDynamicValue(ctx =>
        new RpcConnectionHandler(PMIDE_SERVICE_PATH, () => ctx.container.get<PmideService>(PmideService))
    ).inSingletonScope();
});
