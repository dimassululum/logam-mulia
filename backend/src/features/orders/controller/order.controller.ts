import { Request, Response } from 'express';
import * as orderService from '../service/order.service';
import { createOrderSchema, updateOrderStatusSchema } from '../schema/order.schema';
import { paginate, parsePagination, sendSuccess } from '../../../core/utils/response';

function getQueryString(value: unknown) {
  return typeof value === 'string' ? value : undefined;
}

export async function getAllOrders(req: Request, res: Response) {
  const { page, limit, skip } = parsePagination({
    page: getQueryString(req.query.page),
    limit: getQueryString(req.query.limit),
  });
  const result = await orderService.getAllOrders({
    page,
    limit,
    skip,
    search: getQueryString(req.query.search),
    status: getQueryString(req.query.status),
    shipping: getQueryString(req.query.shipping),
  });
  sendSuccess({ res, data: result.orders, meta: paginate(result.total, page, limit) });
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

export async function uploadPaymentProof(req: Request, res: Response) {
  const order = await orderService.uploadPaymentProof(req.params.id, req.user!.userId, req.file);
  sendSuccess({ res, message: 'Bukti pembayaran berhasil diupload', data: order });
}

export async function confirmPayment(req: Request, res: Response) {
  const order = await orderService.confirmOrderPayment(req.params.id, req.user!.role);
  sendSuccess({ res, message: 'Pembayaran pesanan berhasil dikonfirmasi', data: order });
}
