import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import 'express-async-errors';
import path from 'path';

import { env } from './config/env';
import { errorHandler } from './middlewares/error.middleware';
import { logger } from './utils/logger';

// Feature routes
import authRoutes from '../features/auth/routes/auth.routes';
import categoryRoutes from '../features/categories/routes/category.routes';
import productRoutes from '../features/products/routes/product.routes';
import boutiqueRoutes from '../features/boutique/routes/boutique.routes';
import boutiquesRoutes from '../features/boutiques/routes/boutique.routes';
import articleRoutes from '../features/articles/routes/article.routes';
import companyProfileRoutes from '../features/company-profile/routes/company-profile.routes';
import voucherRoutes from '../features/vouchers/routes/voucher.routes';
import checkoutRoutes from '../features/checkout/routes/checkout.routes';
import customerRoutes from '../features/customers/routes/customer.routes';
import orderRoutes from '../features/orders/routes/order.routes';
import metalPriceRoutes from '../features/metal-prices/routes/metal-price.routes';
import paymentMethodRoutes from '../features/payment-methods/routes/payment-method.routes';
import midtransRoutes from '../features/midtrans/midtrans.routes';
import duitkuRoutes from '../features/duitku/duitku.routes';

const app = express();
app.set('trust proxy', 1);

const allowedOrigins = [
  env.FRONTEND_URL,
  ...env.FRONTEND_URLS,
  ...(env.IS_DEVELOPMENT ? ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:3003'] : []),
];
const allowedOriginPatterns = [
  /^https:\/\/.*\.vercel\.app$/,
];

// ─── Security ──────────────────────────────────────────────────────────────
app.use(helmet());

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      if (allowedOriginPatterns.some((pattern) => pattern.test(origin))) {
        callback(null, true);
        return;
      }

      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ─── Rate Limiting ─────────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  message: { success: false, message: 'Terlalu banyak request, coba lagi nanti' },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Terlalu banyak percobaan login, coba lagi dalam 15 menit' },
});

app.use(globalLimiter);

// ─── Body Parsing ──────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Static Files (must be before helmet to allow cross-origin) ────────────
const uploadsStatic = express.static(path.resolve(env.UPLOAD_DIR));
const allowCrossOriginUploads: express.RequestHandler = (_req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
};

app.use('/uploads', allowCrossOriginUploads, uploadsStatic);
app.use('/api/uploads', allowCrossOriginUploads, uploadsStatic);

// ─── Health Check ──────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
  });
});

// ─── API Routes ────────────────────────────────────────────────────────────
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/boutique', boutiqueRoutes);
app.use('/api/boutiques', boutiquesRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/company-profile', companyProfileRoutes);
app.use('/api/vouchers', voucherRoutes);
app.use('/api/checkout', checkoutRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/metal-prices', metalPriceRoutes);
app.use('/api/payment-methods', paymentMethodRoutes);
app.use('/api/midtrans', midtransRoutes);
app.use('/api/duitku', duitkuRoutes);

// ─── 404 Handler ───────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint tidak ditemukan' });
});

// ─── Global Error Handler ──────────────────────────────────────────────────
app.use(errorHandler);

logger.info(`Server configured — env: ${env.NODE_ENV}`);

export default app;
