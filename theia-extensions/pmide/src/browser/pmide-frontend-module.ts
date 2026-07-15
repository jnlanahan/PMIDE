/********************************************************************************
 * PMIDE frontend DI module.
 * SPDX-License-Identifier: MIT
 ********************************************************************************/

import { CommandContribution, MenuContribution, ResourceResolver } from '@theia/core';
import { FrontendApplicationContribution, WidgetFactory } from '@theia/core/lib/browser';
import { RemoteConnectionProvider, ServiceConnectionProvider } from '@theia/core/lib/browser/messaging/service-connection-provider';
import { bindViewContribution } from '@theia/core/lib/browser/shell/view-contribution';
import { ContainerModule, interfaces } from '@theia/core/shared/inversify';
import { PMIDE_AGENT_SERVICE_PATH, PmideAgentClient, PmideAgentService } from '../common/agent-protocol';
import { PMIDE_SERVICE_PATH, PmideService } from '../common/protocol';
import { PmideAgentClientImpl, PmideAgentFrontend } from './pmide-agent-frontend';
import { PmideAskWidget } from './pmide-ask-widget';
import { PmideGitResourceResolver } from './pmide-git-resource';
import { bindPmideMode } from './pmide-mode';
import { PmideSpaceService } from './pmide-space';
import { PmideSpecEditorWidget, PmideSpecsContribution, PmideSpecsFeed, PmideSpecsWidget, SpecEditorOptions } from './pmide-specs';
import { PmideThemeContribution } from './pmide-theme';
import {
    PmideAskViewContribution, PmideCodeViewContribution, PmideCodeWidget,
    PmideContextViewContribution, PmideContextWidget, PmideHomeViewContribution,
    PmideHomeWidget, PmideSpecsViewContribution,
    PmideSurfacesFrontendContribution, PmideWorkflowsViewContribution,
} from './pmide-surfaces';
import {
    PmideWorkflowRunnerWidget, PmideWorkflowsContribution, PmideWorkflowsFeed,
    PmideWorkflowsWidget, WorkflowRunnerOptions,
} from './pmide-workflows';

import '../../src/browser/style/pmide.css';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function bindSurface(bind: interfaces.Bind, widget: { ID: string } & (new (...args: any[]) => any), view: new () => any): void {
    bindViewContribution(bind, view);
    bind(widget).toSelf();
    bind(WidgetFactory).toDynamicValue(ctx => ({
        id: widget.ID,
        createWidget: () => ctx.container.get(widget),
    })).inSingletonScope();
}

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

    // Product Space
    bind(PmideSpaceService).toSelf().inSingletonScope();

    // UI modes: reader (calm default) <-> code (full IDE)
    bindPmideMode(bind);

    // Specs: shared change feed, per-document reader widgets, commands
    bind(PmideSpecsFeed).toSelf().inSingletonScope();
    bind(PmideSpecEditorWidget).toSelf();
    bind(WidgetFactory).toDynamicValue(ctx => ({
        id: PmideSpecEditorWidget.FACTORY_ID,
        createWidget: (options: SpecEditorOptions) => {
            const widget = ctx.container.get(PmideSpecEditorWidget);
            widget.configure(options);
            return widget;
        },
    })).inSingletonScope();
    bind(PmideSpecsContribution).toSelf().inSingletonScope();
    bind(CommandContribution).toService(PmideSpecsContribution);
    bind(MenuContribution).toService(PmideSpecsContribution);

    // Workflows: package feed, per-package runner widgets, commands
    bind(PmideWorkflowsFeed).toSelf().inSingletonScope();
    bind(PmideWorkflowRunnerWidget).toSelf();
    bind(WidgetFactory).toDynamicValue(ctx => ({
        id: PmideWorkflowRunnerWidget.FACTORY_ID,
        createWidget: (options: WorkflowRunnerOptions) => {
            const widget = ctx.container.get(PmideWorkflowRunnerWidget);
            widget.configure(options);
            return widget;
        },
    })).inSingletonScope();
    bind(PmideWorkflowsContribution).toSelf().inSingletonScope();
    bind(CommandContribution).toService(PmideWorkflowsContribution);

    // The six surfaces
    bindSurface(bind, PmideHomeWidget, PmideHomeViewContribution);
    bindSurface(bind, PmideAskWidget, PmideAskViewContribution);
    bindSurface(bind, PmideSpecsWidget, PmideSpecsViewContribution);
    bindSurface(bind, PmideWorkflowsWidget, PmideWorkflowsViewContribution);
    bindSurface(bind, PmideCodeWidget, PmideCodeViewContribution);
    bindSurface(bind, PmideContextWidget, PmideContextViewContribution);

    // Startup attachment + commands + menu
    bind(PmideSurfacesFrontendContribution).toSelf().inSingletonScope();
    bind(FrontendApplicationContribution).toService(PmideSurfacesFrontendContribution);
    bind(CommandContribution).toService(PmideSurfacesFrontendContribution);
    bind(MenuContribution).toService(PmideSurfacesFrontendContribution);

    // PMIDE Light theme
    bind(PmideThemeContribution).toSelf().inSingletonScope();
    bind(FrontendApplicationContribution).toService(PmideThemeContribution);
});
