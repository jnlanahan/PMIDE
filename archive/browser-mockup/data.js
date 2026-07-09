/* ═══════════════════════════════════════════════════════════════
   PMIDE demo data — the "enterprise-sample-app" repository
   Everything the golden demo flow touches lives here.
   ═══════════════════════════════════════════════════════════════ */

const DATA = {};

/* ─────────── Repo file tree ───────────
   type: 'dir' | 'file'; kind drives the icon; content key → DATA.files */
DATA.tree = [
  { name: '.github', type: 'dir', children: [
    { name: 'copilot-instructions.md', type: 'file', kind: 'md' },
    { name: 'pull_request_template.md', type: 'file', kind: 'md' },
  ]},
  { name: 'agent-runs', type: 'dir', children: [
    { name: 'AR-0089', type: 'dir', children: [
      { name: 'run-summary.md', type: 'file', kind: 'md' },
      { name: 'context-used.json', type: 'file', kind: 'json' },
    ]},
  ]},
  { name: 'context', type: 'dir', children: [
    { name: 'product-principles.md', type: 'file', kind: 'md' },
    { name: 'business-rules.md', type: 'file', kind: 'md' },
    { name: 'customer-segments.md', type: 'file', kind: 'md' },
    { name: 'compliance-rules.md', type: 'file', kind: 'md' },
    { name: 'domain-glossary.md', type: 'file', kind: 'md' },
    { name: 'ux-standards.md', type: 'file', kind: 'md' },
    { name: 'release-constraints.md', type: 'file', kind: 'md' },
  ]},
  { name: 'decisions', type: 'dir', children: [
    { name: 'DR-0016-checkout-guest-flow.md', type: 'file', kind: 'md' },
  ]},
  { name: 'releases', type: 'dir', children: [
    { name: 'release-story-template.md', type: 'file', kind: 'md' },
  ]},
  { name: 'skills', type: 'dir', children: [
    { name: 'release-story-writer', type: 'dir', children: [
      { name: 'SKILL.md', type: 'file', kind: 'md' },
    ]},
  ]},
  { name: 'src', type: 'dir', children: [
    { name: 'account', type: 'dir', children: [
      { name: 'settings', type: 'dir', children: [
        { name: 'payment-settings.tsx', type: 'file', kind: 'tsx' },
        { name: 'profile-settings.tsx', type: 'file', kind: 'tsx' },
      ]},
    ]},
    { name: 'billing', type: 'dir', children: [
      { name: 'permissions.ts', type: 'file', kind: 'ts' },
      { name: 'invoices.ts', type: 'file', kind: 'ts' },
    ]},
    { name: 'checkout', type: 'dir', children: [
      { name: 'checkout-flow.tsx', type: 'file', kind: 'tsx' },
    ]},
  ]},
  { name: 'tests', type: 'dir', children: [
    { name: 'billing.test.ts', type: 'file', kind: 'ts' },
    { name: 'checkout.test.ts', type: 'file', kind: 'ts' },
  ]},
  { name: 'work-packages', type: 'dir', children: [] },
  { name: 'AGENTS.md', type: 'file', kind: 'md' },
  { name: 'package.json', type: 'file', kind: 'json' },
  { name: 'README.md', type: 'file', kind: 'md' },
];

