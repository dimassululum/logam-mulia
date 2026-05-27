import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';

dotenv.config();

const prisma = new PrismaClient();
const BACKUP_DIR = process.env.DEMO_SEED_BACKUP_DIR || '/private/tmp/logam-mulia-demo-seed-backups';

interface DemoBoutiqueSeed {
  name: string;
  slug: string;
  city: string;
  address: string;
}

const boutiques: DemoBoutiqueSeed[] = [
  {
    name: 'BELM - Bintaro',
    slug: 'belm-bintaro',
    city: 'Tangerang Selatan',
    address: 'Ruko Kebayoran Arcade 2 Blok B No. 28, Jl. Boulevard Bintaro Jaya Sektor 7, Pondok Jaya, Kec. Pondok Aren, Tangerang Selatan, Banten 15224',
  },
  {
    name: 'BELM - Gedung Antam',
    slug: 'belm-gedung-antam',
    city: 'Jakarta Selatan',
    address: 'Gedung Aneka Tambang, Lantai 1. Jalan Let.jen. T.b. Simatupang, No.1 Lingkar Selatan, Tanjung Barat, Kel. Tanjung Barat, Kec. Jagakarsa, Kota Jakarta Selatan, Dki Jakarta 12530',
  },
  {
    name: 'BELM - Makassar',
    slug: 'belm-makassar',
    city: 'Makassar',
    address: 'Kantor Perwakilan PT ANTAM Tbk. Jalan Sam Ratulangi, No.60 Makassar, Sulawesi Selatan 90122',
  },
  {
    name: 'BELM - Juanda',
    slug: 'belm-juanda',
    city: 'Jakarta Pusat',
    address: 'Jl. Ir. Juanda Raya No. 31, Kel. Kebon Kelapa, Kec. Gambir, Jakarta Pusat, DKI Jakarta 10120',
  },
  {
    name: 'BELM - Puri Indah',
    slug: 'belm-puri-indah',
    city: 'Jakarta Barat',
    address: 'Ruko Puri Indah Sentra Niaga, Jl. Puri Indah Raya No.25 Blok T1, Kembangan Sel., Kec. Kembangan, Kota Jakarta Barat, Daerah Khusus Ibukota Jakarta 11610',
  },
  {
    name: 'BELM - Surabaya Pakuwon',
    slug: 'belm-surabaya-pakuwon',
    city: 'Surabaya',
    address: 'Ruko Puncak Bukit Golf unit RBK. Jl Bukit Darmo Boulevard No. 1 Kelurahan Pradah Kalikendal Kec. Dukuh Pakis, Kota Surabaya, Jawa Timur, 60226',
  },
  {
    name: 'BELM - Surabaya Darmo',
    slug: 'belm-surabaya-darmo',
    city: 'Surabaya',
    address: 'Jl. Raya Darmo No. 37 Keputran, Kec. Tegalsari, Kota Surabaya, Jawa Timur 60241',
  },
  {
    name: 'BELM - Denpasar Bali',
    slug: 'belm-denpasar-bali',
    city: 'Denpasar',
    address: 'Jl. Gatot Subroto Tengah No.80 Kav. No.7 Kel. Dangin Puri Kaja Kec. Denpasar Utara, Denpasar - Bali 80234',
  },
  {
    name: 'BELM - Pekanbaru',
    slug: 'belm-pekanbaru',
    city: 'Pekanbaru',
    address: 'Jalan Tuanku Tambusai No.318 A&B, Kel. Labu Baru Timur, Kec. Payung Sekaki, Pekanbaru, Riau 28292',
  },
  {
    name: 'BELM - Graha Dipta',
    slug: 'belm-graha-dipta',
    city: 'Jakarta Timur',
    address: 'Gedung Graha Dipta. Jalan Pemuda, No.1 Jatinegara Kaum, Pulo Gadung, Jakarta 13250',
  },
  {
    name: 'BELM - Palembang',
    slug: 'belm-palembang',
    city: 'Palembang',
    address: 'Ruko PTC Mall Blok G5 JL. R Sukamto 8 Ilir Kecamatan Ilir Timur II, Palembang, Sumatera Selatan, 30164',
  },
  {
    name: 'BELM - Setiabudi One',
    slug: 'belm-setiabudi-one',
    city: 'Jakarta Selatan',
    address: 'Gedung Setiabudi 2, Lt. 1 Suite 102A, Jl. H.R. Rasuna Said Kav 62, Kuningan Jakarta Selatan',
  },
  {
    name: 'BELM - Balikpapan',
    slug: 'belm-balikpapan',
    city: 'Balikpapan',
    address: 'Jl. Jend. Sudirman, Balikpapan Super Block (BSB), Blok A-3 dan A-5 Rt 16, Kelurahan Damai Bahagia, Kec. Balikpapan Selatan, Kalimantan Timur 76114',
  },
  {
    name: 'BELM - Serpong',
    slug: 'belm-serpong',
    city: 'Tangerang',
    address: 'Sumarecon Serpong, Ruko Financial Center Blok BA2/002, Jl. Gading Serpong Boulevard, Kec. Kelapa Dua, Kab. Tangerang, Banten, 15810',
  },
  {
    name: 'BELM - Bandung',
    slug: 'belm-bandung',
    city: 'Bandung',
    address: 'Graha Pos Indonesia, Jl. Banda No. 30 Citarum, Kecamatan Bandung Wetan, Kota Bandung 40115',
  },
  {
    name: 'BELM - Bekasi',
    slug: 'belm-bekasi',
    city: 'Bekasi',
    address: 'Summarecon Bekasi, Rukan Emerald, Jl. Bulevar Selatan Blok UA/038, RT 004 RW 005, Marga Mulya, Kec. Bekasi Utara, Bekasi, Jawa Barat 17143',
  },
  {
    name: 'BELM - Bogor',
    slug: 'belm-bogor',
    city: 'Bogor',
    address: 'Jalan Raya Pajajaran No. 60-G, RT.03/RW.04, Baranangsiang, Kec. Bogor Timur, Bogor, Jawa Barat 16143',
  },
  {
    name: 'BELM - Medan',
    slug: 'belm-medan',
    city: 'Medan',
    address: 'Mandiri Building, Jl. Imam Bonjol No.16D Lt 1 Unit 101, Petisah Tengah, Kec. Medan Petisah, Kota Medan, Sumatera Utara 20112',
  },
  {
    name: 'BELM - Yogyakarta',
    slug: 'belm-yogyakarta',
    city: 'Yogyakarta',
    address: 'Jalan Laksda Adisucipto 26, Gondokusuman, Demangan, Yogyakarta 55221',
  },
  {
    name: 'BELM - Semarang',
    slug: 'belm-semarang',
    city: 'Semarang',
    address: 'Rukan DP Mall. Jalan Pemuda, No.150 Blok A Kav.A/7 Sekayu, Semarang, Jawa Tengah 50132',
  },
];

