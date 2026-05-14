import { Request, Response } from 'express';
import * as customerService from '../service/customer.service';
import { sendSuccess } from '../../../core/utils/response';

export async function getCustomers(_req: Request, res: Response) {
  const customers = await customerService.getCustomers();
  sendSuccess({ res, data: customers });
}
