CREATE TABLE IF NOT EXISTS "payment_sessions" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "reference" TEXT NOT NULL,
  "paymentUrl" TEXT,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "amount" DOUBLE PRECISION NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'XOF',
  "checkoutPayload" JSONB NOT NULL,
  "providerPayload" JSONB,
  "orderId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "payment_sessions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "payment_sessions_reference_key"
  ON "payment_sessions"("reference");
CREATE INDEX IF NOT EXISTS "payment_sessions_userId_createdAt_idx"
  ON "payment_sessions"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "payment_sessions_status_createdAt_idx"
  ON "payment_sessions"("status", "createdAt");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'payment_sessions_userId_fkey'
  ) THEN
    ALTER TABLE "payment_sessions"
      ADD CONSTRAINT "payment_sessions_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "users"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "profile_favorite_artisans" (
  "profileId" TEXT NOT NULL,
  "artisanId" TEXT NOT NULL,
  "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "profile_favorite_artisans_pkey" PRIMARY KEY ("profileId","artisanId")
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profile_favorite_artisans_profileId_fkey'
  ) THEN
    ALTER TABLE "profile_favorite_artisans"
      ADD CONSTRAINT "profile_favorite_artisans_profileId_fkey"
      FOREIGN KEY ("profileId") REFERENCES "profiles"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profile_favorite_artisans_artisanId_fkey'
  ) THEN
    ALTER TABLE "profile_favorite_artisans"
      ADD CONSTRAINT "profile_favorite_artisans_artisanId_fkey"
      FOREIGN KEY ("artisanId") REFERENCES "users"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "admin_notifications" (
  "id" TEXT NOT NULL,
  "adminId" TEXT NOT NULL,
  "orderId" TEXT,
  "type" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "payload" JSONB,
  "readAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "admin_notifications_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "admin_notifications_adminId_createdAt_idx"
  ON "admin_notifications"("adminId", "createdAt");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'admin_notifications_adminId_fkey'
  ) THEN
    ALTER TABLE "admin_notifications"
      ADD CONSTRAINT "admin_notifications_adminId_fkey"
      FOREIGN KEY ("adminId") REFERENCES "users"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

