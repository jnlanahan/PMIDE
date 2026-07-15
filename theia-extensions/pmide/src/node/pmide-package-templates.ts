/********************************************************************************
 * PMIDE baseline package templates — the three workflows shipped with the app.
 * Scaffolding copies a template into the product repo at .pmide/packages/<id>/
 * as an independently owned folder (the "use this template" model — no live
 * tether back here). Each package is a Claude Code plugin-shaped folder:
 * a .claude-plugin/plugin.json, a pmide-package.json manifest PMIDE reads,
 * and skills/<id>/SKILL.md with the workflow instructions.
 *
 * Templates are embedded as strings so the packaged app needs no extra
 * resource lookup — the backend is bundled and cannot rely on __dirname.
 * SPDX-License-Identifier: MIT
 ********************************************************************************/

export interface PackageTemplate {
    id: string;
    /** repo-relative path inside the package folder -> file content */
    files: Record<string, string>;
}

function manifest(json: object): string {
    return JSON.stringify(json, undefined, 2) + '\n';
}

const DISCOVERY_SYNTHESIS: PackageTemplate = {
    id: 'discovery-synthesis',
    files: {
        '.claude-plugin/plugin.json': manifest({
            name: 'discovery-synthesis',
            description: 'Turn raw discovery notes into a themed synthesis with evidence and open questions.',
        }),
        'pmide-package.json': manifest({
            id: 'discovery-synthesis',
            name: 'Discovery synthesis',
            description: 'Turn raw discovery notes into a themed synthesis with evidence and open questions.',
            mode: 'new-doc',
            inputs: [
                { id: 'notes', label: 'Raw discovery notes', type: 'multiline', hint: 'Paste interview notes, call transcripts, survey verbatims — messy is fine.' },
                { id: 'focus', label: 'Focus (optional)', type: 'text', hint: 'e.g. “onboarding drop-off” — leave empty to let the themes emerge.', optional: true },
            ],
            output: { dir: 'specs/discovery', name: 'synthesis' },
        }),
        'skills/discovery-synthesis/SKILL.md': `---
name: discovery-synthesis
description: Turn raw discovery notes into a themed synthesis with evidence and open questions.
---

You are running the discovery-synthesis workflow for a product manager.
You receive raw discovery material — interview notes, call transcripts, survey verbatims —
and turn it into a synthesis the PM can share and act on.

Rules for the synthesis:

1. **Themes over chronology.** Group what you heard into 3–7 themes. Name each theme in
   plain language from the customer's point of view, not internal jargon.
2. **Evidence under every claim.** Under each theme, quote the strongest verbatims from the
   notes (short, attributed if the notes say who spoke). Never invent or embellish a quote.
3. **Separate signal from interpretation.** For each theme: first "What we heard" (facts and
   quotes), then "What it might mean" (your interpretation, clearly framed as interpretation).
4. **Surface tensions and surprises.** If participants contradicted each other, or the notes
   contradict what the current specs assume, call it out in its own section. Use the space
   search tools to check the current specs when relevant.
5. **End with open questions and suggested next steps** — concrete, small, and testable.
6. Weight by frequency and intensity, not by who spoke loudest in the notes. If the sample is
   thin, say so plainly.

Structure the artifact as:

# Discovery synthesis — <focus or dominant theme>

> <one-paragraph summary a stakeholder could read alone>

## Themes
### <theme name>
**What we heard** …
**What it might mean** …

## Tensions and surprises
## Open questions
## Suggested next steps
`,
    },
};

