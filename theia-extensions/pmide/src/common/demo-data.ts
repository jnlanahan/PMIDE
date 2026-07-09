/********************************************************************************
 * PMIDE demo data — the "enterprise-sample-app" repository and golden-flow content.
 * Ported from the PMIDE web demo (app/data.js). Repo files here are REAL: the
 * backend materializes them on disk and git-inits them on first launch.
 * SPDX-License-Identifier: MIT
 ********************************************************************************/
/* eslint-disable max-len */

export interface DemoFile { path: string; content: string; }

/* ─────────── Repo files written at bootstrap ─────────── */
export const REPO_FILES: DemoFile[] = [
    {
        path: 'README.md', content: `# enterprise-sample-app

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
`},
    {
        path: 'AGENTS.md', content: `# Agent Instructions — enterprise-sample-app

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
`},
    {
        path: 'context/product-principles.md', content: `# Product Principles

1. **Trust before convenience.** Never trade account safety for a faster flow.
2. **Explain every restriction.** When we block an action, we say why and
   what the customer can do next.
3. **No silent data changes.** Customer-visible state changes always produce
   a confirmation and an audit event.
4. **Accessible by default.** Every flow meets WCAG 2.1 AA.
5. **Reversible where possible.** Prefer soft-disable over delete.
`},
    {
        path: 'context/business-rules.md', content: `# Business Rules

## BR-104 — Payment settings access
Payment settings can be updated by authenticated users.

## BR-097 — Invoice reissue window
Invoices may be reissued up to 90 days after the billing date.

## BR-093 — Refund authority
Refunds above $500 require a billing-team approval.

## BR-088 — Plan downgrade timing
Plan downgrades take effect at the end of the current billing period.
`},
    {
        path: 'context/customer-segments.md', content: `# Customer Segments

## Enterprise accounts
Multi-seat contracts, invoiced billing, assigned CSM. Highest support tier.

## Growth accounts
Self-serve teams on monthly or annual card billing.

## Trial accounts
14-day evaluation. No payment method required until conversion.

## Inactive accounts
Accounts in a suspended, closed, restricted, or risk-flagged state.
Treated as read-only for most account operations.
`},
    {
        path: 'context/compliance-rules.md', content: `# Compliance Rules

## CR-021 — Payment data handling
All payment instrument data is tokenized at the provider. The application
never stores raw card numbers.

## CR-018 — Billing change traceability
Every change to billing behavior must be traceable to an approved
decision record and reviewed by the risk team before release.

## CR-014 — Regulated-market messaging
Customer-facing copy about payments in EU markets must pass legal review.
`},
    {
        path: 'context/domain-glossary.md', content: `# Domain Glossary

**Account status** — lifecycle state of a customer account:
\`active\`, \`trial\`, \`suspended\`, \`closed\`, \`restricted\`, \`risk-flagged\`.

**Payment method** — a tokenized payment instrument attached to an account.

**Payment settings** — the account surface where customers manage payment
methods, billing address, and invoice preferences.

**Billing period** — the interval an account is invoiced for.

**Reactivation** — moving an account from a non-active status back to \`active\`.
`},
    {
        path: 'context/ux-standards.md', content: `# UX Standards

- Blocking states use the standard **restriction banner** component, never
  disabled buttons alone.
- Every restriction banner links to a help-center article.
- Error copy follows the pattern: *what happened → why → what to do next*.
- Destructive actions require typed confirmation.
- All copy in sentence case.
`},
    {
        path: 'context/release-constraints.md', content: `# Release Constraints

- Billing-behavior changes require product **and** risk review before merge.
- No production releases on Fridays or during the last 3 days of a quarter.
- Changes touching payment settings must ship behind the
  \`billing-safeguards\` feature flag.
- Support enablement notes are required for any customer-visible change.
`},
    {
        path: 'decisions/DR-0016-checkout-guest-flow.md', content: `# DR-0016 — Guest checkout stays disabled for enterprise SKUs

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
`},
    {
        path: 'planning/2026-07-06-billing-accounts-weekly.md', content: `Billing & Accounts weekly planning — 2026-07-06
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
  any billing-touching change.
`},
    {
        path: 'skills/release-story-writer/SKILL.md', content: `---
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
`},
    {
        path: 'releases/release-story-template.md', content: `# Release Story — <title>

**What changed** — one paragraph in customer language.

**Why it changed** — link the decision record.

**Who is affected** — segments and markets.

**Customer impact** — visible behavior changes.

**Support notes** — what support needs to know, with macros to update.

**Risk notes** — anything the risk team flagged.

**Links** — Work Package · PR · Decisions
`},
    {
        path: 'agent-runs/AR-0089/run-summary.md', content: `# Agent Run AR-0089

**Agent:** Claude · **Initiated by:** D. Chen · **Status:** Merged
**Task:** Generate release story for invoice-reissue window change
**Skill:** release-story-writer
**Branch:** safe-draft/release-story-invoice-window

## Context used
- /work-packages/WP-0038-invoice-reissue-window
- /context/business-rules.md (BR-097)

## Outcome
Release story drafted and merged in PR #121. No errors.
`},
    {
        path: '.github/pull_request_template.md', content: `## Summary

## Why

## Linked Work Package

## Linked context

## Requested review
- [ ] Product intent review
- [ ] Engineering code review
- [ ] Risk review (billing / compliance changes)

## Risk notes
`},
    {
        path: 'package.json', content: `{
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
}
`},
    {
        path: 'src/account/settings/payment-settings.tsx', content: `import { useAccount } from "../hooks/useAccount";
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
}
`},
    {
        path: 'src/account/settings/profile-settings.tsx', content: `import { useAccount } from "../hooks/useAccount";

export function ProfileSettings() {
  const { account } = useAccount();
  return (
    <section aria-labelledby="profile-settings-title">
      <h2 id="profile-settings-title">Profile</h2>
      <p>{account.displayName}</p>
    </section>
  );
}
`},
    {
        path: 'src/billing/permissions.ts', content: `import type { Account } from "../account/types";

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
}
`},
    {
        path: 'src/billing/invoices.ts', content: `import type { Invoice } from "./types";

const REISSUE_WINDOW_DAYS = 90; // BR-097

export function canReissue(invoice: Invoice, now: Date): boolean {
  const age = (now.getTime() - invoice.billedAt.getTime()) / 86_400_000;
  return age <= REISSUE_WINDOW_DAYS;
}
`},
    {
        path: 'src/checkout/checkout-flow.tsx', content: `import { useCart } from "./useCart";
import { PaymentStep } from "./payment-step";

export function CheckoutFlow() {
  const { cart } = useCart();
  return (
    <main aria-label="Checkout">
      <PaymentStep cart={cart} />
    </main>
  );
}
`},
    {
        path: 'tests/billing.test.ts', content: `import { describe, expect, it } from "vitest";
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
});
`},
    {
        path: 'tests/checkout.test.ts', content: `import { describe, expect, it } from "vitest";

describe("checkout", () => {
  it.todo("guest checkout blocked for enterprise SKUs (DR-0016)");
});
`},
    {
        path: 'work-packages/WP-0038-invoice-reissue-window/work-package.md', content: `# WP-0038 — Extend invoice reissue window to 90 days

**Status:** Merged · **Owner:** D. Chen · **PR:** #121

## Goal
Allow support to reissue invoices up to 90 days after billing date (was 60).

## Acceptance signals
- Invoices up to 90 days old can be reissued
- Invoices past 90 days show the standard restriction banner
- Audit event recorded per reissue
`},
];

