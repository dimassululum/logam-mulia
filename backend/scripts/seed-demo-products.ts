import { PrismaClient, Role } from '@prisma/client';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';

dotenv.config();

const prisma = new PrismaClient();

const RETAINED_EMAILS = ['admin@logam-mulia-antam.com', 'dimasgroapp@gmail.com'] as const;
const PRODUCT_DISPLAY_META_KEY = 'product_display_reviews';
const IMAGE_ASSET_ORIGIN = 'https://assets.butikemaslogammuliastore.com';
const BACKUP_DIR = process.env.DEMO_SEED_BACKUP_DIR || '/private/tmp/logam-mulia-demo-seed-backups';

interface DemoProductSeed {
  name: string;
  slug: string;
  categorySlug: 'emas-batangan' | 'emas-imlek' | 'gift-series' | 'perak-silver-lm-antam';
  price: number;
  weightGram: number;
  stock: number;
  imagePath: string;
  reviewCount: number;
  displayRating: number;
}

const categories = [
  {
    name: 'Emas Batangan',
    slug: 'emas-batangan',
    description: 'Produk emas batangan ANTAM untuk kebutuhan investasi.',
  },
  {
    name: 'Emas Imlek',
    slug: 'emas-imlek',
    description: 'Koleksi emas edisi Imlek dan perayaan tahun baru Tionghoa.',
  },
  {
    name: 'Gift Series',
    slug: 'gift-series',
    description: 'Koleksi emas ANTAM edisi hadiah dan momen spesial.',
  },
  {
    name: 'Perak Silver LM ANTAM',
    slug: 'perak-silver-lm-antam',
    description: 'Produk perak LM ANTAM untuk koleksi dan diversifikasi aset.',
  },
];

