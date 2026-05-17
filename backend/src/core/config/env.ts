import dotenv from 'dotenv';

dotenv.config();

const port = parseInt(process.env.PORT || '5000', 10);

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '');
}

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: port,
  PUBLIC_API_URL: trimTrailingSlash(process.env.PUBLIC_API_URL || `http://localhost:${port}`),

  DATABASE_URL: requireEnv('DATABASE_URL'),

  JWT_ACCESS_SECRET: requireEnv('JWT_ACCESS_SECRET'),
  JWT_REFRESH_SECRET: requireEnv('JWT_REFRESH_SECRET'),
  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',

  MIDTRANS_SERVER_KEY: process.env.MIDTRANS_SERVER_KEY || '',
  MIDTRANS_CLIENT_KEY: process.env.MIDTRANS_CLIENT_KEY || '',
  MIDTRANS_IS_PRODUCTION: process.env.MIDTRANS_IS_PRODUCTION === 'true',

  RAJAONGKIR_API_KEY: process.env.RAJAONGKIR_API_KEY || '',
  RAJAONGKIR_BASE_URL: process.env.RAJAONGKIR_BASE_URL || 'https://rajaongkir.komerce.id/api/v1',
  RAJAONGKIR_ORIGIN_SEARCH: process.env.RAJAONGKIR_ORIGIN_SEARCH || 'Jakarta Timur',

  RESEND_API_KEY: process.env.RESEND_API_KEY || '',
  EMAIL_FROM: process.env.EMAIL_FROM || 'noreply@logam-mulia.com',

  UPLOAD_DIR: process.env.UPLOAD_DIR || './uploads',
  MAX_FILE_SIZE_MB: parseInt(process.env.MAX_FILE_SIZE_MB || '5', 10),

  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  FRONTEND_URLS: (process.env.FRONTEND_URLS || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean),

  get IS_PRODUCTION() {
    return this.NODE_ENV === 'production';
  },

  get IS_DEVELOPMENT() {
    return this.NODE_ENV === 'development';
  },
};
