-- Public reference for catalog / profile favorites (e.g. PRD-12 -> p12)
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "referenceCode" TEXT;

WITH ordered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY "createdAt" ASC) AS rn
  FROM "products"
)
UPDATE "products" AS p
SET "referenceCode" = 'PRD-' || o.rn::text
FROM ordered AS o
WHERE p.id = o.id AND p."referenceCode" IS NULL;

ALTER TABLE "products" ALTER COLUMN "referenceCode" SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "products_referenceCode_key" ON "products"("referenceCode");
