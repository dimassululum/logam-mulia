import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { Role } from '@prisma/client';
import { prisma } from '../../../core/config/database';
import type { CheckoutCustomerBody } from '../schema/checkout.schema';

const SHIPPING_COURIERS = [
  { code: 'jne', courier: 'JNE', name: 'JNE', price: 15000, etd: '2-4 hari' },
  { code: 'jnt', courier: 'JNT', name: 'J&T Express', price: 15000, etd: '2-4 hari' },
  { code: 'paxel', courier: 'PAXEL', name: 'Paxel', price: 50000, etd: '1-2 hari' },
] as const;

type ShippingRateRequest = {
  destinationCity: string;
  destinationId?: number;
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
    rajaOngkirDestinationId: address.rajaOngkirDestinationId,
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
      rajaOngkirDestinationId: input.rajaOngkirDestinationId || null,
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

function normalizeText(value?: string | null) {
  return (value || '')
    .toLowerCase()
    .replace(/^(kota|kabupaten|kab\.?)\s+/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function mapNamedItem(item: any): RajaOngkirNamedItem {
  return {
    id: Number(item.id),
    name: String(item.name || '').trim(),
    zipCode: item.zip_code ? String(item.zip_code).trim() : undefined,
  };
}

function hasCleanName(item: any) {
  const name = String(item.name || '').trim();
  return Boolean(name && name !== '-');
}

function cacheKey(path: string) {
  return `GET:${path}:`;
}

function getCachedPayloadRows(payload: unknown) {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === 'object' && Array.isArray((payload as { data?: unknown }).data)) {
    return (payload as { data: unknown[] }).data;
  }
  return [];
}

async function getCachedLocationRows(path: string) {
  const cached = await prisma.rajaOngkirCache.findUnique({ where: { cacheKey: cacheKey(path) } });
  return cached ? getCachedPayloadRows(cached.payload) : [];
}

async function hasCachedLocationRows(path: string) {
  const rows = await getCachedLocationRows(path);
  return rows.length > 0;
}

async function hasCompleteDistrict(district: any) {
  return hasCachedLocationRows(`/destination/sub-district/${Number(district.id)}`);
}

async function hasCompleteCity(city: any) {
  const districts = await getCachedLocationRows(`/destination/district/${Number(city.id)}`);
  for (const district of districts) {
    if (await hasCompleteDistrict(district)) return true;
  }
  return false;
}

async function hasCompleteProvince(province: any) {
  const cities = await getCachedLocationRows(`/destination/city/${Number(province.id)}`);
  for (const city of cities) {
    if (await hasCompleteCity(city)) return true;
  }
  return false;
}

async function takeFirstComplete<T>(rows: T[], predicate: (row: T) => Promise<boolean>) {
  for (const row of [...rows].sort((a: any, b: any) => Number(hasCleanName(b)) - Number(hasCleanName(a)))) {
    if (await predicate(row)) return [row];
  }
  return [];
}

async function findCachedDistrictName(districtId: number) {
  const cachedDistrictPages = await prisma.rajaOngkirCache.findMany({
    where: { cacheKey: { startsWith: 'GET:/destination/district/' } },
  });
  for (const page of cachedDistrictPages) {
    const district = getCachedPayloadRows(page.payload).find((item: any) => Number(item.id) === districtId);
    if (district && hasCleanName(district)) return String(district.name).trim();
  }
  return 'Kelurahan tujuan';
}

export async function getRajaOngkirProvinces() {
  const rows = await getCachedLocationRows('/destination/province');
  const connectedRows = await takeFirstComplete(rows, hasCompleteProvince);
  return connectedRows.map(mapNamedItem);
}

export async function getRajaOngkirCities(provinceId: number) {
  const rows = await getCachedLocationRows(`/destination/city/${provinceId}`);
  const connectedRows = await takeFirstComplete(rows, hasCompleteCity);
  return connectedRows.map(mapNamedItem);
}

export async function getRajaOngkirDistricts(cityId: number) {
  const rows = await getCachedLocationRows(`/destination/district/${cityId}`);
  const connectedRows = await takeFirstComplete(rows, hasCompleteDistrict);
  return connectedRows.map(mapNamedItem);
}

export async function getRajaOngkirSubdistricts(districtId: number) {
  const rows = await getCachedLocationRows(`/destination/sub-district/${districtId}`);
  const [row] = [...rows].sort((a: any, b: any) => Number(hasCleanName(b)) - Number(hasCleanName(a)));
  if (!row) return [];

  const fallbackName = await findCachedDistrictName(districtId);
  return [{
    id: Number(row.id),
    name: hasCleanName(row) ? String(row.name).trim() : fallbackName,
    zipCode: row.zip_code ? String(row.zip_code).trim() : undefined,
  }];
}

export async function searchRajaOngkirDestinations(search: string) {
  const keyword = search.trim();
  const normalizedKeyword = normalizeText(keyword);
  const cachedPages = await prisma.rajaOngkirCache.findMany({
    where: { cacheKey: { startsWith: 'GET:/destination/domestic-destination?' } },
  });
  const all = cachedPages.flatMap((page) => getCachedPayloadRows(page.payload));

  const seen = new Set<number>();
  const uniqueRows = all.filter((item) => {
    const id = Number(item.id);
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });

  return uniqueRows
    .filter((item) => {
      const searchable = [
        item.label,
        item.province_name,
        item.city_name,
        item.district_name,
        item.subdistrict_name,
        item.zip_code,
      ].map((value) => normalizeText(String(value || ''))).join(' ');
      return searchable.includes(normalizedKeyword);
    })
    .map(mapDestination);
}

function fallbackShippingRate(courier: typeof SHIPPING_COURIERS[number]): ShippingRate {
  return {
    id: `${courier.code}-regular`,
    courier: courier.courier,
    name: courier.name,
    service: 'Reguler',
    description: 'Tarif statik ekspedisi',
    price: courier.price,
    etd: courier.etd,
  };
}

export async function getShippingRates(input: ShippingRateRequest) {
  void input;
  return SHIPPING_COURIERS.map(fallbackShippingRate);
}
