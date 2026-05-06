-- CreateTable
CREATE TABLE "homepage_featured_artisans" (
    "id" TEXT NOT NULL,
    "artisanId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "homepage_featured_artisans_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "homepage_featured_artisans_artisanId_key" ON "homepage_featured_artisans"("artisanId");

-- CreateIndex
CREATE INDEX "homepage_featured_artisans_sortOrder_idx" ON "homepage_featured_artisans"("sortOrder");

-- AddForeignKey
ALTER TABLE "homepage_featured_artisans" ADD CONSTRAINT "homepage_featured_artisans_artisanId_fkey" FOREIGN KEY ("artisanId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
