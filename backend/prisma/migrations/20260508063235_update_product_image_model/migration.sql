-- AlterTable
ALTER TABLE "product_images" ADD COLUMN     "alt_text" TEXT,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
