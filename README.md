# Logam Mulia

Project ini berisi backend Express/Prisma dan frontend Next.js.

## Setup

Install dependency di masing-masing folder:

```bash
cd backend
npm install
```

```bash
cd frontend
npm install
```

## Environment Backend

Salin contoh environment backend:

```bash
cd backend
cp .env.example .env
```

Isi nilai `.env` sesuai konfigurasi lokal masing-masing.

## Menjalankan Project

Backend:

```bash
cd backend
npm run dev
```

Frontend:

```bash
cd frontend
npm run dev
```

## Catatan Git

Folder seperti `node_modules/`, `.next/`, `dist/`, `build/`, `.env`, dan file upload runtime tidak perlu di-commit karena bisa dibuat ulang secara lokal.

## Deploy ke Vercel

Project ini berbentuk monorepo. Untuk deploy frontend ke Vercel dari GitHub:

1. Push branch `main` ke GitHub.
2. Di Vercel, import repository `dimassululum/logam-mulia`.
3. Set **Root Directory** ke `frontend`.
4. Pakai framework preset **Next.js**.
5. Tambahkan environment variable frontend:

```bash
NEXT_PUBLIC_API_URL=https://domain-backend-production/api
```

Backend Express/Prisma tetap perlu URL production yang bisa diakses publik, misalnya dari Railway, Render, Fly.io, atau VPS. Set environment backend:

```bash
PUBLIC_API_URL=https://domain-backend-production
FRONTEND_URL=https://domain-frontend-vercel
DATABASE_URL=postgresql://...
JWT_ACCESS_SECRET=...
JWT_REFRESH_SECRET=...
```

Catatan: backend saat ini menyimpan file upload di filesystem lokal. Untuk production serverless seperti Vercel Functions, upload perlu dipindah ke storage persisten seperti S3/R2/Supabase Storage.
