-- Add partner pricing fields to users (idempotent)
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "partnerRatePerKg" DOUBLE PRECISION;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "partnerMarginXaf" INTEGER;
