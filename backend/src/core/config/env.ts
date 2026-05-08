import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables
dotenv.config();

// Environment validation schema
const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('5000'),

  // Database
  DATABASE_URL: z.string().min(1, 'Database URL is required'),

  // JWT
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT access secret must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT refresh secret must be at least 32 characters'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  // Midtrans
  MIDTRANS_SERVER_KEY: z.string().min(1, 'Midtrans server key is required'),
  MIDTRANS_CLIENT_KEY: z.string().min(1, 'Midtrans client key is required'),
  MIDTRANS_IS_PRODUCTION: z.string().transform(Boolean).default('false'),

  // Raja Ongkir
  RAJAONGKIR_API_KEY: z.string().min(1, 'Raja Ongkir API key is required'),
  RAJAONGKIR_BASE_URL: z.string().url().default('https://api.rajaongkir.com/starter'),

  // Email
  RESEND_API_KEY: z.string().min(1, 'Resend API key is required'),
  EMAIL_FROM: z.string().email().default('noreply@logam-mulia-antam.com'),

  // File Upload
  UPLOAD_DIR: z.string().default('./uploads'),
  MAX_FILE_SIZE_MB: z.string().transform(Number).default('5'),

  // CORS
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),
});

// Validate environment variables
function validateEnv() {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Invalid environment variables:');
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
      process.exit(1);
    }
    throw error;
  }
}

// Export validated environment
export const env = validateEnv();

// Export database URL separately for Prisma
export const databaseUrl = env.DATABASE_URL;

// Export isDevelopment helper
export const isDevelopment = env.NODE_ENV === 'development';
export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';

// Export file upload limits
export const maxFileSize = env.MAX_FILE_SIZE_MB * 1024 * 1024; // Convert MB to bytes
export const UPLOAD_DIR = env.UPLOAD_DIR;

// Export CORS origins — always include the configured URL; in dev also allow any localhost port
export const corsOrigins: (string | RegExp)[] = [
  env.FRONTEND_URL,
  ...(isDevelopment ? [/^http:\/\/localhost(:\d+)?$/] : []),
];

console.log(`✅ Environment loaded for ${env.NODE_ENV}`);
console.log(`🌐 Server will run on port ${env.PORT}`);
console.log(`📁 Upload directory: ${env.UPLOAD_DIR}`);
console.log(`📧 Email from: ${env.EMAIL_FROM}`);