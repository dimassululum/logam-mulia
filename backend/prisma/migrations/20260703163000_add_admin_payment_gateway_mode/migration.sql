INSERT INTO "settings" ("key", "value", "updated_at")
VALUES ('payment_gateway_mode', 'manual', CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO NOTHING;

UPDATE "payment_methods"
SET
  "label" = 'BRI',
  "description" = 'Pembayaran BRI Virtual Account via Midtrans.',
  "is_locked" = false,
  "status" = 'READY',
  "config" = '{"provider":"midtrans","channel":"bri_va"}'::jsonb,
  "sort_order" = 110
WHERE "code" = 'bri_va';

UPDATE "payment_methods"
SET
  "label" = 'BNI',
  "description" = 'Pembayaran BNI Virtual Account via Midtrans.',
  "is_locked" = false,
  "status" = 'READY',
  "config" = '{"provider":"midtrans","channel":"bni_va"}'::jsonb,
  "sort_order" = 120
WHERE "code" = 'bni_va';

UPDATE "payment_methods"
SET
  "label" = 'Mandiri',
  "description" = 'Pembayaran Mandiri Virtual Account via Midtrans.',
  "is_locked" = false,
  "status" = 'READY',
  "config" = '{"provider":"midtrans","channel":"mandiri_va"}'::jsonb,
  "sort_order" = 130
WHERE "code" = 'mandiri_va';

INSERT INTO "payment_methods" ("code", "label", "description", "category", "is_active", "is_locked", "status", "config", "sort_order", "created_at", "updated_at")
VALUES
  (
    'cimb_va',
    'CIMB Niaga',
    'Pembayaran CIMB Niaga Virtual Account via Midtrans.',
    'VIRTUAL_ACCOUNT',
    false,
    false,
    'READY',
    '{"provider":"midtrans","channel":"cimb_va"}'::jsonb,
    140,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    'permata_va',
    'Permata Bank',
    'Pembayaran Permata Bank Virtual Account via Midtrans.',
    'VIRTUAL_ACCOUNT',
    false,
    false,
    'READY',
    '{"provider":"midtrans","channel":"permata_va"}'::jsonb,
    150,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    'qris_midtrans',
    'QRIS',
    'Pembayaran QRIS via Midtrans.',
    'QRIS',
    false,
    false,
    'READY',
    '{"provider":"midtrans","channel":"qris"}'::jsonb,
    160,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  )
ON CONFLICT ("code") DO UPDATE
SET
  "label" = EXCLUDED."label",
  "description" = EXCLUDED."description",
  "category" = EXCLUDED."category",
  "is_locked" = EXCLUDED."is_locked",
  "status" = EXCLUDED."status",
  "config" = EXCLUDED."config",
  "sort_order" = EXCLUDED."sort_order",
  "updated_at" = CURRENT_TIMESTAMP;
