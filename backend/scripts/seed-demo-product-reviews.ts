import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';

dotenv.config();

const prisma = new PrismaClient();

const PRODUCT_DISPLAY_META_KEY = 'product_display_reviews';
const OLD_SITE_ORIGIN = 'https://butikemaslogammuliastore.com';
const IMAGE_ASSET_ORIGIN = 'https://assets.butikemaslogammuliastore.com';
const OLD_PRODUCT_REVIEWS_ACTION_ID = '4003982315631fd339a79deb1c0d68780388b7c228';
const BACKUP_DIR = process.env.DEMO_SEED_BACKUP_DIR || '/private/tmp/logam-mulia-demo-seed-backups';

interface OldReview {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  updated_at: string;
  image_url: string | null;
  customer_name: string | null;
}

interface DisplayReview {
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
  displayReviews?: DisplayReview[];
}

type ProductDisplayMetaMap = Record<string, ProductDisplayMeta>;

function isExecuteMode() {
  return process.argv.includes('--execute');
}

function oldProductDetailUrl(slug: string) {
  return `${OLD_SITE_ORIGIN}/product-detail/${slug}?slug=${slug}`;
}

function oldRouterStateTreeHeader(slug: string) {
  return encodeURIComponent(JSON.stringify([
    '',
    {
      children: [
        'product-detail',
        {
          children: [
            ['slug', slug, 'd', null],
            { children: ['__PAGE__?', {}] },
          ],
        },
      ],
    },
  ]));
}

function mimeFromPath(imagePath: string) {
  const normalized = imagePath.split('?')[0].toLowerCase();
  if (normalized.endsWith('.png')) return 'image/png';
  if (normalized.endsWith('.webp')) return 'image/webp';
  return 'image/jpeg';
}

function parseReviewImagePaths(value: string | null) {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.filter((item): item is string => typeof item === 'string');
    return typeof parsed === 'string' ? [parsed] : [];
  } catch {
    return [value];
  }
}

function extractOldProductId(html: string) {
  const direct = html.match(/"initialProduct":\{"id":"([^"]+)"/);
  if (direct?.[1]) return direct[1];

  const escaped = html.match(/\\"initialProduct\\":\{\\"id\\":\\"([^\\"]+)\\"/);
  return escaped?.[1] || null;
}

function extractOldReviews(rscText: string): OldReview[] {
  const line = rscText.split('\n').find((item) => item.startsWith('1:'));
  if (!line) return [];

  const parsed = JSON.parse(line.slice(2));
  return Array.isArray(parsed) ? parsed : [];
}

