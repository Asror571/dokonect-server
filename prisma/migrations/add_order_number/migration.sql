-- AlterTable
ALTER TABLE "Order" ADD COLUMN "orderNumber" SERIAL NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");

-- Set starting value to 1000
SELECT setval(pg_get_serial_sequence('"Order"', 'orderNumber'), 1000, false);
