import crypto from 'crypto';
import { Prisma } from '@prisma/client';
import { env } from '../../core/config/env';
import { BadRequestError, ForbiddenError } from '../../core/utils/errors';

export type MidtransMethodCode = 'bri_va' | 'bni_va' | 'mandiri_va' | 'cimb_va' | 'permata_va' | 'qris_midtrans';

export interface MidtransCustomerDetails {
  firstName: string;
  email: string;
  phone?: string | null;
}

export interface ChargeMidtransInput {
  orderId: string;
  grossAmount: number;
  methodCode: MidtransMethodCode;
  customer: MidtransCustomerDetails;
}

export interface MidtransNotificationPayload {
  order_id?: string;
  transaction_id?: string;
  status_code?: string;
  gross_amount?: string;
  signature_key?: string;
  payment_type?: string;
  transaction_status?: string;
  fraud_status?: string;
  settlement_time?: string;
  expiry_time?: string;
  [key: string]: unknown;
}

export interface ParsedMidtransPayment {
  transactionId?: string;
  paymentType?: string;
  transactionStatus?: string;
  fraudStatus?: string;
  vaNumber?: string;
  billKey?: string;
  billerCode?: string;
  qrString?: string;
  qrUrl?: string;
  expiryTime?: Date | null;
  rawResponse: Prisma.InputJsonObject;
}

const CORE_API_BASE_URL = env.MIDTRANS_IS_PRODUCTION
  ? 'https://api.midtrans.com'
  : 'https://api.sandbox.midtrans.com';
const MIDTRANS_DISPLAY_CUSTOMER_NAME = 'PT. Butik Emas LM';

function ensureServerKey() {
  if (!env.MIDTRANS_SERVER_KEY) {
    throw new BadRequestError('MIDTRANS_SERVER_KEY belum diisi di environment backend.');
  }
}

function getAuthHeader() {
  ensureServerKey();
  return `Basic ${Buffer.from(`${env.MIDTRANS_SERVER_KEY}:`).toString('base64')}`;
}

function parseDate(value: unknown) {
  if (typeof value !== 'string' || !value.trim()) return null;
  const normalized = value.includes('T') ? value : value.replace(' ', 'T');
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
}

function findActionUrl(response: Record<string, unknown>, actionName: string) {
  const actions = Array.isArray(response.actions) ? response.actions : [];
  const action = actions.find((item): item is Record<string, unknown> => (
    Boolean(item)
    && typeof item === 'object'
    && !Array.isArray(item)
    && item.name === actionName
    && typeof item.url === 'string'
  ));

  return typeof action?.url === 'string' ? action.url : undefined;
}

function buildChargePayload(input: ChargeMidtransInput) {
  const base = {
    transaction_details: {
      order_id: input.orderId,
      gross_amount: Math.round(input.grossAmount),
    },
    customer_details: {
      first_name: MIDTRANS_DISPLAY_CUSTOMER_NAME,
      email: input.customer.email,
      phone: input.customer.phone || undefined,
    },
  };

  if (input.methodCode === 'mandiri_va') {
    return {
      ...base,
      payment_type: 'echannel',
      echannel: {
        bill_info1: 'Payment:',
        bill_info2: input.orderId,
      },
    };
  }

  if (input.methodCode === 'qris_midtrans') {
    return {
      ...base,
      payment_type: 'gopay',
      gopay: {
        enable_callback: false,
      },
    };
  }

  if (input.methodCode === 'permata_va') {
    return {
      ...base,
      payment_type: 'permata',
    };
  }

  const bankByMethod: Record<Exclude<MidtransMethodCode, 'mandiri_va' | 'permata_va' | 'qris_midtrans'>, string> = {
    bri_va: 'bri',
    bni_va: 'bni',
    cimb_va: 'cimb',
  };

  return {
    ...base,
    payment_type: 'bank_transfer',
    bank_transfer: {
      bank: bankByMethod[input.methodCode],
    },
  };
}

export function parseMidtransPayment(response: Record<string, unknown>): ParsedMidtransPayment {
  const vaNumbers = Array.isArray(response.va_numbers) ? response.va_numbers : [];
  const firstVa = vaNumbers.find((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object' && !Array.isArray(item));
  const permataVaNumber = typeof response.permata_va_number === 'string' ? response.permata_va_number : undefined;
  const billKey = typeof response.bill_key === 'string' ? response.bill_key : undefined;
  const billerCode = typeof response.biller_code === 'string' ? response.biller_code : undefined;
  const qrString = typeof response.qr_string === 'string' ? response.qr_string : undefined;

  return {
    transactionId: typeof response.transaction_id === 'string' ? response.transaction_id : undefined,
    paymentType: typeof response.payment_type === 'string' ? response.payment_type : undefined,
    transactionStatus: typeof response.transaction_status === 'string' ? response.transaction_status : undefined,
    fraudStatus: typeof response.fraud_status === 'string' ? response.fraud_status : undefined,
    vaNumber: typeof firstVa?.va_number === 'string' ? firstVa.va_number : permataVaNumber,
    billKey,
    billerCode,
    qrString,
    qrUrl: findActionUrl(response, 'generate-qr-code') ?? findActionUrl(response, 'deeplink-redirect'),
    expiryTime: parseDate(response.expiry_time),
    rawResponse: response as Prisma.InputJsonObject,
  };
}

export async function chargeMidtransPayment(input: ChargeMidtransInput) {
  const response = await fetch(`${CORE_API_BASE_URL}/v2/charge`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: getAuthHeader(),
    },
    body: JSON.stringify(buildChargePayload(input)),
  });
  const json = await response.json() as Record<string, unknown>;

  if (!response.ok) {
    const message = typeof json.status_message === 'string' ? json.status_message : 'Gagal membuat transaksi Midtrans.';
    throw new BadRequestError(message);
  }

  return parseMidtransPayment(json);
}

export async function getMidtransTransactionStatus(orderId: string): Promise<MidtransNotificationPayload> {
  const response = await fetch(`${CORE_API_BASE_URL}/v2/${encodeURIComponent(orderId)}/status`, {
    headers: {
      Accept: 'application/json',
      Authorization: getAuthHeader(),
    },
  });
  const json = await response.json() as MidtransNotificationPayload & { status_message?: string };

  if (!response.ok) {
    throw new BadRequestError(json.status_message || 'Gagal mengambil status transaksi Midtrans.');
  }

  return json;
}

export function verifyMidtransSignature(payload: MidtransNotificationPayload) {
  ensureServerKey();
  const signatureSource = `${payload.order_id ?? ''}${payload.status_code ?? ''}${payload.gross_amount ?? ''}${env.MIDTRANS_SERVER_KEY}`;
  const expected = crypto.createHash('sha512').update(signatureSource).digest('hex');

  if (!payload.signature_key || payload.signature_key !== expected) {
    throw new ForbiddenError('Signature Midtrans tidak valid.');
  }
}

export function extractMidtransMethodCode(value: string): MidtransMethodCode | null {
  return ['bri_va', 'bni_va', 'mandiri_va', 'cimb_va', 'permata_va', 'qris_midtrans'].includes(value)
    ? (value as MidtransMethodCode)
    : null;
}
