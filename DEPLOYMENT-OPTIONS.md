# Deployment Options Summary

Project ini bisa di-deploy dengan 4 metode berbeda, semua gratis:

## 📋 Quick Comparison

| Aspect | Cloudflare Tunnel | Railway | Oracle Cloud VPS | Self-Hosted |
|--------|------------------|---------|------------------|-------------|
| **Monthly Cost** | $0 | $0* | $0 | $0+ (server) |
| **SSL Certificate** | Auto (Cloudflare) | Auto | Manual (Certbot) | Manual |
| **Public IP** | Not needed | Not needed | Required | Required |
| **Firewall Config** | Not needed | Not needed | Required | Required |
| **DDoS Protection** | ✅ Yes | ❌ No | ❌ No | ❌ No |
| **CDN** | ✅ Global | ❌ No | ❌ No | ❌ No |
| **Server Uptime** | Your machine | 24/7** | 24/7 | 24/7 |
| **Setup Difficulty** | Easy | Easy | Medium | Hard |
| **Best For** | MVP/Testing | Quick deploy | Production | Full control |

*Railway: Free tier has execution limits (sleeps after inactivity)
**Oracle Cloud: Always Free tier available

---

## 🥇 1. Cloudflare Tunnel (RECOMMENDED)

**Use this if**: Anda ingin deploy gratis dengan setup termudah, tanpa perlu konfigurasi server.

```bash
# Deploy command
./deploy-cloudflare.sh
```

**File**: [`CLOUDFLARE-TUNNEL-DEPLOY.md`](./CLOUDFLARE-TUNNEL-DEPLOY.md)

### Pros:
- ✅ **100% Free** - No credit card needed
- ✅ **No server management** - Can run from local machine
- ✅ **No firewall/ports** - Outbound tunnel connection
- ✅ **Auto SSL** - Cloudflare handles everything
- ✅ **DDoS Protection** - Included
- ✅ **Global CDN** - Fast worldwide

### Cons:
- ❌ Traffic goes through Cloudflare (if that's a concern)
- ❌ Your machine needs to stay on (if self-hosted)

---

## 🚂 2. Railway (Platform-as-a-Service)

**Use this if**: Anda ingin deploy cepat tanpa setup server, dengan database managed.

**File**: [`RAILWAY-DEPLOY.md`](./RAILWAY-DEPLOY.md)

### Pros:
- ✅ **Quick deploy** - Git push to deploy
- ✅ **Managed PostgreSQL** - No database setup
- ✅ **Auto SSL** - Built-in
- ✅ **Custom domain** - Free

### Cons:
- ❌ **Free tier sleeps** - After inactivity
- ❌ **Credit limit** - $5/month then sleeps
- ❌ Limited to Railway's infrastructure

---

## 🖥️ 3. Oracle Cloud VPS (Always Free)

**Use this if**: Anda ingin VPS gratis yang selalu on, dengan full control.

**File**: [`ORACLE-CLOUD-DEPLOY.md`](./ORACLE-CLOUD-DEPLOY.md)

### Pros:
- ✅ **Always Free** - No time limits
- ✅ **Full control** - Root access to VPS
- ✅ **24/7 uptime** - Server always on
- ✅ **Static IP** - No changes

### Cons:
- ❌ **Manual setup** - Need to configure everything
- ❌ **Firewall required** - Must open ports 80/443
- ❌ **SSL manual** - Need Certbot setup
- ❌ **Limited specs** - 1 GB RAM, 1/8 OCPU

---

## 🔧 4. Self-Hosted (Existing Setup)

**Use this if**: Anda sudah punya server/VPS dan ingin setup lengkap dengan Nginx.

**File**: [`DEPLOY.md`](./DEPLOY.md)

### Pros:
- ✅ **Full control** - Complete server access
- ✅ **Customizable** - Any configuration possible
- ✅ **Works anywhere** - Any VPS/provider

### Cons:
- ❌ **Complex setup** - Nginx + Certbot configuration
- ❌ **Maintenance** - Manual SSL renewal
- ❌ **Security** - Must configure firewall yourself

---

## 🎯 Which Should I Choose?

### For Beginners / Testing:
→ **Cloudflare Tunnel** - Easiest setup, truly free

### For Production (always on):
→ **Oracle Cloud VPS** - Free forever, full control

### For Quick MVP:
→ **Railway** - Fastest to deploy

### For Existing Infrastructure:
→ **Self-Hosted** - Full control over everything

---

## 📝 Domain Setup (logam-mulia-antam.com)

Semua metode memerlukan domain. Cara setup:

### 1. Buy Domain
- Namecheap, GoDaddy, Google Domains, dll
- Harga: ~$10-15/tahun

### 2. DNS Configuration

**Cloudflare Tunnel:**
```
CNAME  logam-mulia-antam.com  →  your-tunnel.cfargotunnel.com
```

**Railway:**
```
CNAME  logam-mulia-antam.com  →  your-app.up.railway.app
```

**Oracle Cloud / VPS:**
```
A      logam-mulia-antam.com  →  YOUR_SERVER_IP
```

---

## 🔐 Required Environment Variables

Semua metode memerlukan `.env.production` dengan variabel:

```env
# Database
DB_PASSWORD=your_strong_password

# Backend
JWT_ACCESS_SECRET=random_32_char_string
JWT_REFRESH_SECRET=random_32_char_string
PUBLIC_API_URL=https://logam-mulia-antam.com/api

# Frontend
NEXT_PUBLIC_API_URL=https://logam-mulia-antam.com/api
FRONTEND_URL=https://logam-mulia-antam.com

# Payment Gateway (Midtrans)
MIDTRANS_SERVER_KEY=your_midtrans_key
MIDTRANS_CLIENT_KEY=your_midtrans_key
MIDTRANS_IS_PRODUCTION=false

# Shipping (RajaOngkir)
RAJAONGKIR_API_KEY=your_rajaongkir_key
RAJAONGKIR_ORIGIN_ID=your_origin_id

# Email (Resend)
RESEND_API_KEY=your_resend_key
EMAIL_FROM=noreply@logam-mulia-antam.com

# Cloudflare Tunnel (if using that method)
CLOUDFLARE_TUNNEL_TOKEN=your_tunnel_token
```

---

## 🚀 Quick Start Commands

### Cloudflare Tunnel:
```bash
# Setup (one-time)
npm install -g cloudflared  # or download binary
cloudflared tunnel login
cloudflared tunnel create logam-mulia
cloudflared tunnel route dns logam-mulia logam-mulia-antam.com

# Deploy
./deploy-cloudflare.sh
```

### Railway:
```bash
# Via Railway Dashboard (web UI)
# Connect GitHub repo and deploy
```

### Oracle Cloud:
```bash
# SSH ke server, then:
./deploy.sh
```

---

## 📞 Support

Jika ada masalah dengan deployment:
1. Check logs: `docker-compose logs -f`
2. Verify environment variables
3. Check DNS propagation: https://whatsmydns.net
4. Pastikan domain sudah pointing ke service

---

**Ready to deploy? Pick your method and follow the guide!** 🚀
