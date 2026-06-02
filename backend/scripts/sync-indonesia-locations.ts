import dotenv from 'dotenv';
import path from 'path';
import { PrismaClient } from '@prisma/client';

type SourceRow = {
  id: string;
  name: string;
};

type CacheRow = {
  id: number;
  name: string;
  source_id?: string;
};

type Stats = {
  fetched: number;
  cached: number;
  skipped: number;
  failed: number;
};

const prisma = new PrismaClient();
const args = new Set(process.argv.slice(2));
const execute = args.has('--execute');
const clearExisting = args.has('--clear-existing');
const skipExisting = args.has('--skip-existing');
const envFileArg = process.argv.find((arg) => arg.startsWith('--env-file='));
const envFile = envFileArg ? envFileArg.split('=').slice(1).join('=') : '../.env.production';
const maxProvinces = readNumberArg('--max-provinces');
const maxCities = readNumberArg('--max-cities');
const maxDistricts = readNumberArg('--max-districts');

dotenv.config({ path: path.resolve(process.cwd(), envFile) });
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config();

const sourceBaseUrl = (process.env.INDONESIA_LOCATION_BASE_URL || 'https://www.emsifa.com/api-wilayah-indonesia/api').replace(/\/+$/, '');
const cacheTtlDays = Number(process.env.LOCATION_CACHE_TTL_DAYS || 3650);
const concurrency = Number(process.env.LOCATION_SYNC_CONCURRENCY || 8);
const maxRetries = Number(process.env.LOCATION_SYNC_RETRIES || 3);

