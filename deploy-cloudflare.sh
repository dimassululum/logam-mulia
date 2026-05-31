#!/bin/bash

# =============================================================================
# Deploy Script for Cloudflare Tunnel
# =============================================================================
# This script deploys the application using Cloudflare Tunnel
# No need for public IP, SSL certificates, or firewall configuration!
# =============================================================================

set -e

echo "🚀 Deploying Logam Mulia Antam with Cloudflare Tunnel..."
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if .env.production exists
if [ ! -f .env.production ]; then
    echo -e "${RED}❌ Error: .env.production file not found!${NC}"
    echo "Please create .env.production based on the template"
    exit 1
fi

# Check if CLOUDFLARE_TUNNEL_TOKEN is set
if ! grep -q "^CLOUDFLARE_TUNNEL_TOKEN=" .env.production || grep -q "^# CLOUDFLARE_TUNNEL_TOKEN=" .env.production; then
    echo -e "${YELLOW}⚠️  Warning: CLOUDFLARE_TUNNEL_TOKEN not configured${NC}"
    echo ""
    echo "Please follow these steps first:"
    echo "1. Install cloudflared: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/"
    echo "2. Login: cloudflared tunnel login"
    echo "3. Create tunnel: cloudflared tunnel create logam-mulia"
    echo "4. Route DNS: cloudflared tunnel route dns logam-mulia logam-mulia-antam.com"
    echo "5. Get token: cloudflared tunnel token <TUNNEL_ID>"
    echo "6. Add to .env.production: CLOUDFLARE_TUNNEL_TOKEN=your_token"
    echo ""
    exit 1
fi

# Export environment variables
export $(grep -v '^#' .env.production | xargs)

echo "📦 Building Docker images..."
docker-compose -f docker-compose.cloudflare.yml build --no-cache

echo ""
echo "🗄️  Starting database..."
docker-compose -f docker-compose.cloudflare.yml up -d db

echo ""
echo "⏳ Waiting for database to be ready..."
sleep 10

# Wait for database health check
until docker-compose -f docker-compose.cloudflare.yml exec -T db pg_isready -U postgres > /dev/null 2>&1; do
    echo -e "${YELLOW}   Database not ready yet, waiting...${NC}"
    sleep 2
done

echo -e "${GREEN}   Database is ready!${NC}"

echo ""
echo "🔄 Running database migrations..."
docker-compose -f docker-compose.cloudflare.yml run --rm backend npx prisma migrate deploy

echo ""
echo "🌐 Starting all services..."
docker-compose -f docker-compose.cloudflare.yml up -d

echo ""
echo "⏳ Waiting for services to be healthy..."
sleep 15

# Check service health
echo ""
echo "🔍 Checking service status..."

if docker-compose -f docker-compose.cloudflare.yml ps | grep -q "Up (healthy)"; then
    echo -e "${GREEN}✅ All services are healthy!${NC}"
else
    echo -e "${YELLOW}⚠️  Some services may still be starting...${NC}"
    echo "Checking logs:"
    docker-compose -f docker-compose.cloudflare.yml ps
fi

echo ""
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo "📋 Services:"
echo "  - Website: https://logam-mulia-antam.com"
echo "  - API: https://logam-mulia-antam.com/api"
echo "  - Tunnel: Cloudflare (auto SSL + DDoS protection)"
echo ""
echo "📊 Useful commands:"
echo "  Check status:  docker-compose -f docker-compose.cloudflare.yml ps"
echo "  View logs:     docker-compose -f docker-compose.cloudflare.yml logs -f"
echo "  Backend logs: docker-compose -f docker-compose.cloudflare.yml logs -f backend"
echo "  Tunnel logs:  docker-compose -f docker-compose.cloudflare.yml logs -f cloudflared"
echo "  Stop:         docker-compose -f docker-compose.cloudflare.yml down"
echo ""
echo -e "${GREEN}🎉 Your application is now live via Cloudflare Tunnel!${NC}"
