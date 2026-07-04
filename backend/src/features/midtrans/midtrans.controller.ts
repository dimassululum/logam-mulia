import { Request, Response } from 'express';
import { sendSuccess } from '../../core/utils/response';
import * as orderService from '../orders/service/order.service';

export async function handleNotification(req: Request, res: Response) {
  const order = await orderService.handleMidtransNotification(req.body);
  sendSuccess({ res, message: 'Notification Midtrans diproses', data: order });
}
