CREATE TYPE "PaymentMethodCategory" AS ENUM ('QRIS', 'BANK_TRANSFER', 'VIRTUAL_ACCOUNT');

CREATE TYPE "PaymentMethodStatus" AS ENUM ('READY', 'COMING_SOON');

CREATE TABLE "payment_methods" (
  "code" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "description" TEXT,
  "category" "PaymentMethodCategory" NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT false,
  "is_locked" BOOLEAN NOT NULL DEFAULT false,
  "status" "PaymentMethodStatus" NOT NULL DEFAULT 'READY',
  "config" JSONB NOT NULL DEFAULT '{}',
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "payment_methods_pkey" PRIMARY KEY ("code")
);

CREATE INDEX "payment_methods_is_active_status_idx" ON "payment_methods"("is_active", "status");
CREATE INDEX "payment_methods_sort_order_idx" ON "payment_methods"("sort_order");

ALTER TABLE "orders"
ADD COLUMN "payment_method_code" TEXT;

UPDATE "orders"
SET "payment_method_code" = 'qris_manual'
WHERE "payment_method" = 'QRIS Manual';

INSERT INTO "payment_methods" ("code", "label", "description", "category", "is_active", "is_locked", "status", "config", "sort_order")
VALUES
  (
    'qris_manual',
    'QRIS Manual',
    'Bayar dengan scan QRIS, lalu upload bukti pembayaran untuk diverifikasi admin.',
    'QRIS',
    true,
    false,
    'READY',
    '{"imageUrl":"/images/qris.png"}'::jsonb,
    10
  ),
  (
    'bank_transfer',
    'Transfer Bank',
    'Transfer manual ke rekening toko, lalu upload bukti pembayaran untuk diverifikasi admin.',
    'BANK_TRANSFER',
    false,
    false,
    'READY',
    '{"bankName":"","accountNumber":"","accountHolder":"","instructions":"Transfer sesuai total pembayaran, lalu upload bukti pembayaran."}'::jsonb,
    20
  ),
  (
    'bca_va',
    'BCA Virtual Account',
    'Pembayaran virtual account via Midtrans.',
    'VIRTUAL_ACCOUNT',
    false,
    true,
    'COMING_SOON',
    '{}'::jsonb,
    30
  ),
  (
    'bri_va',
    'BRI Virtual Account',
    'Pembayaran virtual account via Midtrans.',
    'VIRTUAL_ACCOUNT',
    false,
    true,
    'COMING_SOON',
    '{}'::jsonb,
    40
  ),
  (
    'mandiri_va',
    'Mandiri Virtual Account',
    'Pembayaran virtual account via Midtrans.',
    'VIRTUAL_ACCOUNT',
    false,
    true,
    'COMING_SOON',
    '{}'::jsonb,
    50
  ),
  (
    'bni_va',
    'BNI Virtual Account',
    'Pembayaran virtual account via Midtrans.',
    'VIRTUAL_ACCOUNT',
    false,
    true,
    'COMING_SOON',
    '{}'::jsonb,
    60
  );

ALTER TABLE "orders"
ADD CONSTRAINT "orders_payment_method_code_fkey"
FOREIGN KEY ("payment_method_code") REFERENCES "payment_methods"("code")
ON DELETE SET NULL ON UPDATE CASCADE;