/* ─────────── File contents ─────────── */
DATA.files = {

'README.md': { lang: 'md', text:
`# enterprise-sample-app

Customer account and billing platform used by the Meridian product group.

This repository is PMIDE-enabled: product context, work packages, skills,
and agent run records live alongside the source code.

## Layout

| Folder | What lives here |
|---|---|
| \`/src\` | Application code |
| \`/tests\` | Automated tests |
| \`/context\` | Governed product & business context |
| \`/decisions\` | Decision records |
| \`/work-packages\` | Agent-ready work packages |
| \`/skills\` | Reusable agent skills |
| \`/agent-runs\` | Traceable AI execution records |
| \`/releases\` | Release stories |

## Working agreement

- Context changes ride on safe draft branches and are reviewed like code.
- Agents act only on approved context and approved skills.
- PMs review product intent. Engineers review code. Both happen on every PR.
` },

'AGENTS.md': { lang: 'md', text:
`# Agent Instructions — enterprise-sample-app

All agents operating in this repository must:

1. Read \`/context/business-rules.md\` and \`/context/compliance-rules.md\`
   before generating any billing, payment, or account-status change.
2. Use the domain glossary for terminology. Never invent domain terms.
3. Work only on \`safe-draft/*\` branches. Never commit to \`main\`.
4. Reference the Work Package ID in every commit message.
5. Record every run under \`/agent-runs/<RUN-ID>/\`.
6. Stop and request human input when acceptance signals are ambiguous.

## Escalation

High-risk domains (billing, compliance, customer data) require the
governance approval flow before a PR may be opened.
` },

'context/product-principles.md': { lang: 'md', text:
`# Product Principles

1. **Trust before convenience.** Never trade account safety for a faster flow.
2. **Explain every restriction.** When we block an action, we say why and
   what the customer can do next.
3. **No silent data changes.** Customer-visible state changes always produce
   a confirmation and an audit event.
4. **Accessible by default.** Every flow meets WCAG 2.1 AA.
5. **Reversible where possible.** Prefer soft-disable over delete.
` },

'context/business-rules.md': { lang: 'md', text:
`# Business Rules

## BR-104 — Payment settings access
Payment settings can be updated by authenticated users.

## BR-097 — Invoice reissue window
Invoices may be reissued up to 90 days after the billing date.

## BR-093 — Refund authority
Refunds above $500 require a billing-team approval.

## BR-088 — Plan downgrade timing
Plan downgrades take effect at the end of the current billing period.
` },

'context/customer-segments.md': { lang: 'md', text:
`# Customer Segments

## Enterprise accounts
Multi-seat contracts, invoiced billing, assigned CSM. Highest support tier.

## Growth accounts
Self-serve teams on monthly or annual card billing.

## Trial accounts
14-day evaluation. No payment method required until conversion.

## Inactive accounts
Accounts in a suspended, closed, restricted, or risk-flagged state.
Treated as read-only for most account operations.
` },

'context/compliance-rules.md': { lang: 'md', text:
`# Compliance Rules

## CR-021 — Payment data handling
All payment instrument data is tokenized at the provider. The application
never stores raw card numbers.

## CR-018 — Billing change traceability
Every change to billing behavior must be traceable to an approved
decision record and reviewed by the risk team before release.

## CR-014 — Regulated-market messaging
Customer-facing copy about payments in EU markets must pass legal review.
` },

'context/domain-glossary.md': { lang: 'md', text:
`# Domain Glossary

**Account status** — lifecycle state of a customer account:
\`active\`, \`trial\`, \`suspended\`, \`closed\`, \`restricted\`, \`risk-flagged\`.

**Payment method** — a tokenized payment instrument attached to an account.

**Payment settings** — the account surface where customers manage payment
methods, billing address, and invoice preferences.

**Billing period** — the interval an account is invoiced for.

**Reactivation** — moving an account from a non-active status back to \`active\`.
` },

'context/ux-standards.md': { lang: 'md', text:
`# UX Standards

- Blocking states use the standard **restriction banner** component, never
  disabled buttons alone.
- Every restriction banner links to a help-center article.
- Error copy follows the pattern: *what happened → why → what to do next*.
- Destructive actions require typed confirmation.
- All copy in sentence case.
` },

'context/release-constraints.md': { lang: 'md', text:
`# Release Constraints

- Billing-behavior changes require product **and** risk review before merge.
- No production releases on Fridays or during the last 3 days of a quarter.
- Changes touching payment settings must ship behind the
  \`billing-safeguards\` feature flag.
- Support enablement notes are required for any customer-visible change.
` },

'decisions/DR-0016-checkout-guest-flow.md': { lang: 'md', text:
`# DR-0016 — Guest checkout stays disabled for enterprise SKUs

**Date:** 2026-05-18 · **Owner:** J. Alvarez (PM) · **Status:** Approved

## Decision
Enterprise SKUs cannot be purchased through guest checkout.

## Rationale
Enterprise contracts require entitlement mapping and tax review that the
guest flow cannot collect.

## Tradeoffs
Slower first purchase for enterprise buyers; mitigated by the sales-assisted flow.

## Impacted areas
Checkout, entitlements, tax calculation.
` },

'skills/release-story-writer/SKILL.md': { lang: 'md', text:
`---
name: release-story-writer
owner: Product Ops (D. Chen)
status: Approved
agents: [claude, copilot]
requires-approval: false
scripts: none
---

# Skill: Release Story Writer

## Purpose
Turn merged work packages and PRs into business-readable release stories.

## Trigger
When a work package reaches **Merged** and a release story does not exist.

## Inputs
Work package, linked PR, linked decision records.

## Steps
1. Read the work package goal and acceptance signals.
2. Read the PR summary and changed areas.
3. Draft: what changed, why, who is affected, support notes.
4. Save to \`/releases/\` and link the work package.

## Output
A release story following \`/releases/release-story-template.md\`.
` },

'releases/release-story-template.md': { lang: 'md', text:
`# Release Story — <title>

**What changed** — one paragraph in customer language.

**Why it changed** — link the decision record.

**Who is affected** — segments and markets.

**Customer impact** — visible behavior changes.

**Support notes** — what support needs to know, with macros to update.

**Risk notes** — anything the risk team flagged.

**Links** — Work Package · PR · Decisions
` },

'agent-runs/AR-0089/run-summary.md': { lang: 'md', text:
`# Agent Run AR-0089

**Agent:** Claude · **Initiated by:** D. Chen · **Status:** Merged
**Task:** Generate release story for invoice-reissue window change
**Skill:** release-story-writer
**Branch:** safe-draft/release-story-invoice-window

## Context used
- /work-packages/WP-0038-invoice-reissue-window
- /context/business-rules.md (BR-097)

## Outcome
Release story drafted and merged in PR #121. No errors.
` },

'agent-runs/AR-0089/context-used.json': { lang: 'json', text:
`{
  "run": "AR-0089",
  "agent": "claude",
  "context": [
    "context/business-rules.md#BR-097",
    "work-packages/WP-0038-invoice-reissue-window/work-package.md"
  ],
  "skills": ["release-story-writer"],
  "branch": "safe-draft/release-story-invoice-window",
  "approvals": [
    { "user": "d.chen", "role": "Product Approver", "ts": "2026-06-11T14:22:09Z" }
  ]
}` },

'.github/copilot-instructions.md': { lang: 'md', text:
`# Copilot Instructions

- Follow /AGENTS.md.
- Billing and payment changes: read /context/business-rules.md first.
- Reference the Work Package ID in commits: "WP-XXXX: <summary>".
- Tests are required for permission and status checks.
` },

'.github/pull_request_template.md': { lang: 'md', text:
`## Summary

## Why

## Linked Work Package

## Linked context

## Requested review
- [ ] Product intent review
- [ ] Engineering code review
- [ ] Risk review (billing / compliance changes)

## Risk notes
` },

'package.json': { lang: 'json', text:
`{
  "name": "enterprise-sample-app",
  "version": "4.12.0",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "test": "vitest run",
    "lint": "eslint src tests"
  },
  "dependencies": {
    "react": "^19.1.0",
    "react-dom": "^19.1.0",
    "zod": "^4.0.5"
  }
}` },

'src/account/settings/payment-settings.tsx': { lang: 'tsx', text:
`import { useAccount } from "../hooks/useAccount";
import { PaymentMethodList } from "./payment-method-list";
import { BillingAddressForm } from "./billing-address-form";

export function PaymentSettings() {
  const { account } = useAccount();

  return (
    <section aria-labelledby="payment-settings-title">
      <h2 id="payment-settings-title">Payment settings</h2>
      <PaymentMethodList accountId={account.id} />
      <BillingAddressForm accountId={account.id} />
    </section>
  );
}` },

'src/account/settings/profile-settings.tsx': { lang: 'tsx', text:
`import { useAccount } from "../hooks/useAccount";

export function ProfileSettings() {
  const { account } = useAccount();
  return (
    <section aria-labelledby="profile-settings-title">
      <h2 id="profile-settings-title">Profile</h2>
      <p>{account.displayName}</p>
    </section>
  );
}` },

'src/billing/permissions.ts': { lang: 'ts', text:
`import type { Account } from "../account/types";

/** Central gate for billing-surface capabilities. */
export function canViewInvoices(account: Account): boolean {
  return account.authenticated;
}

export function canUpdatePaymentSettings(account: Account): boolean {
  return account.authenticated;
}

export function canRequestRefund(account: Account, amount: number): boolean {
  if (!account.authenticated) return false;
  return amount <= 500 || account.roles.includes("billing-approver");
}` },

'src/billing/invoices.ts': { lang: 'ts', text:
`import type { Invoice } from "./types";

const REISSUE_WINDOW_DAYS = 90; // BR-097

export function canReissue(invoice: Invoice, now: Date): boolean {
  const age = (now.getTime() - invoice.billedAt.getTime()) / 86_400_000;
  return age <= REISSUE_WINDOW_DAYS;
}` },

'src/checkout/checkout-flow.tsx': { lang: 'tsx', text:
`import { useCart } from "./useCart";
import { PaymentStep } from "./payment-step";

export function CheckoutFlow() {
  const { cart } = useCart();
  return (
    <main aria-label="Checkout">
      <PaymentStep cart={cart} />
    </main>
  );
}` },

'tests/billing.test.ts': { lang: 'ts', text:
`import { describe, expect, it } from "vitest";
import { canUpdatePaymentSettings } from "../src/billing/permissions";
import { makeAccount } from "./factories";

describe("billing permissions", () => {
  it("authenticated users can update payment settings", () => {
    const account = makeAccount({ authenticated: true });
    expect(canUpdatePaymentSettings(account)).toBe(true);
  });

  it("unauthenticated users cannot update payment settings", () => {
    const account = makeAccount({ authenticated: false });
    expect(canUpdatePaymentSettings(account)).toBe(false);
  });
});` },

'tests/checkout.test.ts': { lang: 'ts', text:
`import { describe, expect, it } from "vitest";

describe("checkout", () => {
  it.todo("guest checkout blocked for enterprise SKUs (DR-0016)");
});` },
};

