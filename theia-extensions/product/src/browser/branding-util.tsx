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
            PMIDE sits over your team&apos;s repositories and becomes the place PM work happens:
            understanding the product by asking, writing version-correct specs, and running
            AI-embedded workflows — all in one calm environment with a full IDE underneath.
        </div>
        <div>
            Six surfaces in the left bar: <span className='gs-text-bold'>Home</span> (what needs you),{' '}
            <span className='gs-text-bold'>Ask</span> (plain-language answers with sources),{' '}
            <span className='gs-text-bold'>Specs</span> (the document workspace),{' '}
            <span className='gs-text-bold'>Workflows</span> (packages you trigger and review),{' '}
            <span className='gs-text-bold'>Code</span> (the full IDE, one click away), and{' '}
            <span className='gs-text-bold'>Context</span> (linked repos and health).
        </div>
    </div>;
}

export function renderExtendingCustomizing(windowService: WindowService): React.ReactNode {
    return <div className='gs-section'>
        <h3 className='gs-section-header'>
            Ask, and see the sources
        </h3>
        <div>
            Ask answers questions about your product from the actual code and current specs, in
            plain language, with citations you can open at the exact line. When the documentation
            and the code disagree, Ask says so instead of silently picking a side.
        </div>
    </div>;
}

export function renderSupport(windowService: WindowService): React.ReactNode {
    return <div className='gs-section'>
        <h3 className='gs-section-header'>
            Version-correct by default
        </h3>
        <div>
            Specs are markdown in git, but you never see git jargon: history is a friendly
            timeline, changes are readable diffs, and &quot;Save version&quot; records a
            plain-language note drafted for you and reviewed by you.
        </div>
    </div>;
}

export function renderTickets(windowService: WindowService): React.ReactNode {
    return <div className='gs-section'>
        <h3 className='gs-section-header'>
            You trigger, you review
        </h3>
        <div>
            Workflows do the labor — discovery synthesis, folding evidence into a spec,
            stakeholder updates — grounded in your repositories and running read-only.
            Nothing lands until you review the draft and accept it.
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
            A Product Space is just your repos
        </h3>
        <div>
            Open your product folder, then link the code repositories next to it from the Context
            surface. Ask searches across all of them; links are recorded in the product repo so
            the space comes back on every open. The search index is a local, rebuildable cache —
            never committed.
        </div>
    </div>;
}

export function renderCollaboration(windowService: WindowService): React.ReactNode {
    return <div className='gs-section'>
        <h3 className='gs-section-header'>
            Depth when you want it
        </h3>
        <div>
            Reader mode keeps the surface calm. Code mode — one click on the Code surface — reveals
            the full IDE: file tree, terminal, source control, debugging, and VS Code extensions
            from Open VSX. Same environment, same repositories, nothing to reload.
        </div>
    </div>;
}

export function renderDownloads(): React.ReactNode {
    return <div className='gs-section'>
        <h3 className='gs-section-header'>
            Getting started
        </h3>
        <div className='gs-action-container'>
            Open your product folder (or any folder — a <code>specs/</code> directory is created
            the first time you write a document). Home shows what needs your attention; Ask answers
            your first question; the Workflows surface has three packages ready to add from
            templates. PMIDE uses the Claude engine bundled with the app — the Context surface
            shows whether it is connected.
        </div>
    </div>;
}
