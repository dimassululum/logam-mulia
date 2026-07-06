# Environment Strategy

Project ini punya tiga jalur aman:

- Local: develop dan test cepat di laptop.
- Staging: rehearsal sebelum production, domain `staging.logam-mulia-antam.com`.
- Production: domain live `logam-mulia-antam.com`.

File lama seperti `docker-compose.cloudflare.yml` tetap dibiarkan untuk arsip, tetapi **jangan dipakai untuk deploy production**. Script `deploy-cloudflare.sh` sudah diberi guard legacy supaya tidak sengaja menjalankan stack lama.

## Compose Files

Gunakan base compose plus override environment:

```powershell
docker.exe compose --env-file .env.local -f docker-compose.stack.yml -f docker-compose.local.yml up -d
docker.exe compose -p logam-mulia-staging --env-file .env.staging -f docker-compose.stack.yml -f docker-compose.staging.yml up -d
docker.exe compose -p logam-mulia --env-file .env.production -f docker-compose.stack.yml -f docker-compose.prod.yml up -d
```

Project name yang beda membuat network dan volume terpisah:

- `logam-mulia-local_*`
- `logam-mulia-staging_*`
- `logam-mulia_*` untuk production live

## First-Time Setup

1. Copy template env:

```powershell
Copy-Item .env.local.example .env.local
Copy-Item .env.staging.example .env.staging
Copy-Item .env.production.example .env.production
```

2. Isi secret di file env asli. Jangan commit `.env.local`, `.env.staging`, atau `.env.production`.

3. Untuk staging Cloudflare, buat tunnel/route terpisah:

```powershell
cloudflared tunnel create logam-mulia-staging
cloudflared tunnel route dns logam-mulia-staging staging.logam-mulia-antam.com
```

4. Copy credentials JSON tunnel staging ke:

```text
cloudflared/staging-credentials.json
```

5. Update `cloudflared/config.staging.yml` dengan tunnel ID staging.

6. Untuk production, pastikan `.env.production` menunjuk ke credential file yang benar:

```text
CLOUDFLARED_CONFIG_FILE=./cloudflared/config.prod.yml
CLOUDFLARED_CREDENTIALS_FILE=./cloudflared/<production-tunnel-id>.json
```

Credential path harus file JSON, bukan folder. Override compose sudah memakai `create_host_path: false`, jadi deploy akan gagal cepat kalau file hilang dan tidak membuat folder kosong.

## Deploy

Staging:

```powershell
.\scripts\deploy-staging.ps1
```

Jika Docker build di mesin server sedang menggantung, staging bisa di-boot sementara dari image lokal yang sudah ada:

```powershell
docker.exe tag logam-mulia-backend:latest logam-mulia-staging-backend:latest
docker.exe tag logam-mulia-frontend:latest logam-mulia-staging-frontend:latest
.\scripts\deploy-staging.ps1 -SkipBuild
```

Production:

```powershell
.\scripts\deploy-prod.ps1
```

Production script meminta konfirmasi `DEPLOY-PROD` sebelum lanjut.

Manual equivalent jika perlu debug di VPS:

```bash
docker compose -p logam-mulia --env-file .env.production -f docker-compose.stack.yml -f docker-compose.prod.yml build
docker compose -p logam-mulia --env-file .env.production -f docker-compose.stack.yml -f docker-compose.prod.yml run --rm backend npx prisma migrate deploy
docker compose -p logam-mulia --env-file .env.production -f docker-compose.stack.yml -f docker-compose.prod.yml up -d
```

Jangan campur dengan `docker-compose.yml`, `docker-compose.cloudflare.yml`, atau `deploy.sh` di production live.

## Production Sanity Checks

Setelah deploy production, cek satu stack yang aktif:

```bash
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Image}}" | grep logam
docker inspect -f '{{.Name}} started={{.State.StartedAt}} image={{.Image}}' logam-mulia-frontend logam-mulia-backend
```

Frontend dan backend seharusnya sama-sama baru direcreate setelah deploy yang membawa perubahan frontend/backend. Kalau backend baru tetapi frontend masih lama, kemungkinan perubahan UI belum naik.

Cek backend memakai database production internal:

```bash
docker exec logam-mulia-backend node -e 'const u=new URL(process.env.DATABASE_URL); console.log({host:u.hostname, port:u.port, database:u.pathname.slice(1), search:u.search})'
```

Nilai yang benar untuk production live saat ini:

```text
host: db
port: 5432
database: antam_db
search: ?schema=public
```

Cek Cloudflare tunnel route:

```bash
sed -n '1,120p' /opt/logam-mulia/cloudflared/config.prod.yml
```

Route yang benar: `/api` dan `/uploads` ke `http://backend:5000`, sisanya ke `http://frontend:3000`.

Cek data order dari DB dan API publik harus konsisten:

```bash
docker exec logam-mulia-db psql -U postgres -d antam_db -c "select count(*) from orders;"
curl -s https://logam-mulia-antam.com/api/health
```

Untuk endpoint admin `/api/orders`, gunakan token admin browser atau token sementara dari backend hanya untuk debugging, lalu pastikan `meta.total` sama dengan hitungan DB.

## Promotion Flow

1. Develop di local.
2. Commit perubahan.
3. Deploy staging.
4. Test checklist staging:
   - home page
   - product list/detail
   - login/register
   - cart/checkout
   - upload/payment proof kalau relevan
   - admin order/product flows
5. Backup production database.
6. Deploy production.
7. Jalankan production sanity checks.
8. Cek `/health`, homepage, admin orders, dan logs.

## Rollback Notes

Rollback code paling aman dilakukan dengan kembali ke commit/image sebelumnya lalu deploy ulang. Rollback database harus diputuskan per migration; hindari migration destruktif langsung di production.
