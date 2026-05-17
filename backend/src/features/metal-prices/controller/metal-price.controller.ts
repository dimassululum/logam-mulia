import { Request, Response } from 'express';
import { sendSuccess } from '../../../core/utils/response';
import * as metalPriceService from '../service/metal-price.service';

export async function getMetalPrices(_req: Request, res: Response) {
  const summary = await metalPriceService.getMetalPricesSummary();
  sendSuccess({ res, data: summary });
}

export async function updateMetalPrices(req: Request, res: Response) {
  const summary = await metalPriceService.updateMetalPrices(req.body);
  sendSuccess({ res, message: 'Harga logam berhasil diupdate', data: summary });
}
