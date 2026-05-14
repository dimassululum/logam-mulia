import bcrypt from 'bcryptjs';
import { prisma } from '../../../core/config/database';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../../core/utils/jwt';
import {
  ConflictError,
  UnauthorizedError,
  NotFoundError,
  ForbiddenError,
} from '../../../core/utils/errors';
import type { RegisterInput, LoginInput } from '../schema/auth.schema';

const SALT_ROUNDS = 12;

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
