import { Request, Response } from 'express';
import * as checkoutService from '../service/checkout.service';
import { sendSuccess } from '../../../core/utils/response';
import { checkoutCustomerBodySchema, checkoutCustomerQuerySchema, shippingRatesSchema } from '../schema/checkout.schema';

export async function lookupCustomer(req: Request, res: Response) {
  const query = checkoutCustomerQuerySchema.parse(req.query);
  const customer = await checkoutService.lookupCheckoutCustomer(query.email);
  sendSuccess({ res, data: customer });
}

export async function saveCustomer(req: Request, res: Response) {
  const body = checkoutCustomerBodySchema.parse(req.body);
  const customer = await checkoutService.saveCheckoutCustomer(body, req.file);
  sendSuccess({ res, message: 'Data checkout berhasil disimpan', data: customer });
}

export async function getShippingRates(req: Request, res: Response) {
  const query = shippingRatesSchema.parse(req.query);
  const rates = await checkoutService.getShippingRates(query.destinationCity, query.weightGram);
  sendSuccess({ res, data: rates });
}
