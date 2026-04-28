-- Photo de profil pour comptes utilisateurs (ex. artisans promus via User)
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "avatarUrl" TEXT;
