# 🚀 Logam Mulia Backend - Production Deployment Guide

## 📋 Prerequisites

### System Requirements
- **Node.js:** v18.0.0 or higher
- **PostgreSQL:** v14.0 or higher
- **Redis:** v6.0 or higher (for caching)
- **Nginx:** v1.20 or higher (reverse proxy)
- **SSL Certificate:** For HTTPS

### Environment Variables
Copy `.env.example` to `.env` and configure:

```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/logam_mulia"

# Authentication
JWT_ACCESS_SECRET="your-super-secret-jwt-key-min-32-chars"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-min-32-chars"

# Payment Gateway
MIDTRANS_SERVER_KEY="SB-Mid-server-YOUR_SERVER_KEY"
MIDTRANS_CLIENT_KEY="SB-Mid-client-YOUR_CLIENT_KEY"
MIDTRANS_IS_PRODUCTION=false

# Email Service
RESEND_API_KEY="re_your_api_key"
EMAIL_FROM="noreply@logam-mulia-antam.com"

# File Upload
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE_MB=5

# Frontend
FRONTEND_URL="https://yourdomain.com"

# Server
NODE_ENV="production"
PORT=5000
```

---

## 🛠️ Deployment Steps

### 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Install Redis
sudo apt install redis-server -y

# Install Nginx
sudo apt install nginx -y

# Install PM2
sudo npm install -g pm2
```

### 2. Database Setup

```bash
# Switch to postgres user
sudo -u postgres psql

# Create database
CREATE DATABASE logam_mulia;

# Create user
CREATE USER logam_user WITH PASSWORD 'your_password';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE logam_mulia TO logam_user;

# Exit
\q
```

### 3. Application Setup

```bash
# Clone repository
git clone https://github.com/your-repo/logam-mulia-backend.git
cd logam-mulia-backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
nano .env  # Edit with your values

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate deploy

# Seed initial data
npx ts-node prisma/seed.ts
```

### 4. Build Application

```bash
# Build TypeScript
npm run build

# Or use ts-node for development
npm install -g ts-node
```

### 5. PM2 Configuration

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'logam-mulia-backend',
    script: './dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024'
  }]
};
```

### 6. Start Application

```bash
# Create logs directory
mkdir logs

# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 startup
pm2 startup
```

---

## 🌐 Nginx Configuration

Create `/etc/nginx/sites-available/logam-mulia`:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Configuration
    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # File Upload Size
    client_max_body_size 10M;

    # Proxy to Node.js
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Static Files
    location /uploads {
        alias /path/to/your/project/uploads;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Health Check
    location /health {
        proxy_pass http://localhost:5000;
        access_log off;
    }
}
```

Enable site:

```bash
sudo ln -s /etc/nginx/sites-available/logam-mulia /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 🔒 SSL Certificate Setup

### Using Let's Encrypt

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

---

## 📊 Monitoring & Logging

### PM2 Monitoring

```bash
# Monitor application
pm2 monit

# View logs
pm2 logs

# Restart application
pm2 restart logam-mulia-backend

# View status
pm2 status
```

### Log Rotation

Create `/etc/logrotate.d/logam-mulia`:

```
/path/to/your/project/logs/*.log {
    daily
    missingok
    rotate 52
    compress compress
    notifempty
    create 644 www-data www-data
    postrotate
        pm2 reloadLogs
    endscript
}
```

---

## 🔧 Health Checks

### Application Health

```bash
# Check if server is running
curl -f http://localhost:5000/health || exit 1

# Check database connection
curl -f http://localhost:5000/api/health || exit 1
```

### Database Health

```bash
# Test database connection
sudo -u postgres psql -c "SELECT 1;" logam_mulia
```

---

## 🚨 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   ```bash
   # Check PostgreSQL status
   sudo systemctl status postgresql
   
   # Check connection string
   sudo -u postgres psql -c "\l"
   ```

2. **Application Not Starting**
   ```bash
   # Check PM2 logs
   pm2 logs logam-mulia-backend
   
   # Check environment variables
   pm2 env 0
   ```

3. **File Upload Issues**
   ```bash
   # Check upload directory permissions
   ls -la uploads/
   
   # Fix permissions
   sudo chown -R www-data:www-data uploads/
   ```

4. **Memory Issues**
   ```bash
   # Check memory usage
   pm2 monit
   
   # Restart with more memory
   pm2 restart logam-mulia-backend --max-memory-restart 2G
   ```

---

## 📈 Performance Optimization

### Database Optimization

```sql
-- Create indexes for better performance
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_cart_items_user_id ON cart_items(user_id);
```

### Caching Setup

```bash
# Configure Redis
sudo nano /etc/redis/redis.conf

# Set max memory
maxmemory 256mb
maxmemory-policy allkeys-lru

# Restart Redis
sudo systemctl restart redis
```

---

## 🔐 Security Hardening

### Firewall Setup

```bash
# Configure UFW
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

### Application Security

```bash
# Set file permissions
chmod 600 .env
chmod 755 uploads/

# Set up fail2ban
sudo apt install fail2ban -y
sudo systemctl enable fail2ban
```

---

## 📋 Post-Deployment Checklist

- [ ] Environment variables configured
- [ ] Database migrated and seeded
- [ ] SSL certificate installed
- [ ] Nginx configured and running
- [ ] PM2 application running
- [ ] Health checks passing
- [ ] Logs being collected
- [ ] Monitoring set up
- [ ] Backup strategy implemented
- [ ] Security hardening completed

---

## 🔄 Backup Strategy

### Database Backup

```bash
# Create backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"
mkdir -p $BACKUP_DIR

# Backup database
pg_dump -h localhost -U logam_user logam_mulia > $BACKUP_DIR/logam_mulia_$DATE.sql

# Keep only last 7 days
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
```

### Application Backup

```bash
# Backup application files
tar -czf /backups/app_$(date +%Y%m%d_%H%M%S).tar.gz \
  --exclude=node_modules \
  --exclude=logs \
  --exclude=uploads \
  /path/to/your/project
```

---

## 📞 Support & Maintenance

### Regular Maintenance Tasks

1. **Weekly:**
   - Check application logs
   - Monitor system resources
   - Review security updates

2. **Monthly:**
   - Update dependencies
   - Review performance metrics
   - Test backup restoration

3. **Quarterly:**
   - Security audit
   - Performance optimization
   - Database maintenance

### Emergency Contacts

- **Development Team:** dev-team@logam-mulia-antam.com
- **System Administrator:** admin@logam-mulia-antam.com
- **Database Administrator:** dba@logam-mulia-antam.com

---

## 🎉 Deployment Complete!

Your Logam Mulia Backend is now running in production!

**Next Steps:**
1. Monitor application performance
2. Set up alerting and monitoring
3. Regular security updates
4. Performance optimization

---

*This deployment guide ensures your Logam Mulia Backend runs securely and efficiently in production.*