/* ─────────── Context Library objects ─────────── */
DATA.context = [
  {
    id: 'ctx-principles', title: 'Product principles', category: 'Product principles',
    file: 'context/product-principles.md', owner: 'J. Alvarez (PM)', status: 'Approved',
    updated: '2026-06-02', freshness: 'fresh',
    linkedDecisions: [], linkedWPs: [], agentUsage: 14,
    governance: 'No review required',
    summary: 'Five principles that govern every customer-facing decision, from trust-first defaults to reversibility.',
  },
  {
    id: 'ctx-rules', title: 'Business rules', category: 'Business rules',
    file: 'context/business-rules.md', owner: 'J. Alvarez (PM)', status: 'Approved',
    updated: '2026-05-27', freshness: 'aging',
    linkedDecisions: ['DR-0016'], linkedWPs: ['WP-0038'], agentUsage: 31,
    governance: 'High-risk category — changes require product + risk approval',
    summary: 'Rules that gate billing behavior: payment-settings access, invoice reissue windows, refund authority, downgrade timing.',
    rules: [
      { id: 'BR-104', text: 'Payment settings can be updated by authenticated users.' },
      { id: 'BR-097', text: 'Invoices may be reissued up to 90 days after the billing date.' },
      { id: 'BR-093', text: 'Refunds above $500 require a billing-team approval.' },
      { id: 'BR-088', text: 'Plan downgrades take effect at the end of the current billing period.' },
    ],
  },
  {
    id: 'ctx-segments', title: 'Customer segments', category: 'Customer segments',
    file: 'context/customer-segments.md', owner: 'R. Okafor (Product Ops)', status: 'Approved',
    updated: '2026-04-30', freshness: 'aging',
    linkedDecisions: [], linkedWPs: [], agentUsage: 9,
    governance: 'No review required',
    summary: 'Enterprise, growth, trial, and inactive account segments with their operational treatment.',
  },
  {
    id: 'ctx-compliance', title: 'Compliance rules', category: 'Compliance rules',
    file: 'context/compliance-rules.md', owner: 'M. Steiner (Risk)', status: 'Approved',
    updated: '2026-06-14', freshness: 'fresh',
    linkedDecisions: [], linkedWPs: [], agentUsage: 22,
    governance: 'High-risk category — compliance review required for every change',
    summary: 'Payment-data handling, billing-change traceability, and regulated-market messaging requirements.',
  },
  {
    id: 'ctx-glossary', title: 'Domain glossary', category: 'Domain glossary',
    file: 'context/domain-glossary.md', owner: 'R. Okafor (Product Ops)', status: 'Approved',
    updated: '2026-05-12', freshness: 'fresh',
    linkedDecisions: [], linkedWPs: [], agentUsage: 40,
    governance: 'No review required',
    summary: 'Canonical definitions: account status, payment method, payment settings, billing period, reactivation.',
  },
  {
    id: 'ctx-ux', title: 'UX standards', category: 'UX standards',
    file: 'context/ux-standards.md', owner: 'P. Laurent (Design)', status: 'Approved',
    updated: '2026-03-19', freshness: 'stale',
    linkedDecisions: [], linkedWPs: [], agentUsage: 12,
    governance: 'Review recommended',
    summary: 'Restriction banners, error-copy pattern, typed confirmations, sentence case.',
  },
  {
    id: 'ctx-release', title: 'Release constraints', category: 'Release constraints',
    file: 'context/release-constraints.md', owner: 'T. Whitfield (Eng Lead)', status: 'Approved',
    updated: '2026-06-20', freshness: 'fresh',
    linkedDecisions: [], linkedWPs: [], agentUsage: 17,
    governance: 'Review recommended',
    summary: 'Billing changes need product + risk review, Friday freeze, billing-safeguards flag, support enablement notes.',
  },
  {
    id: 'ctx-agents', title: 'Agent instructions', category: 'Agent instructions',
    file: 'AGENTS.md', owner: 'T. Whitfield (Eng Lead)', status: 'Approved',
    updated: '2026-06-08', freshness: 'fresh',
    linkedDecisions: [], linkedWPs: [], agentUsage: 55,
    governance: 'High-risk category — engineering approval required',
    summary: 'Ground rules for every agent in this repo: read governed context first, safe-draft branches only, traceable runs.',
  },
];

