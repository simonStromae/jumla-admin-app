Loaded Prisma config from prisma.config.ts.

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('client', 'agent', 'admin', 'driver');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('pending', 'completed', 'failed', 'refunded');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'client',
    "status" TEXT NOT NULL DEFAULT 'active',
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifyToken" TEXT,
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
    "resetToken" TEXT,
    "resetExpiry" TIMESTAMP(3),
    "loginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedAt" TIMESTAMP(3),
    "sessionVersion" INTEGER NOT NULL DEFAULT 0,
    "permissions" JSONB NOT NULL DEFAULT '{}',
    "city" TEXT,
    "country" TEXT NOT NULL DEFAULT 'CM',
    "addresses" JSONB,
    "clientType" TEXT DEFAULT 'standard',
    "clientTypeChosen" BOOLEAN NOT NULL DEFAULT false,
    "defaultDelivery" TEXT DEFAULT 'pickup',
    "companyName" TEXT,
    "billingAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "routes" (
    "id" TEXT NOT NULL,
    "origin" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "label" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "transitDays" INTEGER NOT NULL DEFAULT 14,
    "currency" TEXT NOT NULL DEFAULT 'CAD',
    "fees" JSONB,

    CONSTRAINT "routes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "airlines" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "iata" TEXT,
    "country" TEXT,
    "logoUrl" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "airlines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaigns" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,
    "departureDate" TIMESTAMP(3),
    "arrivalDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'enr',
    "statusNotes" JSONB,
    "capacityKg" DOUBLE PRECISION,
    "exchangeRateToCAD" DOUBLE PRECISION,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),
    "financeRevenueCad" DOUBLE PRECISION,
    "financeWeightKg" DOUBLE PRECISION,

    CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_legs" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "airlineId" TEXT NOT NULL,
    "awbNumber" TEXT,
    "weightKg" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "campaign_legs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_costs" (
    "campaignId" TEXT NOT NULL,
    "fret" INTEGER NOT NULL DEFAULT 0,
    "manutention" INTEGER NOT NULL DEFAULT 0,
    "douane" INTEGER NOT NULL DEFAULT 0,
    "entrepot" INTEGER NOT NULL DEFAULT 0,
    "transport" INTEGER NOT NULL DEFAULT 0,
    "divers" INTEGER NOT NULL DEFAULT 0,
    "enteredById" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaign_costs_pkey" PRIMARY KEY ("campaignId")
);

-- CreateTable
CREATE TABLE "campaign_cost_items" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "amountXaf" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "campaign_cost_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parcels" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "trackingCode" TEXT NOT NULL,
    "description" TEXT,
    "weightKg" DOUBLE PRECISION,
    "declaredValue" DOUBLE PRECISION,
    "priceXaf" INTEGER,
    "productType" TEXT DEFAULT 'standard',
    "nbCartons" INTEGER DEFAULT 0,
    "nbPetitsSacs" INTEGER DEFAULT 0,
    "nbSacsMoyens" INTEGER DEFAULT 0,
    "nbGrandsSacs" INTEGER DEFAULT 0,
    "nbPlastiques" INTEGER DEFAULT 0,
    "nbPlastiquesBiere" INTEGER DEFAULT 0,
    "nbCasiers24x65" INTEGER DEFAULT 0,
    "nbCasiers24x33" INTEGER DEFAULT 0,
    "nbCasiers12x50" INTEGER DEFAULT 0,
    "marginPct" DOUBLE PRECISION DEFAULT 30,
    "pricingDetails" JSONB,
    "items" JSONB,
    "recipName" TEXT,
    "recipPhone" TEXT,
    "recipCity" TEXT,
    "confirmedPriceXaf" INTEGER,
    "adjustmentStatus" TEXT DEFAULT 'none',
    "delivery" TEXT DEFAULT 'pickup',
    "driverId" TEXT,
    "deliveredAt" TIMESTAMP(3),
    "deliveryProof" JSONB,
    "hasValuable" BOOLEAN NOT NULL DEFAULT false,
    "coverageFee" INTEGER,
    "waiverAccepted" BOOLEAN NOT NULL DEFAULT false,
    "forbiddenAcknowledged" BOOLEAN NOT NULL DEFAULT false,
    "disclaimerAcceptedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'enr',
    "confirmed" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),
    "cancellationReason" TEXT,
    "notifyTarget" TEXT DEFAULT 'sender',
    "notifyPhone" TEXT,
    "notifyEmail" TEXT,

    CONSTRAINT "parcels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "parcelId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "interacRef" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'payment',
    "method" TEXT NOT NULL DEFAULT 'interac',
    "reference" TEXT,
    "note" TEXT,
    "recordedById" TEXT,
    "collectedAt" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transaction_allocations" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "transaction_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tracking_events" (
    "id" TEXT NOT NULL,
    "parcelId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "location" TEXT,
    "note" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tracking_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "campaignId" TEXT,
    "body" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bordereaux" (
    "id" TEXT NOT NULL,
    "parcelId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "weightKg" DOUBLE PRECISION,
    "nbPieces" INTEGER NOT NULL DEFAULT 1,
    "items" JSONB,
    "status" TEXT NOT NULL DEFAULT 'en_attente',
    "notes" TEXT,
    "clientConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "clientConfirmedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bordereaux_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cost_posts" (
    "id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "historicalAmt" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "customAdded" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cost_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cargo_variable_costs" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "postId" INTEGER NOT NULL,
    "amountCad" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cargo_variable_costs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fixed_monthly_costs" (
    "id" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "postId" INTEGER NOT NULL,
    "amountCad" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fixed_monthly_costs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fiscal_snapshots" (
    "id" TEXT NOT NULL,
    "fiscalYear" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "payload" JSONB NOT NULL,

    CONSTRAINT "fiscal_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "whatsapp_logs" (
    "id" TEXT NOT NULL,
    "parcelId" TEXT,
    "toPhone" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "twilioSid" TEXT,
    "error" TEXT,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "whatsapp_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "parcelId" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "campaignId" TEXT,
    "amountXaf" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "notes" TEXT,
    "issuedAt" TIMESTAMP(3),
    "dueAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "campaigns_code_key" ON "campaigns"("code");

