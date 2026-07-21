BEGIN;

-- AlterTable
ALTER TABLE "QuoteRequest" ADD COLUMN     "approvalState" TEXT NOT NULL DEFAULT 'not_required',
ADD COLUMN     "campaign" TEXT,
ADD COLUMN     "closedAt" TIMESTAMP(3),
ADD COLUMN     "consentBasis" TEXT NOT NULL DEFAULT 'inquiry',
ADD COLUMN     "contactId" TEXT,
ADD COLUMN     "dedupeKey" TEXT,
ADD COLUMN     "firstTouchSource" TEXT NOT NULL DEFAULT 'website',
ADD COLUMN     "handoffState" TEXT NOT NULL DEFAULT 'pending',
ADD COLUMN     "lastTouchSource" TEXT NOT NULL DEFAULT 'website',
ADD COLUMN     "lostReason" TEXT,
ADD COLUMN     "nextActionAt" TIMESTAMP(3),
ADD COLUMN     "normalizedEmail" TEXT,
ADD COLUMN     "normalizedPhone" TEXT,
ADD COLUMN     "ownerId" TEXT,
ADD COLUMN     "region" TEXT NOT NULL DEFAULT 'US',
ADD COLUMN     "updatedAt" TIMESTAMP(3),
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Consultation" ADD COLUMN     "calendarEventId" TEXT,
ADD COLUMN     "contactId" TEXT,
ADD COLUMN     "dedupeKey" TEXT,
ADD COLUMN     "handoffState" TEXT NOT NULL DEFAULT 'pending',
ADD COLUMN     "nextRetryAt" TIMESTAMP(3),
ADD COLUMN     "ownerId" TEXT,
ADD COLUMN     "retryCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "updatedAt" TIMESTAMP(3),
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "failedLoginCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lockedUntil" TIMESTAMP(3),
ADD COLUMN     "updatedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "Contact" (
    "id" TEXT NOT NULL,
    "identityKey" TEXT NOT NULL,
    "normalizedEmail" TEXT,
    "normalizedPhone" TEXT,
    "name" TEXT NOT NULL,
    "region" TEXT NOT NULL DEFAULT 'US',
    "marketingStatus" TEXT NOT NULL DEFAULT 'unknown',
    "enrichedAt" TIMESTAMP(3),
    "enrichmentData" JSONB,
    "accountId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "domain" TEXT,
    "status" TEXT NOT NULL DEFAULT 'prospect',
    "version" INTEGER NOT NULL DEFAULT 0,
    "ownerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttributionTouch" (
    "id" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "contactId" TEXT,
    "source" TEXT NOT NULL,
    "medium" TEXT,
    "campaign" TEXT,
    "landingUrl" TEXT,
    "referrer" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AttributionTouch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsentRecord" (
    "id" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "lawfulBasis" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "evidence" JSONB,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "ConsentRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SuppressionEntry" (
    "id" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "valueHash" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "region" TEXT NOT NULL DEFAULT 'US',
    "source" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SuppressionEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutreachMessage" (
    "id" TEXT NOT NULL,
    "quoteId" TEXT,
    "contactId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "recipientHash" TEXT NOT NULL,
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdById" TEXT NOT NULL,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "scheduledAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OutreachMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntegrationEndpoint" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "direction" TEXT NOT NULL DEFAULT 'bidirectional',
    "baseUrl" TEXT,
    "secretEnvKey" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "rateLimitPerMinute" INTEGER NOT NULL DEFAULT 30,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntegrationEndpoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntegrationEvent" (
    "id" TEXT NOT NULL,
    "endpointId" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "externalId" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "availableAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lockedAt" TIMESTAMP(3),
    "processedAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntegrationEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntegrationLink" (
    "id" TEXT NOT NULL,
    "endpointId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "localId" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntegrationLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrivacyRequest" (
    "id" TEXT NOT NULL,
    "contactId" TEXT,
    "requestType" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'received',
    "requesterHash" TEXT NOT NULL,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "verifiedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrivacyRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RateLimitBucket" (
    "id" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "subjectHash" TEXT NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RateLimitBucket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

-- Preserve and normalize records created by the former db-push schema. Legacy
-- inquiry consent is deliberately not inferred; outreach remains blocked until
-- verified consent exists.
UPDATE "QuoteRequest"
SET "normalizedEmail" = lower(trim("email")),
    "normalizedPhone" = '+' || regexp_replace("phone", '[^0-9]', '', 'g'),
    "dedupeKey" = 'legacy-quote:' || "id",
    "updatedAt" = "createdAt",
    "status" = CASE WHEN "status" = 'scheduled' THEN 'consultation_scheduled' ELSE "status" END;

UPDATE "Consultation"
SET "dedupeKey" = 'legacy-consultation:' || "id",
    "updatedAt" = "createdAt";

UPDATE "User" SET "updatedAt" = "createdAt";

WITH identities AS (
    SELECT lower(trim("email")) AS email,
           '+' || regexp_replace("phone", '[^0-9]', '', 'g') AS phone,
           "name",
           "createdAt"
    FROM "QuoteRequest"
    UNION ALL
    SELECT nullif(lower(trim("email")), '') AS email,
           '+' || regexp_replace("phone", '[^0-9]', '', 'g') AS phone,
           "name",
           "createdAt"
    FROM "Consultation"
), ranked AS (
    SELECT DISTINCT ON (coalesce(email, '') || '|' || phone)
           email, phone, "name", "createdAt",
           coalesce(email, '') || '|' || phone AS identity
    FROM identities
    ORDER BY coalesce(email, '') || '|' || phone, "createdAt"
)
INSERT INTO "Contact" ("id", "identityKey", "normalizedEmail", "normalizedPhone", "name", "region", "marketingStatus", "createdAt", "updatedAt")
SELECT 'legacy_' || md5(identity), 'legacy:' || md5(identity), email, phone, "name", 'US', 'unknown', "createdAt", CURRENT_TIMESTAMP
FROM ranked;

UPDATE "QuoteRequest" q
SET "contactId" = 'legacy_' || md5(q."normalizedEmail" || '|' || q."normalizedPhone");

UPDATE "Consultation" c
SET "contactId" = 'legacy_' || md5(coalesce(nullif(lower(trim(c."email")), ''), '') || '|' || ('+' || regexp_replace(c."phone", '[^0-9]', '', 'g')));

ALTER TABLE "QuoteRequest"
    ALTER COLUMN "dedupeKey" SET NOT NULL,
    ALTER COLUMN "normalizedEmail" SET NOT NULL,
    ALTER COLUMN "normalizedPhone" SET NOT NULL,
    ALTER COLUMN "updatedAt" SET NOT NULL;

ALTER TABLE "Consultation"
    ALTER COLUMN "dedupeKey" SET NOT NULL,
    ALTER COLUMN "updatedAt" SET NOT NULL;

ALTER TABLE "User" ALTER COLUMN "updatedAt" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Contact_identityKey_key" ON "Contact"("identityKey");

-- CreateIndex
CREATE INDEX "Contact_normalizedEmail_idx" ON "Contact"("normalizedEmail");

-- CreateIndex
CREATE INDEX "Contact_normalizedPhone_idx" ON "Contact"("normalizedPhone");

-- CreateIndex
CREATE INDEX "Contact_accountId_idx" ON "Contact"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_domain_key" ON "Account"("domain");

-- CreateIndex
CREATE INDEX "Account_ownerId_status_idx" ON "Account"("ownerId", "status");

-- CreateIndex
CREATE INDEX "AttributionTouch_quoteId_occurredAt_idx" ON "AttributionTouch"("quoteId", "occurredAt");

-- CreateIndex
CREATE INDEX "ConsentRecord_status_expiresAt_idx" ON "ConsentRecord"("status", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "ConsentRecord_contactId_channel_purpose_key" ON "ConsentRecord"("contactId", "channel", "purpose");

-- CreateIndex
CREATE INDEX "SuppressionEntry_active_channel_idx" ON "SuppressionEntry"("active", "channel");

-- CreateIndex
CREATE UNIQUE INDEX "SuppressionEntry_channel_valueHash_key" ON "SuppressionEntry"("channel", "valueHash");

-- CreateIndex
CREATE INDEX "OutreachMessage_status_scheduledAt_idx" ON "OutreachMessage"("status", "scheduledAt");

-- CreateIndex
CREATE INDEX "OutreachMessage_quoteId_idx" ON "OutreachMessage"("quoteId");

-- CreateIndex
CREATE UNIQUE INDEX "IntegrationEndpoint_name_key" ON "IntegrationEndpoint"("name");

-- CreateIndex
CREATE INDEX "IntegrationEndpoint_provider_category_idx" ON "IntegrationEndpoint"("provider", "category");

-- CreateIndex
CREATE UNIQUE INDEX "IntegrationEvent_idempotencyKey_key" ON "IntegrationEvent"("idempotencyKey");

-- CreateIndex
CREATE INDEX "IntegrationEvent_status_availableAt_idx" ON "IntegrationEvent"("status", "availableAt");

-- CreateIndex
CREATE INDEX "IntegrationEvent_endpointId_externalId_idx" ON "IntegrationEvent"("endpointId", "externalId");

-- CreateIndex
CREATE UNIQUE INDEX "IntegrationLink_endpointId_entityType_localId_key" ON "IntegrationLink"("endpointId", "entityType", "localId");

-- CreateIndex
CREATE UNIQUE INDEX "IntegrationLink_endpointId_entityType_externalId_key" ON "IntegrationLink"("endpointId", "entityType", "externalId");

-- CreateIndex
CREATE INDEX "PrivacyRequest_status_dueAt_idx" ON "PrivacyRequest"("status", "dueAt");

-- CreateIndex
CREATE INDEX "RateLimitBucket_expiresAt_idx" ON "RateLimitBucket"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "RateLimitBucket_scope_subjectHash_windowStart_key" ON "RateLimitBucket"("scope", "subjectHash", "windowStart");

-- CreateIndex
CREATE INDEX "AuditEvent_entityType_entityId_createdAt_idx" ON "AuditEvent"("entityType", "entityId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "QuoteRequest_dedupeKey_key" ON "QuoteRequest"("dedupeKey");

-- CreateIndex
CREATE INDEX "QuoteRequest_status_createdAt_idx" ON "QuoteRequest"("status", "createdAt");

-- CreateIndex
CREATE INDEX "QuoteRequest_ownerId_status_idx" ON "QuoteRequest"("ownerId", "status");

-- CreateIndex
CREATE INDEX "QuoteRequest_contactId_idx" ON "QuoteRequest"("contactId");

-- CreateIndex
CREATE UNIQUE INDEX "Consultation_dedupeKey_key" ON "Consultation"("dedupeKey");

-- CreateIndex
CREATE INDEX "Consultation_date_status_idx" ON "Consultation"("date", "status");

-- CreateIndex
CREATE INDEX "Consultation_ownerId_status_idx" ON "Consultation"("ownerId", "status");

-- CreateIndex
CREATE INDEX "Consultation_contactId_idx" ON "Consultation"("contactId");

-- AddForeignKey
ALTER TABLE "QuoteRequest" ADD CONSTRAINT "QuoteRequest_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteRequest" ADD CONSTRAINT "QuoteRequest_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consultation" ADD CONSTRAINT "Consultation_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consultation" ADD CONSTRAINT "Consultation_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttributionTouch" ADD CONSTRAINT "AttributionTouch_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "QuoteRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttributionTouch" ADD CONSTRAINT "AttributionTouch_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsentRecord" ADD CONSTRAINT "ConsentRecord_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutreachMessage" ADD CONSTRAINT "OutreachMessage_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "QuoteRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutreachMessage" ADD CONSTRAINT "OutreachMessage_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutreachMessage" ADD CONSTRAINT "OutreachMessage_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutreachMessage" ADD CONSTRAINT "OutreachMessage_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationEvent" ADD CONSTRAINT "IntegrationEvent_endpointId_fkey" FOREIGN KEY ("endpointId") REFERENCES "IntegrationEndpoint"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationLink" ADD CONSTRAINT "IntegrationLink_endpointId_fkey" FOREIGN KEY ("endpointId") REFERENCES "IntegrationEndpoint"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrivacyRequest" ADD CONSTRAINT "PrivacyRequest_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

COMMIT;
