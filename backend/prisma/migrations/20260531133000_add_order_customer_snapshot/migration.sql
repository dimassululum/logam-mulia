ALTER TABLE "orders"
  ADD COLUMN IF NOT EXISTS "customer_name" TEXT,
  ADD COLUMN IF NOT EXISTS "customer_email" TEXT,
  ADD COLUMN IF NOT EXISTS "customer_phone" TEXT;

UPDATE "orders"
SET
  "customer_name" = COALESCE("customer_name", "users"."name"),
  "customer_email" = COALESCE("customer_email", "users"."email"),
  "customer_phone" = COALESCE("customer_phone", "users"."phone")
FROM "users"
WHERE "orders"."user_id" = "users"."id";

CREATE INDEX IF NOT EXISTS "orders_customer_phone_idx" ON "orders"("customer_phone");
CREATE INDEX IF NOT EXISTS "orders_customer_email_idx" ON "orders"("customer_email");
