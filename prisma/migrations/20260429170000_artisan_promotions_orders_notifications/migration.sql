-- Artisan features: promotions, stock, order tracking, notifications.

ALTER TABLE "products"
  ADD COLUMN IF NOT EXISTS "stockQuantity" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "promotionActive" BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS "promotionPercent" INTEGER,
  ADD COLUMN IF NOT EXISTS "promotionReason" TEXT,
  ADD COLUMN IF NOT EXISTS "promotionStartedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "promotionEndedAt" TIMESTAMP(3);

CREATE TABLE IF NOT EXISTS "order_status_events" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "status" "OrderStatus" NOT NULL,
  "note" TEXT,
  "changedById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "order_status_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "order_status_events_orderId_createdAt_idx"
  ON "order_status_events"("orderId", "createdAt");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'order_status_events_orderId_fkey'
  ) THEN
    ALTER TABLE "order_status_events"
      ADD CONSTRAINT "order_status_events_orderId_fkey"
      FOREIGN KEY ("orderId") REFERENCES "orders"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

INSERT INTO "order_status_events" ("id", "orderId", "status", "note", "changedById", "createdAt")
SELECT
  CONCAT('ose_', o."id"),
  o."id",
  o."status",
  'Etat initial',
  NULL,
  o."createdAt"
FROM "orders" o
WHERE NOT EXISTS (
  SELECT 1 FROM "order_status_events" e WHERE e."orderId" = o."id"
);

CREATE TABLE IF NOT EXISTS "artisan_notifications" (
  "id" TEXT NOT NULL,
  "artisanId" TEXT NOT NULL,
  "orderId" TEXT,
  "type" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "payload" JSONB,
  "readAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "artisan_notifications_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "artisan_notifications_artisanId_createdAt_idx"
  ON "artisan_notifications"("artisanId", "createdAt");

CREATE INDEX IF NOT EXISTS "artisan_notifications_artisanId_readAt_idx"
  ON "artisan_notifications"("artisanId", "readAt");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'artisan_notifications_artisanId_fkey'
  ) THEN
    ALTER TABLE "artisan_notifications"
      ADD CONSTRAINT "artisan_notifications_artisanId_fkey"
      FOREIGN KEY ("artisanId") REFERENCES "users"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
