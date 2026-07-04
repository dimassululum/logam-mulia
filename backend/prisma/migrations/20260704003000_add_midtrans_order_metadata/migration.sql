ALTER TABLE "orders"
  ADD COLUMN "midtrans_payment_type" TEXT,
  ADD COLUMN "midtrans_transaction_status" TEXT,
  ADD COLUMN "midtrans_fraud_status" TEXT,
  ADD COLUMN "midtrans_expiry_time" TIMESTAMP(3),
  ADD COLUMN "midtrans_raw_response" JSONB;

CREATE INDEX "orders_midtrans_transaction_status_idx" ON "orders"("midtrans_transaction_status");