/* ─────────── Context update written when the PM accepts (golden-flow step 4) ─────────── */
export const CONTEXT_UPDATE_WRITES: DemoFile[] = [
    {
        path: 'context/business-rules.md', content: `# Business Rules

## BR-104 — Payment settings access
Payment settings can be updated only by authenticated users whose
account status is active. (DR-0017, 2026-07-06)

## BR-097 — Invoice reissue window
Invoices may be reissued up to 90 days after the billing date.

## BR-093 — Refund authority
Refunds above $500 require a billing-team approval.

## BR-088 — Plan downgrade timing
Plan downgrades take effect at the end of the current billing period.
`},
    {
        path: 'context/domain-glossary.md', content: `# Domain Glossary

**Account status** — lifecycle state of a customer account:
\`active\`, \`trial\`, \`suspended\`, \`closed\`, \`restricted\`, \`risk-flagged\`.

**Payment method** — a tokenized payment instrument attached to an account.

**Payment settings** — the account surface where customers manage payment
methods, billing address, and invoice preferences.

**Billing period** — the interval an account is invoiced for.

**Reactivation** — moving an account from a non-active status back to \`active\`.

**Inactive account** — any account whose status is suspended, closed,
restricted, or risk-flagged. Inactive accounts cannot change payment settings.
`},
    {
        path: 'context/release-constraints.md', content: `# Release Constraints

- Billing-behavior changes require product **and** risk review before merge.
- No production releases on Fridays or during the last 3 days of a quarter.
- Changes touching payment settings must ship behind the
  \`billing-safeguards\` feature flag.
- Support enablement notes are required for any customer-visible change.
- BR-104 enforcement (inactive-account payment lock) rides the
  \`billing-safeguards\` flag and needs product + risk sign-off.
`},
    {
        path: 'decisions/DR-0017-inactive-account-payment-settings.md', content: `# DR-0017 — Inactive accounts cannot update payment settings

**Date:** 2026-07-06 · **Owner:** J. Alvarez (PM) · **Status:** Proposed

## Decision
Inactive accounts cannot update payment settings.

## Context
Three support escalations where suspended accounts changed payment methods
and disputed charges after reactivation.

## Options considered
1. Block edits for inactive accounts (chosen)
2. Allow edits with extra verification
3. Manual support-only changes

## Rationale
Inactive accounts may represent suspended, closed, restricted, or
risk-flagged customer states. Allowing payment setting changes creates
downstream billing and support issues.

## Tradeoffs
Adds friction for users who need to reactivate first. Mitigated by the
restriction banner linking to reactivation help.

## Impacted areas
Account settings · Billing permissions · Checkout · Support workflows
`},
];

