#!/bin/bash

# Deployment script for Logam Mulia Antam
# Run this in WSL after configuring DNS to point to your server

set -e

echo "🚀 Deploying Logam Mulia Antam..."

# Check if running in WSL
if ! grep -q Microsoft /proc/version && ! grep -q microsoft /proc/version; then
    echo "⚠️  Warning: This script is designed to run in WSL"
fi

# Create necessary directories
mkdir -p nginx/conf.d
mkdir -p uploads

# Check if .env.production exists
if [ ! -f .env.production ]; then
    echo "❌ Error: .env.production file not found!"
    echo "Please create .env.production based on the template"
    exit 1
fi

# Load environment variables
export $(grep -v '^#' .env.production | xargs)

# Build and start containers
echo "📦 Building Docker images..."
docker-compose build --no-cache

echo "🗄️  Starting database..."
docker-compose up -d db

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 10

# Run database migrations
echo "🔄 Running database migrations..."
docker-compose run --rm backend npx prisma migrate deploy

echo "🌐 Starting all services..."
docker-compose up -d

# Check initial SSL certificates
echo "🔒 Checking SSL certificates..."
if [ ! -d "./certbot_data/live/logam-mulia-antam.com" ]; then
    echo "📝 Obtaining initial SSL certificates..."
    echo "Make sure your domain points to this server IP first!"
    
    # Stop nginx temporarily
    docker-compose stop nginx
    
    # Get certificate
    docker run -it --rm \
        -v ./certbot_data:/etc/letsencrypt \
        -v ./certbot_www:/var/www/certbot \
        -p 80:80 \
        certbot/certbot certonly \
        --standalone \
        --preferred-challenges http \
        -d logam-mulia-antam.com \
        -d www.logam-mulia-antam.com \
        --agree-tos \
        --no-eff-email \
        -m admin@logam-mulia-antam.com
    
    # Start nginx again
    docker-compose start nginx
fi

echo "✅ Deployment complete!"
echo ""
echo "📋 Services:"
echo "  - Website: https://logam-mulia-antam.com"
echo "  - API: https://logam-mulia-antam.com/api"
echo ""
echo "📊 Check status: docker-compose ps"
echo "📜 View logs: docker-compose logs -f"
