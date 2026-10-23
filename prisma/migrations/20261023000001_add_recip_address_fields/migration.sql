-- Add extended recipient address fields to parcels table
ALTER TABLE "parcels" ADD COLUMN IF NOT EXISTS "recipAddress"  TEXT;
ALTER TABLE "parcels" ADD COLUMN IF NOT EXISTS "recipApt"      TEXT;
ALTER TABLE "parcels" ADD COLUMN IF NOT EXISTS "recipProvince" TEXT;
ALTER TABLE "parcels" ADD COLUMN IF NOT EXISTS "recipPostal"   TEXT;