function isExecuteMode() {
  return process.argv.includes('--execute');
}

function mapsUrlFor(boutique: DemoBoutiqueSeed) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${boutique.name} ${boutique.address}`)}`;
}

async function backupCurrentBoutiques() {
  await fs.mkdir(BACKUP_DIR, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(BACKUP_DIR, `demo-boutiques-${timestamp}.json`);
  const data = {
    createdAt: new Date().toISOString(),
    boutiques: await prisma.boutique.findMany({ orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] }),
  };
  await fs.writeFile(backupPath, JSON.stringify(data, null, 2));
  return backupPath;
}

async function main() {
  if (!isExecuteMode()) {
    console.log(`Dry run OK. Tambahkan --execute untuk seed ${boutiques.length} butik BELM.`);
    return;
  }

  const backupPath = await backupCurrentBoutiques();
  console.log(`Backup butik dibuat: ${backupPath}`);

  await prisma.boutique.deleteMany();

  for (const [index, boutique] of boutiques.entries()) {
    await prisma.boutique.create({
      data: {
        ...boutique,
        contactPhone: 'Tidak tersedia',
        googleMapsUrl: mapsUrlFor(boutique),
        isActive: true,
        sortOrder: index + 1,
      },
    });
  }

  const count = await prisma.boutique.count({ where: { isActive: true } });
  console.log(`Seed butik selesai: ${count} butik aktif.`);

  if (count !== boutiques.length) {
    throw new Error(`Jumlah butik aktif tidak sesuai. Expected ${boutiques.length}, got ${count}.`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