DATA.contextCategories = [
  'Product principles', 'Business rules', 'Customer segments', 'Compliance rules',
  'Domain glossary', 'UX standards', 'Architecture notes', 'Release constraints',
  'Agent instructions', 'Decision history',
];

/* ─────────── Decisions ─────────── */
DATA.decisions = [
  {
    id: 'DR-0016', title: 'Guest checkout stays disabled for enterprise SKUs',
    date: '2026-05-18', owner: 'J. Alvarez (PM)', status: 'Approved',
    file: 'decisions/DR-0016-checkout-guest-flow.md',
    summary: 'Enterprise SKUs cannot be purchased through guest checkout — entitlement mapping and tax review need the assisted flow.',
  },
];

/* ─────────── Existing Work Packages ─────────── */
DATA.workPackages = [
  {
    id: 'WP-0038', slug: 'invoice-reissue-window', title: 'Extend invoice reissue window to 90 days',
    status: 'Merged', owner: 'D. Chen', updated: '2026-06-11',
    branch: 'safe-draft/invoice-reissue-window', pr: '#121', readiness: 94,
    goal: 'Allow support to reissue invoices up to 90 days after billing date (was 60).',
    problem: 'Enterprise finance teams frequently request reissues in the 60–90 day range; support had no self-serve path.',
    contextUsed: ['Business rule BR-097', 'Customer segments — enterprise accounts'],
    decisionsUsed: [],
    agentInstructions: 'Update REISSUE_WINDOW_DAYS, keep audit events, extend tests.',
    acceptance: [
      'Invoices up to 90 days old can be reissued',
      'Invoices past 90 days show the standard restriction banner',
      'Audit event recorded per reissue',
    ],
    nonGoals: ['No change to refund flows', 'No change to invoice layout'],
    risks: ['Behind billing-safeguards flag', 'Risk review completed 2026-06-10'],
    tests: ['Window boundary at 89/90/91 days', 'Audit event emission'],
    reviewPlan: ['Product intent review', 'Engineering code review'],
    runs: ['AR-0089'],
  },
];

/* ─────────── Existing Skills ─────────── */
DATA.skills = [
  {
    id: 'skill-release-story', slug: 'release-story-writer', name: 'Release Story Writer',
    status: 'Approved', owner: 'Product Ops (D. Chen)', updated: '2026-05-30',
    purpose: 'Turn merged work packages and PRs into business-readable release stories.',
    trigger: 'When a work package reaches Merged and a release story does not exist.',
    inputs: ['Work package', 'Linked PR', 'Decision records'],
    output: 'Release story following the /releases template.',
    scripts: false, agents: ['Claude', 'Copilot'],
    approval: 'Not required — no scripts, no sensitive context',
    usage: 8,
    files: ['skills/release-story-writer/SKILL.md'],
  },
];

/* ─────────── Agent catalog ─────────── */
DATA.agents = [
  { id: 'claude', name: 'Claude', color: '#d99e78',
    strength: 'Requirement refinement, context consistency, product-readable summaries.',
    tags: ['context reasoning', 'long documents', 'review packets'], real: true },
  { id: 'copilot', name: 'GitHub Copilot', color: '#8bb8f8',
    strength: 'GitHub-native issue-to-PR implementation inside this repo.',
    tags: ['issue → PR', 'repo-native', 'inline code'], real: false },
  { id: 'codex', name: 'Codex', color: '#9fe0b8',
    strength: 'Script and test generation, mechanical refactors.',
    tags: ['tests', 'scripts', 'refactors'], real: false },
  { id: 'gemini', name: 'Gemini', color: '#c5a8f5',
    strength: 'Cross-file analysis and large-context exploration.',
    tags: ['analysis', 'large context'], real: false },
  { id: 'enterprise', name: 'Meridian Gateway', color: '#e8c477',
    strength: 'Enterprise model gateway with policy-filtered context access.',
    tags: ['policy-aware', 'internal'], real: false },
  { id: 'human', name: 'Human engineer', color: '#a5aebe',
    strength: 'Architecture-heavy or high-risk work that needs human judgment first.',
    tags: ['high risk', 'architecture'], real: true },
];

/* ─────────── Historical agent runs ─────────── */
DATA.agentRuns = [
  {
    id: 'AR-0089', agent: 'Claude', user: 'D. Chen', started: '2026-06-11 14:02',
    task: 'Generate release story for invoice-reissue window change',
    status: 'Merged', skill: 'release-story-writer',
    branch: 'safe-draft/release-story-invoice-window',
    context: ['business-rules.md#BR-097', 'WP-0038/work-package.md'],
    files: ['releases/2026-06-invoice-reissue-window.md'],
    commands: ['read context', 'draft story', 'write file'],
    pr: '#121', errors: 'None', approvals: ['d.chen — Product Approver'],
    simulated: false,
  },
];

/* ─────────── Planning session (golden flow input) ─────────── */
DATA.planningNotes =
`Billing & Accounts weekly planning — 2026-07-06
Attendees: J. Alvarez (PM), T. Whitfield (Eng Lead), M. Steiner (Risk), support rep

- Support escalation review: 3 cases where suspended accounts changed their
  payment method and then disputed charges after reactivation.
- Risk: suspended/closed/restricted accounts changing payment settings is a
  chargeback and fraud vector. Decision in the room: inactive accounts should
  NOT be able to update payment settings. Active status required.
- Keep saved payment methods intact — do not delete anything, just block edits.
- Show a clear explanation instead of a dead disabled form. Link to
  reactivation help article. Support wants updated macro language too.
- Do NOT touch checkout payment authorization — different flow, different risk.
- Teresa: billing changes still need product + risk review before merge
  (release constraint), and this should ride the billing-safeguards flag.
- Follow-up: what happens to in-flight subscription renewals for suspended
  accounts? Nobody knew — needs a decision later.
- Idea from Marcus: we keep re-reviewing billing changes by hand. We should
  have a reusable "billing domain reviewer" capability agents can run against
  any billing-touching change.`;

