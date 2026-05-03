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
