/********************************************************************************
 * PMIDE frontend DI module.
 * SPDX-License-Identifier: MIT
 ********************************************************************************/

import { CommandContribution, MenuContribution, ResourceResolver } from '@theia/core';
import { FrontendApplicationContribution, WidgetFactory } from '@theia/core/lib/browser';
import { PreferenceContribution } from '@theia/core/lib/common/preferences/preference-schema';
import { ServiceConnectionProvider } from '@theia/core/lib/browser/messaging/service-connection-provider';
import { bindViewContribution } from '@theia/core/lib/browser/shell/view-contribution';
import { ContainerModule } from '@theia/core/shared/inversify';
import { PMIDE_SERVICE_PATH, PmideService } from '../common/protocol';
import { PmideCommandContribution, PmideMenuContribution, PmideStatusBarContribution, PmideWorkspaceInit, pmidePreferenceContribution } from './pmide-contributions';
import { PmideFlows } from './pmide-flows';
import { PmideGitResourceResolver } from './pmide-git-resource';
import { PMIDE_PANEL_FACTORY_ID, PmidePanelOptions, PmidePanelWidget } from './pmide-panels';
import { PmideState } from './pmide-state';
import {
    PmideContextViewContribution, PmideContextViewWidget,
    PmideGovernanceViewContribution, PmideGovernanceViewWidget,
    PmidePrsViewContribution, PmidePrsViewWidget,
    PmideReleasesViewContribution, PmideReleasesViewWidget,
    PmideRunsViewContribution, PmideRunsViewWidget,
    PmideSkillsViewContribution, PmideSkillsViewWidget,
    PmideWpViewContribution, PmideWpViewWidget,
} from './pmide-views';

import '../../src/browser/style/pmide.css';

export default new ContainerModule(bind => {
    // Backend proxy
    bind(PmideService).toDynamicValue(ctx =>
        ServiceConnectionProvider.createProxy<PmideService>(ctx.container, PMIDE_SERVICE_PATH)
    ).inSingletonScope();

    // State + flows
    bind(PmideState).toSelf().inSingletonScope();
    bind(PmideFlows).toSelf().inSingletonScope();

    // Real-diff resource resolver
    bind(PmideGitResourceResolver).toSelf().inSingletonScope();
    bind(ResourceResolver).toService(PmideGitResourceResolver);

    // Preferences (demo mode gate)
    bind(PreferenceContribution).toConstantValue(pmidePreferenceContribution);

    // Commands + menus
    bind(CommandContribution).to(PmideCommandContribution).inSingletonScope();
    bind(MenuContribution).to(PmideMenuContribution).inSingletonScope();

    // Status bar + bootstrap
    bind(PmideStatusBarContribution).toSelf().inSingletonScope();
    bind(FrontendApplicationContribution).toService(PmideStatusBarContribution);
    bind(PmideWorkspaceInit).toSelf().inSingletonScope();
    bind(FrontendApplicationContribution).toService(PmideWorkspaceInit);

    // Main-area panels
    bind(PmidePanelWidget).toSelf();
    bind(WidgetFactory).toDynamicValue(ctx => ({
        id: PMIDE_PANEL_FACTORY_ID,
        createWidget: (options: PmidePanelOptions) => {
            const widget = ctx.container.get(PmidePanelWidget);
            widget.configure(options);
            return widget;
        },
    })).inSingletonScope();

    // Activity-bar views
    bindViewContribution(bind, PmideContextViewContribution);
    bind(PmideContextViewWidget).toSelf();
    bind(WidgetFactory).toDynamicValue(ctx => ({
        id: PmideContextViewWidget.ID,
        createWidget: () => ctx.container.get(PmideContextViewWidget),
    })).inSingletonScope();

    bindViewContribution(bind, PmideWpViewContribution);
    bind(PmideWpViewWidget).toSelf();
    bind(WidgetFactory).toDynamicValue(ctx => ({
        id: PmideWpViewWidget.ID,
        createWidget: () => ctx.container.get(PmideWpViewWidget),
    })).inSingletonScope();

    bindViewContribution(bind, PmideSkillsViewContribution);
    bind(PmideSkillsViewWidget).toSelf();
    bind(WidgetFactory).toDynamicValue(ctx => ({
        id: PmideSkillsViewWidget.ID,
        createWidget: () => ctx.container.get(PmideSkillsViewWidget),
    })).inSingletonScope();

    bindViewContribution(bind, PmideRunsViewContribution);
    bind(PmideRunsViewWidget).toSelf();
    bind(WidgetFactory).toDynamicValue(ctx => ({
        id: PmideRunsViewWidget.ID,
        createWidget: () => ctx.container.get(PmideRunsViewWidget),
    })).inSingletonScope();

    bindViewContribution(bind, PmidePrsViewContribution);
    bind(PmidePrsViewWidget).toSelf();
    bind(WidgetFactory).toDynamicValue(ctx => ({
        id: PmidePrsViewWidget.ID,
        createWidget: () => ctx.container.get(PmidePrsViewWidget),
    })).inSingletonScope();

    bindViewContribution(bind, PmideReleasesViewContribution);
    bind(PmideReleasesViewWidget).toSelf();
    bind(WidgetFactory).toDynamicValue(ctx => ({
        id: PmideReleasesViewWidget.ID,
        createWidget: () => ctx.container.get(PmideReleasesViewWidget),
    })).inSingletonScope();

    bindViewContribution(bind, PmideGovernanceViewContribution);
    bind(PmideGovernanceViewWidget).toSelf();
    bind(WidgetFactory).toDynamicValue(ctx => ({
        id: PmideGovernanceViewWidget.ID,
        createWidget: () => ctx.container.get(PmideGovernanceViewWidget),
    })).inSingletonScope();
});
