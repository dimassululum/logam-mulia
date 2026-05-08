import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { env, corsOrigins, isDevelopment } from './config/env';
import { errorHandler } from './middlewares/error.middleware';
import authRoutes from '../routes/auth.routes';
import userRoutes from '../routes/users.routes';
import categoryRoutes from '../routes/categories.routes';
import productRoutes from '../routes/products.routes';
import cartRoutes from '../routes/cart.routes';
import orderRoutes from '../routes/orders.routes';
import paymentRoutes from '../routes/payments.routes';
import voucherRoutes from '../routes/vouchers.routes';
import promoRoutes from '../routes/promos.routes';
import reviewRoutes from '../routes/reviews.routes';
import adminRoutes from '../routes/admin.routes';
import bannerRoutes from '../routes/banners.routes';
import contentRoutes from '../routes/contents.routes';

// Create Express app
export const createApp = (): Application => {
  const app = express();

  // Trust proxy for rate limiting
  app.set('trust proxy', 1);

  // Security middleware
  app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  }));

  // CORS configuration
  app.use(cors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  }));

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
      error: 'Too many requests from this IP, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use('/api', limiter);

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Static file serving for uploads
  app.use('/uploads', express.static('uploads'));

  // Static file serving for public assets
  app.use('/public', express.static('public'));

  // Favicon route
  app.get('/favicon.ico', (req, res) => {
    res.status(204).end(); // No content
  });

  // Request logging middleware (development only)
  if (isDevelopment) {
    app.use((req: Request, res: Response, next: NextFunction) => {
      const timestamp = new Date().toISOString();
      console.log(`📝 ${timestamp} - ${req.method} ${req.path}`);
      next();
    });
  }

  // Health check endpoint
  app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: env.NODE_ENV,
      version: '1.0.0',
    });
  });

  // API routes
  app.get('/api', (req: Request, res: Response) => {
    res.json({
      message: 'Logam Mulia API v1.0.0',
      status: 'running',
      endpoints: {
        health: '/health',
        auth: {
          register: 'POST /api/auth/register',
          login: 'POST /api/auth/login',
          refresh: 'POST /api/auth/refresh',
          me: 'GET /api/auth/me',
          profile: 'PUT /api/auth/profile',
          logout: 'POST /api/auth/logout',
        },
        users: {
          list: 'GET /api/users',
          detail: 'GET /api/users/:id',
          create: 'POST /api/users',
          update: 'PUT /api/users/:id',
          delete: 'DELETE /api/users/:id',
          reactivate: 'POST /api/users/:id/reactivate',
          stats: 'GET /api/users/stats',
        },
        categories: {
          list: 'GET /api/categories',
          tree: 'GET /api/categories/tree',
          detail: 'GET /api/categories/:id',
          create: 'POST /api/categories',
          update: 'PUT /api/categories/:id',
          delete: 'DELETE /api/categories/:id',
        },
        products: {
          list: 'GET /api/products',
          featured: 'GET /api/products/featured',
          search: 'GET /api/products/search',
          detail: 'GET /api/products/:id',
          create: 'POST /api/products',
          update: 'PUT /api/products/:id',
          delete: 'DELETE /api/products/:id',
          bulkUpdate: 'POST /api/products/bulk-update',
          bulkDelete: 'POST /api/products/bulk-delete',
          stats: 'GET /api/products/stats',
        },
        cart: {
          get: 'GET /api/cart',
          addItem: 'POST /api/cart',
          updateItem: 'PUT /api/cart/:itemId',
          removeItem: 'DELETE /api/cart/:itemId',
          clear: 'DELETE /api/cart',
          merge: 'POST /api/cart/merge',
        },
        orders: {
          list: 'GET /api/orders',
          detail: 'GET /api/orders/:id',
          create: 'POST /api/orders',
          update: 'PUT /api/orders/:id',
          cancel: 'POST /api/orders/:id/cancel',
          stats: 'GET /api/orders/stats',
        },
        payments: {
          charge: 'POST /api/payments/charge',
          status: 'GET /api/payments/status/:orderId',
          webhook: 'POST /api/payments/webhook',
          cancel: 'POST /api/payments/cancel/:orderId',
          methods: 'GET /api/payments/methods',
        },
        vouchers: {
          list: 'GET /api/vouchers',
          active: 'GET /api/vouchers/active',
          detail: 'GET /api/vouchers/:id',
          create: 'POST /api/vouchers',
          update: 'PUT /api/vouchers/:id',
          delete: 'DELETE /api/vouchers/:id',
          validate: 'POST /api/vouchers/validate',
          stats: 'GET /api/vouchers/stats',
        },
        promos: {
          list: 'GET /api/promos',
          active: 'GET /api/promos/active',
          detail: 'GET /api/promos/:id',
          create: 'POST /api/promos',
          update: 'PUT /api/promos/:id',
          delete: 'DELETE /api/promos/:id',
          stats: 'GET /api/promos/stats',
        },
        reviews: {
          list: 'GET /api/reviews',
          detail: 'GET /api/reviews/:id',
          create: 'POST /api/reviews',
          update: 'PUT /api/reviews/:id',
          delete: 'DELETE /api/reviews/:id',
          product: 'GET /api/reviews/product/:productId',
          pending: 'GET /api/reviews/pending',
          stats: 'GET /api/reviews/stats',
        },
        admin: {
          dashboard: 'GET /api/admin/dashboard',
          users: 'GET /api/admin/users',
          updateUser: 'PUT /api/admin/users/:id',
          orders: 'GET /api/admin/orders',
          bulkUpdateOrders: 'POST /api/admin/orders/bulk-update',
          settings: 'GET /api/admin/settings',
          updateSettings: 'POST /api/admin/settings',
        },
        banners: {
          list: 'GET /api/banners',
          public: 'GET /api/banners/public',
          detail: 'GET /api/banners/:id',
          create: 'POST /api/banners',
          update: 'PUT /api/banners/:id',
          delete: 'DELETE /api/banners/:id',
          toggle: 'POST /api/banners/:id/toggle',
          reorder: 'POST /api/banners/reorder',
        },
        contents: {
          list: 'GET /api/contents',
          public: 'GET /api/contents/public',
          detail: 'GET /api/contents/:id',
          bySlug: 'GET /api/contents/slug/:slug',
          create: 'POST /api/contents',
          update: 'PUT /api/contents/:id',
          delete: 'DELETE /api/contents/:id',
          publish: 'POST /api/contents/:id/publish',
          unpublish: 'POST /api/contents/:id/unpublish',
        },
      },
    });
  });

  // Auth routes
  app.use('/api/auth', authRoutes);

  // User routes
  app.use('/api/users', userRoutes);

  // Category routes
  app.use('/api/categories', categoryRoutes);

  // Product routes
  app.use('/api/products', productRoutes);

  // Cart routes
  app.use('/api/cart', cartRoutes);

  // Order routes
  app.use('/api/orders', orderRoutes);

  // Payment routes
  app.use('/api/payments', paymentRoutes);

  // Voucher routes
  app.use('/api/vouchers', voucherRoutes);

  // Promo routes
  app.use('/api/promos', promoRoutes);

  // Review routes
  app.use('/api/reviews', reviewRoutes);

  // Admin routes
  app.use('/api/admin', adminRoutes);

  // Banner routes
  app.use('/api/banners', bannerRoutes);

  // Content routes
  app.use('/api/contents', contentRoutes);

  // Direct login route (without /api prefix)
  app.post('/login', (req: Request, res: Response) => {
    // Redirect to the actual login endpoint
    res.redirect(307, '/api/auth/login');
  });

  // 404 handler
  app.use('*', (req: Request, res: Response) => {
    res.status(404).json({
      error: 'Route not found',
      message: `Cannot ${req.method} ${req.originalUrl}`,
    });
  });

  // Error handling middleware (must be last)
  app.use(errorHandler);

  return app;
};

// Graceful shutdown handler
export const setupGracefulShutdown = (app: Application) => {
  const gracefulShutdown = (signal: string) => {
    console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
    
    // Close server, database connections, etc.
    process.exit(0);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
};

console.log('🚀 Server module loaded');