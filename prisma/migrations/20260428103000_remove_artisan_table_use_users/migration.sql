-- Move artisan data to users/profile and remove artisans table.

-- 1) Add artisan profile fields on profiles.
ALTER TABLE "profiles"
  ADD COLUMN IF NOT EXISTS "craft" TEXT,
  ADD COLUMN IF NOT EXISTS "bio" TEXT,
  ADD COLUMN IF NOT EXISTS "quote" TEXT,
  ADD COLUMN IF NOT EXISTS "heritage" TEXT,
  ADD COLUMN IF NOT EXISTS "speciality" TEXT,
  ADD COLUMN IF NOT EXISTS "yearsExperience" INTEGER;

-- 2..5) Data migration only if legacy table exists.
DO $$
BEGIN
  IF to_regclass('public.artisans') IS NOT NULL THEN
    -- 2) Ensure one user per artisan (reuse email if it already exists).
    UPDATE "users" u
    SET
      "role" = 'ARTISAN',
      "displayName" = a."fullName",
      "status" = CASE
        WHEN a."status" = 'SUSPENDED' THEN 'SUSPENDED'::"UserStatus"
        WHEN a."status" = 'PENDING' THEN 'PENDING'::"UserStatus"
        ELSE 'ACTIVE'::"UserStatus"
      END
    FROM "artisans" a
    WHERE lower(u."email") = lower(a."email");

    INSERT INTO "users" (
      "id",
      "referenceCode",
      "email",
      "password",
      "displayName",
      "role",
      "status",
      "createdAt",
      "updatedAt"
    )
    SELECT
      CONCAT('art_user_', a."id"),
      a."referenceCode",
      a."email",
      COALESCE((SELECT "password" FROM "users" ORDER BY "createdAt" ASC LIMIT 1), '$2b$10$7EqJtq98hPqEX7fNZaFWoO5A4nPLqvGjYH6G6D/adJzi10BGSAdoo'),
      a."fullName",
      'ARTISAN'::"UserRole",
      CASE
        WHEN a."status" = 'SUSPENDED' THEN 'SUSPENDED'::"UserStatus"
        WHEN a."status" = 'PENDING' THEN 'PENDING'::"UserStatus"
        ELSE 'ACTIVE'::"UserStatus"
      END,
      a."createdAt",
      NOW()
    FROM "artisans" a
    WHERE NOT EXISTS (
      SELECT 1 FROM "users" u WHERE lower(u."email") = lower(a."email")
    );

    -- 3) Upsert profile data from artisans.
    INSERT INTO "profiles" (
      "id",
      "userId",
      "phone",
      "city",
      "avatarUrl",
      "craft",
      "bio",
      "quote",
      "heritage",
      "speciality",
      "yearsExperience",
      "updatedAt"
    )
    SELECT
      CONCAT('prof_art_', a."id"),
      u."id",
      a."phone",
      a."city",
      a."photoUrl",
      a."craft",
      a."bio",
      a."quote",
      a."heritage",
      a."speciality",
      a."yearsExperience",
      NOW()
    FROM "artisans" a
    JOIN "users" u ON lower(u."email") = lower(a."email")
    ON CONFLICT ("userId") DO UPDATE
    SET
      "phone" = EXCLUDED."phone",
      "city" = EXCLUDED."city",
      "avatarUrl" = EXCLUDED."avatarUrl",
      "craft" = EXCLUDED."craft",
      "bio" = EXCLUDED."bio",
      "quote" = EXCLUDED."quote",
      "heritage" = EXCLUDED."heritage",
      "speciality" = EXCLUDED."speciality",
      "yearsExperience" = EXCLUDED."yearsExperience",
      "updatedAt" = NOW();

    -- 4) Repoint product.artisanId from artisans.id to users.id.
    UPDATE "products" p
    SET "artisanId" = u."id"
    FROM "artisans" a
    JOIN "users" u ON lower(u."email") = lower(a."email")
    WHERE p."artisanId" = a."id";

    -- 5) Repoint profiles.favoriteArtisanId from artisans.id to users.id.
    UPDATE "profiles" pr
    SET "favoriteArtisanId" = u."id"
    FROM "artisans" a
    JOIN "users" u ON lower(u."email") = lower(a."email")
    WHERE pr."favoriteArtisanId" = a."id";
  END IF;
END $$;

-- 6) Drop old FKs and recreate FKs to users.
ALTER TABLE "products" DROP CONSTRAINT IF EXISTS "products_artisanId_fkey";
ALTER TABLE "profiles" DROP CONSTRAINT IF EXISTS "profiles_favoriteArtisanId_fkey";

ALTER TABLE "products"
  ADD CONSTRAINT "products_artisanId_fkey"
  FOREIGN KEY ("artisanId") REFERENCES "users"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "profiles"
  ADD CONSTRAINT "profiles_favoriteArtisanId_fkey"
  FOREIGN KEY ("favoriteArtisanId") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- 7) Remove legacy artisan table and enum.
DROP TABLE IF EXISTS "artisans";
DROP TYPE IF EXISTS "ArtisanStatus";
