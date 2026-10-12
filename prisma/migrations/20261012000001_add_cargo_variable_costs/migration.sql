-- Crée la table cargo_variable_costs si elle n'existe pas encore en production.
-- La baseline 20261011000000_init la définit dans le schéma, mais la commande
-- "migrate resolve --applied" ne l'exécute pas sur les bases existantes.

CREATE TABLE IF NOT EXISTS "cargo_variable_costs" (
    "id"         TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "postId"     INTEGER NOT NULL,
    "amountCad"  DOUBLE PRECISION NOT NULL,
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"  TIMESTAMP(3) NOT NULL,
    CONSTRAINT "cargo_variable_costs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "cargo_variable_costs_campaignId_postId_key"
    ON "cargo_variable_costs"("campaignId", "postId");

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'cargo_variable_costs_campaignId_fkey'
    ) THEN
        ALTER TABLE "cargo_variable_costs"
            ADD CONSTRAINT "cargo_variable_costs_campaignId_fkey"
            FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'cargo_variable_costs_postId_fkey'
    ) THEN
        ALTER TABLE "cargo_variable_costs"
            ADD CONSTRAINT "cargo_variable_costs_postId_fkey"
            FOREIGN KEY ("postId") REFERENCES "cost_posts"("id")
            ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;