const products: DemoProductSeed[] = [
  {
    name: 'Emas Antam LM Batangan Idul Fitri 2026 - 5gr',
    slug: 'emas-antam-lm-batangan-idul-fitri-2026-5gr',
    categorySlug: 'gift-series',
    price: 14843000,
    weightGram: 5,
    stock: 0,
    imagePath: 'product-images/0.7416393304297134.png',
    reviewCount: 4,
    displayRating: 5,
  },
  {
    name: 'Emas Antam LM Gift Series Idul Fitri 2026 - 1 gr',
    slug: 'emas-antam-lm-gift-series-idul-fitri-2026-1-gr',
    categorySlug: 'gift-series',
    price: 2945000,
    weightGram: 1,
    stock: 0,
    imagePath: 'product-images/0.2551332964864452.png',
    reviewCount: 3,
    displayRating: 5,
  },
  {
    name: 'Emas Antam LM Gift Series Imlek 2026 Year of The Horse - 1 gr',
    slug: 'emas-antam-lm-gift-series-imlek-2026-year-of-the-horse-1-gr',
    categorySlug: 'gift-series',
    price: 2945000,
    weightGram: 1,
    stock: 0,
    imagePath: 'product-images/0.4578812874574496.png',
    reviewCount: 2,
    displayRating: 5,
  },
  {
    name: 'Emas Batangan - 0,5 gram',
    slug: 'emas-batangan-05-gram',
    categorySlug: 'emas-batangan',
    price: 1449000,
    weightGram: 0.5,
    stock: 25,
    imagePath: 'product-images/0.931989294013652.png',
    reviewCount: 9,
    displayRating: 5,
  },
  {
    name: 'Emas Batangan - 1 gram',
    slug: 'emas-batangan-1-gram',
    categorySlug: 'emas-batangan',
    price: 2798000,
    weightGram: 1,
    stock: 94,
    imagePath: 'product-images/0.569408285449523.png',
    reviewCount: 8,
    displayRating: 5,
  },
  {
    name: 'Emas Batangan - 2 gram',
    slug: 'emas-batangan-2-gram',
    categorySlug: 'emas-batangan',
    price: 5536000,
    weightGram: 2,
    stock: 69,
    imagePath: 'product-images/0.6178969413631583.png',
    reviewCount: 9,
    displayRating: 5,
  },
  {
    name: 'Emas Batangan - 3 gram',
    slug: 'emas-batangan-3-gram',
    categorySlug: 'emas-batangan',
    price: 8279000,
    weightGram: 3,
    stock: 61,
    imagePath: 'product-images/0.8842732264699494.png',
    reviewCount: 6,
    displayRating: 5,
  },
  {
    name: 'Emas Batangan - 5 gram',
    slug: 'emas-batangan-5-gram',
    categorySlug: 'emas-batangan',
    price: 13765000,
    weightGram: 5,
    stock: 77,
    imagePath: 'product-images/0.7918582005200308.png',
    reviewCount: 13,
    displayRating: 5,
  },
  {
    name: 'Emas Batangan - 10 gram',
    slug: 'emas-batangan-10-gram',
    categorySlug: 'emas-batangan',
    price: 27475000,
    weightGram: 10,
    stock: 56,
    imagePath: 'product-images/0.3541894296225835.png',
    reviewCount: 23,
    displayRating: 5,
  },
  {
    name: 'Emas Batangan - 25 gram',
    slug: 'emas-batangan-25-gram',
    categorySlug: 'emas-batangan',
    price: 68562000,
    weightGram: 25,
    stock: 60,
    imagePath: 'product-images/0.4582229822836148.png',
    reviewCount: 8,
    displayRating: 5,
  },
  {
    name: 'Emas Batangan - 50 gram',
    slug: 'emas-batangan-50-gram',
    categorySlug: 'emas-batangan',
    price: 137045000,
    weightGram: 50,
    stock: 82,
    imagePath: 'product-images/0.7577654361617971.jpg',
    reviewCount: 9,
    displayRating: 5,
  },
  {
    name: 'Emas Batangan - 100 gram',
    slug: 'emas-batangan-100-gram',
    categorySlug: 'emas-batangan',
    price: 274012000,
    weightGram: 100,
    stock: 65,
    imagePath: 'product-images/0.26228399374745726.png',
    reviewCount: 5,
    displayRating: 5,
  },
  {
    name: 'Emas Batangan - 250 gram',
    slug: 'emas-batangan-250-gram',
    categorySlug: 'emas-batangan',
    price: 676265000,
    weightGram: 250,
    stock: 50,
    imagePath: 'product-images/0.6805306246413897.png',
    reviewCount: 5,
    displayRating: 5,
  },
  {
    name: 'Emas Batangan - 500 gram',
    slug: 'emas-batangan-500-gram',
    categorySlug: 'emas-batangan',
    price: 1352320000,
    weightGram: 500,
    stock: 50,
    imagePath: 'product-images/0.18280645426052078.jpg',
    reviewCount: 5,
    displayRating: 5,
  },
  {
    name: 'Emas Batangan - 1000 gram',
    slug: 'emas-batangan-1000-gram',
    categorySlug: 'emas-batangan',
    price: 2704600000,
    weightGram: 1000,
    stock: 50,
    imagePath: 'product-images/0.35929370965985774.png',
    reviewCount: 5,
    displayRating: 5,
  },
  {
    name: 'Emas Antam LM Gift Series Imlek 2026 Year of The Horse - 0,5 gr',
    slug: 'emas-antam-lm-gift-series-imlek-2026-year-of-the-horse-05-gr',
    categorySlug: 'gift-series',
    price: 1529500,
    weightGram: 0.5,
    stock: 50,
    imagePath: 'product-images/0.7732557475412781.png',
    reviewCount: 5,
    displayRating: 5,
  },
  {
    name: 'Emas Batangan Imlek 2026 Year of The Horse - 8gr',
    slug: 'emas-batangan-imlek-2026-year-of-the-horse-8gr',
    categorySlug: 'emas-imlek',
    price: 23406800,
    weightGram: 8,
    stock: 50,
    imagePath: 'product-images/0.34274568616098855.png',
    reviewCount: 5,
    displayRating: 5,
  },
  {
    name: "Emas Antam LM Gift Series Santa's Christmas Journey - 1 gr",
    slug: 'emas-antam-lm-gift-series-santas-christmas-journey-1-gr',
    categorySlug: 'gift-series',
    price: 2969000,
    weightGram: 1,
    stock: 50,
    imagePath: 'product-images/0.40718851536860357.png',
    reviewCount: 5,
    displayRating: 5,
  },
  {
    name: 'Emas Antam LM Gift Series Christmas Eve - 1gr',
    slug: 'emas-antam-lm-gift-series-christmas-eve-1gr',
    categorySlug: 'gift-series',
    price: 2945000,
    weightGram: 1,
    stock: 50,
    imagePath: 'product-images/0.6760706965616164.jpeg',
    reviewCount: 5,
    displayRating: 5,
  },
  {
    name: 'Emas Antam LM Gift Series Simfoni Ibu Pertiwi 2025 - 1 gr',
    slug: 'emas-antam-lm-gift-series-simfoni-ibu-pertiwi-2025-1-gr',
    categorySlug: 'gift-series',
    price: 2945000,
    weightGram: 1,
    stock: 50,
    imagePath: 'product-images/0.9938744509543808.png',
    reviewCount: 5,
    displayRating: 5,
  },
  {
    name: 'Emas Antam LM Gift Series Love Heart - 1 gr',
    slug: 'emas-antam-lm-gift-series-love-heart-1-gr',
    categorySlug: 'gift-series',
    price: 2945000,
    weightGram: 1,
    stock: 50,
    imagePath: 'product-images/0.3715473884881052.png',
    reviewCount: 5,
    displayRating: 5,
  },
  {
    name: 'Perak Batangan 500 gram',
    slug: 'perak-batangan-500-gram',
    categorySlug: 'perak-silver-lm-antam',
    price: 25450000,
    weightGram: 500,
    stock: 50,
    imagePath: 'product-images/0.45856721771318887.webp',
    reviewCount: 5,
    displayRating: 5,
  },
  {
    name: 'Perak Batangan 250 gram',
    slug: 'perak-batangan-250-gram',
    categorySlug: 'perak-silver-lm-antam',
    price: 13125000,
    weightGram: 250,
    stock: 50,
    imagePath: 'product-images/0.7639585052826794.webp',
    reviewCount: 5,
    displayRating: 5,
  },
];