-- CreateIndex
CREATE UNIQUE INDEX "parcels_trackingCode_key" ON "parcels"("trackingCode");

-- CreateIndex
CREATE UNIQUE INDEX "payments_parcelId_key" ON "payments"("parcelId");

-- CreateIndex
CREATE UNIQUE INDEX "cargo_variable_costs_campaignId_postId_key" ON "cargo_variable_costs"("campaignId", "postId");

-- CreateIndex
CREATE UNIQUE INDEX "fixed_monthly_costs_month_postId_key" ON "fixed_monthly_costs"("month", "postId");

-- CreateIndex
CREATE UNIQUE INDEX "fiscal_snapshots_fiscalYear_key" ON "fiscal_snapshots"("fiscalYear");

-- CreateIndex
CREATE INDEX "notifications_userId_createdAt_idx" ON "notifications"("userId", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "invoices_number_key" ON "invoices"("number");

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "routes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_legs" ADD CONSTRAINT "campaign_legs_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_legs" ADD CONSTRAINT "campaign_legs_airlineId_fkey" FOREIGN KEY ("airlineId") REFERENCES "airlines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_costs" ADD CONSTRAINT "campaign_costs_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_costs" ADD CONSTRAINT "campaign_costs_enteredById_fkey" FOREIGN KEY ("enteredById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_cost_items" ADD CONSTRAINT "campaign_cost_items_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parcels" ADD CONSTRAINT "parcels_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parcels" ADD CONSTRAINT "parcels_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parcels" ADD CONSTRAINT "parcels_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_parcelId_fkey" FOREIGN KEY ("parcelId") REFERENCES "parcels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_allocations" ADD CONSTRAINT "transaction_allocations_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_allocations" ADD CONSTRAINT "transaction_allocations_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tracking_events" ADD CONSTRAINT "tracking_events_parcelId_fkey" FOREIGN KEY ("parcelId") REFERENCES "parcels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tracking_events" ADD CONSTRAINT "tracking_events_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bordereaux" ADD CONSTRAINT "bordereaux_parcelId_fkey" FOREIGN KEY ("parcelId") REFERENCES "parcels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cargo_variable_costs" ADD CONSTRAINT "cargo_variable_costs_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cargo_variable_costs" ADD CONSTRAINT "cargo_variable_costs_postId_fkey" FOREIGN KEY ("postId") REFERENCES "cost_posts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fixed_monthly_costs" ADD CONSTRAINT "fixed_monthly_costs_postId_fkey" FOREIGN KEY ("postId") REFERENCES "cost_posts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_parcelId_fkey" FOREIGN KEY ("parcelId") REFERENCES "parcels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

