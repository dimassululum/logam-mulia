import { Request, Response } from 'express';
import { sendSuccess } from '../../../core/utils/response';
import * as paymentMethodService from '../service/payment-method.service';
import { updatePaymentGatewayModeSchema, updatePaymentMethodSchema } from '../schema/payment-method.schema';

export async function getPublicPaymentMethods(_req: Request, res: Response) {
  const methods = await paymentMethodService.getPublicPaymentMethods();
  sendSuccess({ res, data: methods });
}

export async function getCheckoutPaymentMethods(_req: Request, res: Response) {
  const result = await paymentMethodService.getCheckoutPaymentMethods();
  sendSuccess({ res, data: result });
}

export async function getAdminPaymentMethods(_req: Request, res: Response) {
  const methods = await paymentMethodService.getAdminPaymentMethods();
  sendSuccess({ res, data: methods });
}

export async function getPaymentGatewayMode(_req: Request, res: Response) {
  const mode = await paymentMethodService.getPaymentGatewayMode();
  sendSuccess({ res, data: { mode } });
}

export async function updatePaymentGatewayMode(req: Request, res: Response) {
  const input = updatePaymentGatewayModeSchema.parse(req.body);
  const result = await paymentMethodService.updatePaymentGatewayMode(input);
  sendSuccess({ res, message: 'Mode pembayaran berhasil diupdate', data: result });
}

export async function updatePaymentMethod(req: Request, res: Response) {
  const input = updatePaymentMethodSchema.parse(req.body);
  const method = await paymentMethodService.updatePaymentMethod(req.params.code, input);
  sendSuccess({ res, message: 'Metode pembayaran berhasil diupdate', data: method });
}

export async function updateQrisImage(req: Request, res: Response) {
  const method = await paymentMethodService.updateQrisImage(req.file);
  sendSuccess({ res, message: 'Gambar QRIS berhasil diupload', data: method });
}

export async function updateBankAccountAttachment(req: Request, res: Response) {
  const method = await paymentMethodService.updateBankAccountAttachment(req.params.accountId, req.file);
  sendSuccess({ res, message: 'Lampiran buku tabungan berhasil diupload', data: method });
}
