/********************************************************************************
 * Copyright (C) 2020 EclipseSource and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the MIT License, which is available in the project root.
 *
 * SPDX-License-Identifier: MIT
 ********************************************************************************/

import { WindowService } from '@theia/core/lib/browser/window/window-service';
import * as React from 'react';

export interface ExternalBrowserLinkProps {
    text: string;
    url: string;
    windowService: WindowService;
}

export function renderProductName(): React.ReactNode {
    return <h1>PM<span className="gs-blue-header">IDE</span></h1>;
}

function BrowserLink(props: ExternalBrowserLinkProps): React.JSX.Element {
    return <a
        role={'button'}
        tabIndex={0}
        href={props.url}
        target='_blank'
    >
        {props.text}
    </a>;
}

export function renderWhatIs(windowService: WindowService): React.ReactNode {
    return <div className='gs-section'>
        <h3 className='gs-section-header'>
            The IDE rebuilt for product managers
        </h3>
        <div>
            PMIDE puts product managers, engineers, and AI agents in the same repository.
            Manage governed context, generate agent-ready Work Packages, create reusable skills,
            work safely on draft branches, and review product intent — all inside a real IDE.
        </div>
        <div>
            The core value is not that PMs can code. It is that PMs can manage the context and
            agentic work system that increasingly determines what code gets produced.
        </div>
    </div>;
}

export function renderExtendingCustomizing(windowService: WindowService): React.ReactNode {
    return <div className='gs-section'>
        <h3 className='gs-section-header'>
            The golden flow (Demo Mode)
        </h3>
        <div>
            Planning session → context update → safe draft branch → skill creation → Work Package →
            agent routing → code change → Product Intent Review → governed delivery.
        </div>
        <div>
            The scripted walkthrough is <span className='gs-text-bold'>off by default</span>. Run
            <code> PMIDE: Enable Demo Mode</code> from the command palette (F1) or the PMIDE menu to
            bootstrap the demo workspace and walk the full flow. <code>PMIDE: Disable Demo Mode</code> turns it back off.
        </div>
    </div>;
}

export function renderSupport(windowService: WindowService): React.ReactNode {
    return <div className='gs-section'>
        <h3 className='gs-section-header'>
            Safe by default
        </h3>
        <div>
            You are always shown which branch you are on. Nothing changes in the shared product
            until a safe draft branch is reviewed and approved. High-risk context, skills with
            scripts, and agent runs all require explicit approval.
        </div>
    </div>;
}

export function renderTickets(windowService: WindowService): React.ReactNode {
    return <div className='gs-section'>
        <h3 className='gs-section-header'>
            Agents are governed teammates
        </h3>
        <div>
            Every agent run records who initiated it, the context it saw, the skill it used, and
            what changed — traceable from planning decision to pull request.
        </div>
    </div>;
}

export function renderSourceCode(windowService: WindowService): React.ReactNode {
    return <div className='gs-section'>
        <h3 className='gs-section-header'>
            Built on Eclipse Theia
        </h3>
        <div>
            PMIDE is built on the open-source <BrowserLink text="Eclipse Theia platform"
                url="https://theia-ide.org" windowService={windowService} ></BrowserLink> —
            not a fork of VS Code. It supports VS Code extensions via
            the <BrowserLink text="Open VSX registry" url="https://open-vsx.org/"
                windowService={windowService} ></BrowserLink>.
        </div>
    </div>;
}

export function renderDocumentation(windowService: WindowService): React.ReactNode {
    return <div className='gs-section'>
        <h3 className='gs-section-header'>
            Context is the product artifact
        </h3>
        <div>
            The Context Library treats business rules, domain glossaries, compliance rules, and
            release constraints as version-controlled, owned, and reviewed assets — the inputs
            that make agent output trustworthy.
        </div>
    </div>;
}

export function renderCollaboration(windowService: WindowService): React.ReactNode {
    return <div className='gs-section'>
        <h3 className='gs-section-header'>
            Product and engineering, same repo
        </h3>
        <div>
            PMs review product intent. Engineers review code. Both happen on every proposed
            change, and neither bypasses the other.
        </div>
    </div>;
}

export function renderDownloads(): React.ReactNode {
    return <div className='gs-section'>
        <h3 className='gs-section-header'>
            Getting started
        </h3>
        <div className='gs-action-container'>
            Open any folder to work normally — PMIDE is a full IDE with a real terminal, git,
            debugging, and VS Code extensions from Open VSX. When you want the guided product-management
            walkthrough, enable Demo Mode: it creates the <code>enterprise-sample-app</code> demo
            repository (governed context, an approved skill, planning notes ready to import) in your
            home folder and opens it.
        </div>
    </div>;
}
