import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { Role } from '@prisma/client';
import { prisma } from '../../../core/config/database';
import { env } from '../../../core/config/env';
import { BadRequestError } from '../../../core/utils/errors';
import type { CheckoutCustomerBody } from '../schema/checkout.schema';

const SHIPPING_COURIERS = [
  { code: 'jne', courier: 'JNE', name: 'JNE' },
  { code: 'jnt', courier: 'JNT', name: 'J&T Express' },
] as const;

type ShippingRateRequest = {
  destinationCity: string;
  destinationDistrict?: string;
  destinationVillage?: string;
  destinationPostalCode?: string;
  weightGram: number;
};

type ShippingRate = {
  id: string;
  courier: string;
  name: string;
  service: string;
  description: string;
  price: number;
  etd: string;
};

type RajaOngkirDestination = {
  id: number;
  label: string;
  province: string;
  city: string;
  district: string;
  village: string;
  postalCode: string;
};

type RajaOngkirNamedItem = {
  id: number;
  name: string;
  zipCode?: string;
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function toPublicKtpUrl(path: string | null) {
  if (!path) return null;
  return path.startsWith('/uploads/') ? path : `/uploads/${path}`;
}

function mapAddress(address: any, user: { name: string; phone: string | null }) {
  return {
    id: address.id,
    fullName: address.fullName || address.label || user.name,
    phone: address.phone || user.phone || '',
    address: address.address,
    city: address.city,
    district: address.district || '',
    village: address.village || '',
    province: address.province,
    postalCode: address.postalCode,
    isDefault: address.isDefault,
  };
}

export async function lookupCheckoutCustomer(email: string) {
  const normalizedEmail = normalizeEmail(email);
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    include: {
      addresses: { orderBy: [{ isDefault: 'desc' }, { id: 'asc' }] },
      _count: { select: { orders: true } },
    },
  });

  if (!user) {
    return {
      email: normalizedEmail,
      found: false,
      hasKtp: false,
      hasOrders: false,
      ordererName: '',
      phone: '',
      ktpUrl: null,
      addresses: [],
    };
  }

  return {
    email: user.email,
    found: true,
    hasKtp: Boolean(user.ktpUrl),
    hasOrders: user._count.orders > 0,
    ordererName: user.name,
    phone: user.phone || '',
    ktpUrl: toPublicKtpUrl(user.ktpUrl),
    addresses: user.addresses.map((address) => mapAddress(address, user)),
  };
}

export async function saveCheckoutCustomer(input: CheckoutCustomerBody, ktpFile?: Express.Multer.File) {
  const email = normalizeEmail(input.email);
  const existing = await prisma.user.findUnique({ where: { email } });
  const ktpUrl = ktpFile ? `/uploads/${ktpFile.filename}` : undefined;

  const user = existing
    ? await prisma.user.update({
        where: { id: existing.id },
        data: {
          name: input.name.trim(),
          phone: input.phone || existing.phone,
          ...(ktpUrl && { ktpUrl, isKycVerified: true }),
        },
      })
    : await prisma.user.create({
        data: {
          email,
          name: input.name.trim(),
          phone: input.phone,
          passwordHash: await bcrypt.hash(crypto.randomUUID(), 12),
          role: Role.CUSTOMER,
          ...(ktpUrl && { ktpUrl, isKycVerified: true }),
        },
      });

  const hasAddressPayload = Boolean(input.address && input.city && input.province && input.postalCode);
  if (hasAddressPayload) {
    const addressData = {
      label: input.addressFullName || input.name,
      fullName: input.addressFullName || input.name,
      phone: input.addressPhone || input.phone || user.phone || '',
      address: input.address!,
      city: input.city!,
      district: input.district || null,
      village: input.village || null,
      province: input.province!,
      postalCode: input.postalCode!,
      isDefault: true,
    };

    if (input.addressId) {
      await prisma.address.update({
        where: { id: input.addressId },
        data: addressData,
      });
    } else {
      await prisma.address.updateMany({
        where: { userId: user.id },
        data: { isDefault: false },
      });
      await prisma.address.create({
        data: {
          userId: user.id,
          ...addressData,
        },
      });
    }
  }

  return lookupCheckoutCustomer(email);
}

