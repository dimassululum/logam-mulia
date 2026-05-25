-- AlterTable
ALTER TABLE "addresses" ADD COLUMN "raja_ongkir_destination_id" INTEGER;

-- CreateTable
CREATE TABLE "raja_ongkir_cache" (
    "cache_key" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "raja_ongkir_cache_pkey" PRIMARY KEY ("cache_key")
);

-- CreateIndex
CREATE INDEX "raja_ongkir_cache_expires_at_idx" ON "raja_ongkir_cache"("expires_at");
