# Railway Deployment Guide - Logam Mulia Antam (FREE TIER)

## Overview
Deploy ke Railway dengan:
- **Backend**: Node.js API service
- **Frontend**: Next.js static site
- **Database**: PostgreSQL managed (gratis)
- **Domain**: Custom domain `logam-mulia-antam.com`
- **SSL**: Auto-managed by Railway

## Prerequisites

1. Akun Railway (gratis): https://railway.app
2. Domain `logam-mulia-antam.com` sudah dibeli
3. GitHub account (untuk auto-deploy)

## Step-by-Step Deployment

### 1. Setup Repository

Push project ke GitHub (kalau belum):

```bash
git init
git add .
git commit -m "Initial commit for Railway deployment"
git branch -M main
git remote add origin https://github.com/username/logam-mulia.git
git push -u origin main
```

### 2. Create Railway Project

1. Login ke https://railway.app/dashboard
2. Click "New Project"
3. Pilih "Deploy from GitHub repo"
4. Connect repository `logam-mulia`

### 3. Deploy Database

1. Di project Railway, click "New"
2. Pilih "Database" → "Add PostgreSQL"
3. Database akan otomatis dibuat dengan:
   - Host: `postgres.railway.internal`
   - Port: `5432`
   - Database: `railway`
   - Username & Password: auto-generated

### 4. Deploy Backend

1. Click "New" → "GitHub Repo"
2. Pilih repository `logam-mulia`
3. Pilih directory: `backend`
4. Railway akan otomatis detect `Dockerfile`
5. Setting environment variables:

   ```
   NODE_ENV=production
   PORT=5000
   PUBLIC_API_URL=https://logam-mulia-antam.com/api
   DATABASE_URL=${{Postgres.DATABASE_URL}}  (Railway auto-fill)
   JWT_ACCESS_SECRET=your_random_secret_32chars
   JWT_REFRESH_SECRET=your_random_secret_32chars
   JWT_ACCESS_EXPIRES_IN=15m
   JWT_REFRESH_EXPIRES_IN=7d
   MIDTRANS_SERVER_KEY=your_midtrans_key
   MIDTRANS_CLIENT_KEY=your_midtrans_key
   MIDTRANS_IS_PRODUCTION=false
   RAJAONGKIR_API_KEY=your_rajaongkir_key
   RAJAONGKIR_BASE_URL=https://rajaongkir.komerce.id/api/v1
   RAJAONGKIR_ORIGIN_ID=your_origin_id
   RAJAONGKIR_ORIGIN_SEARCH=Jakarta Timur
   RESEND_API_KEY=your_resend_key
   EMAIL_FROM=noreply@logam-mulia-antam.com
   ADMIN_ORDER_NOTIFICATION_EMAIL=admin@logam-mulia-antam.com
   FRONTEND_URL=https://logam-mulia-antam.com
   UPLOAD_DIR=/app/uploads
   MAX_FILE_SIZE_MB=10
   ```

6. **IMPORTANT**: Jalankan migrations:
   ```
   Railway Dashboard → Backend service → Shell
   npx prisma migrate deploy
   ```

### 5. Deploy Frontend

1. Click "New" → "GitHub Repo"
2. Pilih repository `logam-mulia`
3. Pilih directory: `frontend`
4. Setting environment variables:

   ```
   NODE_ENV=production
   PORT=3000
   NEXT_PUBLIC_API_URL=https://logam-mulia-antam.com/api
   ```

### 6. Setup Custom Domain

1. **Backend**: 
   - Settings → Domain
   - Generate domain: `logam-mulia-api.up.railway.app`
   - (Tidak perlu custom domain untuk API)

2. **Frontend**:
   - Settings → Domain
   - Click "Custom Domain"
   - Enter: `logam-mulia-antam.com`
   - Railway akan kasih CNAME record:
     ```
     CNAME logam-mulia-antam.com → your-frontend-domain.up.railway.app
     ```
   - Add CNAME di DNS provider (Cloudflare/Namecheap/dll)
   - Wait 5-10 menit untuk SSL propagate

### 7. Update Frontend API URL

Edit environment variable Frontend:
```
NEXT_PUBLIC_API_URL=https://logam-mulia-api.up.railway.app
```

Redeploy frontend.

### 8. Domain Configuration

Di DNS provider (Cloudflare recommended - gratis):

```
# A Record untuk root domain (jika Railway support)
A     logam-mulia-antam.com     → (Railway IP if available)

# CNAME untuk www
CNAME www.logam-mulia-antam.com → logam-mulia-antam.com

# CNAME untuk Railway app
CNAME logam-mulia-antam.com → your-app.up.railway.app
```

**Note**: Railway menggunakan CNAME untuk custom domains.

### 9. SSL Certificate

Railway auto-provision SSL certificates via Let's Encrypt. Tidak perlu setup manual.

## Environment Variables Summary

| Variable | Backend | Frontend | Database |
|----------|---------|----------|----------|
| NODE_ENV | production | production | - |
| PORT | 5000 | 3000 | 5432 |
| DATABASE_URL | ${{Postgres.DATABASE_URL}} | - | auto |
| NEXT_PUBLIC_API_URL | - | https://your-api.up.railway.app | - |
| PUBLIC_API_URL | https://... | - | - |

## Railway Pricing (Free Tier)

- **Execution**: $5 credit/bulan (hundreds of hours)
- **PostgreSQL**: Gratis (10 GB storage)
- **Outbound Data**: 100 GB/bulan
- **Custom Domain**: Gratis
- **SSL**: Gratis (Let's Encrypt)

Jika credit habis, service akan sleep sampai reset bulanan.

## Troubleshooting

### Database Connection Failed
```
# Check DATABASE_URL format
postgresql://user:pass@postgres.railway.internal:5432/railway
```

### Frontend can't connect to API
1. Check CORS di backend (FRONTEND_URL harus sesuai)
2. Check NEXT_PUBLIC_API_URL format
3. Pastikan API service running

### Domain not working
1. Check DNS propagation: https://whatsmydns.net
2. Pastikan CNAME record benar
3. Wait 10-15 menit untuk SSL provision

## Monitoring

Railway Dashboard menyediakan:
- Logs real-time
- Metrics (CPU, Memory, Network)
- Deployment history
- Auto-restart on crash

## Backup Database

Railway auto-backup PostgreSQL daily. Untuk manual export:
```bash
# Connect via Railway CLI
railway connect postgres

# Or use pg_dump
pg_dump ${{DATABASE_URL}} > backup.sql
```

## Updates & Redeploy

Push ke GitHub akan auto-trigger redeploy:
```bash
git add .
git commit -m "Update feature X"
git push origin main
```

Railway akan rebuild dan redeploy otomatis.
