import { Request, Response } from 'express';
import * as voucherService from '../service/voucher.service';
import { paginate, parsePagination, sendSuccess } from '../../../core/utils/response';

export async function getAllVouchers(req: Request, res: Response) {
  const { page, limit } = parsePagination(req.query as any);
  const { search, isActive } = req.query;

  const result = await voucherService.getAllVouchers({
    page,
    limit,
    search: search as string,
    isActive: isActive !== undefined ? isActive === 'true' : undefined,
  });

  sendSuccess({
    res,
    data: result.vouchers,
    meta: paginate(result.total, page, limit),
  });
}

export async function getPublicActiveVouchers(req: Request, res: Response) {
  const { page, limit } = parsePagination(req.query as any);
  const result = await voucherService.getPublicActiveVouchers({ page, limit });

  sendSuccess({
    res,
    data: result.vouchers,
    meta: paginate(result.total, page, limit),
  });
}

export async function getVoucher(req: Request, res: Response) {
  const voucher = await voucherService.getVoucherById(req.params.id);
  sendSuccess({ res, data: voucher });
}

export async function createVoucher(req: Request, res: Response) {
  const voucher = await voucherService.createVoucher(req.body);
  sendSuccess({ res, statusCode: 201, message: 'Voucher berhasil dibuat', data: voucher });
}

export async function updateVoucher(req: Request, res: Response) {
  const voucher = await voucherService.updateVoucher(req.params.id, req.body);
  sendSuccess({ res, message: 'Voucher berhasil diupdate', data: voucher });
}

export async function deleteVoucher(req: Request, res: Response) {
  await voucherService.deactivateVoucher(req.params.id);
  sendSuccess({ res, message: 'Voucher berhasil dinonaktifkan' });
}

export async function validateVoucher(req: Request, res: Response) {
  const result = await voucherService.validateVoucher(req.user!.userId, req.body);
  sendSuccess({ res, message: 'Voucher valid', data: result });
}