/* ─────────── Skill files written by the wizard (step 5) ─────────── */
export const SKILL_WRITES: DemoFile[] = [
    {
        path: 'skills/billing-domain-reviewer/SKILL.md', content: `---
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
`},
    {
        path: 'skills/billing-domain-reviewer/templates/review-output.md', content: `# Billing Domain Review — <change>

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
`},
    {
        path: 'skills/billing-domain-reviewer/references/billing-rules.md', content: `# Reference: Billing rules snapshot

Snapshot of /context/business-rules.md pinned for this skill.
The skill re-reads the live file at run time; this copy documents
the rules the skill was designed against.

- BR-104 — Payment settings require active account status.
- BR-097 — Invoice reissue window: 90 days.
- BR-093 — Refunds above $500 require billing-team approval.
- BR-088 — Downgrades take effect at period end.
`},
    {
        path: 'skills/billing-domain-reviewer/scripts/check-billing-terms.py', content: `#!/usr/bin/env python3
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
            findings.append(f"{path}: '{m.group()}' -> use '{canonical}'")
    return findings

if __name__ == "__main__":
    results = [f for arg in sys.argv[1:] for f in scan(Path(arg))]
    print(chr(10).join(results) if results else "No terminology drift found.")
    sys.exit(1 if results else 0)
`},
];

