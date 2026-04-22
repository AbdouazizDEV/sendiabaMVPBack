-- AlterTable: add public reference for artisans (e.g. ART-3021)
ALTER TABLE "artisans" ADD COLUMN IF NOT EXISTS "referenceCode" TEXT;

-- Backfill existing rows (stable order by creation time)
WITH ordered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY "createdAt" ASC) AS rn
  FROM "artisans"
)
UPDATE "artisans" AS a
SET "referenceCode" = 'ART-' || (3016 + o.rn)::text
FROM ordered AS o
WHERE a.id = o.id AND a."referenceCode" IS NULL;

ALTER TABLE "artisans" ALTER COLUMN "referenceCode" SET NOT NULL;

CREATE UNIQUE INDEX "artisans_referenceCode_key" ON "artisans"("referenceCode");
