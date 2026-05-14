import { Role } from '@prisma/client';
import { prisma } from '../../../core/config/database';

function toPublicKtpUrl(path: string | null) {
  if (!path) return null;
  return path.startsWith('/uploads/') ? path : `/uploads/${path}`;
}

export async function getCustomers() {
  const customers = await prisma.user.findMany({
    where: { role: Role.CUSTOMER },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      email: true,
      ktpUrl: true,
      createdAt: true,
    },
  });

  return customers.map((customer) => ({
    ...customer,
    ktpUrl: toPublicKtpUrl(customer.ktpUrl),
  }));
}