function normalizeText(value?: string | null) {
  return (value || '')
    .toLowerCase()
    .replace(/^(kota|kabupaten|kab\.?)\s+/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function compact(values: Array<string | undefined | null>) {
  return values.map((value) => value?.trim()).filter(Boolean) as string[];
}

function unique(values: string[]) {
  return Array.from(new Set(values));
}

async function fetchRajaOngkir(path: string, init?: RequestInit) {
  if (!env.RAJAONGKIR_API_KEY) {
    throw new BadRequestError('RAJAONGKIR_API_KEY belum diset di backend.');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  let response: Response;
  try {
    response = await fetch(`${env.RAJAONGKIR_BASE_URL}${path}`, {
      ...init,
      signal: init?.signal || controller.signal,
      headers: {
        key: env.RAJAONGKIR_API_KEY,
        Authorization: `Bearer ${env.RAJAONGKIR_API_KEY}`,
        ...(init?.headers || {}),
      },
    });
  } catch (error) {
    console.error('RajaOngkir connection error:', error);
    throw new BadRequestError('Gagal terhubung ke RajaOngkir. Periksa koneksi internet backend atau status layanan RajaOngkir.');
  } finally {
    clearTimeout(timeout);
  }

  const json = await response.json().catch(() => null) as any;
  const statusCode = json?.meta?.code || json?.rajaongkir?.status?.code;
  if (!response.ok || statusCode >= 400) {
    const message = json?.meta?.message || json?.rajaongkir?.status?.description || 'Gagal mengambil data RajaOngkir';
    throw new BadRequestError(message);
  }

  return json;
}

function destinationSearchTerms(input: ShippingRateRequest | { destinationCity: string }) {
  const city = input.destinationCity;
  const district = 'destinationDistrict' in input ? input.destinationDistrict : undefined;
  const village = 'destinationVillage' in input ? input.destinationVillage : undefined;
  const postalCode = 'destinationPostalCode' in input ? input.destinationPostalCode : undefined;

  return unique([
    ...compact([postalCode]),
    compact([village, district, city]).join(' '),
    compact([district, city]).join(' '),
    city,
  ].filter(Boolean));
}

function scoreDestination(item: any, input: ShippingRateRequest | { destinationCity: string }) {
  const city = input.destinationCity;
  const district = 'destinationDistrict' in input ? input.destinationDistrict : undefined;
  const village = 'destinationVillage' in input ? input.destinationVillage : undefined;
  const postalCode = 'destinationPostalCode' in input ? input.destinationPostalCode : undefined;

  let score = 0;
  if (postalCode && String(item.zip_code || '') === postalCode) score += 20;
  if (normalizeText(item.city_name) === normalizeText(city)) score += 10;
  if (district && normalizeText(item.district_name) === normalizeText(district)) score += 6;
  if (village && normalizeText(item.subdistrict_name) === normalizeText(village)) score += 4;

  const label = normalizeText(item.label);
  for (const part of compact([village, district, city])) {
    if (label.includes(normalizeText(part))) score += 1;
  }

  return score;
}

async function findRajaOngkirDestinationId(input: ShippingRateRequest | { destinationCity: string }) {
  for (const term of destinationSearchTerms(input)) {
    const params = new URLSearchParams({ search: term, limit: '10', offset: '0' });
    const json = await fetchRajaOngkir(`/destination/domestic-destination?${params.toString()}`);
    const destinations = Array.isArray(json.data) ? json.data : [];
    if (destinations.length > 0) {
      const [best] = destinations.sort((a: any, b: any) => scoreDestination(b, input) - scoreDestination(a, input));
      return best.id;
    }
  }

  throw new BadRequestError('Kota tujuan belum ditemukan di RajaOngkir.');
}

function mapDestination(item: any): RajaOngkirDestination {
  return {
    id: Number(item.id),
    label: String(item.label || '').trim(),
    province: String(item.province_name || '').trim(),
    city: String(item.city_name || '').trim(),
    district: String(item.district_name || '').trim(),
    village: String(item.subdistrict_name || '').trim(),
    postalCode: String(item.zip_code || '').trim(),
  };
}

function mapNamedItem(item: any): RajaOngkirNamedItem {
  return {
    id: Number(item.id),
    name: String(item.name || '').trim(),
    zipCode: item.zip_code ? String(item.zip_code).trim() : undefined,
  };
}

export async function getRajaOngkirProvinces() {
  const json = await fetchRajaOngkir('/destination/province');
  const rows = Array.isArray(json.data) ? json.data : [];
  return rows.map(mapNamedItem);
}

export async function getRajaOngkirCities(provinceId: number) {
  const json = await fetchRajaOngkir(`/destination/city/${provinceId}`);
  const rows = Array.isArray(json.data) ? json.data : [];
  return rows.map(mapNamedItem);
}

export async function getRajaOngkirDistricts(cityId: number) {
  const json = await fetchRajaOngkir(`/destination/district/${cityId}`);
  const rows = Array.isArray(json.data) ? json.data : [];
  return rows.map(mapNamedItem);
}

export async function getRajaOngkirSubdistricts(districtId: number) {
  const json = await fetchRajaOngkir(`/destination/sub-district/${districtId}`);
  const rows = Array.isArray(json.data) ? json.data : [];
  return rows.map(mapNamedItem);
}

export async function searchRajaOngkirDestinations(search: string) {
  const keyword = search.trim();
  const limit = 100;
  const maxPages = 10;
  const all: any[] = [];

  for (let page = 0; page < maxPages; page += 1) {
    const params = new URLSearchParams({
      search: keyword,
      limit: String(limit),
      offset: String(page * limit),
    });

    const json = await fetchRajaOngkir(`/destination/domestic-destination?${params.toString()}`);
    const rows = Array.isArray(json.data) ? json.data : [];
    all.push(...rows);
    if (rows.length < limit) break;
  }

  const seen = new Set<number>();
  const uniqueRows = all.filter((item) => {
    const id = Number(item.id);
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });

  return uniqueRows.map(mapDestination);
}

function normalizeEtd(value: unknown) {
  const etd = String(value || '').trim();
  if (!etd || etd === '-') return '-';
  if (/days?/i.test(etd)) return etd.replace(/days?/i, 'hari');
  return etd.toLowerCase().includes('hari') ? etd : `${etd} hari`;
}

function fallbackShippingRate(courier: typeof SHIPPING_COURIERS[number]): ShippingRate {
  return {
    id: `${courier.code}-fallback`,
    courier: courier.courier,
    name: courier.name,
    service: 'Reguler',
    description: 'Ongkir belum tersedia dari RajaOngkir',
    price: 0,
    etd: '-',
  };
}

async function fetchCourierRate(originId: string | number, destinationId: string | number, weightGram: number, courier: typeof SHIPPING_COURIERS[number]) {
  const body = new URLSearchParams({
    origin: String(originId),
    destination: String(destinationId),
    weight: String(weightGram),
    courier: courier.code,
    price: 'lowest',
  });

  const json = await fetchRajaOngkir('/calculate/domestic-cost', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  const rates = (Array.isArray(json.data) ? json.data : []).map((item: any): ShippingRate => ({
    id: `${courier.code}-${String(item.service || item.description || 'regular').toLowerCase().replace(/\s+/g, '-')}`,
    courier: courier.courier,
    name: courier.name,
    service: item.service || 'Reguler',
    description: item.description || item.service || '',
    price: Number(item.cost || 0),
    etd: normalizeEtd(item.etd),
  })).filter((rate: ShippingRate) => rate.price > 0);

  return rates.sort((a: ShippingRate, b: ShippingRate) => a.price - b.price)[0] || fallbackShippingRate(courier);
}

export async function getShippingRates(input: ShippingRateRequest) {
  const [originId, destinationId] = await Promise.all([
    findRajaOngkirDestinationId({ destinationCity: env.RAJAONGKIR_ORIGIN_SEARCH }),
    findRajaOngkirDestinationId(input),
  ]);

  const rates = await Promise.all(SHIPPING_COURIERS.map(async (courier) => {
    try {
      return await fetchCourierRate(originId, destinationId, input.weightGram, courier);
    } catch (error) {
      console.warn(`RajaOngkir rate unavailable for ${courier.code}:`, error instanceof Error ? error.message : error);
      return fallbackShippingRate(courier);
    }
  }));

  return rates;
}
