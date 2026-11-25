-- CreateTable (idempotent)
CREATE TABLE IF NOT EXISTS "partner_contacts" (
    "id"        TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "name"      TEXT NOT NULL,
    "phone"     TEXT,
    "city"      TEXT,
    "address"   TEXT,
    "notes"     TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "partner_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex (idempotent)
CREATE INDEX IF NOT EXISTS "partner_contacts_partnerId_idx" ON "partner_contacts"("partnerId");

-- AddForeignKey (idempotent)
DO $$ BEGIN
  ALTER TABLE "partner_contacts"
    ADD CONSTRAINT "partner_contacts_partnerId_fkey"
    FOREIGN KEY ("partnerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
