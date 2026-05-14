-- CreateTable
CREATE TABLE "_ProductToVoucher" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_ProductToVoucher_AB_unique" ON "_ProductToVoucher"("A", "B");

-- CreateIndex
CREATE INDEX "_ProductToVoucher_B_index" ON "_ProductToVoucher"("B");

-- AddForeignKey
ALTER TABLE "_ProductToVoucher" ADD CONSTRAINT "_ProductToVoucher_A_fkey" FOREIGN KEY ("A") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProductToVoucher" ADD CONSTRAINT "_ProductToVoucher_B_fkey" FOREIGN KEY ("B") REFERENCES "vouchers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
