# Environment Strategy

Project ini punya tiga jalur aman:

- Local: develop dan test cepat di laptop.
- Staging: rehearsal sebelum production, domain `staging.logam-mulia-antam.com`.
- Production: domain live `logam-mulia-antam.com`.

File lama seperti `docker-compose.cloudflare.yml` tetap dibiarkan supaya deployment yang sedang live tidak berubah mendadak.

## Compose Files

Gunakan base compose plus override environment:

```powershell
docker.exe compose --env-file .env.local -f docker-compose.stack.yml -f docker-compose.local.yml up -d
docker.exe compose -p logam-mulia-staging --env-file .env.staging -f docker-compose.stack.yml -f docker-compose.staging.yml up -d
docker.exe compose -p logam-mulia-prod --env-file .env.production -f docker-compose.stack.yml -f docker-compose.prod.yml up -d
```

Project name yang beda membuat network dan volume terpisah:

- `logam-mulia-local_*`
- `logam-mulia-staging_*`
- `logam-mulia-prod_*`

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

## Deploy

Staging:

```powershell
.\scripts\deploy-staging.ps1
```

Production:

```powershell
.\scripts\deploy-prod.ps1
```

Production script meminta konfirmasi `DEPLOY-PROD` sebelum lanjut.

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
7. Cek `/health`, homepage, dan logs.

## Rollback Notes

Rollback code paling aman dilakukan dengan kembali ke commit/image sebelumnya lalu deploy ulang. Rollback database harus diputuskan per migration; hindari migration destruktif langsung di production.
