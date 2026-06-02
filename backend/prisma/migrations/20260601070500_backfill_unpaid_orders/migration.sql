UPDATE "orders"
SET "status" = 'UNPAID'
WHERE "status" = 'PENDING'
  AND "payment_proof_url" IS NULL;

UPDATE "order_status_logs"
SET "status" = 'UNPAID'
WHERE "status" = 'PENDING'
  AND "order_id" IN (
    SELECT "id"
    FROM "orders"
    WHERE "status" = 'UNPAID'
      AND "payment_proof_url" IS NULL
  );
