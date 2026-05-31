# Cloudflare Tunnel Deployment (100% FREE & RECOMMENDED)

## Keunggulan Cloudflare Tunnel

| Fitur | Cloudflare Tunnel | Railway | Oracle Cloud |
|-------|------------------|---------|--------------|
| Biaya | **100% Gratis** | Free tier (sleep) | Always Free |
| SSL/HTTPS | **Auto (Cloudflare)** | Auto (Let's Encrypt) | Manual (Certbot) |
| Firewall/Port | **Tidak perlu** | Tidak perlu | Perlu konfigurasi |
| DDoS Protection | **Included** | - | - |
| CDN/Cache | **Global CDN** | - | - |
| Deploy dari | **Mana saja** | Railway only | VPS only |

## Prerequisites

1. **Cloudflare Account** (Gratis): https://dash.cloudflare.com/sign-up
2. **Domain** sudah di-add ke Cloudflare: `logam-mulia-antam.com`
3. **Server/VPS/Local Machine** untuk run Docker

## Step-by-Step Deployment

### 1. Add Domain ke Cloudflare

1. Login ke https://dash.cloudflare.com
2. Click "Add a Site"
3. Masukkan: `logam-mulia-antam.com`
4. Pilih plan **Free**
5. Cloudflare akan scan DNS records
6. Copy nameservers dari Cloudflare ke domain registrar
7. Tunggu propagasi DNS (5-30 menit)

### 2. Install cloudflared (Tunnel Client)

**Di Server/VPS/Local Machine:**

```bash
# Download dan install cloudflared
wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb

# Verify
cloudflared version
```

**Atau via Docker (Recommended):**

Tidak perlu install cloudflared, pakai Docker image saja.

### 3. Authenticate dengan Cloudflare

```bash
# Login ke Cloudflare via CLI
cloudflared tunnel login

# Ini akan buka browser, authorize access
# File credentials akan disimpan di ~/.cloudflared/
```

### 4. Create Tunnel

```bash
# Create tunnel
cloudflared tunnel create logam-mulia-tunnel

# Output akan kasih tunnel ID, simpan!
# Contoh: Tunnel ID: f47ac10b-58cc-4372-a567-0e02b2c3d479
```

### 5. Setup DNS Route

```bash
# Route domain ke tunnel (ganti TUNNEL_ID dengan ID Anda)
cloudflared tunnel route dns logam-mulia-tunnel logam-mulia-antam.com
cloudflared tunnel route dns logam-mulia-tunnel www.logam-mulia-antam.com
```

### 6. Create Config File

Buat file `~/.cloudflared/config.yml`:

```yaml
tunnel: YOUR_TUNNEL_ID
 credentials-file: /home/ubuntu/.cloudflared/YOUR_TUNNEL_ID.json

# Ingress rules - route traffic ke services
ingress:
  # Backend API - route /api ke backend
  - hostname: logam-mulia-antam.com
    path: /api/*
    service: http://localhost:5000
    
  # Uploads - route /uploads ke backend
  - hostname: logam-mulia-antam.com
    path: /uploads/*
    service: http://localhost:5000
    
  # Frontend - everything else
  - hostname: logam-mulia-antam.com
    service: http://localhost:3000
    
  # www subdomain
  - hostname: www.logam-mulia-antam.com
    service: http://localhost:3000
    
  # Default (catch-all)
  - service: http_status:404
```

### 7. Deploy dengan Docker Compose + Cloudflare Tunnel

Saya sudah siapkan `docker-compose.cloudflare.yml`:

```yaml
version: '3.8'

services:
  # PostgreSQL Database
  db:
    image: postgres:15-alpine
    container_name: logam-mulia-db
    restart: always
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DB_PASSWORD:-postgres}
      POSTGRES_DB: antam_db
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - logam-mulia-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Backend API
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: logam-mulia-backend
    restart: always
    environment:
      NODE_ENV: production
      PORT: 5000
      PUBLIC_API_URL: https://logam-mulia-antam.com/api
      DATABASE_URL: postgresql://postgres:${DB_PASSWORD:-postgres}@db:5432/antam_db?schema=public
      JWT_ACCESS_SECRET: ${JWT_ACCESS_SECRET}
      JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET}
      JWT_ACCESS_EXPIRES_IN: ${JWT_ACCESS_EXPIRES_IN:-15m}
      JWT_REFRESH_EXPIRES_IN: ${JWT_REFRESH_EXPIRES_IN:-7d}
      MIDTRANS_SERVER_KEY: ${MIDTRANS_SERVER_KEY}
      MIDTRANS_CLIENT_KEY: ${MIDTRANS_CLIENT_KEY}
      MIDTRANS_IS_PRODUCTION: ${MIDTRANS_IS_PRODUCTION:-false}
      RAJAONGKIR_API_KEY: ${RAJAONGKIR_API_KEY}
      RAJAONGKIR_BASE_URL: ${RAJAONGKIR_BASE_URL:-https://rajaongkir.komerce.id/api/v1}
      RAJAONGKIR_ORIGIN_ID: ${RAJAONGKIR_ORIGIN_ID}
      RAJAONGKIR_ORIGIN_SEARCH: ${RAJAONGKIR_ORIGIN_SEARCH:-Jakarta Timur}
      RESEND_API_KEY: ${RESEND_API_KEY}
      EMAIL_FROM: ${EMAIL_FROM:-noreply@logam-mulia-antam.com}
      ADMIN_ORDER_NOTIFICATION_EMAIL: ${ADMIN_ORDER_NOTIFICATION_EMAIL}
      FRONTEND_URL: ${FRONTEND_URL:-https://logam-mulia-antam.com}
      FRONTEND_URLS: ${FRONTEND_URLS}
      UPLOAD_DIR: /app/uploads
      MAX_FILE_SIZE_MB: ${MAX_FILE_SIZE_MB:-10}
    volumes:
      - uploads_data:/app/uploads
    depends_on:
      db:
        condition: service_healthy
    networks:
      - logam-mulia-network

  # Frontend Next.js
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: logam-mulia-frontend
    restart: always
    environment:
      NODE_ENV: production
      PORT: 3000
      NEXT_PUBLIC_API_URL: https://logam-mulia-antam.com/api
    depends_on:
      - backend
    networks:
      - logam-mulia-network

  # Cloudflare Tunnel (tidak perlu Nginx!)
  cloudflared:
    image: cloudflare/cloudflared:latest
    container_name: logam-mulia-tunnel
    restart: always
    command: tunnel --no-autoupdate run --token ${CLOUDFLARE_TUNNEL_TOKEN}
    environment:
      - TUNNEL_TOKEN=${CLOUDFLARE_TUNNEL_TOKEN}
    depends_on:
      - backend
      - frontend
    networks:
      - logam-mulia-network

volumes:
  postgres_data:
  uploads_data:

networks:
  logam-mulia-network:
    driver: bridge
```

**Catatan**: Versi ini lebih sederhana - tidak perlu Nginx atau Certbot!

### 8. Dapatkan Tunnel Token

```bash
# Dapatkan token untuk tunnel Anda
cloudflared tunnel token YOUR_TUNNEL_ID

# Copy token ini, akan digunakan di .env
```

### 9. Setup Environment Variables

Edit `.env.production`:

```env
# ... (existing env vars) ...

# Cloudflare Tunnel Token (dari step 8)
CLOUDFLARE_TUNNEL_TOKEN=eyJhIjoiY2RjMj...
```

### 10. Deploy

```bash
# Gunakan docker-compose untuk Cloudflare
docker-compose -f docker-compose.cloudflare.yml up -d

# Check status
docker-compose -f docker-compose.cloudflare.yml ps

# View logs
docker-compose -f docker-compose.cloudflare.yml logs -f cloudflared
```

### 11. Database Migration

```bash
docker-compose -f docker-compose.cloudflare.yml run --rm backend npx prisma migrate deploy
```

## Alternative: Run Tunnel via CLI (tanpa Docker)

Jika mau pakai cloudflared langsung tanpa Docker container:

```bash
# Run tunnel
cloudflared tunnel run YOUR_TUNNEL_ID

# Atau sebagai service
sudo cloudflared service install
sudo systemctl start cloudflared
sudo systemctl enable cloudflared
```

## Cloudflare Dashboard Settings

Setelah tunnel aktif, configure di Cloudflare Dashboard:

### 1. SSL/TLS Settings
1. SSL/TLS → Overview
2. Pilih encryption mode: **Full (strict)** atau **Full**

### 2. Always Use HTTPS
1. SSL/TLS → Edge Certificates
2. Enable: **Always Use HTTPS**

### 3. Automatic HTTPS Rewrites
1. Enable: **Automatic HTTPS Rewrites**

### 4. Cache Rules (Optional)
1. Caching → Configuration
2. Set browser cache TTL sesuai kebutuhan

### 5. Page Rules (Optional)
Create page rules untuk:
- Cache static assets
- Redirect www ke non-www atau sebaliknya

## Keunggulan vs Nginx

| Aspek | Cloudflare Tunnel | Nginx Self-Hosted |
|-------|------------------|-------------------|
| SSL Certificate | Auto (Cloudflare) | Manual (Certbot) |
| Renew SSL | Otomatis | Perlu cron job |
| Firewall | Tidak perlu | Perlu buka 80/443 |
| DDoS Protection | ✅ Built-in | ❌ Tidak ada |
| CDN | ✅ Global | ❌ Tidak ada |
| Rate Limiting | ✅ Built-in | ❌ Manual config |
| Analytics | ✅ Dashboard | ❌ Manual |

## Troubleshooting

### Tunnel tidak connect
```bash
# Check logs
docker-compose -f docker-compose.cloudflare.yml logs cloudflared

# Verify token
echo $CLOUDFLARE_TUNNEL_TOKEN

# Test tunnel status
cloudflared tunnel info YOUR_TUNNEL_ID
```

### Domain tidak resolve
1. Check DNS settings di Cloudflare Dashboard
2. Pastikan tunnel route sudah benar: `cloudflared tunnel route dns ...`
3. Tunggu DNS propagation (5-15 menit)

### 502 Bad Gateway
- Backend/Frontend belum ready
- Check service logs: `docker-compose logs backend`
- Pastikan healthcheck service berhasil

## Update & Maintenance

```bash
# Update tunnel image
docker-compose -f docker-compose.cloudflare.yml pull cloudflared
docker-compose -f docker-compose.cloudflare.yml up -d cloudflared

# Update app
git pull
docker-compose -f docker-compose.cloudflare.yml up -d --build
```

## Cost: 100% GRATIS

- Cloudflare Tunnel: **Free** (unlimited bandwidth)
- Cloudflare SSL: **Free**
- Cloudflare CDN: **Free**
- Cloudflare DDoS: **Free**

## Summary

**Cloudflare Tunnel adalah solusi terbaik** untuk deploy gratis karena:
1. ✅ No server configuration needed (firewall/ports)
2. ✅ Automatic SSL & HTTPS
3. ✅ Global CDN & DDoS protection
4. ✅ Can deploy from any machine (even local)
5. ✅ Simpler than Nginx + Certbot setup

**Recommended untuk semua use case production!**
