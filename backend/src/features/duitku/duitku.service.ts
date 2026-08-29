import crypto from 'crypto';
import { Prisma } from '@prisma/client';
import { env } from '../../core/config/env';
import { BadRequestError, ForbiddenError } from '../../core/utils/errors';

export type DuitkuMethodCode =
  | 'duitku_bri_va'
  | 'duitku_bni_va'
  | 'duitku_mandiri_va'
  | 'duitku_cimb_va'
  | 'duitku_bsi_va'
  | 'duitku_danamon_va'
  | 'duitku_permata_va'
  | 'duitku_maybank_va'
  | 'duitku_sampoerna_va'
  | 'duitku_artha_graha_va'
  | 'duitku_neo_va'
  | 'duitku_alfamart'
  | 'duitku_pegadaian'
  | 'duitku_pos';

export interface DuitkuCustomerDetails {
  firstName: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  postalCode?: string | null;
}

export interface ChargeDuitkuInput {
  orderId: string;
  grossAmount: number;
  methodCode: DuitkuMethodCode;
  customer: DuitkuCustomerDetails;
}

export interface DuitkuInquiryResponse {
  merchantCode?: string;
  reference?: string;
  paymentUrl?: string;
  vaNumber?: string;
  amount?: string | number;
  statusCode?: string;
  statusMessage?: string;
  qrString?: string;
  [key: string]: unknown;
}

export interface DuitkuCallbackPayload {
  merchantCode?: string;
  amount?: string;
  merchantOrderId?: string;
  productDetail?: string;
  additionalParam?: string;
  paymentCode?: string;
  resultCode?: string;
  merchantUserId?: string;
  reference?: string;
  signature?: string;
  publisherOrderId?: string;
  settlementDate?: string;
  [key: string]: unknown;
}

export interface DuitkuStatusResponse {
  merchantOrderId?: string;
  reference?: string;
  amount?: string;
  fee?: string;
  statusCode?: string;
  statusMessage?: string;
  [key: string]: unknown;
}

export interface ParsedDuitkuPayment {
  reference?: string;
  paymentUrl?: string;
  vaNumber?: string;
  qrString?: string;
  amount?: number;
  statusCode?: string;
  statusMessage?: string;
  paymentCode?: string;
  publisherOrderId?: string;
  settlementDate?: string;
  rawResponse: Prisma.InputJsonObject;
}

export const DUITKU_METHOD_CODES: DuitkuMethodCode[] = [
  'duitku_bri_va',
  'duitku_bni_va',
  'duitku_mandiri_va',
  'duitku_cimb_va',
  'duitku_bsi_va',
  'duitku_danamon_va',
  'duitku_permata_va',
  'duitku_maybank_va',
  'duitku_sampoerna_va',
  'duitku_artha_graha_va',
  'duitku_neo_va',
  'duitku_alfamart',
  'duitku_pegadaian',
  'duitku_pos',
];

const DUITKU_CHANNEL_BY_METHOD: Record<DuitkuMethodCode, string> = {
  duitku_bri_va: 'BR',
  duitku_bni_va: 'I1',
  duitku_mandiri_va: 'M2',
  duitku_cimb_va: 'B1',
  duitku_bsi_va: 'BV',
  duitku_danamon_va: 'DM',
  duitku_permata_va: 'BT',
  duitku_maybank_va: 'VA',
  duitku_sampoerna_va: 'S1',
  duitku_artha_graha_va: 'AG',
  duitku_neo_va: 'NC',
  duitku_alfamart: 'FT',
  duitku_pegadaian: 'FT',
  duitku_pos: 'FT',
};

const API_BASE_URL = env.DUITKU_IS_PRODUCTION
  ? 'https://passport.duitku.com'
  : 'https://sandbox.duitku.com';
const DUITKU_BANK_DISPLAY_NAME = 'PT. Butik Emas LM';

function ensureDuitkuCredentials() {
  if (!env.DUITKU_MERCHANT_CODE || !env.DUITKU_API_KEY) {
    throw new BadRequestError('DUITKU_MERCHANT_CODE dan DUITKU_API_KEY belum diisi di environment backend.');
  }
}

function hmacSha256(value: string) {
  ensureDuitkuCredentials();
  return crypto.createHmac('sha256', env.DUITKU_API_KEY).update(value).digest('hex');
}

function asString(value: unknown) {
  return typeof value === 'string' ? value : undefined;
}

function asAmount(value: unknown) {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : undefined;
}

function parseDuitkuResponse(response: Record<string, unknown>): ParsedDuitkuPayment {
  return {
    reference: asString(response.reference),
    paymentUrl: asString(response.paymentUrl),
    vaNumber: asString(response.vaNumber),
    qrString: asString(response.qrString),
    amount: asAmount(response.amount),
    statusCode: asString(response.statusCode),
    statusMessage: asString(response.statusMessage),
    paymentCode: asString(response.paymentCode),
    publisherOrderId: asString(response.publisherOrderId),
    settlementDate: asString(response.settlementDate),
    rawResponse: response as Prisma.InputJsonObject,
  };
}