const EVIDENCE_TO_SPEC: PackageTemplate = {
    id: 'evidence-to-spec',
    files: {
        '.claude-plugin/plugin.json': manifest({
            name: 'evidence-to-spec',
            description: 'Fold new evidence into an existing spec as a reviewed revision.',
        }),
        'pmide-package.json': manifest({
            id: 'evidence-to-spec',
            name: 'Evidence to spec',
            description: 'Fold new evidence into an existing spec as a reviewed revision.',
            mode: 'revise-spec',
            inputs: [
                { id: 'spec', label: 'Spec to revise', type: 'spec' },
                { id: 'evidence', label: 'New evidence', type: 'multiline', hint: 'What did you learn? Paste findings, data points, decisions, customer quotes…' },
                { id: 'guidance', label: 'Guidance (optional)', type: 'text', hint: 'e.g. “only touch the eligibility rules”', optional: true },
            ],
        }),
        'skills/evidence-to-spec/SKILL.md': `---
name: evidence-to-spec
description: Fold new evidence into an existing spec as a reviewed revision.
---

You are running the evidence-to-spec workflow for a product manager. You receive the current
content of a spec and new evidence, and you produce a complete revised version of that spec.

Rules for the revision:

1. **Return the whole document.** The artifact is the full revised spec, ready to replace the
   current file. Never output a fragment or a list of edits.
2. **Preserve voice and structure.** Keep the document's headings, tone, and formatting.
   Change only what the evidence justifies; leave untouched sections exactly as they are.
3. **Every change must trace to the evidence.** Do not slip in improvements the evidence does
   not support. If the evidence is ambiguous, prefer the smaller change.
4. **Contradictions are decisions, not silent edits.** Where the evidence contradicts the
   current spec, make the change and add a brief note in the document (e.g. under a "Decisions"
   or "Changelog" section, creating it only if the document has a natural place for it).
5. **Mark true unknowns.** If the evidence raises a question the spec cannot yet answer, add it
   to an "Open questions" section rather than guessing.
6. Use the space search tools to check related specs and code if the evidence refers to them.
`,
    },
};

const STAKEHOLDER_UPDATE: PackageTemplate = {
    id: 'stakeholder-update',
    files: {
        '.claude-plugin/plugin.json': manifest({
            name: 'stakeholder-update',
            description: 'Draft a crisp stakeholder update from the current state of the space.',
        }),
        'pmide-package.json': manifest({
            id: 'stakeholder-update',
            name: 'Stakeholder update',
            description: 'Draft a crisp stakeholder update from the current state of the space.',
            mode: 'new-doc',
            inputs: [
                { id: 'audience', label: 'Audience', type: 'text', hint: 'e.g. “exec team”, “engineering leads”, “design partners”' },
                { id: 'period', label: 'Covering', type: 'text', hint: 'e.g. “the last two weeks”' },
                {
                    id: 'highlights', label: 'Highlights to include (optional)', type: 'multiline',
                    hint: 'Anything the update must mention — wins, risks, decisions.', optional: true,
                },
            ],
            output: { dir: 'specs/updates', name: 'update' },
        }),
        'skills/stakeholder-update/SKILL.md': `---
name: stakeholder-update
description: Draft a crisp stakeholder update from the current state of the space.
---

You are running the stakeholder-update workflow for a product manager. You draft an update
for the named audience, grounded in the actual current state of this Product Space.

Rules for the update:

1. **Ground it.** Use the space search tools and read the current specs (especially anything
   under specs/updates and specs/discovery) to know what is true now. Do not invent progress.
2. **Write for the audience.** Executives get outcomes and risks; engineering leads get scope
   and dependencies; design partners get what changed for them. Adjust depth accordingly.
3. **Lead with the headline** — the one sentence the reader must retain.
4. **Keep it honest and calm.** Risks and slips stated plainly, no spin, no alarm. If something
   is unknown, say it is unknown.
5. **Short.** A stakeholder update that takes more than two minutes to read will not be read.

Structure the artifact as:

# Update for <audience> — <period>

> <the headline>

## What moved
## What we decided
## Risks and watch-items
## What's next
## Asks
`,
    },
};

export const PACKAGE_TEMPLATES: ReadonlyArray<PackageTemplate> = [
    DISCOVERY_SYNTHESIS,
    EVIDENCE_TO_SPEC,
    STAKEHOLDER_UPDATE,
];
