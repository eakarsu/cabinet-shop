ALTER TABLE "AiResult" ADD COLUMN IF NOT EXISTS "userId" TEXT;
ALTER TABLE "AiResult" ADD COLUMN IF NOT EXISTS "providerReceipt" TEXT;
ALTER TABLE "AiResult" ADD COLUMN IF NOT EXISTS "result" TEXT;
CREATE INDEX IF NOT EXISTS "AiResult_userId_createdAt_idx" ON "AiResult"("userId", "createdAt" DESC);