/* ─────────── Work Package files (step 6) ─────────── */
export const WP_WRITES: DemoFile[] = [
    {
        path: 'work-packages/WP-0042-billing-status-rule/work-package.md', content: `# WP-0042 — Enforce Billing Status Rule in Account Settings

**Status:** Draft · **Owner:** J. Alvarez · **Branch:** safe-draft/billing-status-rule

## Goal
Prevent inactive accounts from changing payment settings.

## Context used
- Business rule BR-104 (updated): payment settings require active account status
- Domain term: inactive account
- Release constraint: billing changes require product and risk review
- UX standard: restriction banner with help-center link

## Acceptance signals
- Active users can update payment settings
- Inactive users cannot update payment settings
- Inactive users see clear explanatory copy
- Existing saved payment methods are not deleted
- Support flow language is updated

## Non-goals
- Do not change checkout payment authorization
- Do not remove existing payment methods
- Do not redesign account settings

## Risk controls
- Ships behind the billing-safeguards feature flag
- Product + risk review before merge
`},
    {
        path: 'work-packages/WP-0042-billing-status-rule/context-map.json', content: `{
  "workPackage": "WP-0042",
  "sources": [
    { "file": "context/business-rules.md", "anchor": "BR-104", "informs": ["goal", "acceptance"] },
    { "file": "decisions/DR-0017-inactive-account-payment-settings.md", "informs": ["goal", "rationale"] },
    { "file": "context/domain-glossary.md", "anchor": "inactive account", "informs": ["definitions"] },
    { "file": "context/release-constraints.md", "informs": ["risk-controls", "review-plan"] },
    { "file": "context/ux-standards.md", "anchor": "restriction banner", "informs": ["acceptance"] }
  ]
}
`},
    {
        path: 'work-packages/WP-0042-billing-status-rule/review-plan.md', content: `# Review plan — WP-0042

1. Product intent review (J. Alvarez)
2. Engineering code review (T. Whitfield)
3. Risk review for billing behavior (M. Steiner)

Risk controls: billing-safeguards flag · no Friday release · support notes required.
`},
];

/* ─────────── Agent implementation files (step 8 — written on the agent branch) ─────────── */
export const IMPLEMENTATION_WRITES: DemoFile[] = [
    {
        path: 'src/billing/permissions.ts', content: `import type { Account } from "../account/types";
import { flags } from "../platform/feature-flags";

/** Central gate for billing-surface capabilities. */
export function canViewInvoices(account: Account): boolean {
  return account.authenticated;
}

/**
 * BR-104: payment settings may be updated only by authenticated
 * users whose account status is active. (WP-0042, DR-0017)
 */
export function canUpdatePaymentSettings(account: Account): boolean {
  if (!flags.enabled("billing-safeguards")) return account.authenticated;
  return account.authenticated && account.status === "active";
}

export function canRequestRefund(account: Account, amount: number): boolean {
  if (!account.authenticated) return false;
  return amount <= 500 || account.roles.includes("billing-approver");
}
`},
    {
        path: 'src/account/settings/payment-settings.tsx', content: `import { useAccount } from "../hooks/useAccount";
import { canUpdatePaymentSettings } from "../../billing/permissions";
import { RestrictionBanner } from "../../ui/restriction-banner";
import { PaymentMethodList } from "./payment-method-list";
import { BillingAddressForm } from "./billing-address-form";

export function PaymentSettings() {
  const { account } = useAccount();
  const canEdit = canUpdatePaymentSettings(account);

  return (
    <section aria-labelledby="payment-settings-title">
      <h2 id="payment-settings-title">Payment settings</h2>
      {!canEdit && (
        <RestrictionBanner
          title="Payment settings are locked for this account"
          body="Your account is not active, so payment details cannot be
                changed right now. Your saved payment methods are safe."
          helpHref="/help/reactivate-account"
          helpLabel="How to reactivate your account"
        />
      )}
      <PaymentMethodList accountId={account.id} readOnly={!canEdit} />
      {canEdit && <BillingAddressForm accountId={account.id} />}
    </section>
  );
}
`},
    {
        path: 'tests/billing-status-rule.test.ts', content: `import { describe, expect, it } from "vitest";
import { canUpdatePaymentSettings } from "../src/billing/permissions";
import { makeAccount } from "./factories";

describe("BR-104: payment settings require active status", () => {
  it("allows active accounts", () => {
    const account = makeAccount({ status: "active" });
    expect(canUpdatePaymentSettings(account)).toBe(true);
  });

  it("blocks inactive accounts", () => {
    const account = makeAccount({ status: "inactive" });
    expect(canUpdatePaymentSettings(account)).toBe(false);
  });

  // TODO(review): suspended / restricted / risk-flagged not yet covered
  it("keeps saved payment methods", () => {
    const account = makeAccount({ status: "inactive", methods: 2 });
    expect(account.paymentMethods).toHaveLength(2);
  });
});
`},
    {
        path: 'support/billing-status-copy.md', content: `# Support copy — payment settings restriction

Banner: "Payment settings are locked for this account."
Body: "Your account is not active, so payment details cannot be
changed right now. Your saved payment methods are safe."
Link: How to reactivate your account (/help/reactivate-account)

Macro update: BILL-LOCKED-01 (pending help-center link)
`},
];