/* ─────────── Extraction results (what the AI finds in the notes) ─────────── */
DATA.extraction = [
  {
    kind: 'decision', title: 'Inactive accounts cannot update payment settings',
    body: 'Suspended, closed, restricted, or risk-flagged accounts must not be able to change payment settings. Driven by three support escalations involving chargebacks after reactivation.',
    impact: 'Account settings · Billing permissions · Support workflows',
    target: 'decisions/DR-0017-inactive-account-payment-settings.md',
    accepted: null,
  },
  {
    kind: 'rule', title: 'BR-104 update: payment settings require active status',
    body: 'Before: "Payment settings can be updated by authenticated users." After: "Payment settings can be updated only by authenticated users whose account status is active."',
    impact: 'Supersedes current BR-104 · flags a conflict with the existing rule',
    target: 'context/business-rules.md',
    accepted: null,
  },
  {
    kind: 'wp', title: 'Enforce billing-status rule in account settings',
    body: 'Block payment-settings changes for inactive accounts, keep saved payment methods, show explanatory copy with a reactivation link, update support macros.',
    impact: 'Ready to generate as WP-0042 after context is accepted',
    target: 'work-packages/WP-0042-billing-status-rule/',
    accepted: null,
  },
  {
    kind: 'skill', title: 'Suggested skill: Billing Domain Reviewer',
    body: 'A reusable review capability agents run against any billing-touching change: checks business rules, glossary terms, acceptance coverage, and produces reviewer questions.',
    impact: 'Marcus flagged repeated manual review effort',
    target: 'skills/billing-domain-reviewer/',
    accepted: null,
  },
  {
    kind: 'conflict', title: 'Context conflict: BR-104 vs. new rule',
    body: 'Business Rule BR-104 currently allows all authenticated users to update payment settings. The new rule restricts this to active accounts. BR-104 must be updated or marked superseded.',
    impact: 'Resolve by accepting the BR-104 update above',
    target: 'context/business-rules.md',
    accepted: null,
  },
  {
    kind: 'question', title: 'Open question: renewals for suspended accounts',
    body: 'What happens to in-flight subscription renewals when an account is suspended? No decision was made — defer to a future planning session.',
    impact: 'Deferred items are tracked in the decision backlog',
    target: 'decisions/backlog.md',
    accepted: null,
  },
  {
    kind: 'risk', title: 'Risk control: ride the billing-safeguards flag',
    body: 'Change must ship behind the billing-safeguards feature flag and pass product + risk review before merge (existing release constraint).',
    impact: 'Attached to the work package risk controls',
    target: 'work-packages/WP-0042-billing-status-rule/review-plan.md',
    accepted: null,
  },
];

/* ─────────── PM-friendly context diff shown at "Accept context update" ─────────── */
DATA.contextDiff = {
  title: 'Business Rule Update — BR-104',
  before: 'Payment settings can be updated by authenticated users.',
  after: 'Payment settings can be updated only by authenticated users whose account status is active.',
  impacted: ['Account settings', 'Billing permissions', 'Checkout', 'Support workflows'],
  files: ['context/business-rules.md', 'context/domain-glossary.md', 'context/release-constraints.md'],
};

/* ─────────── The generated Work Package (WP-0042) ─────────── */
DATA.newWP = {
  id: 'WP-0042', slug: 'billing-status-rule', title: 'Enforce Billing Status Rule in Account Settings',
  status: 'Draft', owner: 'J. Alvarez', updated: 'today',
  branch: 'safe-draft/billing-status-rule', pr: null, readiness: 87,
  goal: 'Prevent inactive accounts from changing payment settings.',
  problem: 'Suspended and closed accounts can currently change payment methods, creating a chargeback and fraud vector confirmed by three support escalations.',
  contextUsed: [
    'Business rule BR-104 (updated): payment settings require active account status',
    'Domain term: inactive account (suspended, closed, restricted, risk-flagged)',
    'Release constraint: billing changes require product and risk review',
    'UX standard: restriction banner with help-center link',
  ],
  decisionsUsed: ['DR-0017 — Inactive accounts cannot update payment settings'],
  agentInstructions:
    'Gate canUpdatePaymentSettings on account.status === "active". Render the standard restriction banner in PaymentSettings for inactive accounts with reactivation link. Do not delete or hide saved payment methods. Add status-matrix tests. Update support copy file.',
  acceptance: [
    'Active users can update payment settings',
    'Inactive users cannot update payment settings',
    'Inactive users see clear explanatory copy',
    'Existing saved payment methods are not deleted',
    'Support flow language is updated',
  ],
  nonGoals: [
    'Do not change checkout payment authorization',
    'Do not remove existing payment methods',
    'Do not redesign account settings',
  ],
  risks: [
    'Ships behind the billing-safeguards feature flag',
    'Requires product + risk review before merge (release constraint)',
  ],
  tests: [
    'Permission matrix across all six account statuses',
    'Banner renders with reactivation link for inactive statuses',
    'Saved payment methods untouched after block',
  ],
  reviewPlan: ['Product intent review', 'Engineering code review', 'Risk review for billing behavior'],
  runs: [],
};

/* ─────────── The generated Skill (billing-domain-reviewer) ─────────── */
DATA.newSkill = {
  id: 'skill-billing-reviewer', slug: 'billing-domain-reviewer', name: 'Billing Domain Reviewer',
  status: 'Proposed', owner: 'J. Alvarez (PM)', updated: 'today',
  purpose: 'Review work related to billing rules, account status, and payment setting changes.',
  trigger: 'When a work package or PR touches billing, payment methods, account status, or checkout.',
  inputs: ['Business rules', 'Domain glossary', 'Changed files', 'Work package', 'Acceptance signals'],
  output: 'Product behavior review · risk notes · missing acceptance criteria · recommended reviewer questions.',
  scripts: true, agents: ['Claude', 'Copilot', 'Codex'],
  approval: 'Risk approval required — touches billing domain and references a script',
  usage: 0,
  files: [
    'skills/billing-domain-reviewer/SKILL.md',
    'skills/billing-domain-reviewer/templates/review-output.md',
    'skills/billing-domain-reviewer/references/billing-rules.md',
    'skills/billing-domain-reviewer/scripts/check-billing-terms.py',
  ],
};

