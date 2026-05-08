FROM node:20-alpine

RUN apk add --no-cache dumb-init openssl

WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY prisma ./prisma
COPY . .

RUN npx prisma generate && \
    mkdir -p uploads public && \
    chown -R node:node /app

ENV NODE_ENV=production

EXPOSE 5000

USER node

ENTRYPOINT ["dumb-init", "--"]
CMD ["sh", "-c", "npx prisma migrate deploy && npx ts-node --transpile-only src/index.ts"]