async function fetchText(url: string, init?: RequestInit) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0',
        ...(init?.headers || {}),
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return response.text();
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchImageAsDataUrl(imagePath: string) {
  const normalizedPath = imagePath.replace(/^\/+/, '');
  const url = imagePath.startsWith('http') ? imagePath : `${IMAGE_ASSET_ORIGIN}/${normalizedPath}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    return `data:${response.headers.get('content-type') || mimeFromPath(imagePath)};base64,${buffer.toString('base64')}`;
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchOldProductId(slug: string) {
  const html = await fetchText(oldProductDetailUrl(slug));
  const oldProductId = extractOldProductId(html);

  if (!oldProductId) {
    throw new Error(`Product ID lama tidak ditemukan untuk slug ${slug}`);
  }

  return oldProductId;
}

async function fetchOldReviews(productId: string, slug: string) {
  const responseText = await fetchText(oldProductDetailUrl(slug), {
    method: 'POST',
    headers: {
      Accept: 'text/x-component',
      'Content-Type': 'text/plain;charset=UTF-8',
      'Next-Action': OLD_PRODUCT_REVIEWS_ACTION_ID,
      'Next-Router-State-Tree': oldRouterStateTreeHeader(slug),
      Origin: OLD_SITE_ORIGIN,
      Referer: oldProductDetailUrl(slug),
    },
    body: JSON.stringify([productId]),
  });

  return extractOldReviews(responseText);
}

async function buildDisplayReviews(oldReviews: OldReview[]) {
  const displayReviews: DisplayReview[] = [];

  for (const oldReview of oldReviews) {
    const imagePath = parseReviewImagePaths(oldReview.image_url)[0];
    let imageUrl = '';

    if (imagePath) {
      try {
        imageUrl = await fetchImageAsDataUrl(imagePath);
      } catch (error) {
        console.warn(`Gagal ambil gambar review ${imagePath}:`, error instanceof Error ? error.message : error);
      }
    }

    displayReviews.push({
      id: oldReview.id,
      reviewerName: oldReview.customer_name || 'Pelanggan',
      imageUrl,
      description: oldReview.comment || '',
      createdAt: oldReview.created_at,
      updatedAt: oldReview.updated_at,
    });
  }

  return displayReviews;
}

async function readProductDisplayMeta(): Promise<ProductDisplayMetaMap> {
  const setting = await prisma.setting.findUnique({ where: { key: PRODUCT_DISPLAY_META_KEY } });
  if (!setting?.value) return {};

  try {
    return JSON.parse(setting.value) as ProductDisplayMetaMap;
  } catch {
    return {};
  }
}

async function backupCurrentMeta() {
  await fs.mkdir(BACKUP_DIR, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(BACKUP_DIR, `demo-product-reviews-${timestamp}.json`);
  const data = {
    createdAt: new Date().toISOString(),
    productDisplayMeta: await prisma.setting.findUnique({ where: { key: PRODUCT_DISPLAY_META_KEY } }),
  };

  await fs.writeFile(backupPath, JSON.stringify(data, null, 2));
  return backupPath;
}

async function main() {
  const execute = isExecuteMode();
  const products = await prisma.product.findMany({
    where: { isActive: true },
    select: { id: true, name: true, slug: true },
    orderBy: { createdAt: 'asc' },
  });

  if (products.length === 0) {
    throw new Error('Produk aktif tidak ditemukan. Jalankan seed produk dulu.');
  }

  const meta = await readProductDisplayMeta();
  const summary: Array<{ slug: string; oldReviewCount: number; displayReviewCount: number; imageCount: number }> = [];

  for (const product of products) {
    console.log(`Mengambil review: ${product.slug}`);

    try {
      const oldProductId = await fetchOldProductId(product.slug);
      const oldReviews = await fetchOldReviews(oldProductId, product.slug);
      const displayReviews = await buildDisplayReviews(oldReviews);
      const currentMeta = meta[product.id] || {};

      meta[product.id] = {
        displayRating: currentMeta.displayRating ?? 5,
        reviewCount: currentMeta.reviewCount ?? oldReviews.length,
        soldCount: currentMeta.soldCount ?? 0,
        displayReviews,
      };

      summary.push({
        slug: product.slug,
        oldReviewCount: oldReviews.length,
        displayReviewCount: displayReviews.length,
        imageCount: displayReviews.filter((review) => review.imageUrl.startsWith('data:image/')).length,
      });
    } catch (error) {
      console.warn(`Review dilewati untuk ${product.slug}:`, error instanceof Error ? error.message : error);
      const currentMeta = meta[product.id] || {};
      meta[product.id] = {
        displayRating: currentMeta.displayRating ?? 5,
        reviewCount: currentMeta.reviewCount ?? 0,
        soldCount: currentMeta.soldCount ?? 0,
        displayReviews: currentMeta.displayReviews || [],
      };
    }
  }

  if (!execute) {
    console.log('Dry run OK. Tambahkan --execute untuk menyimpan review demo.');
    console.table(summary);
    return;
  }

  const backupPath = await backupCurrentMeta();
  console.log(`Backup meta review dibuat: ${backupPath}`);

  await prisma.setting.upsert({
    where: { key: PRODUCT_DISPLAY_META_KEY },
    update: { value: JSON.stringify(meta) },
    create: { key: PRODUCT_DISPLAY_META_KEY, value: JSON.stringify(meta) },
  });

  console.table(summary);
  console.log(`Review demo tersimpan untuk ${summary.length} produk.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