/* ─────────── Agent-run record files (written when the run completes) ─────────── */
export const AGENT_RUN_WRITES: DemoFile[] = [
    {
        path: 'agent-runs/AR-0092/run-summary.md', content: `# Agent Run AR-0092

**Agents:** Claude → Copilot (simulated execution) · **Initiated by:** J. Alvarez
**Task:** Refine WP-0042, then implement billing status rule
**Skill:** billing-domain-reviewer (pending approval — instructions only)
**Branch:** agent/wp-0042-implementation

## Context sent
- work-packages/WP-0042-billing-status-rule/ (all files)
- context/business-rules.md#BR-104
- context/domain-glossary.md#inactive-account
- context/ux-standards.md#restriction-banner
- AGENTS.md

## Outcome
4 files changed on agent/wp-0042-implementation. Awaiting Product Intent Review.
`},
    {
        path: 'agent-runs/AR-0092/context-used.json', content: `{
  "run": "AR-0092",
  "agents": ["claude", "copilot"],
  "simulated": true,
  "context": [
    "work-packages/WP-0042-billing-status-rule/",
    "context/business-rules.md#BR-104",
    "context/domain-glossary.md#inactive-account",
    "context/ux-standards.md#restriction-banner",
    "AGENTS.md"
  ],
  "skills": ["billing-domain-reviewer (pending approval)"],
  "branch": "agent/wp-0042-implementation",
  "approvals": [
    { "user": "j.alvarez", "role": "Agent Operator", "action": "routing approval" }
  ]
}
`},
];

/* ─────────── Release story (step 10) ─────────── */
export const RELEASE_STORY_WRITE: DemoFile = {
    path: 'releases/2026-07-billing-status-rule.md', content: `# Release Story — Payment settings locked for inactive accounts

**What changed** — Accounts that are suspended, closed, restricted, or
risk-flagged can no longer change payment settings. Saved payment methods
stay exactly as they are, and a clear banner explains how to reactivate.

**Why it changed** — Three support escalations showed suspended accounts
changing payment methods and disputing charges after reactivation (DR-0017).

**Who is affected** — All markets. Only accounts in a non-active status
see any change.

**Customer impact** — Inactive-account holders see a restriction banner
with a reactivation link instead of editable payment forms.

**Support notes** — Macro BILL-LOCKED-01 ships with this change.
Help-center article link pending — flagged in product intent review.

**Risk notes** — Rides the billing-safeguards flag. Risk review in
progress; EU banner copy queued for legal (CR-014).

**Links** — WP-0042 · PR #128 · DR-0017 · AR-0092
`};

/* ─────────── Catalogs & flow content (frontend rendering) ─────────── */

export const PLANNING_NOTES = REPO_FILES.find(f => f.path.startsWith('planning/'))!.content;

export interface ExtractionItem {
    kind: 'decision' | 'rule' | 'wp' | 'skill' | 'conflict' | 'question' | 'risk';
    title: string;
    body: string;
    impact: string;
    target: string;
    accepted: boolean | 'defer' | null;
}

