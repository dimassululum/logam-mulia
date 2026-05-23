import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '../../../core/config/database';
import { env } from '../../../core/config/env';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../../core/utils/jwt';
import { sendEmail } from '../../../core/utils/email';
import {
  BadRequestError,
  ConflictError,
  UnauthorizedError,
  NotFoundError,
  ForbiddenError,
} from '../../../core/utils/errors';
import type { RegisterInput, LoginInput, ForgotPasswordInput, ResetPasswordInput } from '../schema/auth.schema';

const SALT_ROUNDS = 12;
const RESET_PASSWORD_TOKEN_BYTES = 32;
const RESET_PASSWORD_EXPIRES_MINUTES = 30;

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    phone: string | null;
  };
  tokens: AuthTokens;
}

// ─── Register ──────────────────────────────────────────────────────────────
export async function register(input: RegisterInput): Promise<AuthResponse> {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new ConflictError('Email sudah terdaftar');
  }

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash,
      phone: input.phone,
    },
  });

  const tokens = generateTokens(user.id, user.role);

  // Persist refresh token
  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken: tokens.refreshToken },
  });

  return {
    user: { id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone },
    tokens,
  };
}

// ─── Login ─────────────────────────────────────────────────────────────────
export async function login(input: LoginInput): Promise<AuthResponse> {
  const user = await prisma.user.findUnique({ where: { email: input.email } });

  if (!user) {
    throw new UnauthorizedError('Email atau password salah');
  }

  if (!user.isActive) {
    throw new ForbiddenError('Akun Anda telah dinonaktifkan. Hubungi admin.');
  }

  const isPasswordValid = await bcrypt.compare(input.password, user.passwordHash);
  if (!isPasswordValid) {
    throw new UnauthorizedError('Email atau password salah');
  }

  const tokens = generateTokens(user.id, user.role);

  // Update refresh token & last login
  await prisma.user.update({
    where: { id: user.id },
    data: {
      refreshToken: tokens.refreshToken,
      lastLoginAt: new Date(),
    },
  });

  return {
    user: { id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone },
    tokens,
  };
}

// ─── Forgot Password ──────────────────────────────────────────────────────
export async function forgotPassword(input: ForgotPasswordInput): Promise<void> {
  const user = await prisma.user.findUnique({ where: { email: input.email } });

  if (!user || !user.isActive) {
    return;
  }

  const token = crypto.randomBytes(RESET_PASSWORD_TOKEN_BYTES).toString('hex');
  const tokenHash = hashResetToken(token);
  const expiresAt = new Date(Date.now() + RESET_PASSWORD_EXPIRES_MINUTES * 60 * 1000);
  const resetLink = `${env.FRONTEND_URL}/reset-password?token=${encodeURIComponent(token)}`;

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordResetTokenHash: tokenHash,
      passwordResetExpiresAt: expiresAt,
    },
  });

  await sendEmail({
    to: user.email,
    subject: 'Reset Password Logam Mulia Antam',
    text: [
      `Halo ${user.name},`,
      '',
      'Kami menerima permintaan reset password untuk akun Logam Mulia Antam Anda.',
      `Buka link berikut untuk membuat password baru: ${resetLink}`,
      '',
      `Link ini berlaku selama ${RESET_PASSWORD_EXPIRES_MINUTES} menit.`,
      'Abaikan email ini jika Anda tidak meminta reset password.',
    ].join('\n'),
    html: `
      <p>Halo ${user.name},</p>
      <p>Kami menerima permintaan reset password untuk akun Logam Mulia Antam Anda.</p>
      <p><a href="${resetLink}">Klik di sini untuk membuat password baru</a>.</p>
      <p>Link ini berlaku selama ${RESET_PASSWORD_EXPIRES_MINUTES} menit.</p>
      <p>Abaikan email ini jika Anda tidak meminta reset password.</p>
    `,
  });
}

// ─── Reset Password ───────────────────────────────────────────────────────
export async function resetPassword(input: ResetPasswordInput): Promise<void> {
  const tokenHash = hashResetToken(input.token);
  const user = await prisma.user.findFirst({
    where: {
      passwordResetTokenHash: tokenHash,
      passwordResetExpiresAt: { gt: new Date() },
    },
  });

  if (!user) {
    throw new BadRequestError('Link reset password tidak valid atau sudah kedaluwarsa');
  }

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      refreshToken: null,
      passwordResetTokenHash: null,
      passwordResetExpiresAt: null,
    },
  });
}

// ─── Refresh Token ─────────────────────────────────────────────────────────
export async function refreshToken(token: string): Promise<{ accessToken: string }> {
  let payload: { userId: string };
  try {
    payload = verifyRefreshToken(token);
  } catch {
    throw new UnauthorizedError('Refresh token tidak valid atau sudah kedaluwarsa');
  }

  const user = await prisma.user.findUnique({ where: { id: payload.userId } });

  if (!user || user.refreshToken !== token) {
    throw new UnauthorizedError('Refresh token tidak valid');
  }

  if (!user.isActive) {
    throw new ForbiddenError('Akun Anda telah dinonaktifkan');
  }

  const accessToken = signAccessToken({ userId: user.id, role: user.role });
  return { accessToken };
}

// ─── Logout ────────────────────────────────────────────────────────────────
export async function logout(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { refreshToken: null },
  });
}

// ─── Get Me ────────────────────────────────────────────────────────────────
export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      isKycVerified: true,
      ktpUrl: true,
      createdAt: true,
      addresses: {
        orderBy: { isDefault: 'desc' },
      },
    },
  });

  if (!user) {
    throw new NotFoundError('User');
  }

  return user;
}

// ─── Helpers ───────────────────────────────────────────────────────────────
function generateTokens(userId: string, role: string): AuthTokens {
  return {
    accessToken: signAccessToken({ userId, role }),
    refreshToken: signRefreshToken({ userId }),
  };
}

function hashResetToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}