DATA.newSkillFiles = {
'skills/billing-domain-reviewer/SKILL.md': { lang: 'md', text:
`---
name: billing-domain-reviewer
owner: J. Alvarez (PM)
status: Proposed
agents: [claude, copilot, codex]
requires-approval: true   # billing domain + script
scripts: [scripts/check-billing-terms.py]
---

# Skill: Billing Domain Reviewer

## Purpose
Review work related to billing rules, account status, and payment
setting changes.

## Trigger
When a work package or PR touches billing, payment methods,
account status, or checkout.

## Inputs
- Business rules (/context/business-rules.md)
- Domain glossary (/context/domain-glossary.md)
- Changed files
- Work package
- Acceptance signals

## Steps
1. Load the business rules and glossary.
2. Run \`scripts/check-billing-terms.py\` against changed files to flag
   non-canonical domain terms.
3. Compare the change against each acceptance signal.
4. Check non-goals were not violated.
5. Draft reviewer questions for product, engineering, and risk.

## Output
Fill \`templates/review-output.md\`:
- Product behavior review
- Risk notes
- Missing acceptance criteria
- Recommended reviewer questions
` },

'skills/billing-domain-reviewer/templates/review-output.md': { lang: 'md', text:
`# Billing Domain Review — <change>

## Intent match
<High / Medium / Low> — <one line>

## Satisfied signals
- …

## Needs review
- …

## Risk notes
- …

## Questions for reviewers
- Product: …
- Engineering: …
- Risk: …
` },

'skills/billing-domain-reviewer/references/billing-rules.md': { lang: 'md', text:
`# Reference: Billing rules snapshot

Snapshot of /context/business-rules.md pinned for this skill.
The skill re-reads the live file at run time; this copy documents
the rules the skill was designed against.

- BR-104 — Payment settings require active account status.
- BR-097 — Invoice reissue window: 90 days.
- BR-093 — Refunds above $500 require billing-team approval.
- BR-088 — Downgrades take effect at period end.
` },

'skills/billing-domain-reviewer/scripts/check-billing-terms.py': { lang: 'py', text:
`#!/usr/bin/env python3
"""Flag non-canonical billing terms in changed files.

Reads the domain glossary and reports terminology drift, e.g.
"deactivated account" where the canonical term is "inactive account".
Requires governance approval before agents may execute it.
"""
import re
import sys
from pathlib import Path

CANONICAL = {
    r"deactivated account": "inactive account",
    r"payment info": "payment method",
    r"billing settings": "payment settings",
    r"frozen account": "suspended account",
}

def scan(path: Path) -> list[str]:
    findings = []
    text = path.read_text(encoding="utf-8", errors="ignore")
    for pattern, canonical in CANONICAL.items():
        for m in re.finditer(pattern, text, re.IGNORECASE):
            findings.append(f"{path}:{text.count(chr(10), 0, m.start()) + 1} "
                            f"'{m.group()}' -> use '{canonical}'")
    return findings

if __name__ == "__main__":
    results = [f for arg in sys.argv[1:] for f in scan(Path(arg))]
    print("\\n".join(results) if results else "No terminology drift found.")
    sys.exit(1 if results else 0)
` },
};

/* ─────────── Skill validation scan (simulated) ─────────── */
DATA.skillScan = {
  passed: [
    'Purpose is clear',
    'Trigger conditions are defined',
    'Inputs and output format are defined',
    'Owner is assigned',
    'No hidden data access detected',
    'No conflicting instructions with AGENTS.md',
  ],
  needsReview: [
    'Skill touches the billing domain (high-risk category)',
    'Skill references a script — script execution requires approval',
    'Risk approval required before organization-wide use',
  ],
  verdict: 'Ready to propose',
};

