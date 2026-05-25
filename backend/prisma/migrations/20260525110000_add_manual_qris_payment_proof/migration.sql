ALTER TABLE "orders"
ADD COLUMN "payment_method" TEXT NOT NULL DEFAULT 'QRIS Manual',
ADD COLUMN "payment_proof_url" TEXT,
ADD COLUMN "payment_proof_uploaded_at" TIMESTAMP(3);