export function getDuitkuChannelCode(methodCode: DuitkuMethodCode) {
  return DUITKU_CHANNEL_BY_METHOD[methodCode];
}

export function extractDuitkuMethodCode(value: string): DuitkuMethodCode | null {
  return DUITKU_METHOD_CODES.includes(value as DuitkuMethodCode)
    ? (value as DuitkuMethodCode)
    : null;
}

export function parseDuitkuPayment(response: Record<string, unknown>) {
  return parseDuitkuResponse(response);
}

export function parseDuitkuCallback(payload: DuitkuCallbackPayload): ParsedDuitkuPayment {
  return parseDuitkuResponse({
    ...payload,
    reference: payload.reference,
    statusCode: payload.resultCode,
    statusMessage: payload.resultCode === '00' ? 'SUCCESS' : payload.resultCode === '02' ? 'CANCELED' : 'PENDING',
  } as Record<string, unknown>);
}

export async function chargeDuitkuPayment(input: ChargeDuitkuInput) {
  ensureDuitkuCredentials();

  const paymentAmount = Math.round(input.grossAmount);
  const signature = hmacSha256(`${env.DUITKU_MERCHANT_CODE}${input.orderId}${paymentAmount}`);
  const callbackUrl = `${env.PUBLIC_API_URL}/api/duitku/callback`;
  const returnUrl = `${env.FRONTEND_URL}/payment/duitku`;
  const customerName = input.customer.firstName.slice(0, 20) || 'Customer LM';

  const params = {
    merchantCode: env.DUITKU_MERCHANT_CODE,
    paymentAmount,
    paymentMethod: getDuitkuChannelCode(input.methodCode),
    merchantOrderId: input.orderId,
    productDetails: `Pembayaran ${input.orderId}`,
    additionalParam: '',
    merchantUserInfo: input.customer.email,
    customerVaName: DUITKU_BANK_DISPLAY_NAME,
    email: input.customer.email,
    phoneNumber: input.customer.phone || '',
    customerDetail: {
      firstName: customerName,
      email: input.customer.email,
      phoneNumber: input.customer.phone || '',
      billingAddress: {
        firstName: customerName,
        address: input.customer.address || '',
        city: input.customer.city || '',
        postalCode: input.customer.postalCode || '',
        phone: input.customer.phone || '',
        countryCode: 'ID',
      },
      shippingAddress: {
        firstName: customerName,
        address: input.customer.address || '',
        city: input.customer.city || '',
        postalCode: input.customer.postalCode || '',
        phone: input.customer.phone || '',
        countryCode: 'ID',
      },
    },
    callbackUrl,
    returnUrl,
    signature,
    expiryPeriod: env.DUITKU_EXPIRY_MINUTES,
  };

  const response = await fetch(`${API_BASE_URL}/webapi/api/merchant/v2/inquiry`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });
  const json = await response.json() as Record<string, unknown>;

  if (!response.ok) {
    const message = asString(json.Message) || asString(json.message) || asString(json.statusMessage) || 'Gagal membuat transaksi Duitku.';
    throw new BadRequestError(message);
  }

  return parseDuitkuPayment(json);
}

export async function getDuitkuTransactionStatus(orderId: string): Promise<DuitkuStatusResponse> {
  ensureDuitkuCredentials();

  const signature = hmacSha256(`${env.DUITKU_MERCHANT_CODE}${orderId}`);
  const response = await fetch(`${API_BASE_URL}/webapi/api/merchant/transactionStatus`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      merchantCode: env.DUITKU_MERCHANT_CODE,
      merchantOrderId: orderId,
      signature,
    }),
  });
  const json = await response.json() as DuitkuStatusResponse & { Message?: string; message?: string };

  if (!response.ok) {
    throw new BadRequestError(json.Message || json.message || json.statusMessage || 'Gagal mengambil status transaksi Duitku.');
  }

  return json;
}

export function verifyDuitkuCallbackSignature(payload: DuitkuCallbackPayload) {
  ensureDuitkuCredentials();

  const merchantOrderId = payload.merchantOrderId;
  const amount = payload.amount;
  if (!merchantOrderId || !amount) {
    throw new BadRequestError('merchantOrderId atau amount Duitku tidak tersedia.');
  }

  const expected = hmacSha256(`${env.DUITKU_MERCHANT_CODE}${amount}${merchantOrderId}`);
  if (!payload.signature || payload.signature !== expected) {
    throw new ForbiddenError('Signature Duitku tidak valid.');
  }
}
