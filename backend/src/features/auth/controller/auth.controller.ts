import { Request, Response } from 'express';
import * as authService from '../service/auth.service';
import { sendSuccess } from '../../../core/utils/response';

export async function register(req: Request, res: Response): Promise<void> {
  const result = await authService.register(req.body);
  sendSuccess({
    res,
    statusCode: 201,
    message: 'Registrasi berhasil',
    data: result,
  });
}

export async function login(req: Request, res: Response): Promise<void> {
  const result = await authService.login(req.body);
  sendSuccess({
    res,
    message: 'Login berhasil',
    data: result,
  });
}

export async function forgotPassword(req: Request, res: Response): Promise<void> {
  await authService.forgotPassword(req.body);
  sendSuccess({
    res,
    message: 'Jika email terdaftar, link reset password akan dikirim ke email tersebut.',
  });
}

export async function resetPassword(req: Request, res: Response): Promise<void> {
  await authService.resetPassword(req.body);
  sendSuccess({
    res,
    message: 'Password berhasil direset. Silakan login dengan password baru.',
  });
}

export async function refreshToken(req: Request, res: Response): Promise<void> {
  const { refreshToken } = req.body;
  const result = await authService.refreshToken(refreshToken);
  sendSuccess({
    res,
    message: 'Token diperbarui',
    data: result,
  });
}

export async function logout(req: Request, res: Response): Promise<void> {
  await authService.logout(req.user!.userId);
  sendSuccess({ res, message: 'Logout berhasil' });
}

export async function getMe(req: Request, res: Response): Promise<void> {
  const user = await authService.getMe(req.user!.userId);
  sendSuccess({ res, data: user });
}

export async function updateProfile(req: Request, res: Response): Promise<void> {
  const user = await authService.updateProfile(req.user!.userId, req.body);
  sendSuccess({ res, message: 'Profil berhasil diperbarui', data: user });
}
