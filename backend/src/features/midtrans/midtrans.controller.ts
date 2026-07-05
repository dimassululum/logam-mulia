import { Request, Response } from 'express';
import { sendSuccess } from '../../core/utils/response';
import * as orderService from '../orders/service/order.service';

export async function handleNotification(req: Request, res: Response) {
  if (!req.body?.signature_key) {
    sendSuccess({
      res,
      message: 'Notification Midtrans reachable',
      data: { accepted: false, reason: 'missing_signature' },
    });
    return;
  }

  const order = await orderService.handleMidtransNotification(req.body);
  sendSuccess({ res, message: 'Notification Midtrans diproses', data: order });
}
