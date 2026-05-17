DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'MetalType') THEN
    CREATE TYPE "MetalType" AS ENUM ('GOLD', 'SILVER');
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS "metal_prices" (
  "id" TEXT NOT NULL,
  "metal" "MetalType" NOT NULL,
  "price" DECIMAL(15,2) NOT NULL,
  "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "metal_prices_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "metal_prices_metal_recorded_at_idx" ON "metal_prices"("metal", "recorded_at");
