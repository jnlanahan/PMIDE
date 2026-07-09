/********************************************************************************
 * PMIDE git resource — resolves pmide-git URIs to file contents at a git ref,
 * so friendly diffs open the real editor diff against main/HEAD.
 * URI shape: pmide-git:/<repo-relative-path>?ref=<ref>&repo=<abs-repo-path>
 * SPDX-License-Identifier: MIT
 ********************************************************************************/

import { Resource, ResourceResolver } from '@theia/core';
import URI from '@theia/core/lib/common/uri';
import { inject, injectable } from '@theia/core/shared/inversify';
import { PmideService } from '../common/protocol';

export const PMIDE_GIT_SCHEME = 'pmide-git';

export function refUri(repoPath: string, repoRelativePath: string, ref: string): URI {
    return new URI(`${PMIDE_GIT_SCHEME}:/${repoRelativePath}?ref=${encodeURIComponent(ref)}&repo=${encodeURIComponent(repoPath)}`);
}

@injectable()
export class PmideGitResourceResolver implements ResourceResolver {

    @inject(PmideService)
    protected readonly service: PmideService;

    resolve(uri: URI): Resource {
        if (uri.scheme !== PMIDE_GIT_SCHEME) {
            throw new Error('Not a pmide-git URI: ' + uri.toString());
        }
        const path = uri.path.toString().replace(/^\//, '');
        const params = new URLSearchParams(uri.query);
        const ref = params.get('ref') || 'HEAD';
        const repo = params.get('repo') || '';
        const service = this.service;
        return {
            uri,
            async readContents(): Promise<string> {
                const content = await service.readFileAtRef(repo, path, ref);
                return content ?? '';
            },
            dispose(): void { /* nothing */ },
        };
    }
}
