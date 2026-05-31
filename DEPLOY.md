# Deployment Guide - Logam Mulia Antam

## 🚀 Deployment Options (Choose One)

| Method | Cost | SSL | Firewall | Difficulty | Recommendation |
|--------|------|-----|----------|------------|----------------|
| **Cloudflare Tunnel** | **100% Free** | **Auto** | **Not needed** | **Easy** | **⭐ RECOMMENDED** |
| Railway | Free tier | Auto | Not needed | Easy | Good for quick deploy |
| Oracle Cloud VPS | Always Free | Manual | Required | Medium | Full control |
| Self-hosted (Nginx) | Server cost | Manual (Certbot) | Required | Hard | Existing setup |

### **Recommended: Cloudflare Tunnel** 
**File**: [`CLOUDFLARE-TUNNEL-DEPLOY.md`](./CLOUDFLARE-TUNNEL-DEPLOY.md)
- ✅ **Truly FREE** - No server needed, can run from local machine
- ✅ **No firewall configuration** - Tunnel creates outbound connection
- ✅ **Automatic SSL** - Cloudflare handles certificates
- ✅ **DDoS Protection** - Included with Cloudflare
- ✅ **Global CDN** - Fast loading worldwide
- ✅ **Simple setup** - No Nginx, no Certbot needed

### Quick Start - Cloudflare Tunnel (Recommended)
```bash
# 1. Setup Cloudflare Tunnel (see CLOUDFLARE-TUNNEL-DEPLOY.md)
# 2. Configure .env.production
# 3. Deploy
./deploy-cloudflare.sh
```

---

## Prerequisites (For Self-Hosted/Nginx Method)

1. **WSL (Windows Subsystem for Linux)** installed with Ubuntu
2. **Docker Desktop** with WSL integration enabled
3. **Domain** configured to point to your server IP (logam-mulia-antam.com)
4. **Ports 80 and 443** open on firewall

## Quick Start

### 1. Copy Project to WSL

```bash
# In WSL, navigate to your project folder
cd /mnt/c/dhlb-server/project/project_dimas/logam-mulia

# Or clone/copy to WSL home directory
cp -r /mnt/c/dhlb-server/project/project_dimas/logam-mulia ~/logam-mulia
cd ~/logam-mulia
```

### 2. Configure Environment Variables

Edit `.env.production` and fill in all required values:

```bash
nano .env.production
```

Required configurations:
- `DB_PASSWORD` - Strong database password
- `JWT_ACCESS_SECRET` & `JWT_REFRESH_SECRET` - Random long strings
- `MIDTRANS_SERVER_KEY` & `MIDTRANS_CLIENT_KEY` - Payment gateway keys
- `RAJAONGKIR_API_KEY` - Shipping API key
- `RESEND_API_KEY` - Email service API key

### 3. Make Scripts Executable

```bash
chmod +x deploy.sh
```

### 4. Initial SSL Setup

For first-time deployment, start with HTTP only to get SSL certificates:

```bash
# Copy init config temporarily
cp nginx/conf.d/init.conf nginx/conf.d/default.conf

# Start containers (without SSL)
docker-compose up -d
```

### 5. Obtain SSL Certificates

```bash
# Run certbot to get certificates
docker run -it --rm \
    -v ./certbot_data:/etc/letsencrypt \
    -v ./certbot_www:/var/www/certbot \
    -p 80:80 \
    certbot/certbot certonly \
    --standalone \
    -d logam-mulia-antam.com \
    -d www.logam-mulia-antam.com \
    --agree-tos \
    --no-eff-email \
    -m your-email@example.com
```

### 6. Switch to Full Config

```bash
# Copy the full nginx config
rm nginx/conf.d/default.conf
cp nginx/conf.d/logam-mulia-antam.conf nginx/conf.d/default.conf

# Restart nginx
docker-compose restart nginx
```

### 7. Run Full Deployment

```bash
./deploy.sh
```

## Manual Deployment Steps

If the script doesn't work, run manually:

```bash
# Build images
docker-compose build --no-cache

# Start database
docker-compose up -d db

# Wait for database
sleep 10

# Run migrations
docker-compose run --rm backend npx prisma migrate deploy

# Start all services
docker-compose up -d
```

## Useful Commands

```bash
# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f nginx

# Restart services
docker-compose restart

# Stop all
docker-compose down

# Stop and remove volumes (WARNING: deletes data)
docker-compose down -v

# Access database
docker-compose exec db psql -U postgres -d antam_db

# Access backend shell
docker-compose exec backend sh

# Access frontend shell
docker-compose exec frontend sh
```

## SSL Certificate Renewal

Certificates auto-renew via certbot container. To manually renew:

```bash
docker-compose exec certbot certbot renew
```

## Troubleshooting

### Container won't start
```bash
docker-compose logs [service-name]
```

### Database connection issues
```bash
# Check if database is ready
docker-compose exec db pg_isready -U postgres

# Reset database (WARNING: deletes all data)
docker-compose down -v
docker-compose up -d db
```

### SSL certificate issues
```bash
# Check certificate status
docker-compose exec nginx ls -la /etc/letsencrypt/live/

# Force certificate renewal
docker run -it --rm -v ./certbot_data:/etc/letsencrypt certbot/certbot renew --force-renewal
```

### Permission issues in WSL
```bash
# Fix permissions
sudo chown -R $USER:$USER .
```

## Security Notes

1. Change all default passwords in `.env.production`
2. Keep `.env.production` secure and never commit it
3. Regularly update Docker images: `docker-compose pull`
4. Monitor logs for suspicious activity