function isExecuteMode() {
  return process.argv.includes('--execute');
}

function descriptionFor(product: DemoProductSeed) {
  const category = categories.find((item) => item.slug === product.categorySlug)?.name || 'Logam Mulia';
  return `${product.name} asli ANTAM LM dengan kadar 99.99%. Produk ${category.toLowerCase()} ini disiapkan untuk katalog uji coba dengan data dari web customer lama.`;
}

function mimeFromPath(imagePath: string) {
  if (imagePath.endsWith('.png')) return 'image/png';
  if (imagePath.endsWith('.webp')) return 'image/webp';
  return 'image/jpeg';
}

async function fetchImageAsDataUrl(imagePath: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);

  try {
    const response = await fetch(`${IMAGE_ASSET_ORIGIN}/${imagePath}`, {
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

async function backupCurrentData() {
  await fs.mkdir(BACKUP_DIR, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(BACKUP_DIR, `clean-demo-product-seed-${timestamp}.json`);
  const data = {
    createdAt: new Date().toISOString(),
    users: await prisma.user.findMany(),
    addresses: await prisma.address.findMany(),
    categories: await prisma.category.findMany(),
    products: await prisma.product.findMany({ include: { images: true } }),
    orders: await prisma.order.findMany({ include: { items: true, statusLogs: true } }),
    reviews: await prisma.review.findMany(),
    vouchers: await prisma.voucher.findMany({ include: { usages: true } }),
    productDisplayMeta: await prisma.setting.findUnique({ where: { key: PRODUCT_DISPLAY_META_KEY } }),
  };

  await fs.writeFile(backupPath, JSON.stringify(data, null, 2));
  return backupPath;
}

async function validateRetainedUsers() {
  const retainedUsers = await prisma.user.findMany({
    where: { email: { in: [...RETAINED_EMAILS] } },
  });
  const foundEmails = new Set(retainedUsers.map((user) => user.email));
  const missing = RETAINED_EMAILS.filter((email) => !foundEmails.has(email));

  if (missing.length > 0) {
    throw new Error(`Retained user wajib ada sebelum reset: ${missing.join(', ')}`);
  }

  return retainedUsers;
}

async function cleanDemoData(adminUserId: string) {
  await prisma.article.updateMany({
    where: { author: { email: { notIn: [...RETAINED_EMAILS] } } },
    data: { authorId: adminUserId },
  });

  await prisma.voucherUsage.deleteMany();
  await prisma.review.deleteMany();
  await prisma.orderStatusLog.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.address.deleteMany();
  await prisma.user.deleteMany({ where: { email: { notIn: [...RETAINED_EMAILS] } } });
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
}

async function resetRetainedAccounts() {
  await prisma.user.update({
    where: { email: 'admin@logam-mulia-antam.com' },
    data: {
      role: Role.SUPER_ADMIN,
      isActive: true,
      isKycVerified: true,
      phone: null,
      ktpUrl: null,
      refreshToken: null,
    },
  });

  await prisma.user.update({
    where: { email: 'dimasgroapp@gmail.com' },
    data: {
      role: Role.CUSTOMER,
      isActive: true,
      isKycVerified: false,
      phone: null,
      ktpUrl: null,
      refreshToken: null,
    },
  });
}

async function seedCategories() {
  const categoryMap = new Map<string, string>();

  for (const category of categories) {
    const created = await prisma.category.create({ data: category });
    categoryMap.set(category.slug, created.id);
  }

  return categoryMap;
}

async function seedProducts(categoryMap: Map<string, string>) {
  const displayMeta: Record<string, {
    displayRating: number;
    reviewCount: number;
    soldCount: number;
    displayReviews: Array<{
      id: string;
      reviewerName: string;
      imageUrl: string;
      description: string;
      createdAt: string;
      updatedAt: string;
    }>;
  }> = {};

  for (const productSeed of products) {
    const categoryId = categoryMap.get(productSeed.categorySlug);
    if (!categoryId) throw new Error(`Kategori tidak ditemukan untuk ${productSeed.name}`);

    const product = await prisma.product.create({
      data: {
        categoryId,
        name: productSeed.name,
        slug: productSeed.slug,
        description: descriptionFor(productSeed),
        price: productSeed.price,
        weightGram: productSeed.weightGram,
        kadar: '99.99%',
        stock: productSeed.stock,
        isActive: true,
      },
    });

    await prisma.productImage.create({
      data: {
        productId: product.id,
        imageUrl: await fetchImageAsDataUrl(productSeed.imagePath),
        isPrimary: true,
        sortOrder: 0,
      },
    });

    displayMeta[product.id] = {
      displayRating: productSeed.displayRating,
      reviewCount: productSeed.reviewCount,
      soldCount: 0,
      displayReviews: [],
    };
  }

  await prisma.setting.upsert({
    where: { key: PRODUCT_DISPLAY_META_KEY },
    update: { value: JSON.stringify(displayMeta) },
    create: { key: PRODUCT_DISPLAY_META_KEY, value: JSON.stringify(displayMeta) },
  });
}

async function verifySeed() {
  const [userCount, categoryCount, productCount, missingImageCount, outOfStockProducts] = await Promise.all([
    prisma.user.count(),
    prisma.category.count(),
    prisma.product.count({ where: { isActive: true } }),
    prisma.productImage.count({
      where: {
        isPrimary: true,
        NOT: { imageUrl: { startsWith: 'data:image/' } },
      },
    }),
    prisma.product.count({ where: { stock: 0 } }),
  ]);

  return {
    userCount,
    categoryCount,
    productCount,
    missingImageCount,
    outOfStockProducts,
  };
}

async function main() {
  const execute = isExecuteMode();
  const retainedUsers = await validateRetainedUsers();
  const admin = retainedUsers.find((user) => user.email === 'admin@logam-mulia-antam.com');

  if (!admin) throw new Error('Admin utama tidak ditemukan.');

  if (!execute) {
    console.log('Dry run OK. Tambahkan --execute untuk menjalankan reset dan seed demo produk.');
    console.log(`Akan mempertahankan akun: ${RETAINED_EMAILS.join(', ')}`);
    console.log(`Akan seed ${categories.length} kategori dan ${products.length} produk.`);
    return;
  }

  const backupPath = await backupCurrentData();
  console.log(`Backup dibuat: ${backupPath}`);

  await cleanDemoData(admin.id);
  await resetRetainedAccounts();
  const categoryMap = await seedCategories();
  await seedProducts(categoryMap);

  const result = await verifySeed();
  console.log(`Seed selesai: ${JSON.stringify(result, null, 2)}`);

  if (
    result.userCount !== 2 ||
    result.categoryCount !== 4 ||
    result.productCount !== 23 ||
    result.missingImageCount !== 0 ||
    result.outOfStockProducts < 3
  ) {
    throw new Error('Verifikasi seed gagal. Cek hasil query di atas dan backup sebelum lanjut.');
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