export const EXTRACTION: ExtractionItem[] = [
    {
        kind: 'decision', title: 'Inactive accounts cannot update payment settings',
        body: 'Suspended, closed, restricted, or risk-flagged accounts must not be able to change payment settings. Driven by three support escalations involving chargebacks after reactivation.',
        impact: 'Account settings · Billing permissions · Support workflows',
        target: 'decisions/DR-0017-inactive-account-payment-settings.md', accepted: null,
    },
    {
        kind: 'rule', title: 'BR-104 update: payment settings require active status',
        body: 'Before: "Payment settings can be updated by authenticated users." After: "Payment settings can be updated only by authenticated users whose account status is active."',
        impact: 'Supersedes current BR-104 · flags a conflict with the existing rule',
        target: 'context/business-rules.md', accepted: null,
    },
    {
        kind: 'wp', title: 'Enforce billing-status rule in account settings',
        body: 'Block payment-settings changes for inactive accounts, keep saved payment methods, show explanatory copy with a reactivation link, update support macros.',
        impact: 'Ready to generate as WP-0042 after context is accepted',
        target: 'work-packages/WP-0042-billing-status-rule/', accepted: null,
    },
    {
        kind: 'skill', title: 'Suggested skill: Billing Domain Reviewer',
        body: 'A reusable review capability agents run against any billing-touching change: checks business rules, glossary terms, acceptance coverage, and produces reviewer questions.',
        impact: 'Marcus flagged repeated manual review effort',
        target: 'skills/billing-domain-reviewer/', accepted: null,
    },
    {
        kind: 'conflict', title: 'Context conflict: BR-104 vs. new rule',
        body: 'Business Rule BR-104 currently allows all authenticated users to update payment settings. The new rule restricts this to active accounts. BR-104 must be updated or marked superseded.',
        impact: 'Resolve by accepting the BR-104 update above',
        target: 'context/business-rules.md', accepted: null,
    },
    {
        kind: 'question', title: 'Open question: renewals for suspended accounts',
        body: 'What happens to in-flight subscription renewals when an account is suspended? No decision was made — defer to a future planning session.',
        impact: 'Deferred items are tracked in the decision backlog',
        target: 'decisions/backlog.md', accepted: null,
    },
    {
        kind: 'risk', title: 'Risk control: ride the billing-safeguards flag',
        body: 'Change must ship behind the billing-safeguards feature flag and pass product + risk review before merge (existing release constraint).',
        impact: 'Attached to the work package risk controls',
        target: 'work-packages/WP-0042-billing-status-rule/review-plan.md', accepted: null,
    },
];

export const CONTEXT_DIFF = {
    title: 'Business Rule Update — BR-104',
    before: 'Payment settings can be updated by authenticated users.',
    after: 'Payment settings can be updated only by authenticated users whose account status is active.',
    impacted: ['Account settings', 'Billing permissions', 'Checkout', 'Support workflows'],
    files: ['context/business-rules.md', 'context/domain-glossary.md', 'context/release-constraints.md', 'decisions/DR-0017-inactive-account-payment-settings.md'],
};

export interface ContextObject {
    id: string; title: string; category: string; file: string; owner: string;
    status: string; updated: string; freshness: 'fresh' | 'aging' | 'stale';
    agentUsage: number; governance: string; summary: string;
}

