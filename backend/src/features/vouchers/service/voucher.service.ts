import { DiscountType, Prisma } from '@prisma/client';
import { prisma } from '../../../core/config/database';
import { BadRequestError, ConflictError, NotFoundError } from '../../../core/utils/errors';
import type {
  CreateVoucherInput,
  UpdateVoucherInput,
  ValidateVoucherInput,
} from '../schema/voucher.schema';

interface QueryOptions {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}

interface ApplyVoucherUsageInput {
  voucherId: string;
  userId: string;
  orderId: string;
}

const voucherInclude = {
  products: {
    select: {
      id: true,
      name: true,
      slug: true,
      price: true,
      category: { select: { id: true, name: true, slug: true } },
    },
  },
  _count: {
    select: { orders: true, usages: true },
  },
} satisfies Prisma.VoucherInclude;

function normalizeCode(code: string): string {
  return code.trim().toUpperCase();
}

function toMoney(value: Prisma.Decimal | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  return Number(value);
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function calculateDiscount(
  discountType: DiscountType,
  discountValue: Prisma.Decimal,
  subtotal: number,
  maxDiscount?: Prisma.Decimal | null
): number {
  if (discountType === DiscountType.PERCENTAGE) {
    const rawDiscount = subtotal * (toMoney(discountValue) / 100);
    const cap = maxDiscount ? toMoney(maxDiscount) : rawDiscount;
    return roundMoney(Math.min(rawDiscount, cap, subtotal));
  }

  return roundMoney(Math.min(toMoney(discountValue), subtotal));
}

export async function getAllVouchers(options: QueryOptions = {}) {
  const { page = 1, limit = 20, search, isActive } = options;
  const skip = (page - 1) * limit;

  const where: Prisma.VoucherWhereInput = {};
  if (isActive !== undefined) where.isActive = isActive;
  if (search) {
    where.code = { contains: search.trim(), mode: 'insensitive' };
  }

  const [total, vouchers] = await Promise.all([
    prisma.voucher.count({ where }),
    prisma.voucher.findMany({
      where,
      skip,
      take: limit,
      orderBy: { code: 'asc' },
      include: voucherInclude,
    }),
  ]);

  return { total, vouchers };
}

export async function getPublicActiveVouchers(options: QueryOptions = {}) {
  const { page = 1, limit = 20 } = options;
  const skip = (page - 1) * limit;
  const now = new Date();
  const where: Prisma.VoucherWhereInput = {
    isActive: true,
    OR: [{ startsAt: null }, { startsAt: { lte: now } }],
    AND: [{ OR: [{ expiresAt: null }, { expiresAt: { gte: now } }] }],
  };

  const [total, vouchers] = await Promise.all([
    prisma.voucher.count({ where }),
    prisma.voucher.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ expiresAt: 'asc' }, { code: 'asc' }],
      select: {
        id: true,
        code: true,
        discountType: true,
        discountValue: true,
        minPurchase: true,
        maxDiscount: true,
        expiresAt: true,
        products: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    }),
  ]);

  return { total, vouchers };
}

export async function getVoucherById(id: string) {
  const voucher = await prisma.voucher.findUnique({
    where: { id },
    include: voucherInclude,
  });

  if (!voucher) {
    throw new NotFoundError('Voucher');
  }

  return voucher;
}

export async function createVoucher(data: CreateVoucherInput) {
  const { productIds, ...voucherData } = data;
  const code = normalizeCode(data.code);
  const existing = await prisma.voucher.findUnique({ where: { code } });

  if (existing) {
    throw new ConflictError('Voucher dengan kode tersebut sudah ada');
  }

  return prisma.voucher.create({
    data: {
      ...voucherData,
      code,
      products: productIds.length
        ? {
            connect: productIds.map((id) => ({ id })),
          }
        : undefined,
    },
    include: voucherInclude,
  });
}

