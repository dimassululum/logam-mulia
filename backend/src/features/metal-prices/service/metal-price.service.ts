import type { MetalType, Prisma } from '@prisma/client';
import { prisma } from '../../../core/config/database';
import type { UpdateMetalPricesInput } from '../schema/metal-price.schema';

const historyDays = 7;
const GOLD: MetalType = 'GOLD';
const SILVER: MetalType = 'SILVER';

function toNumber(value: Prisma.Decimal | number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function serializePrice(record: {
  id: string;
  metal: MetalType;
  price: Prisma.Decimal;
  recordedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: record.id,
    metal: record.metal,
    price: toNumber(record.price) ?? 0,
    recordedAt: record.recordedAt.toISOString(),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function getSevenDaysAgo() {
  const date = new Date();
  date.setDate(date.getDate() - historyDays);
  return date;
}

async function getMetalSummary(metal: MetalType) {
  const [current, previous, history] = await Promise.all([
    prisma.metalPrice.findFirst({
      where: { metal },
      orderBy: { recordedAt: 'desc' },
    }),
    prisma.metalPrice.findMany({
      where: { metal },
      orderBy: { recordedAt: 'desc' },
      skip: 1,
      take: 1,
    }),
    prisma.metalPrice.findMany({
      where: {
        metal,
        recordedAt: { gte: getSevenDaysAgo() },
      },
      orderBy: { recordedAt: 'desc' },
      take: 7,
    }),
  ]);

  const currentPrice = current ? toNumber(current.price) : null;
  const previousPrice = previous[0] ? toNumber(previous[0].price) : null;
  const changePercent =
    currentPrice !== null && previousPrice && previousPrice > 0
      ? ((currentPrice - previousPrice) / previousPrice) * 100
      : null;

  return {
    metal,
    current: current ? serializePrice(current) : null,
    previous: previous[0] ? serializePrice(previous[0]) : null,
    changePercent,
    history: history.map(serializePrice),
  };
}

export async function getMetalPricesSummary() {
  const [gold, silver] = await Promise.all([
    getMetalSummary(GOLD),
    getMetalSummary(SILVER),
  ]);

  return { gold, silver };
}

export async function updateMetalPrices(input: UpdateMetalPricesInput) {
  const operations: Prisma.PrismaPromise<unknown>[] = [];
  const now = new Date();

  if (input.goldPrice !== undefined) {
    operations.push(prisma.metalPrice.create({
      data: { metal: GOLD, price: input.goldPrice, recordedAt: now },
    }));
  }

  if (input.silverPrice !== undefined) {
    operations.push(prisma.metalPrice.create({
      data: { metal: SILVER, price: input.silverPrice, recordedAt: now },
    }));
  }

  await prisma.$transaction(operations);
  return getMetalPricesSummary();
}
