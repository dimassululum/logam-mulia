import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@logam-mulia.com' },
    update: {
      name: 'Admin Utama',
      passwordHash,
      role: 'SUPER_ADMIN',
      isActive: true,
      isKycVerified: true,
    },
    create: {
      email: 'admin@logam-mulia.com',
      name: 'Admin Utama',
      passwordHash,
      role: 'SUPER_ADMIN',
      isActive: true,
      isKycVerified: true,
    },
  });

  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: 'emas-batangan' },
      update: {
        name: 'Emas Batangan',
        description: 'Produk emas batangan untuk kebutuhan investasi.',
      },
      create: {
        name: 'Emas Batangan',
        slug: 'emas-batangan',
        description: 'Produk emas batangan untuk kebutuhan investasi.',
      },
    }),
    prisma.category.upsert({
      where: { slug: 'perak' },
      update: {
        name: 'Perak',
        description: 'Produk perak pilihan untuk diversifikasi aset.',
      },
      create: {
        name: 'Perak',
        slug: 'perak',
        description: 'Produk perak pilihan untuk diversifikasi aset.',
      },
    }),
  ]);

  const [goldCategory, silverCategory] = categories;

  const seededProducts = [
    {
      categoryId: goldCategory.id,
      name: 'Antam Certicard 1 Gram',
      slug: 'antam-certicard-1-gram',
      description: 'Emas batangan Antam 1 gram dengan sertifikat resmi.',
      price: 2795000,
      weightGram: 1,
      kadar: '24K',
      stock: 24,
      imageUrl: '/images/lm.png',
    },
    {
      categoryId: goldCategory.id,
      name: 'Antam Certicard 5 Gram',
      slug: 'antam-certicard-5-gram',
      description: 'Emas batangan Antam 5 gram untuk investasi menengah.',
      price: 13950000,
      weightGram: 5,
      kadar: '24K',
      stock: 12,
      imageUrl: '/images/logo-lm.png',
    },
    {
      categoryId: goldCategory.id,
      name: 'Antam Certicard 10 Gram',
      slug: 'antam-certicard-10-gram',
      description: 'Emas batangan Antam 10 gram dengan kemasan Certicard.',
      price: 27850000,
      weightGram: 10,
      kadar: '24K',
      stock: 8,
      imageUrl: '/images/antam.png',
    },
    {
      categoryId: silverCategory.id,
      name: 'Perak Batangan 10 Gram',
      slug: 'perak-batangan-10-gram',
      description: 'Perak batangan 10 gram untuk diversifikasi portofolio.',
      price: 475000,
      weightGram: 10,
      kadar: '99.9%',
      stock: 30,
      imageUrl: '/images/cert.png',
    },
  ];

  for (const productSeed of seededProducts) {
    const { imageUrl, ...productData } = productSeed;
    const product = await prisma.product.upsert({
      where: { slug: productData.slug },
      update: {
        ...productData,
        isActive: true,
      },
      create: {
        ...productData,
        isActive: true,
      },
    });

    await prisma.productImage.deleteMany({ where: { productId: product.id } });
    await prisma.productImage.create({
      data: {
        productId: product.id,
        imageUrl,
        isPrimary: true,
        sortOrder: 0,
      },
    });
  }

  const reviewProduct =
    await prisma.product.findUnique({ where: { slug: 'emas-antam-logam-mulia-certicard---2-gr' }, include: { images: true } }) ||
    await prisma.product.findUnique({ where: { slug: 'antam-certicard-1-gram' }, include: { images: true } }) ||
    await prisma.product.findFirst({ include: { images: true } });

  if (reviewProduct) {
    const existingSetting = await prisma.setting.findUnique({ where: { key: 'product_display_reviews' } });
    const productDisplayMeta = existingSetting ? JSON.parse(existingSetting.value) : {};
    const now = new Date().toISOString();

    productDisplayMeta[reviewProduct.id] = {
      displayRating: 5.0,
      soldCount: 124,
      displayReviews: [
        {
          id: 'seed-review-cici-sarah',
          reviewerName: 'Cici Sarah',
          imageUrl: reviewProduct.images[0]?.imageUrl || '/images/lm.png',
          description: 'Terimakasih seller. Awalnya ragu, ternyata asli.',
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 'seed-review-marcelinno',
          reviewerName: 'Marcelinno',
          imageUrl: '',
          description: 'Barang asli dan terpercaya. Pengiriman juga aman.',
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 'seed-review-ny-sintiaa',
          reviewerName: 'Ny.Sintiaa',
          imageUrl: reviewProduct.images[0]?.imageUrl || '/images/cert.png',
          description: 'Barang ok dan bagus. Seller ramah.',
          createdAt: now,
          updatedAt: now,
        },
      ],
    };

    await prisma.setting.upsert({
      where: { key: 'product_display_reviews' },
      update: { value: JSON.stringify(productDisplayMeta) },
      create: { key: 'product_display_reviews', value: JSON.stringify(productDisplayMeta) },
    });
  }

  await Promise.all([
    prisma.boutique.upsert({
      where: { slug: 'butik-graha-dipta' },
      update: {
        name: 'Butik Graha Dipta',
        city: 'Jakarta',
        address: 'Jalan Pemuda No. 1, Pulo Gadung, Jakarta Timur',
        contactPhone: '081212345678',
        googleMapsUrl: 'https://maps.google.com/?q=Graha+Dipta+Pulogadung',
        isActive: true,
        sortOrder: 1,
      },
      create: {
        name: 'Butik Graha Dipta',
        slug: 'butik-graha-dipta',
        city: 'Jakarta',
        address: 'Jalan Pemuda No. 1, Pulo Gadung, Jakarta Timur',
        contactPhone: '081212345678',
        googleMapsUrl: 'https://maps.google.com/?q=Graha+Dipta+Pulogadung',
        isActive: true,
        sortOrder: 1,
      },
    }),
    prisma.boutique.upsert({
      where: { slug: 'butik-surabaya' },
      update: {
        name: 'Butik Surabaya',
        city: 'Surabaya',
        address: 'Jalan Basuki Rahmat No. 45, Surabaya',
        contactPhone: '081298765432',
        googleMapsUrl: 'https://maps.google.com/?q=Surabaya',
        isActive: true,
        sortOrder: 2,
      },
      create: {
        name: 'Butik Surabaya',
        slug: 'butik-surabaya',
        city: 'Surabaya',
        address: 'Jalan Basuki Rahmat No. 45, Surabaya',
        contactPhone: '081298765432',
        googleMapsUrl: 'https://maps.google.com/?q=Surabaya',
        isActive: true,
        sortOrder: 2,
      },
    }),
  ]);

  await Promise.all([
    prisma.article.upsert({
      where: { slug: 'cara-memulai-investasi-emas' },
      update: {
        title: 'Cara Memulai Investasi Emas',
        excerpt: 'Langkah dasar memilih produk emas sesuai tujuan investasi.',
        content: '<p>Mulai dari tujuan, alokasi dana, lalu pilih pecahan emas yang sesuai kebutuhan.</p>',
        coverUrl: '/images/banner-1.png',
        authorId: admin.id,
        isPublished: true,
        publishedAt: new Date('2026-05-01T09:00:00+07:00'),
      },
      create: {
        title: 'Cara Memulai Investasi Emas',
        slug: 'cara-memulai-investasi-emas',
        excerpt: 'Langkah dasar memilih produk emas sesuai tujuan investasi.',
        content: '<p>Mulai dari tujuan, alokasi dana, lalu pilih pecahan emas yang sesuai kebutuhan.</p>',
        coverUrl: '/images/banner-1.png',
        authorId: admin.id,
        isPublished: true,
        publishedAt: new Date('2026-05-01T09:00:00+07:00'),
      },
    }),
    prisma.article.upsert({
      where: { slug: 'strategi-menabung-emas-rutin' },
      update: {
        title: 'Strategi Menabung Emas Rutin',
        excerpt: 'Cara menjaga konsistensi pembelian emas tanpa menunggu harga sempurna.',
        content: '<p>Pembelian berkala membantu meratakan harga beli dan menjaga disiplin investasi.</p>',
        coverUrl: '/images/banner-2.png',
        authorId: admin.id,
        isPublished: true,
        publishedAt: new Date('2026-05-08T09:00:00+07:00'),
      },
      create: {
        title: 'Strategi Menabung Emas Rutin',
        slug: 'strategi-menabung-emas-rutin',
        excerpt: 'Cara menjaga konsistensi pembelian emas tanpa menunggu harga sempurna.',
        content: '<p>Pembelian berkala membantu meratakan harga beli dan menjaga disiplin investasi.</p>',
        coverUrl: '/images/banner-2.png',
        authorId: admin.id,
        isPublished: true,
        publishedAt: new Date('2026-05-08T09:00:00+07:00'),
      },
    }),
  ]);

  const companyProfileItems = [
    {
      key: 'homepage_banners',
      type: 'json',
      value: JSON.stringify([
        {
          id: 'banner-seed-1',
          title: 'Promo Beli Emas Online',
          thumbnailUrl: '/images/banner-1.png',
          status: 'active',
          expiresAt: '2026-12-31',
        },
        {
          id: 'banner-seed-2',
          title: 'Gempita Hari Raya',
          thumbnailUrl: '/images/banner-2.png',
          status: 'active',
          expiresAt: '2026-12-31',
        },
      ]),
    },
    { key: 'hero_video_status', type: 'text', value: 'active' },
    { key: 'hero_video_button_title', type: 'text', value: 'Beli Emas Disini' },
    { key: 'hero_video_preview_url', type: 'text', value: '/videos/home-hero-latest.mp4' },
    { key: 'footer_company_name', type: 'text', value: 'Logam Mulia Antam' },
    {
      key: 'footer_company_description',
      type: 'text',
      value: 'Distributor resmi logam mulia Antam, menyediakan solusi investasi emas yang aman dan transparan.',
    },
    { key: 'footer_company_logo_preview', type: 'text', value: '' },
    {
      key: 'footer_address',
      type: 'text',
      value: 'Unit Bisnis Pengolahan dan Pemurnian Logam Mulia Gedung Graha Dipta, Jakarta 13250',
    },
    { key: 'footer_google_maps_link', type: 'text', value: 'https://maps.google.com/?q=Graha+Dipta+Pulogadung' },
    { key: 'footer_whatsapp_contact', type: 'text', value: '081212345678' },
    {
      key: 'footer_social_media',
      type: 'json',
      value: JSON.stringify([
        { id: 'social-instagram', name: 'Instagram', status: 'active', link: 'https://instagram.com/logammuliaantam' },
        { id: 'social-facebook', name: 'Facebook', status: 'active', link: 'https://facebook.com/logammuliaantam' },
      ]),
    },
  ];

  for (const item of companyProfileItems) {
    await prisma.companyProfile.upsert({
      where: { key: item.key },
      update: { value: item.value, type: item.type },
      create: item,
    });
  }

  console.log(`Seed completed: admin, categories, products, reviews, boutiques, articles, and company profile are ready. Review product: ${reviewProduct?.name ?? '-'}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