export async function updateVoucher(id: string, data: UpdateVoucherInput) {
  const { productIds, ...voucherData } = data;
  const existing = await prisma.voucher.findUnique({ where: { id } });

  if (!existing) {
    throw new NotFoundError('Voucher');
  }

  const nextCode = data.code ? normalizeCode(data.code) : undefined;
  if (nextCode && nextCode !== existing.code) {
    const codeExists = await prisma.voucher.findUnique({ where: { code: nextCode } });
    if (codeExists) {
      throw new ConflictError('Voucher dengan kode tersebut sudah ada');
    }
  }

  return prisma.voucher.update({
    where: { id },
    data: {
      ...voucherData,
      ...(nextCode && { code: nextCode }),
      ...(productIds && {
        products: {
          set: productIds.map((productId) => ({ id: productId })),
        },
      }),
    },
    include: voucherInclude,
  });
}

export async function deactivateVoucher(id: string) {
  const existing = await prisma.voucher.findUnique({ where: { id } });

  if (!existing) {
    throw new NotFoundError('Voucher');
  }

  return prisma.voucher.update({
    where: { id },
    data: { isActive: false },
  });
}

export async function validateVoucher(userId: string, input: ValidateVoucherInput) {
  const code = normalizeCode(input.code);
  const subtotal = input.subtotal;
  const voucher = await prisma.voucher.findUnique({ where: { code } });

  if (!voucher || !voucher.isActive) {
    throw new NotFoundError('Voucher');
  }

  const now = new Date();
  if (voucher.startsAt && voucher.startsAt > now) {
    throw new BadRequestError('Voucher belum aktif');
  }

  if (voucher.expiresAt && voucher.expiresAt < now) {
    throw new BadRequestError('Voucher sudah kedaluwarsa');
  }

  if (voucher.usageLimit !== null && voucher.usageCount >= voucher.usageLimit) {
    throw new BadRequestError('Voucher sudah mencapai batas penggunaan');
  }

  if (subtotal < toMoney(voucher.minPurchase)) {
    throw new BadRequestError('Subtotal belum memenuhi minimum pembelian voucher');
  }

  const userUsageCount = await prisma.voucherUsage.count({
    where: {
      voucherId: voucher.id,
      userId,
    },
  });

  if (userUsageCount >= voucher.perUserLimit) {
    throw new BadRequestError('Voucher sudah mencapai batas penggunaan untuk user ini');
  }

  const discountAmount = calculateDiscount(
    voucher.discountType,
    voucher.discountValue,
    subtotal,
    voucher.maxDiscount
  );

  return {
    voucher: {
      id: voucher.id,
      code: voucher.code,
      discountType: voucher.discountType,
      discountValue: toMoney(voucher.discountValue),
      minPurchase: toMoney(voucher.minPurchase),
      maxDiscount: voucher.maxDiscount ? toMoney(voucher.maxDiscount) : null,
    },
    subtotal,
    discountAmount,
    finalAmount: roundMoney(subtotal - discountAmount),
  };
}

export async function applyVoucherUsage(input: ApplyVoucherUsageInput) {
  return prisma.$transaction(async (tx) => {
    const existingUsage = await tx.voucherUsage.findUnique({
      where: {
        voucherId_userId_orderId: {
          voucherId: input.voucherId,
          userId: input.userId,
          orderId: input.orderId,
        },
      },
    });

    if (existingUsage) {
      return existingUsage;
    }

    const voucher = await tx.voucher.findUnique({
      where: { id: input.voucherId },
      select: { id: true, usageLimit: true, usageCount: true, perUserLimit: true },
    });

    if (!voucher) {
      throw new NotFoundError('Voucher');
    }

    if (voucher.usageLimit !== null && voucher.usageCount >= voucher.usageLimit) {
      throw new BadRequestError('Voucher sudah mencapai batas penggunaan');
    }

    const userUsageCount = await tx.voucherUsage.count({
      where: {
        voucherId: input.voucherId,
        userId: input.userId,
      },
    });

    if (userUsageCount >= voucher.perUserLimit) {
      throw new BadRequestError('Voucher sudah mencapai batas penggunaan untuk user ini');
    }

    const usage = await tx.voucherUsage.create({
      data: {
        voucherId: input.voucherId,
        userId: input.userId,
        orderId: input.orderId,
      },
    });

    await tx.voucher.update({
      where: { id: input.voucherId },
      data: { usageCount: { increment: 1 } },
    });

    return usage;
  });
}
