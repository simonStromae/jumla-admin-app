-- CreateTable
CREATE TABLE IF NOT EXISTS "error_logs" (
    "id" TEXT NOT NULL,
    "route" TEXT NOT NULL,
    "method" TEXT NOT NULL DEFAULT 'GET',
    "status" INTEGER NOT NULL DEFAULT 500,
    "message" TEXT NOT NULL,
    "stack" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "error_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "error_logs_createdAt_idx" ON "error_logs"("createdAt" DESC);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "error_logs_route_idx" ON "error_logs"("route");
