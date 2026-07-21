# Operations runbook

## Release sequence

1. Back up PostgreSQL and verify the latest restore exercise.
2. Build the immutable image and run CI against the exact revision.
3. Run `npm run db:migrate` as a one-shot release job.
4. Deploy the application image without schema or seed flags.
5. Run `npm run integrations:work -- 100` from a separate worker/cron until the queue is drained.
6. Verify `/`, `/login`, a read-only catalog API, admin sign-in, and connector/queue metrics.

The Compose topology models migration as a separate completed service before app startup. Application startup never force-resets a schema. `prisma db push` is intentionally not a project command.

For a database previously managed by `db push`, apply the checked-in baseline and upgrade using the provider's controlled migration process. `scripts/verify-legacy-migration.sh` proves that old leads, appointments, and staff rows are retained and normalized. Test this on a restored copy before the production window.

## Required production boundaries

- PostgreSQL with encrypted connections, least-privilege application and migration roles, point-in-time recovery, and storage monitoring.
- HTTPS `NEXTAUTH_URL` and three distinct 32+ character values for `NEXTAUTH_SECRET`, `INTERNAL_API_TOKEN`, and `PRIVACY_HASH_SECRET`.
- Connector tokens in the deployment secret store. Never place token values in `IntegrationEndpoint` rows.
- A single controlled administrator bootstrap, followed by removal of `BOOTSTRAP_ADMIN_*` from the job environment.
- At least one continuously scheduled integration worker. Running multiple workers is safe because claims are conditional and stale locks expire.

Production environment validation rejects non-PostgreSQL databases, insecure public URLs, missing/weak secrets, and reused secret values.

## Backup and restore

Example logical backup:

```bash
pg_dump --format=custom --no-owner --file=cabinet-shop.dump "$DATABASE_URL"
pg_restore --list cabinet-shop.dump > cabinet-shop.contents
```

Restore to a new database, never over the active one:

```bash
createdb cabinet_shop_restore_test
pg_restore --no-owner --dbname=postgresql://USER@HOST/cabinet_shop_restore_test cabinet-shop.dump
DATABASE_URL=postgresql://USER@HOST/cabinet_shop_restore_test npx prisma migrate status
```

Verify counts and representative relations for `QuoteRequest`, `Contact`, `ConsentRecord`, `SuppressionEntry`, `Consultation`, `IntegrationEvent`, and `AuditEvent`. Exercise restore at least quarterly and record recovery time/point results. Protect the backup because it contains customer data; expire it under the approved retention policy.

## Queue and connector response

Monitor counts grouped by `IntegrationEvent.status`, oldest `availableAt`, terminal failures, consultation `handoffState`, and approved outreach older than the delivery SLO. Retries are bounded to six attempts with exponential delay and a 10-second network timeout. A terminal `failed` row requires operator diagnosis; do not edit its payload. Correct configuration/provider state, create a new idempotency key through an audited repair tool or controlled SQL change, and retain the failed event.

For suspected duplicate sync, inspect `IntegrationLink` before changing either system. Do not delete mapping rows while the connector is active.

## Consent, outreach, and privacy operations

- Never turn a service inquiry into marketing consent. EU/UK marketing requires `explicit_consent`.
- An outreach author cannot review the same message. Approval queues the message; the worker rechecks consent and suppression before including the recipient address.
- Process privacy requests from `/admin/operations`. Verify identity out of band before disclosure, correction, or deletion. Preserve required financial/audit data and document the lawful exception.
- Treat overdue `PrivacyRequest.dueAt` rows as incidents. California requests default to 45 days; EU/UK and other configured regions default to 30 days.
- Suppression rows contain hashes and should normally be retained even after other personal data is deleted, so the opt-out cannot be forgotten.

## AI controls

AI is optional and disabled without `OPENROUTER_API_KEY`. Budget and availability alerts should cover request count, latency, error rate, and provider spend. User history is bounded; tool-returned records are treated as untrusted; privileged catalog/customer operations are absent from guest tool definitions; confirmations are signed and requester-bound. AI text is a draft and must never be treated as pricing, contractual advice, approved outreach, or a database mutation unless the validated tool and human confirmation path completes.

## Incident response

1. Disable the affected connector or AI key and stop its worker.
2. Rotate provider tokens and any potentially exposed internal/auth/hash secret through the secret manager.
3. Invalidate sessions after auth-secret rotation and review `AuditEvent`, `IntegrationEvent`, `AiResult`, provider logs, and deployment access logs.
4. Add suppression records before any further outreach if consent integrity is uncertain.
5. Preserve evidence, assess notification obligations by region, and document scope/remediation.

Full four-commit history and current source are scanned by Gitleaks in CI. The repository tracks only `.env.example`; local `.env*` files remain ignored. A clean scan is not permission to skip rotation when a real credential may have been copied elsewhere.