/* ─────────── Code diff for the implementation PR ─────────── */
DATA.codeDiff = [
  {
    file: 'src/billing/permissions.ts', add: 9, del: 2,
    lines: [
      { t: 'hunk', text: '@@ -6,10 +6,17 @@ export function canViewInvoices(account: Account): boolean {' },
      { t: 'ctx', old: 6, neu: 6, text: '  return account.authenticated;' },
      { t: 'ctx', old: 7, neu: 7, text: '}' },
      { t: 'ctx', old: 8, neu: 8, text: '' },
      { t: 'add', neu: 9, text: '/**' },
      { t: 'add', neu: 10, text: ' * BR-104: payment settings may be updated only by authenticated' },
      { t: 'add', neu: 11, text: ' * users whose account status is active. (WP-0042, DR-0017)' },
      { t: 'add', neu: 12, text: ' */' },
      { t: 'del', old: 9, text: 'export function canUpdatePaymentSettings(account: Account): boolean {' },
      { t: 'del', old: 10, text: '  return account.authenticated;' },
      { t: 'add', neu: 13, text: 'export function canUpdatePaymentSettings(account: Account): boolean {' },
      { t: 'add', neu: 14, text: '  if (!flags.enabled("billing-safeguards")) return account.authenticated;' },
      { t: 'add', neu: 15, text: '  return account.authenticated && account.status === "active";' },
      { t: 'ctx', old: 11, neu: 16, text: '}' },
    ],
  },
  {
    file: 'src/account/settings/payment-settings.tsx', add: 14, del: 1,
    lines: [
      { t: 'hunk', text: '@@ -1,14 +1,27 @@' },
      { t: 'ctx', old: 1, neu: 1, text: 'import { useAccount } from "../hooks/useAccount";' },
      { t: 'add', neu: 2, text: 'import { canUpdatePaymentSettings } from "../../billing/permissions";' },
      { t: 'add', neu: 3, text: 'import { RestrictionBanner } from "../../ui/restriction-banner";' },
      { t: 'ctx', old: 2, neu: 4, text: 'import { PaymentMethodList } from "./payment-method-list";' },
      { t: 'ctx', old: 3, neu: 5, text: 'import { BillingAddressForm } from "./billing-address-form";' },
      { t: 'ctx', old: 4, neu: 6, text: '' },
      { t: 'ctx', old: 5, neu: 7, text: 'export function PaymentSettings() {' },
      { t: 'ctx', old: 6, neu: 8, text: '  const { account } = useAccount();' },
      { t: 'add', neu: 9, text: '  const canEdit = canUpdatePaymentSettings(account);' },
      { t: 'ctx', old: 7, neu: 10, text: '' },
      { t: 'ctx', old: 8, neu: 11, text: '  return (' },
      { t: 'ctx', old: 9, neu: 12, text: '    <section aria-labelledby="payment-settings-title">' },
      { t: 'ctx', old: 10, neu: 13, text: '      <h2 id="payment-settings-title">Payment settings</h2>' },
      { t: 'add', neu: 14, text: '      {!canEdit && (' },
      { t: 'add', neu: 15, text: '        <RestrictionBanner' },
      { t: 'add', neu: 16, text: '          title="Payment settings are locked for this account"' },
      { t: 'add', neu: 17, text: '          body="Your account is not active, so payment details cannot be' },
      { t: 'add', neu: 18, text: '                changed right now. Your saved payment methods are safe."' },
      { t: 'add', neu: 19, text: '          helpHref="/help/reactivate-account"' },
      { t: 'add', neu: 20, text: '          helpLabel="How to reactivate your account"' },
      { t: 'add', neu: 21, text: '        />' },
      { t: 'add', neu: 22, text: '      )}' },
      { t: 'del', old: 11, text: '      <PaymentMethodList accountId={account.id} />' },
      { t: 'add', neu: 23, text: '      <PaymentMethodList accountId={account.id} readOnly={!canEdit} />' },
      { t: 'add', neu: 24, text: '      {canEdit && <BillingAddressForm accountId={account.id} />}' },
    ],
  },
  {
    file: 'tests/billing-status-rule.test.ts', add: 24, del: 0, isNew: true,
    lines: [
      { t: 'hunk', text: '@@ -0,0 +1,24 @@ (new file)' },
      { t: 'add', neu: 1, text: 'import { describe, expect, it } from "vitest";' },
      { t: 'add', neu: 2, text: 'import { canUpdatePaymentSettings } from "../src/billing/permissions";' },
      { t: 'add', neu: 3, text: 'import { makeAccount } from "./factories";' },
      { t: 'add', neu: 4, text: '' },
      { t: 'add', neu: 5, text: 'describe("BR-104: payment settings require active status", () => {' },
      { t: 'add', neu: 6, text: '  it("allows active accounts", () => {' },
      { t: 'add', neu: 7, text: '    const account = makeAccount({ status: "active" });' },
      { t: 'add', neu: 8, text: '    expect(canUpdatePaymentSettings(account)).toBe(true);' },
      { t: 'add', neu: 9, text: '  });' },
      { t: 'add', neu: 10, text: '' },
      { t: 'add', neu: 11, text: '  it("blocks inactive accounts", () => {' },
      { t: 'add', neu: 12, text: '    const account = makeAccount({ status: "inactive" });' },
      { t: 'add', neu: 13, text: '    expect(canUpdatePaymentSettings(account)).toBe(false);' },
      { t: 'add', neu: 14, text: '  });' },
      { t: 'add', neu: 15, text: '' },
      { t: 'add', neu: 16, text: '  // TODO(review): suspended / restricted / risk-flagged not yet covered' },
      { t: 'add', neu: 17, text: '  it("keeps saved payment methods", () => {' },
      { t: 'add', neu: 18, text: '    const account = makeAccount({ status: "inactive", methods: 2 });' },
      { t: 'add', neu: 19, text: '    expect(account.paymentMethods).toHaveLength(2);' },
      { t: 'add', neu: 20, text: '  });' },
      { t: 'add', neu: 21, text: '});' },
    ],
  },
  {
    file: 'support/billing-status-copy.md', add: 8, del: 0, isNew: true,
    lines: [
      { t: 'hunk', text: '@@ -0,0 +1,8 @@ (new file)' },
      { t: 'add', neu: 1, text: '# Support copy — payment settings restriction' },
      { t: 'add', neu: 2, text: '' },
      { t: 'add', neu: 3, text: 'Banner: "Payment settings are locked for this account."' },
      { t: 'add', neu: 4, text: 'Body: "Your account is not active, so payment details cannot be' },
      { t: 'add', neu: 5, text: 'changed right now. Your saved payment methods are safe."' },
      { t: 'add', neu: 6, text: 'Link: How to reactivate your account (/help/reactivate-account)' },
      { t: 'add', neu: 7, text: '' },
      { t: 'add', neu: 8, text: 'Macro update: BILL-LOCKED-01 (pending help-center link)' },
    ],
  },
];

/* ─────────── Review packet for the implementation PR ─────────── */
DATA.reviewPacket = {
  pr: '#128', prTitle: 'WP-0042: Enforce billing status rule in account settings',
  intent: 'High', ring: 87,
  satisfied: [
    'Inactive users cannot update payment settings',
    'Active users keep existing behavior',
    'Payment methods are not deleted',
    'Change rides the billing-safeguards feature flag',
  ],
  needsReview: [
    'Support copy updated, but not linked to the help center yet (macro BILL-LOCKED-01 pending)',
    'Test only covers inactive status — suspended, restricted, and risk-flagged are untested',
    'Restriction banner error message may need UX review against the error-copy pattern',
  ],
  changedAreas: [
    { area: 'Account settings payment form', file: 'src/account/settings/payment-settings.tsx' },
    { area: 'Billing permissions check', file: 'src/billing/permissions.ts' },
    { area: 'Billing status test', file: 'tests/billing-status-rule.test.ts' },
    { area: 'User-facing support copy', file: 'support/billing-status-copy.md' },
  ],
  nonGoalCheck: 'No checkout files touched. No payment-method deletion paths modified. Non-goals respected.',
  risks: [
    'Billing behavior change — risk review required before merge (release constraint)',
    'EU messaging: banner copy may need legal review under CR-014',
  ],
  questions: {
    engineering: ['Should the status gate live in the API layer as well as the client permission check?'],
    risk: ['Does the suspended-account renewal question (deferred) block this release?'],
  },
  recommendation: 'Request agent revision to extend test coverage to all inactive statuses before engineering approval.',
};