export const CONTEXT_OBJECTS: ContextObject[] = [
    { id: 'ctx-principles', title: 'Product principles', category: 'Product principles', file: 'context/product-principles.md', owner: 'J. Alvarez (PM)', status: 'Approved', updated: '2026-06-02', freshness: 'fresh', agentUsage: 14, governance: 'No review required', summary: 'Five principles that govern every customer-facing decision, from trust-first defaults to reversibility.' },
    { id: 'ctx-rules', title: 'Business rules', category: 'Business rules', file: 'context/business-rules.md', owner: 'J. Alvarez (PM)', status: 'Approved', updated: '2026-05-27', freshness: 'aging', agentUsage: 31, governance: 'High-risk category — changes require product + risk approval', summary: 'Rules that gate billing behavior: payment-settings access, invoice reissue windows, refund authority, downgrade timing.' },
    { id: 'ctx-segments', title: 'Customer segments', category: 'Customer segments', file: 'context/customer-segments.md', owner: 'R. Okafor (Product Ops)', status: 'Approved', updated: '2026-04-30', freshness: 'aging', agentUsage: 9, governance: 'No review required', summary: 'Enterprise, growth, trial, and inactive account segments with their operational treatment.' },
    { id: 'ctx-compliance', title: 'Compliance rules', category: 'Compliance rules', file: 'context/compliance-rules.md', owner: 'M. Steiner (Risk)', status: 'Approved', updated: '2026-06-14', freshness: 'fresh', agentUsage: 22, governance: 'High-risk category — compliance review required for every change', summary: 'Payment-data handling, billing-change traceability, and regulated-market messaging requirements.' },
    { id: 'ctx-glossary', title: 'Domain glossary', category: 'Domain glossary', file: 'context/domain-glossary.md', owner: 'R. Okafor (Product Ops)', status: 'Approved', updated: '2026-05-12', freshness: 'fresh', agentUsage: 40, governance: 'No review required', summary: 'Canonical definitions: account status, payment method, payment settings, billing period, reactivation.' },
    { id: 'ctx-ux', title: 'UX standards', category: 'UX standards', file: 'context/ux-standards.md', owner: 'P. Laurent (Design)', status: 'Approved', updated: '2026-03-19', freshness: 'stale', agentUsage: 12, governance: 'Review recommended', summary: 'Restriction banners, error-copy pattern, typed confirmations, sentence case.' },
    { id: 'ctx-release', title: 'Release constraints', category: 'Release constraints', file: 'context/release-constraints.md', owner: 'T. Whitfield (Eng Lead)', status: 'Approved', updated: '2026-06-20', freshness: 'fresh', agentUsage: 17, governance: 'Review recommended', summary: 'Billing changes need product + risk review, Friday freeze, billing-safeguards flag, support enablement notes.' },
    { id: 'ctx-agents', title: 'Agent instructions', category: 'Agent instructions', file: 'AGENTS.md', owner: 'T. Whitfield (Eng Lead)', status: 'Approved', updated: '2026-06-08', freshness: 'fresh', agentUsage: 55, governance: 'High-risk category — engineering approval required', summary: 'Ground rules for every agent in this repo: read governed context first, safe-draft branches only, traceable runs.' },
];

export interface AgentInfo {
    id: string; name: string; color: string; strength: string; tags: string[]; real: boolean;
    recommend?: string;
}

export const AGENTS: AgentInfo[] = [
    { id: 'claude', name: 'Claude', color: '#d99e78', strength: 'Requirement refinement, context consistency, product-readable summaries.', tags: ['context reasoning', 'long documents', 'review packets'], real: true, recommend: 'Refine Work Package' },
    { id: 'copilot', name: 'GitHub Copilot', color: '#8bb8f8', strength: 'GitHub-native issue-to-PR implementation inside this repo.', tags: ['issue → PR', 'repo-native', 'inline code'], real: false, recommend: 'Create Implementation PR' },
    { id: 'codex', name: 'Codex', color: '#9fe0b8', strength: 'Script and test generation, mechanical refactors.', tags: ['tests', 'scripts', 'refactors'], real: false },
    { id: 'gemini', name: 'Gemini', color: '#c5a8f5', strength: 'Cross-file analysis and large-context exploration.', tags: ['analysis', 'large context'], real: false },
    { id: 'enterprise', name: 'Meridian Gateway', color: '#e8c477', strength: 'Enterprise model gateway with policy-filtered context access.', tags: ['policy-aware', 'internal'], real: false },
    { id: 'human', name: 'Human engineer', color: '#a5aebe', strength: 'Architecture-heavy or high-risk work that needs human judgment first.', tags: ['high risk', 'architecture'], real: true },
];

export const SKILL_SCAN = {
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

export const REVIEW_PACKET = {
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
        engineering: 'Should the status gate live in the API layer as well as the client permission check?',
        risk: 'Does the suspended-account renewal question (deferred) block this release?',
    },
    recommendation: 'Request agent revision to extend test coverage to all inactive statuses before engineering approval.',
};

