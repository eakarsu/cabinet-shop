# Completeness Review: cabinet-shop

**Review date:** 2026-07-18

## Assessment basis

Static inspection of project-owned source and configuration only; no dependency installation, build, database migration, external-service call, or runtime launch was performed. The scan considered 113 project files (100 source files), 1 manifest(s), 0 test-like file(s), and 0 CI workflow(s), excluding dependency/generated directories.

## Classification

**Functional but incomplete**

This is a substantive but unfinished sales/customer operations application, not just an empty scaffold. Inspection found 100 source files across `src/`, `prisma/` using Next.js, React, Prisma; however, the checked-in workflow and delivery controls do not yet demonstrate a complete, production-operable product.

## Why it is not complete

- Mock, demo, sample, fixture, or placeholder behavior remains in executable/product paths.
- No recognizable project-owned automated tests were found for the main workflow.
- No checked-in CI workflow proves builds, tests, migrations, and security checks on every change.
- No clear deployment/container configuration demonstrates a reproducible production topology.

## Needed features

1. Integrate CRM, email/calendar, enrichment, consent, and suppression sources with bidirectional, deduplicated sync.
2. Implement explicit lead/account lifecycle, ownership, approvals, attribution, and handoff/retry states.
3. Add deliverability, opt-out, regional privacy, rate-limit, and human-review controls for automated outreach.
4. Measure conversion and data quality with representative end-to-end workflow tests rather than generated sample records.
5. Add risk-based unit, integration, and end-to-end tests in CI, including migration and failure-path coverage.

## Risks or launch blockers

- Credential/configuration exposure: environment files are present in the repository tree and must be checked against Git history and rotated if real.
- Automation contains destructive process, filesystem, or database operations; do not run it on a shared machine without review.
- Startup appears coupled to seed/migration behavior, risking data mutation or non-repeatable launches.
- AI-provider availability, cost, privacy, prompt injection, and unvalidated output are launch risks until bounded and evaluated.

## Evidence inspected

- `README.md`
- `prisma/schema.prisma:24`
- `start.sh:84`
- `src/app/layout.tsx`
- `package.json`
- `start.sh`

## Recommended next action

Choose one real sales/customer operations journey, define acceptance criteria and external contracts, then close its persistence, permission, integration, failure, and test gaps before expanding features.

## Implementation progress (2026-07-19)

Implemented the governed sales/customer-operations journey on 2026-07-19. Quotes and consultations now normalize and deduplicate contacts, capture attribution and purpose-specific consent, enforce explicit lead and account lifecycles, use optimistic versions, require ownership and independent approval, record immutable audit events, and hand work to durable CRM/email/calendar outboxes with signed inbound webhooks, stable external links, bounded retries, failure visibility, and connector/recipient cadence limits. The application now includes staff account management, conversion/data-quality and connector-health dashboards, customer consultation controls, hashed suppression, regional privacy requests, and independently reviewed outreach whose consent and suppression status is rechecked immediately before delivery.

Identity and data boundaries now fail closed: customer and staff records require authenticated ownership/role checks, registration and login are persistently throttled, locked/inactive accounts are rejected, runtime secrets must be distinct and strong, public intake is validated/idempotent/honeypot-protected, destructive record deletion was replaced with audited lifecycle states, and startup no longer resets, pushes, seeds, kills processes, or prints credentials. AI access is bounded, requester-signed, role restricted, privacy-minimized, timeout/rate limited, and produces reviewable drafts rather than autonomous customer messages. Stored printable cut-list text is escaped, and estimate creation requires a real requesting customer rather than an internal fake lead.

Operational delivery now includes data-preserving baseline and upgrade migrations, non-destructive reference seeding, explicit administrator bootstrap, a safe executable start script, a non-root standalone container/Compose topology with one-shot migrations, environment/security/backup/restore/incident documentation, and CI gates for schema parity, legacy backfill, lint, types, unit/integration/browser tests, production build, dependency and history secret scans, and container build. Local validation passed: fresh PostgreSQL 17 migrations, exact migration/schema parity, legacy lead/contact/consultation/staff backfill, 8 unit tests, 5 transactional integration tests, 2 live Playwright journeys, lint, type checking, production build, Compose rendering, `git diff --check`, and full-history Gitleaks. The PostCSS build dependency is now explicitly overridden to the patched direct version and the complete dependency audit reports zero vulnerabilities. A local image build could not run because the configured Docker daemon is offline; CI retains the authoritative container-build gate.

External launch inputs are intentionally not fabricated: operators must provision production PostgreSQL, DNS/TLS, connector endpoints and credentials, provider-side webhook configuration, administrator credentials, monitored workers, and encrypted backup/restore infrastructure. Those infrastructure and secret gates do not represent missing application workflows.

## Runtime verification — 2026-07-20

The safe standalone launcher was verified with disposable PostgreSQL on port `55630` and the loopback application on `6074`. The existing one-time bootstrap command persisted an environment-provisioned bcrypt administrator; NextAuth credentials login succeeded and `/api/auth/session` verified the session. The validator recorded `API_VERIFIED / startup_login_session_api` on the first attempt. Type checking, eight unit tests, the production build, two consecutive migration deploys, and all five transactional sales-workflow integration tests passed. No assigned port remained open afterward.
