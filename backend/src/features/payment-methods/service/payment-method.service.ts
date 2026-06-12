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
  savingsBookAttachmentUrl?: string;
  instructions?: string;
  bankAccounts?: BankAccountConfig[];
}

interface BankAccountConfig {
  id: string;
  bankName?: string;
  accountNumber?: string;
  accountHolder?: string;
  isActive?: boolean;
  savingsBookAttachmentUrl?: string;
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

function normalizeAccountId(value: unknown) {
  const id = normalizeOptionalString(value);
  return ['1', '2', '3'].includes(id) ? id : '';
}

function normalizeBankName(value: unknown) {
  const bankName = normalizeOptionalString(value).toUpperCase();
  const allowedBanks = ['BRI', 'BNI', 'MANDIRI', 'BCA', 'BTN'];
  return allowedBanks.includes(bankName) ? bankName : normalizeOptionalString(value);
}

function normalizeBankAccount(account: Partial<BankAccountConfig>, fallbackId: string): BankAccountConfig {
  return {
    id: normalizeAccountId(account.id) || fallbackId,
    bankName: normalizeBankName(account.bankName),
    accountNumber: normalizeOptionalString(account.accountNumber),
    accountHolder: normalizeOptionalString(account.accountHolder),
    isActive: Boolean(account.isActive),
    savingsBookAttachmentUrl: normalizeOptionalString(account.savingsBookAttachmentUrl),
  };
}

function getBankAccounts(config: PaymentMethodConfig): BankAccountConfig[] {
  const fromConfig = Array.isArray(config.bankAccounts) ? config.bankAccounts : [];
  const byId = new Map<string, BankAccountConfig>();

  for (const account of fromConfig) {
    const normalized = normalizeBankAccount(account, String(byId.size + 1));
    if (['1', '2', '3'].includes(normalized.id)) {
      byId.set(normalized.id, normalized);
    }
  }

  const legacyAccount = normalizeBankAccount(
    {
      id: '1',
      bankName: config.bankName,
      accountNumber: config.accountNumber,
      accountHolder: config.accountHolder,
      isActive: byId.get('1')?.isActive ?? true,
      savingsBookAttachmentUrl: config.savingsBookAttachmentUrl ?? byId.get('1')?.savingsBookAttachmentUrl,
    },
    '1'
  );

  byId.set('1', {
    ...byId.get('1'),
    ...legacyAccount,
    isActive: byId.get('1')?.isActive ?? legacyAccount.isActive,
  });

  return ['1', '2', '3'].map((id) => byId.get(id) ?? normalizeBankAccount({ id, isActive: false }, id));
}

function isCompleteBankAccount(account: BankAccountConfig) {
  return Boolean(
    normalizeOptionalString(account.bankName) &&
    normalizeOptionalString(account.accountNumber) &&
    normalizeOptionalString(account.accountHolder)
  );
}

function getUsableBankAccounts(config: PaymentMethodConfig) {
  return getBankAccounts(config).filter((account) => account.isActive && isCompleteBankAccount(account));
}

function mergeConfig(code: string, current: Prisma.JsonValue, next?: Record<string, unknown>): PaymentMethodConfig {
  const base = defaultConfigs[code] ?? {};
  const merged = {
    ...base,
    ...asConfig(current),
    ...(next ?? {}),
  };

  if (code !== BANK_TRANSFER_CODE) return merged;

  const accounts = getBankAccounts(merged);
  const primaryAccount = accounts[0];
  return {
    ...merged,
    bankName: primaryAccount.bankName,
    accountNumber: primaryAccount.accountNumber,
    accountHolder: primaryAccount.accountHolder,
    savingsBookAttachmentUrl: primaryAccount.savingsBookAttachmentUrl,
    bankAccounts: accounts,
  };
}

function isUsable(method: PaymentMethodRecord, config = asConfig(method.config)) {
  if (!method.isActive || method.isLocked || method.status !== PaymentMethodStatus.READY) return false;

  if (method.code === QRIS_MANUAL_CODE) {
    return Boolean(normalizeOptionalString(config.imageUrl));
  }

  if (method.code === BANK_TRANSFER_CODE) {
    return getUsableBankAccounts(config).length > 0;
  }

  return false;
}

function serializePaymentMethod(method: PaymentMethodRecord) {
  const config = asConfig(method.config);
  const serializedConfig = method.code === BANK_TRANSFER_CODE
    ? {
      ...config,
      bankAccounts: getBankAccounts(config),
    }
    : config;

  return {
    code: method.code,
    label: method.label,
    description: method.description,
    category: method.category,
    isActive: method.isActive,
    isLocked: method.isLocked,
    status: method.status,
    config: serializedConfig,
    isUsable: isUsable(method, serializedConfig),
    sortOrder: method.sortOrder,
    createdAt: method.createdAt.toISOString(),
    updatedAt: method.updatedAt.toISOString(),
  };
}

function serializePublicPaymentMethod(method: PaymentMethodRecord) {
  const serialized = serializePaymentMethod(method);

  if (serialized.code !== BANK_TRANSFER_CODE) return serialized;

  const bankAccounts = getUsableBankAccounts(serialized.config).map((account) => ({
    id: account.id,
    bankName: account.bankName,
    accountNumber: account.accountNumber,
    accountHolder: account.accountHolder,
    isActive: account.isActive,
  }));
  const primaryAccount = bankAccounts[0];

  return {
    ...serialized,
    config: {
      bankName: primaryAccount?.bankName ?? '',
      accountNumber: primaryAccount?.accountNumber ?? '',
      accountHolder: primaryAccount?.accountHolder ?? '',
      instructions: serialized.config.instructions,
      bankAccounts,
    },
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

    if (getUsableBankAccounts(config).length === 0) {
      throw new BadRequestError('Minimal satu rekening transfer bank aktif dan lengkap sebelum Transfer Bank diaktifkan.');
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

  return methods.map(serializePublicPaymentMethod).filter((method) => method.isUsable);
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

export async function updateBankAccountAttachment(accountId: string, file: Express.Multer.File | undefined) {
  if (!file) throw new BadRequestError('Lampiran buku tabungan wajib diupload.');

  const normalizedAccountId = normalizeAccountId(accountId);
  if (!normalizedAccountId) {
    throw new BadRequestError('Slot rekening transfer bank tidak valid.');
  }

  const method = await findPaymentMethod(BANK_TRANSFER_CODE);
  const config = mergeConfig(method.code, method.config);
  const accounts = getBankAccounts(config).map((account) => (
    account.id === normalizedAccountId
      ? { ...account, savingsBookAttachmentUrl: `/uploads/${file.filename}` }
      : account
  ));
  const primaryAccount = accounts[0];

  const updated = await prisma.paymentMethod.update({
    where: { code: BANK_TRANSFER_CODE },
    data: {
      config: toPrismaJson({
        ...config,
        bankName: primaryAccount.bankName,
        accountNumber: primaryAccount.accountNumber,
        accountHolder: primaryAccount.accountHolder,
        savingsBookAttachmentUrl: primaryAccount.savingsBookAttachmentUrl,
        bankAccounts: accounts,
      }),
    },
  });

  return serializePaymentMethod(updated);
}

export async function resolveActivePaymentMethodForOrder(code: string, bankAccountId?: string) {
  const method = await findPaymentMethod(code);
  const serialized = serializePaymentMethod(method);

  if (!serialized.isUsable) {
    throw new BadRequestError('Metode pembayaran tidak tersedia. Silakan pilih metode pembayaran lain.');
  }

  if (method.code === BANK_TRANSFER_CODE) {
    const accounts = getUsableBankAccounts(serialized.config);
    const selectedAccount = accounts.find((account) => account.id === bankAccountId) ?? (accounts.length === 1 ? accounts[0] : null);

    if (!selectedAccount) {
      throw new BadRequestError('Pilih salah satu rekening transfer bank.');
    }

    const snapshot = {
      bankName: selectedAccount.bankName,
      accountNumber: selectedAccount.accountNumber,
      accountHolder: selectedAccount.accountHolder,
      instructions: serialized.config.instructions,
    };

    return {
      code: method.code,
      label: selectedAccount.bankName || method.label,
      category: method.category,
      config: snapshot,
    };
  }

  return {
    code: method.code,
    label: method.label,
    category: method.category,
    config: asConfig(method.config),
  };
}
