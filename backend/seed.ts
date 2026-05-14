import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('admin123', 12);
  await prisma.user.upsert({
    where: { email: 'admin@logam-mulia.com' },
    update: {},
    create: {
      email: 'admin@logam-mulia.com',
      name: 'Admin Utama',
      passwordHash,
      role: 'SUPER_ADMIN',
      isActive: true,
      isKycVerified: true,
    },
  });
  console.log('Admin user created');
}

main().catch(console.error).finally(() => prisma.$disconnect());
