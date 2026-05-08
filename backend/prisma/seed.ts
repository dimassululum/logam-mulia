import { PrismaClient, Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ── helpers ──────────────────────────────────────────────────────────────────
const slug = (name: string, suffix = '') =>
  name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + (suffix ? `-${suffix}` : '');

async function main() {
  console.log('🌱 Starting comprehensive database seeding...');

  try {
    // Create SUPER_ADMIN user
    const adminEmail = 'admin@logam-mulia-antam.com';
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail },
    });

    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash('admin123456', 12);
      
      const admin = await prisma.user.create({
        data: {
          name: 'Super Admin',
          email: adminEmail,
          passwordHash: hashedPassword,
          phone: '+6281234567890',
          role: 'SUPER_ADMIN',
          isActive: true,
          isKycVerified: true,
        },
      });

      console.log('✅ Created SUPER_ADMIN user:', admin.email);
    } else {
      console.log('ℹ️  SUPER_ADMIN user already exists:', existingAdmin.email);
    }

    // Create ADMIN user
    const adminEmail2 = 'admin@example.com';
    const existingAdmin2 = await prisma.user.findUnique({
      where: { email: adminEmail2 },
    });

    if (!existingAdmin2) {
      const hashedPassword2 = await bcrypt.hash('admin123', 12);
      
      const admin2 = await prisma.user.create({
        data: {
          name: 'Admin User',
          email: adminEmail2,
          passwordHash: hashedPassword2,
          phone: '+6281234567891',
          role: 'ADMIN',
          isActive: true,
          isKycVerified: true,
        },
      });

      console.log('✅ Created ADMIN user:', admin2.email);
    } else {
      console.log('ℹ️  ADMIN user already exists:', existingAdmin2.email);
    }

    // Create test customer user
    const customerEmail = 'customer@example.com';
    const existingCustomer = await prisma.user.findUnique({
      where: { email: customerEmail },
    });

    if (!existingCustomer) {
      const hashedPassword3 = await bcrypt.hash('customer123', 12);
      
      const customer = await prisma.user.create({
        data: {
          name: 'Test Customer',
          email: customerEmail,
          passwordHash: hashedPassword3,
          phone: '+6281234567892',
          role: 'CUSTOMER',
          isActive: true,
          isKycVerified: false,
        },
      });

      console.log('✅ Created CUSTOMER user:', customer.email);
    } else {
      console.log('ℹ️  CUSTOMER user already exists:', existingCustomer.email);
    }

    // ── Additional customers ────────────────────────────────────────────────
    const extraCustomers = [
      { name: 'Budi Santoso',     email: 'budi.santoso@gmail.com',     phone: '+6281200001111' },
      { name: 'Rina Maharani',    email: 'rina.maharani@gmail.com',     phone: '+6281200002222' },
      { name: 'Andi Wijaya',      email: 'andi.wijaya@gmail.com',       phone: '+6281200003333' },
      { name: 'Salsabila Putri',  email: 'salsabila.putri@gmail.com',   phone: '+6281200004444' },
      { name: 'Michael Hartono',  email: 'michael.hartono@gmail.com',   phone: '+6281200005555' },
      { name: 'Dewi Anggraini',   email: 'dewi.anggraini@gmail.com',    phone: '+6281200006666' },
      { name: 'Reza Pratama',     email: 'reza.pratama@gmail.com',      phone: '+6281200007777' },
      { name: 'Nadia Kusuma',     email: 'nadia.kusuma@gmail.com',      phone: '+6281200008888' },
    ];
    const custPw = await bcrypt.hash('customer123', 12);
    const customerIds: string[] = [];
    for (const c of extraCustomers) {
      const existing = await prisma.user.findUnique({ where: { email: c.email } });
      if (!existing) {
        const u = await prisma.user.create({
          data: { ...c, passwordHash: custPw, role: 'CUSTOMER', isActive: true, isKycVerified: false },
        });
        customerIds.push(u.id);
        console.log(`✅ Created customer: ${u.email}`);
      } else {
        customerIds.push(existing.id);
      }
    }

    // ── Categories ───────────────────────────────────────────────────────────
    const categoryData = [
      { name: 'Emas Batangan',  desc: 'Emas batangan murni 24K bersertifikat LBMA untuk investasi' },
      { name: 'Emas Perhiasan', desc: 'Perhiasan emas 18K dan 22K dengan desain premium' },
      { name: 'Koin Emas',      desc: 'Koin emas edisi terbatas dan seri khusus' },
      { name: 'Gift Series',    desc: 'Paket hadiah emas dalam kemasan premium' },
    ];
    const categories: Record<string, string> = {};
    for (const cat of categoryData) {
      const s = slug(cat.name, 'seed');
      const existing = await prisma.category.findFirst({ where: { name: cat.name } });
      if (!existing) {
        const c = await prisma.category.create({
          data: { name: cat.name, slug: s, description: cat.desc, isActive: true },
        });
        categories[cat.name] = c.id;
        console.log(`✅ Created category: ${c.name}`);
      } else {
        categories[cat.name] = existing.id;
      }
    }

    // ── Products ─────────────────────────────────────────────────────────────
    const productData = [
      { name: 'Emas Antam 0.5g', weightGram: 0.5,  price: 600000,     stock: 200, cat: 'Emas Batangan',  kadar: '24K' },
      { name: 'Emas Antam 1g',   weightGram: 1,    price: 1145000,    stock: 150, cat: 'Emas Batangan',  kadar: '24K' },
      { name: 'Emas Antam 2g',   weightGram: 2,    price: 2260000,    stock: 80,  cat: 'Emas Batangan',  kadar: '24K' },
      { name: 'Emas Antam 5g',   weightGram: 5,    price: 5540000,    stock: 60,  cat: 'Emas Batangan',  kadar: '24K' },
      { name: 'Emas Antam 10g',  weightGram: 10,   price: 10985000,   stock: 40,  cat: 'Emas Batangan',  kadar: '24K' },
      { name: 'Emas Antam 25g',  weightGram: 25,   price: 27200000,   stock: 20,  cat: 'Emas Batangan',  kadar: '24K' },
      { name: 'Emas Antam 50g',  weightGram: 50,   price: 54100000,   stock: 10,  cat: 'Emas Batangan',  kadar: '24K' },
      { name: 'Emas Antam 100g', weightGram: 100,  price: 107900000,  stock: 5,   cat: 'Emas Batangan',  kadar: '24K' },
      { name: 'Emas Antam 250g', weightGram: 250,  price: 268500000,  stock: 3,   cat: 'Emas Batangan',  kadar: '24K' },
      { name: 'Emas Antam 500g', weightGram: 500,  price: 536000000,  stock: 2,   cat: 'Emas Batangan',  kadar: '24K' },
      { name: 'Cincin Emas 18K 2g',    weightGram: 2,  price: 2100000,  stock: 25, cat: 'Emas Perhiasan', kadar: '18K' },
      { name: 'Kalung Emas 22K 5g',    weightGram: 5,  price: 5200000,  stock: 15, cat: 'Emas Perhiasan', kadar: '22K' },
      { name: 'Gelang Emas 18K 6g',    weightGram: 6,  price: 6100000,  stock: 12, cat: 'Emas Perhiasan', kadar: '18K' },
      { name: 'Koin Emas Nusantara 1g',weightGram: 1,  price: 1250000,  stock: 50, cat: 'Koin Emas',      kadar: '24K' },
      { name: 'Koin Emas Garuda 5g',   weightGram: 5,  price: 5850000,  stock: 30, cat: 'Koin Emas',      kadar: '24K' },
      { name: 'Gift Series 0.5g',      weightGram: 0.5,price: 680000,   stock: 100,cat: 'Gift Series',    kadar: '24K' },
      { name: 'Gift Series Premium 1g',weightGram: 1,  price: 1350000,  stock: 75, cat: 'Gift Series',    kadar: '24K' },
    ];

    const productIds: string[] = [];
    for (const p of productData) {
      const s = slug(p.name, 'v1');
      const existing = await prisma.product.findFirst({ where: { name: p.name } });
      if (!existing) {
        const catId = categories[p.cat];
        if (!catId) { console.log(`⚠️  Skipping ${p.name}: category not found`); continue; }
        const prod = await prisma.product.create({
          data: {
            name:        p.name,
            slug:        s,
            description: `${p.name} kadar ${p.kadar}, ideal untuk investasi dan hadiah. Setiap produk dilengkapi sertifikat keaslian resmi.`,
            price:       new Prisma.Decimal(p.price),
            weightGram:  new Prisma.Decimal(p.weightGram),
            kadar:       p.kadar,
            stock:       p.stock,
            isActive:    true,
            categoryId:  catId,
          },
        });
        productIds.push(prod.id);
        console.log(`✅ Created product: ${prod.name}`);
      } else {
        productIds.push(existing.id);
      }
    }

    // ── Settings ─────────────────────────────────────────────────────────────
    const settings = [
      { key: 'company_name',        value: 'Logam Mulia Antam' },
      { key: 'company_address',     value: 'Jl. Pulogadung No. 1, Jakarta Timur 13920' },
      { key: 'company_phone',       value: '+62 21 4788 2222' },
      { key: 'company_email',       value: 'info@logam-mulia-antam.com' },
      { key: 'whatsapp_number',     value: '+6281234567890' },
      { key: 'shipping_cost_base',  value: '15000' },
      { key: 'min_purchase_amount', value: '500000' },
      { key: 'max_order_weight',    value: '5000' },
      { key: 'gold_price_update',   value: 'daily' },
    ];
    for (const s of settings) {
      const existing = await prisma.setting.findUnique({ where: { key: s.key } });
      if (!existing) {
        await prisma.setting.create({ data: s });
        console.log(`✅ Setting: ${s.key}`);
      }
    }

    // ── Banners ───────────────────────────────────────────────────────────────
    const bannerData = [
      { title: 'Beli Emas Online Terpercaya', imageUrl: '/images/banner-1.png', linkUrl: '/products', order: 1 },
      { title: 'Promo Ramadan 2026',          imageUrl: '/images/banner-2.png', linkUrl: '/products', order: 2 },
      { title: 'Seri Kemerdekaan Edisi Terbatas', imageUrl: '/images/banner-3.jpg', linkUrl: '/products?category=koin-emas', order: 3 },
    ];
    for (const b of bannerData) {
      const existing = await prisma.banner.findFirst({ where: { title: b.title } });
      if (!existing) {
        await prisma.banner.create({
          data: { title: b.title, imageUrl: b.imageUrl, linkUrl: b.linkUrl, isActive: true, sortOrder: b.order },
        });
        console.log(`✅ Banner: ${b.title}`);
      }
    }

    // ── Articles / Contents ───────────────────────────────────────────────────
    const admin = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } });
    const articles = [
      {
        slug: 'mengapa-emas-safe-haven',
        title: 'Mengapa Emas Adalah "Safe Haven" Terbaik?',
        excerpt: 'Pelajari alasan utama mengapa investor profesional selalu menyisihkan portofolio dalam bentuk emas.',
        content: '<p>Emas telah lama dikenal sebagai aset perlindungan nilai yang tak tertandingi. Di tengah ketidakpastian ekonomi global, emas tetap menjadi pilihan utama para investor institusional maupun ritel.</p><p>Beberapa alasan emas menjadi safe haven: (1) Nilai intrinsik yang stabil, (2) Likuiditas tinggi di seluruh dunia, (3) Tidak terpengaruh inflasi jangka panjang, (4) Tidak bergantung pada kinerja perusahaan manapun.</p>',
        tags: ['Panduan', 'Investasi'],
      },
      {
        slug: 'strategi-dollar-cost-averaging-emas',
        title: 'Strategi Dollar Cost Averaging Pada Emas',
        excerpt: 'Cara cerdas menabung emas tanpa harus menunggu harga turun. Konsistensi adalah kunci.',
        content: '<p>Dollar Cost Averaging (DCA) adalah strategi investasi dengan membeli aset secara rutin dalam jumlah tetap, terlepas dari harga saat itu. Strategi ini sangat efektif untuk investasi emas jangka panjang.</p><p>Dengan DCA, Anda tidak perlu khawatir dengan fluktuasi harga harian. Yang terpenting adalah konsistensi dan disiplin dalam berinvestasi.</p>',
        tags: ['Strategi', 'Investasi'],
      },
      {
        slug: 'verifikasi-sertifikat-antam',
        title: 'Cara Verifikasi Keaslian Sertifikat Antam',
        excerpt: 'Kenali ciri-ciri fisik dan fitur keamanan terbaru pada produk CertiCard investasi Anda.',
        content: '<p>Setiap produk emas Antam dilengkapi dengan sertifikat CertiCard yang memiliki berbagai fitur keamanan canggih. Penting bagi Anda sebagai investor untuk memahami cara memverifikasi keaslian sertifikat ini.</p><p>Fitur keamanan CertiCard meliputi: hologram khusus, QR code terenkripsi, dan nomor seri unik yang dapat diverifikasi di website resmi Antam.</p>',
        tags: ['Keamanan', 'Panduan'],
      },
      {
        slug: 'portofolio-emas-untuk-pemula',
        title: 'Membangun Portofolio Emas untuk Pemula',
        excerpt: 'Panduan lengkap memulai investasi emas dari nol hingga portofolio yang menguntungkan.',
        content: '<p>Memulai investasi emas tidak perlu modal besar. Dengan perencanaan yang tepat, Anda bisa membangun portofolio emas yang solid bahkan dengan anggaran terbatas.</p><p>Langkah awal: tentukan tujuan investasi, pilih produk yang sesuai (batangan, koin, atau perhiasan), dan mulai dengan nominal yang terjangkau.</p>',
        tags: ['Panduan', 'Pemula'],
      },
    ];

    if (admin) {
      for (const art of articles) {
        const existing = await prisma.content.findUnique({ where: { slug: art.slug } });
        if (!existing) {
          await prisma.content.create({
            data: {
              slug:     art.slug,
              title:    art.title,
              excerpt:  art.excerpt,
              content:  art.content,
              type:     'post',
              status:   'published',
              authorId: admin.id,
            },
          });
          console.log(`✅ Article: ${art.title}`);
        }
      }
    }

    // ── Vouchers ──────────────────────────────────────────────────────────────
    const voucherData = [
      { code: 'EMAS10',      discountType: 'PERCENTAGE', discountValue: 10, minPurchase: 1000000,  usageLimit: 100 },
      { code: 'NEWMEMBER50', discountType: 'FIXED',      discountValue: 50000, minPurchase: 500000, usageLimit: 500 },
      { code: 'GOLD100K',    discountType: 'FIXED',      discountValue: 100000, minPurchase: 5000000, usageLimit: 50 },
    ];
    for (const v of voucherData) {
      const existing = await prisma.voucher.findUnique({ where: { code: v.code } });
      if (!existing) {
        await prisma.voucher.create({
          data: {
            code:          v.code,
            discountType:  v.discountType as any,
            discountValue: new Prisma.Decimal(v.discountValue),
            minPurchase:   new Prisma.Decimal(v.minPurchase),
            usageLimit:    v.usageLimit,
            isActive:      true,
            expiresAt:     new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          },
        });
        console.log(`✅ Voucher: ${v.code}`);
      }
    }

    // ── Sample Orders ─────────────────────────────────────────────────────────
    const allCustomers = await prisma.user.findMany({ where: { role: 'CUSTOMER' }, take: 8 });
    const allProducts  = await prisma.product.findMany({ take: 10 });

    if (allCustomers.length > 0 && allProducts.length > 0) {
      const orderStatuses = ['PENDING','PAID','PROCESSING','SHIPPED','DELIVERED','COMPLETED','CANCELLED'] as const;
      const existingOrders = await prisma.order.count();

      if (existingOrders < 5) {
        for (let i = 0; i < 15; i++) {
          const customer = allCustomers[i % allCustomers.length];
          const product  = allProducts[i % allProducts.length];
          const qty      = (i % 3) + 1;
          const price    = Number(product.price);
          const shipping = 15000;
          const subtotal = price * qty;
          const grand    = subtotal + shipping;
          const status   = orderStatuses[i % orderStatuses.length];
          const daysAgo  = i * 3;

          const orderId = `INV-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${String(i+1).padStart(3,'0')}-${Math.random().toString(36).slice(2,6).toUpperCase()}`;
          await prisma.order.create({
            data: {
              id:              orderId,
              userId:          customer.id,
              status,
              totalAmount:     new Prisma.Decimal(subtotal),
              shippingCost:    new Prisma.Decimal(shipping),
              discountAmount:  new Prisma.Decimal(0),
              grandTotal:      new Prisma.Decimal(grand),
              shippingAddress: JSON.stringify({
                fullName:   customer.name,
                phone:      customer.phone ?? '+6281200000000',
                address:    'Jl. Merdeka No. 17',
                city:       'Jakarta',
                province:   'DKI Jakarta',
                postalCode: '10110',
              }),
              shippingCity:    'Jakarta',
              createdAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
              items: {
                create: [{
                  productId:       product.id,
                  quantity:        qty,
                  priceAtPurchase: new Prisma.Decimal(price),
                  subtotal:        new Prisma.Decimal(price * qty),
                }],
              },
            },
          });
        }
        console.log('✅ Created 15 sample orders');
      } else {
        console.log('ℹ️  Sample orders already exist');
      }
    }

    console.log('\n🎉 Comprehensive seeding completed!');
    console.log('\n📋 Login Credentials:');
    console.log('🔑 SUPER_ADMIN : admin@logam-mulia-antam.com / admin123456');
    console.log('🔑 ADMIN       : admin@example.com / admin123');
    console.log('🔑 CUSTOMER    : customer@example.com / customer123');

  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