export const WP_0042 = {
    id: 'WP-0042', title: 'Enforce Billing Status Rule in Account Settings',
    owner: 'J. Alvarez', readiness: 87,
    goal: 'Prevent inactive accounts from changing payment settings.',
    problem: 'Suspended and closed accounts can currently change payment methods, creating a chargeback and fraud vector confirmed by three support escalations.',
    contextUsed: [
        'Business rule BR-104 (updated): payment settings require active account status',
        'Domain term: inactive account (suspended, closed, restricted, risk-flagged)',
        'Release constraint: billing changes require product and risk review',
        'UX standard: restriction banner with help-center link',
    ],
    decisionsUsed: ['DR-0017 — Inactive accounts cannot update payment settings'],
    agentInstructions: 'Gate canUpdatePaymentSettings on account.status === "active". Render the standard restriction banner in PaymentSettings for inactive accounts with reactivation link. Do not delete or hide saved payment methods. Add status-matrix tests. Update support copy file.',
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
};

export const GOVERNANCE_MATRIX = [
    { artifact: 'Context update (standard)', approver: 'Product owner' },
    { artifact: 'Context update (billing / compliance)', approver: 'Product owner + Risk' },
    { artifact: 'Skill without scripts', approver: 'Skill approver' },
    { artifact: 'Skill with scripts', approver: 'Skill approver + Risk' },
    { artifact: 'Agent run touching code', approver: 'Engineering reviewer' },
    { artifact: 'Merge to main', approver: 'Engineering + required reviews' },
];

export const GIT_LABELS = [
    { git: 'Branch', pm: 'Safe Draft Branch' },
    { git: 'Commit', pm: 'Save Version' },
    { git: 'Push', pm: 'Share Draft' },
    { git: 'Pull Request', pm: 'Propose Change' },
    { git: 'Diff', pm: 'Compare Changes' },
    { git: 'Merge', pm: 'Accept Change' },
    { git: 'Conflict', pm: 'Competing Change' },
];

export const COMPANION_ANSWERS: { match: RegExp; text: string; sources: string[] }[] = [
    {
        match: /branch|draft/i,
        text: 'A **safe draft branch** is your safe place to propose changes. Nothing changes in the shared product until the branch is reviewed and approved through a pull request. You can commit ("save versions") freely on a draft — main stays protected and only accepts reviewed PRs.',
        sources: ['AGENTS.md', 'release-constraints.md'],
    },
    {
        match: /work package|wp-/i,
        text: 'A **Work Package** bundles everything an agent or engineer needs: goal, context used, acceptance signals, non-goals, risk controls, and a review plan. It lives in the repo under /work-packages/, so it is versioned like code.',
        sources: ['work-packages/'],
    },
    {
        match: /skill/i,
        text: 'A **Skill** is a governed, reusable capability an agent can invoke — instructions plus optional templates, references, and scripts. Skills that run scripts or touch sensitive domains need approval before agents may use them.',
        sources: ['skills/', 'AGENTS.md'],
    },
    {
        match: /inactive|status|suspended/i,
        text: 'Per the domain glossary, an **inactive account** is any account in a suspended, closed, restricted, or risk-flagged state. The updated rule BR-104 blocks payment-settings changes for all of these — saved payment methods stay intact.',
        sources: ['domain-glossary.md', 'business-rules.md'],
    },
    {
        match: /pr|pull request|review/i,
        text: 'A **pull request** is a reviewable package of changes. In PMIDE you review it twice: a **Product Intent Review** (did it satisfy the work package?) and the normal engineering code review. Merging still requires the engineering side.',
        sources: ['.github/pull_request_template.md'],
    },
    {
        match: /governance|approval|risk/i,
        text: 'Governance in this repo: billing/compliance context needs product + risk approval, skills with scripts need risk + engineering approval, and main only accepts reviewed PRs. See the Governance view for live checks.',
        sources: ['release-constraints.md', 'compliance-rules.md'],
    },
    {
        match: /commit|save/i,
        text: 'A **commit** is a saved checkpoint of your work ("Save Version"). Commits on a safe draft branch do not affect the shared product — pushing ("Share Draft") publishes the branch so the team can see and review it.',
        sources: ['AGENTS.md'],
    },
];

export const COMPANION_FALLBACK = {
    text: 'I can help with the repo, the context library, work packages, skills, branches, and reviews. Try asking about the current branch, what a work package is, or why the billing rule changed.',
    sources: [] as string[],
};
