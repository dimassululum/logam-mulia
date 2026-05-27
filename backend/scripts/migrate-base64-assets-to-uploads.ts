import { PrismaClient } from '@prisma/client';
import { createHash } from 'crypto';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';

dotenv.config();

const prisma = new PrismaClient();
const PRODUCT_DISPLAY_META_KEY = 'product_display_reviews';
const PRODUCT_DISPLAY_SUMMARY_KEY = 'product_display_review_summaries';
const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || './uploads');

interface DisplayReviewRecord {
  id: string;
  reviewerName: string;
  imageUrl: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

interface ProductDisplayMeta {
  displayRating?: number;
  reviewCount?: number;
  soldCount?: number;
  displayReviews?: DisplayReviewRecord[];
}

type ProductDisplayMetaMap = Record<string, ProductDisplayMeta>;

function isExecuteMode() {
  return process.argv.includes('--execute');
}

function parseDataUrl(value: string) {
  const match = value.match(/^data:(image\/(?:jpeg|png|webp));base64,([a-z0-9+/=\s]+)$/i);
  if (!match) return null;

  const mimeType = match[1].toLowerCase();
  const ext = mimeType === 'image/jpeg' ? 'jpg' : mimeType.replace('image/', '');
  const buffer = Buffer.from(match[2].replace(/\s/g, ''), 'base64');
  const hash = createHash('sha256').update(buffer).digest('hex').slice(0, 24);

  return { buffer, ext, hash };
}

async function writeUploadFile(value: string, prefix: string) {
  const parsed = parseDataUrl(value);
  if (!parsed) return null;

  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  const filename = `${prefix}-${parsed.hash}.${parsed.ext}`;
  const filePath = path.join(UPLOAD_DIR, filename);

  try {
    await fs.access(filePath);
  } catch {
    await fs.writeFile(filePath, parsed.buffer);
  }

  return `/uploads/${filename}`;
}

function buildSummary(meta: ProductDisplayMetaMap) {
  return Object.fromEntries(
    Object.entries(meta).map(([productId, value]) => [
      productId,
      {
        displayRating: value.displayRating ?? 5,
        reviewCount: value.reviewCount ?? (value.displayReviews || []).length,
        soldCount: value.soldCount ?? 0,
      },
    ]),
  );
}

async function migrateProductImages(execute: boolean) {
  const images = await prisma.productImage.findMany({
    select: { id: true, imageUrl: true },
    orderBy: { id: 'asc' },
  });

  let scanned = 0;
  let converted = 0;

  for (const image of images) {
    scanned += 1;
    if (!parseDataUrl(image.imageUrl)) continue;

    converted += 1;
    if (!execute) continue;

    const nextUrl = await writeUploadFile(image.imageUrl, 'product');
    if (nextUrl) {
      await prisma.productImage.update({
        where: { id: image.id },
        data: { imageUrl: nextUrl },
      });
    }
  }

  return { scanned, converted };
}

async function migrateDisplayReviewImages(execute: boolean) {
  const setting = await prisma.setting.findUnique({ where: { key: PRODUCT_DISPLAY_META_KEY } });
  if (!setting) return { products: 0, reviews: 0, converted: 0, summaryWritten: false };

  const meta = JSON.parse(setting.value) as ProductDisplayMetaMap;
  let reviews = 0;
  let converted = 0;

  for (const [productId, productMeta] of Object.entries(meta)) {
    const displayReviews = productMeta.displayReviews || [];

    for (const review of displayReviews) {
      reviews += 1;
      if (!parseDataUrl(review.imageUrl || '')) continue;

      converted += 1;
      if (!execute) continue;

      const nextUrl = await writeUploadFile(review.imageUrl, 'review');
      if (nextUrl) review.imageUrl = nextUrl;
    }

    meta[productId] = { ...productMeta, displayReviews };
  }

  if (execute) {
    await prisma.$transaction([
      prisma.setting.update({
        where: { key: PRODUCT_DISPLAY_META_KEY },
        data: { value: JSON.stringify(meta) },
      }),
      prisma.setting.upsert({
        where: { key: PRODUCT_DISPLAY_SUMMARY_KEY },
        update: { value: JSON.stringify(buildSummary(meta)) },
        create: { key: PRODUCT_DISPLAY_SUMMARY_KEY, value: JSON.stringify(buildSummary(meta)) },
      }),
    ]);
  }

  return {
    products: Object.keys(meta).length,
    reviews,
    converted,
    summaryWritten: execute,
  };
}

async function main() {
  const execute = isExecuteMode();

  console.log(`Mode: ${execute ? 'execute' : 'dry-run'}`);
  console.log(`Upload directory: ${UPLOAD_DIR}`);

  const productImages = await migrateProductImages(execute);
  const displayReviews = await migrateDisplayReviewImages(execute);

  console.log(JSON.stringify({ productImages, displayReviews }, null, 2));

  if (!execute) {
    console.log('Dry run only. Re-run with --execute to write files and update database rows.');
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