/* ─────────── Governance queue ─────────── */
DATA.governance = [
  {
    id: 'gov-1', icon: '⛨', title: 'Context change: business-rules.md (BR-104)',
    sub: 'High-risk category (billing). Requires product owner + risk approval before merge.',
    state: 'Review required', who: 'M. Steiner (Risk)', when: 'awaiting draft PR',
    policy: 'Policy CTX-GOV-004: high-risk context categories require approval.',
  },
  {
    id: 'gov-2', icon: '⚙', title: 'Skill proposal: billing-domain-reviewer',
    sub: 'Contains a script and touches the billing domain. Script execution stays blocked until approved.',
    state: 'Waiting for approval', who: 'M. Steiner (Risk) + T. Whitfield (Eng Lead)', when: 'submitted today',
    policy: 'Policy SKILL-SEC-001/002: scripts and sensitive context require approval.',
  },
  {
    id: 'gov-3', icon: '⛿', title: 'Protected branch: main',
    sub: 'Direct commits are blocked in PM mode. All changes flow through safe draft branches and PRs.',
    state: 'Enforced', who: 'Repository policy', when: 'always on',
    policy: 'Policy BRANCH-004: protected branches accept reviewed PRs only.',
  },
];

DATA.governanceApprovalMatrix = [
  { artifact: 'Context update (standard)', approver: 'Product owner' },
  { artifact: 'Context update (billing / compliance)', approver: 'Product owner + Risk' },
  { artifact: 'Skill without scripts', approver: 'Skill approver' },
  { artifact: 'Skill with scripts', approver: 'Skill approver + Risk' },
  { artifact: 'Agent run touching code', approver: 'Engineering reviewer' },
  { artifact: 'Merge to main', approver: 'Engineering + required reviews' },
];

/* ─────────── Audit trail (grows at runtime) ─────────── */
DATA.audit = [
  { time: '09:41', user: 'd.chen', what: 'merged PR #121 (release story — invoice reissue window)', ref: 'AR-0089' },
  { time: '09:12', user: 't.whitfield', what: 'approved agent run AR-0089 output', ref: 'AR-0089' },
  { time: 'Fri', user: 'm.steiner', what: 'completed risk review for WP-0038', ref: 'WP-0038' },
];

/* ─────────── Release stories ─────────── */
DATA.releases = [
  {
    id: 'rel-1', title: 'Invoice reissue window extended to 90 days', date: '2026-06-12',
    file: 'releases/2026-06-invoice-reissue-window.md',
    what: 'Support can now reissue invoices up to 90 days after the billing date (previously 60).',
    why: 'Enterprise finance teams frequently requested reissues in the 60–90 day range.',
    affected: 'Enterprise and growth accounts, all markets.',
    impact: 'No customer-visible UI change; support resolves reissue requests without escalation.',
    support: 'Macro INV-REISSUE-02 updated. Escalation path retired.',
    risk: 'Risk review completed 2026-06-10. No open items.',
    links: ['WP-0038', 'PR #121'],
  },
];

/* ─────────── Companion canned answers ─────────── */
DATA.companionAnswers = [
  { match: /branch|draft/i,
    text: `A <b>safe draft branch</b> is your safe place to propose changes. Nothing changes in the shared product until the branch is reviewed and approved through a pull request. You can commit ("save versions") freely on a draft — <code>main</code> stays protected and only accepts reviewed PRs.`,
    sources: ['AGENTS.md', 'release-constraints.md'] },
  { match: /work package|wp-/i,
    text: `A <b>Work Package</b> bundles everything an agent or engineer needs: goal, context used, acceptance signals, non-goals, risk controls, and a review plan. It lives in the repo under <code>/work-packages/</code>, so it's versioned like code.`,
    sources: ['work-packages/'] },
  { match: /skill/i,
    text: `A <b>Skill</b> is a governed, reusable capability an agent can invoke — instructions plus optional templates, references, and scripts. Skills that run scripts or touch sensitive domains need approval before agents may use them.`,
    sources: ['skills/', 'AGENTS.md'] },
  { match: /inactive|status|suspended/i,
    text: `Per the domain glossary, an <b>inactive account</b> is any account in a suspended, closed, restricted, or risk-flagged state. The new rule BR-104 blocks payment-settings changes for all of these — saved payment methods stay intact.`,
    sources: ['domain-glossary.md', 'business-rules.md'] },
  { match: /pr|pull request|review/i,
    text: `A <b>pull request</b> is a reviewable package of changes. In PMIDE you review it twice: a <b>Product Intent Review</b> (did it satisfy the work package?) and the normal engineering code review. Merging still requires the engineering side.`,
    sources: ['.github/pull_request_template.md'] },
  { match: /governance|approval|risk/i,
    text: `Governance in this repo: billing/compliance context needs product + risk approval, skills with scripts need risk + engineering approval, and <code>main</code> only accepts reviewed PRs. You can see live checks in the <b>Governance</b> panel.`,
    sources: ['release-constraints.md', 'compliance-rules.md'] },
  { match: /commit|save/i,
    text: `A <b>commit</b> is a saved checkpoint of your work ("Save Version" in the toolbar). Commits on a safe draft branch don't affect the shared product — pushing ("Share Draft") publishes the branch so the team can see and review it.`,
    sources: ['AGENTS.md'] },
];

DATA.companionFallback = {
  text: `I can help with the repo, the context library, work packages, skills, branches, and reviews. Try asking about the current branch, what a work package is, or why the billing rule changed.`,
  sources: [],
};

/* ─────────── PM-friendly Git labels ─────────── */
DATA.gitLabels = [
  { git: 'Branch', pm: 'Safe Draft Branch' },
  { git: 'Commit', pm: 'Save Version' },
  { git: 'Push', pm: 'Share Draft' },
  { git: 'Pull Request', pm: 'Propose Change' },
  { git: 'Diff', pm: 'Compare Changes' },
  { git: 'Merge', pm: 'Accept Change' },
  { git: 'Conflict', pm: 'Competing Change' },
];
