ALTER TABLE "orders" ADD COLUMN "checkout_request_id" TEXT;

CREATE UNIQUE INDEX "orders_checkout_request_id_key" ON "orders"("checkout_request_id");
