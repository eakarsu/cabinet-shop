# Heritage Cabinet & Stone

Production-oriented sales and customer-operations application for a cabinet and stone fabricator. It combines the public catalog and customer portal with a governed lead lifecycle, appointment scheduling, consent/suppression controls, independently reviewed outreach, conversion metrics, and durable CRM/email/calendar/enrichment synchronization.

## What is implemented

- Public materials, gallery, services, quote, consultation, account, and privacy experiences.
- Deduplicated contacts shared by quotes, consultations, CRM, calendar, email, and enrichment.
- Explicit lead states: `new → qualified → assigned → contacted → consultation_scheduled → proposal → approval_pending → won/lost`.
- Optimistic versions, required ownership, required loss reasons, independent proposal approval, handoff state, first/last-touch attribution, and immutable audit events.
- Service-specific consent evidence, hashed global suppression, EU/UK explicit-consent rules for marketing, privacy-request deadlines, and a final permission check immediately before outreach.
- Human-reviewed outreach: AI can draft text, but cannot approve or send it. The author and reviewer must be different people.
- Signed, short-lived AI confirmation payloads; bounded history/tool output; persistent rate limits; no customer prompt or output bodies in AI audit logs.
- Bidirectional connector inbox/outbox with HMAC-authenticated webhooks, idempotency keys, stable external links, timeouts, exponential retry, and terminal failure state.
- PostgreSQL migrations that work from empty and preserve/backfill records from the former `prisma db push` schema.
- Next.js 16, React 19, Prisma 6, Node 22, strict TypeScript, CI, Docker, and separate migration/application startup.

## Local setup

Prerequisites: Node 22 and PostgreSQL 17.

```bash
cp .env.example .env
# Configure DATABASE_URL and generate three different secrets:
# openssl rand -base64 48
npm ci
npm run db:migrate
npm run db:seed                 # optional, non-destructive catalog/reference data
BOOTSTRAP_ADMIN_EMAIL=you@example.com \
BOOTSTRAP_ADMIN_NAME="Operator" \
BOOTSTRAP_ADMIN_PASSWORD='a unique 12-72 character password' \
npm run admin:bootstrap
./start.sh
```

`start.sh` does not install packages, create/reset databases, kill processes, migrate, seed, or build. Opt into a checked-in migration or reference seed with `RUN_MIGRATIONS=1` or `RUN_SEED=1`. Administrator bootstrap never overwrites or promotes an existing account.

## Sales controls

The staff UI at `/admin/quotes` exposes ownership, lifecycle transitions, loss reasons, proposal approval, and AI-assisted draft creation. `/admin/operations` shows conversion, suppression, sync failures, privacy deadlines, connector health, and the independent outreach review queue.

Public lead-list and appointment-list APIs are closed. Customers can retrieve only records matching their authenticated email. Quote deletion is disabled so consent, attribution, and audit history remain intact; leads close as `lost`. Customers may only reschedule an active appointment or transition it to `cancelled`.

## Consent and privacy

Submitting a quote records the narrow `sales_follow_up` basis needed to answer that requested project; it does not grant marketing consent. `/privacy` supports immediate email/SMS/phone opt-out plus access, correction, and deletion requests. Identifiers in suppression and privacy-request records are HMAC hashes. A suppression match always wins, including after approval but before connector delivery.

## Integrations

The optional seed creates disabled endpoint definitions for:

- `primary-crm` (`CRM_SYNC_URL`, `CRM_SYNC_TOKEN`)
- `transactional-email` (`EMAIL_SYNC_URL`, `EMAIL_SYNC_TOKEN`)
- `design-calendar` (`CALENDAR_SYNC_URL`, `CALENDAR_SYNC_TOKEN`)
- `contact-enrichment` (`ENRICHMENT_SYNC_URL`, `ENRICHMENT_SYNC_TOKEN`)

Credentials are never stored in PostgreSQL; `IntegrationEndpoint.secretEnvKey` stores only an environment-variable name. Outbound delivery is run separately:

```bash
npm run integrations:work -- 100
```

Inbound providers post to `/api/integrations/webhooks/:provider` with `X-Heritage-Timestamp` (Unix seconds) and `X-Heritage-Signature`, the hex HMAC-SHA256 of `<timestamp>.<raw-body>`. Supported inbound events are `quote.upsert`, `consultation.upsert`, and `suppression.upsert`. Replayed external IDs are idempotent.

## Validation

```bash
npm run db:validate
npm run lint
npm run typecheck
npm run test:unit
npm run test:integration          # DATABASE_URL must name a test database
npm run test:e2e                  # DATABASE_URL must name a test database
npm run build
npm run security:audit
gitleaks detect --source . --no-banner --redact
```

CI repeats fresh and legacy migration checks, unit/integration/browser tests, lint, type checking, production build, dependency/secret scans, and the container build. See [OPERATIONS.md](./OPERATIONS.md) for release, backup, worker, incident, and privacy procedures.
