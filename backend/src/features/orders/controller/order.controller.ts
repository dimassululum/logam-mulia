import { Request, Response } from 'express';
import * as orderService from '../service/order.service';
import { createOrderSchema, updateOrderStatusSchema } from '../schema/order.schema';
import { sendSuccess } from '../../../core/utils/response';

export async function getAllOrders(_req: Request, res: Response) {
  const orders = await orderService.getAllOrders();
  sendSuccess({ res, data: orders });
}

export async function getOrder(req: Request, res: Response) {
  const order = await orderService.getOrderById(req.params.id);
  sendSuccess({ res, data: order });
}

export async function getMyOrders(req: Request, res: Response) {
  const orders = await orderService.getOrdersByUserId(req.user!.userId);
  sendSuccess({ res, data: orders });
}

export async function getMyOrder(req: Request, res: Response) {
  const order = await orderService.getOrderByIdForUser(req.params.id, req.user!.userId);
  sendSuccess({ res, data: order });
}

export async function createOrder(req: Request, res: Response) {
  const input = createOrderSchema.parse(req.body);
  const order = await orderService.createOrder(input);
  sendSuccess({ res, statusCode: 201, message: 'Pesanan berhasil dibuat', data: order });
}

export async function updateOrderStatus(req: Request, res: Response) {
  const input = updateOrderStatusSchema.parse(req.body);
  const order = await orderService.updateOrderStatus(req.params.id, input);
  sendSuccess({ res, message: 'Status pesanan berhasil diperbarui', data: order });
}

export async function markOrderPaid(req: Request, res: Response) {
  const order = await orderService.markOrderPaid(req.params.id, req.user!.userId, req.user!.role);
  sendSuccess({ res, message: 'Pembayaran pesanan berhasil dikonfirmasi', data: order });
}
