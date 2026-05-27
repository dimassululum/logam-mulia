import { PaymentMethod, PaymentMethodStatus, Prisma } from '@prisma/client';
import { prisma } from '../../../core/config/database';
import { BadRequestError, ForbiddenError, NotFoundError } from '../../../core/utils/errors';
import type { UpdatePaymentMethodInput } from '../schema/payment-method.schema';

export const QRIS_MANUAL_CODE = 'qris_manual';
export const BANK_TRANSFER_CODE = 'bank_transfer';

type PaymentMethodRecord = PaymentMethod;

interface PaymentMethodConfig {
  imageUrl?: string;
  bankName?: string;
  accountNumber?: string;
  accountHolder?: string;
  instructions?: string;
}

const defaultConfigs: Record<string, PaymentMethodConfig> = {
  [QRIS_MANUAL_CODE]: {
    imageUrl: '/images/qris.png',
    instructions: 'Scan QRIS, masukkan nominal persis sesuai total pembayaran, lalu upload bukti pembayaran.',
  },
  [BANK_TRANSFER_CODE]: {
    bankName: '',
    accountNumber: '',
    accountHolder: '',
    instructions: 'Transfer sesuai total pembayaran, lalu upload bukti pembayaran.',
  },
};

function asConfig(value: Prisma.JsonValue): PaymentMethodConfig {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as PaymentMethodConfig;
}

function normalizeOptionalString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function mergeConfig(code: string, current: Prisma.JsonValue, next?: Record<string, unknown>): PaymentMethodConfig {
  const base = defaultConfigs[code] ?? {};
  return {
    ...base,
    ...asConfig(current),
    ...(next ?? {}),
  };
}

function isUsable(method: PaymentMethodRecord, config = asConfig(method.config)) {
  if (!method.isActive || method.isLocked || method.status !== PaymentMethodStatus.READY) return false;

  if (method.code === QRIS_MANUAL_CODE) {
    return Boolean(normalizeOptionalString(config.imageUrl));
  }

  if (method.code === BANK_TRANSFER_CODE) {
    return Boolean(
      normalizeOptionalString(config.bankName) &&
      normalizeOptionalString(config.accountNumber) &&
      normalizeOptionalString(config.accountHolder)
    );
  }

  return false;
}

function serializePaymentMethod(method: PaymentMethodRecord) {
  const config = asConfig(method.config);

  return {
    code: method.code,
    label: method.label,
    description: method.description,
    category: method.category,
    isActive: method.isActive,
    isLocked: method.isLocked,
    status: method.status,
    config,
    isUsable: isUsable(method, config),
    sortOrder: method.sortOrder,
    createdAt: method.createdAt.toISOString(),
    updatedAt: method.updatedAt.toISOString(),
  };
}

async function findPaymentMethod(code: string) {
  const method = await prisma.paymentMethod.findUnique({ where: { code } });
  if (!method) throw new NotFoundError('Metode pembayaran');
  return method;
}

function validateEditableConfig(method: PaymentMethodRecord, config: PaymentMethodConfig, isActive: boolean) {
  if (method.code === QRIS_MANUAL_CODE) {
    if (isActive && !normalizeOptionalString(config.imageUrl)) {
      throw new BadRequestError('Gambar QRIS wajib tersedia sebelum QRIS Manual diaktifkan.');
    }
    return;
  }

  if (method.code === BANK_TRANSFER_CODE) {
    if (!isActive) return;

    if (!normalizeOptionalString(config.bankName)) {
      throw new BadRequestError('Nama bank wajib diisi sebelum Transfer Bank diaktifkan.');
    }
    if (!normalizeOptionalString(config.accountNumber)) {
      throw new BadRequestError('Nomor rekening wajib diisi sebelum Transfer Bank diaktifkan.');
    }
    if (!normalizeOptionalString(config.accountHolder)) {
      throw new BadRequestError('Nama pemilik rekening wajib diisi sebelum Transfer Bank diaktifkan.');
    }
  }
}

function toPrismaJson(value: PaymentMethodConfig): Prisma.InputJsonObject {
  return value as unknown as Prisma.InputJsonObject;
}

export async function getAdminPaymentMethods() {
  const methods = await prisma.paymentMethod.findMany({ orderBy: { sortOrder: 'asc' } });
  return methods.map(serializePaymentMethod);
}

export async function getPublicPaymentMethods() {
  const methods = await prisma.paymentMethod.findMany({
    where: {
      isActive: true,
      isLocked: false,
      status: PaymentMethodStatus.READY,
    },
    orderBy: { sortOrder: 'asc' },
  });

  return methods.map(serializePaymentMethod).filter((method) => method.isUsable);
}

export async function updatePaymentMethod(code: string, input: UpdatePaymentMethodInput) {
  const method = await findPaymentMethod(code);
  if (method.isLocked || method.status === PaymentMethodStatus.COMING_SOON) {
    throw new ForbiddenError('Metode pembayaran ini masih coming soon dan belum bisa diubah.');
  }

  const nextConfig = mergeConfig(method.code, method.config, input.config);
  const nextIsActive = input.isActive ?? method.isActive;
  validateEditableConfig(method, nextConfig, nextIsActive);

  const updated = await prisma.paymentMethod.update({
    where: { code },
    data: {
      isActive: nextIsActive,
      config: toPrismaJson(nextConfig),
    },
  });

  return serializePaymentMethod(updated);
}

export async function updateQrisImage(file: Express.Multer.File | undefined) {
  if (!file) throw new BadRequestError('Gambar QRIS wajib diupload.');

  const method = await findPaymentMethod(QRIS_MANUAL_CODE);
  const nextConfig = mergeConfig(method.code, method.config, { imageUrl: `/uploads/${file.filename}` });

  const updated = await prisma.paymentMethod.update({
    where: { code: QRIS_MANUAL_CODE },
    data: { config: toPrismaJson(nextConfig) },
  });

  return serializePaymentMethod(updated);
}

export async function resolveActivePaymentMethodForOrder(code: string) {
  const method = await findPaymentMethod(code);
  const serialized = serializePaymentMethod(method);

  if (!serialized.isUsable) {
    throw new BadRequestError('Metode pembayaran tidak tersedia. Silakan pilih metode pembayaran lain.');
  }

  return {
    code: method.code,
    label: method.label,
    category: method.category,
    config: asConfig(method.config),
  };
}
