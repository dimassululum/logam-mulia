# Backend Dockerfile
FROM node:20-alpine

# Install OpenSSL and other dependencies for Prisma
RUN apk add --no-cache openssl libssl3

WORKDIR /app

# Copy package files and prisma schema first
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies (postinstall will run prisma generate)
RUN npm ci

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Expose port
EXPOSE 5000

# Start application
CMD ["npm", "start"]
