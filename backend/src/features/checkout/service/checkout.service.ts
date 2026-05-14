import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { Role } from '@prisma/client';
import { prisma } from '../../../core/config/database';
import { env } from '../../../core/config/env';
import { BadRequestError } from '../../../core/utils/errors';
import type { CheckoutCustomerBody } from '../schema/checkout.schema';

const DEFAULT_SHIPPING_ORIGIN_CITY = 'Jakarta Timur';

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

function normalizeText(value: string) {
  return value.toLowerCase().replace(/^(kota|kabupaten|kab\.?)\s+/i, '').trim();
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
        ...(init?.headers || {}),
      },
    });
  } catch {
    throw new BadRequestError('Gagal terhubung ke RajaOngkir. Periksa koneksi internet backend atau status layanan RajaOngkir.');
  } finally {
    clearTimeout(timeout);
  }
  const json = await response.json() as any;
  if (!response.ok || json.rajaongkir?.status?.code >= 400) {
    throw new BadRequestError(json.rajaongkir?.status?.description || 'Gagal mengambil data RajaOngkir');
  }
  return json.rajaongkir;
}

async function findRajaOngkirCityId(cityName: string) {
  const keyword = normalizeText(cityName);
  const data = await fetchRajaOngkir('/city');
  const cities = data.results || [];
  const city = cities.find((item: any) => normalizeText(`${item.type} ${item.city_name}`) === keyword)
    || cities.find((item: any) => normalizeText(item.city_name) === keyword)
    || cities.find((item: any) => normalizeText(item.city_name).includes(keyword) || keyword.includes(normalizeText(item.city_name)));

  if (!city) {
    throw new BadRequestError('Kota tujuan belum ditemukan di RajaOngkir.');
  }

  return city.city_id;
}

async function resolveOriginCityId() {
  return findRajaOngkirCityId(DEFAULT_SHIPPING_ORIGIN_CITY);
}

export async function getShippingRates(destinationCity: string, weightGram: number) {
  void destinationCity;
  void weightGram;

  return [
    {
      id: 'temporary-free-shipping',
      courier: 'EKSPEDISI',
      name: 'Ekspedisi',
      service: 'Ongkir sementara',
      description: 'Ongkir sementara Rp0',
      price: 0,
      etd: '-',
    },
  ];
}
