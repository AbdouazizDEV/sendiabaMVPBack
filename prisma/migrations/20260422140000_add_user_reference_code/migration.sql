-- Public reference for users (e.g. USR-4012)
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "referenceCode" TEXT;

WITH ordered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY "createdAt" ASC) AS rn
  FROM "users"
)
UPDATE "users" AS u
SET "referenceCode" = 'USR-' || (4000 + o.rn)::text
FROM ordered AS o
WHERE u.id = o.id AND u."referenceCode" IS NULL;

ALTER TABLE "users" ALTER COLUMN "referenceCode" SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "users_referenceCode_key" ON "users"("referenceCode");