function readNumberArg(name: string) {
  const arg = process.argv.find((value) => value.startsWith(`${name}=`));
  if (!arg) return null;
  const value = Number(arg.split('=').slice(1).join('='));
  return Number.isFinite(value) && value > 0 ? value : null;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function cacheKey(apiPath: string) {
  return `GET:${apiPath}:`;
}

function toNumericId(id: string) {
  return Number(id.replace(/\D/g, ''));
}

function toStableIntId(id: string) {
  let hash = 2166136261;
  for (const char of id) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  return 100000000 + (hash % 1900000000);
}

function mapStandardRow(row: SourceRow): CacheRow {
  return {
    id: toNumericId(row.id),
    name: row.name.trim(),
    source_id: row.id,
  };
}

function mapVillageRow(row: SourceRow): CacheRow {
  return {
    id: toStableIntId(row.id),
    name: row.name.trim(),
    source_id: row.id,
  };
}

function limitRows<T>(rows: T[], max: number | null) {
  return max ? rows.slice(0, max) : rows;
}

async function existingRows(apiPath: string) {
  const cached = await prisma.rajaOngkirCache.findUnique({ where: { cacheKey: cacheKey(apiPath) } });
  if (!cached) return [];
  if (Array.isArray(cached.payload)) return cached.payload as CacheRow[];
  if (cached.payload && typeof cached.payload === 'object' && Array.isArray((cached.payload as { data?: unknown }).data)) {
    return (cached.payload as { data: CacheRow[] }).data;
  }
  return [];
}

async function fetchSourceRows(endpoint: string) {
  const url = `${sourceBaseUrl}${endpoint}`;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
    try {
      const response = await fetch(url);
      const json = await response.json() as unknown;
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
      if (!Array.isArray(json)) throw new Error(`Unexpected response for ${endpoint}`);
      return json as SourceRow[];
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries) await sleep(400 * attempt);
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

async function cacheRows(apiPath: string, rows: CacheRow[]) {
  const expiresAt = new Date(Date.now() + cacheTtlDays * 24 * 60 * 60 * 1000);
  await prisma.rajaOngkirCache.upsert({
    where: { cacheKey: cacheKey(apiPath) },
    update: {
      payload: rows,
      expiresAt,
      updatedAt: new Date(),
    },
    create: {
      cacheKey: cacheKey(apiPath),
      payload: rows,
      expiresAt,
    },
  });
}

async function loadPage(apiPath: string, sourceEndpoint: string, mapper: (row: SourceRow) => CacheRow, stats: Stats) {
  if (skipExisting) {
    const rows = await existingRows(apiPath);
    if (rows.length > 0) {
      stats.skipped += 1;
      return rows;
    }
  }

  const sourceRows = await fetchSourceRows(sourceEndpoint);
  const rows = sourceRows.map(mapper).filter((row) => Number.isFinite(row.id) && row.name);
  stats.fetched += 1;

  if (execute) {
    await cacheRows(apiPath, rows);
    stats.cached += 1;
  }

  return rows;
}

async function mapWithConcurrency<T, R>(items: T[], worker: (item: T, index: number) => Promise<R>) {
  const results: R[] = [];
  let nextIndex = 0;

  async function runWorker() {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await worker(items[index], index);
    }
  }

  const workerCount = Math.max(1, Math.min(concurrency, items.length));
  await Promise.all(Array.from({ length: workerCount }, runWorker));
  return results;
}

async function sync() {
  const stats: Stats = { fetched: 0, cached: 0, skipped: 0, failed: 0 };

  console.log(`Indonesia location sync ${execute ? 'EXECUTE' : 'DRY RUN'}`);
  console.log(`Source URL: ${sourceBaseUrl}`);
  console.log(`DB write: ${execute ? 'enabled' : 'disabled'}; clear=${clearExisting}; skipExisting=${skipExisting}; concurrency=${concurrency}`);

  if (clearExisting && execute) {
    const deleted = await prisma.rajaOngkirCache.deleteMany({
      where: { cacheKey: { startsWith: 'GET:/destination/' } },
    });
    console.log(`clearedLocationCache=${deleted.count}`);
  }

  const provinceRows = await loadPage('/destination/province', '/provinces.json', mapStandardRow, stats);
  const provinces = limitRows(provinceRows, maxProvinces);
  console.log(`provinces=${provinceRows.length}${maxProvinces ? ` limited=${provinces.length}` : ''}`);

  const cityGroups = await mapWithConcurrency(provinces, async (province, index) => {
    const rows = await loadPage(`/destination/city/${province.id}`, `/regencies/${province.source_id || province.id}.json`, mapStandardRow, stats);
    console.log(`province ${index + 1}/${provinces.length}: id=${province.id} cities=${rows.length}`);
    return limitRows(rows, maxCities).map((city) => ({ ...city, provinceId: province.id }));
  });
  const cities = cityGroups.flat();
  const totalCities = cityGroups.reduce((sum, rows) => sum + rows.length, 0);
  console.log(`cities=${totalCities}${maxCities ? ` limited=${cities.length}` : ''}`);

  const districtGroups = await mapWithConcurrency(cities, async (city, index) => {
    try {
      const rows = await loadPage(`/destination/district/${city.id}`, `/districts/${city.source_id || city.id}.json`, mapStandardRow, stats);
      if ((index + 1) % 50 === 0 || index + 1 === cities.length) {
        console.log(`district pages ${index + 1}/${cities.length}`);
      }
      return limitRows(rows, maxDistricts).map((district) => ({ ...district, cityId: city.id }));
    } catch (error) {
      stats.failed += 1;
      console.error(`failed districts/${city.source_id || city.id}: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  });
  const districts = districtGroups.flat();
  const totalDistricts = districtGroups.reduce((sum, rows) => sum + rows.length, 0);
  console.log(`districts=${totalDistricts}${maxDistricts ? ` limited=${districts.length}` : ''}`);

  let totalVillages = 0;
  await mapWithConcurrency(districts, async (district, index) => {
    try {
      const rows = await loadPage(`/destination/sub-district/${district.id}`, `/villages/${district.source_id || district.id}.json`, mapVillageRow, stats);
      totalVillages += rows.length;
      if ((index + 1) % 250 === 0 || index + 1 === districts.length) {
        console.log(`village pages ${index + 1}/${districts.length}; villages=${totalVillages}`);
      }
    } catch (error) {
      stats.failed += 1;
      console.error(`failed villages/${district.source_id || district.id}: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

  console.log(JSON.stringify({
    ...stats,
    provinces: provinceRows.length,
    cities: totalCities,
    districts: totalDistricts,
    villages: totalVillages,
  }, null, 2));
}

sync()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
