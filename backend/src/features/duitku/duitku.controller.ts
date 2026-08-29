import { Request, Response } from 'express';
import { sendSuccess } from '../../core/utils/response';
import * as orderService from '../orders/service/order.service';

export async function handleCallback(req: Request, res: Response) {
  if (!req.body?.signature) {
    sendSuccess({
      res,
      message: 'Callback Duitku reachable',
      data: { accepted: false, reason: 'missing_signature' },
    });
    return;
  }

  const order = await orderService.handleDuitkuCallback(req.body);
  sendSuccess({ res, message: 'Callback Duitku diproses', data: order });
}
