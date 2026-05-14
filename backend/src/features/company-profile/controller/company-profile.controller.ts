import { Request, Response } from 'express';
import * as companyProfileService from '../service/company-profile.service';
import { sendSuccess } from '../../../core/utils/response';

export async function getCompanyProfile(_req: Request, res: Response) {
  const data = await companyProfileService.getAllCompanyProfile();
  sendSuccess({ res, data });
}

export async function upsertCompanyProfile(req: Request, res: Response) {
  const result = await companyProfileService.upsertCompanyProfile(req.body);
  sendSuccess({ res, message: 'Company profile berhasil diupdate', data: result });
}

export async function bulkUpsertCompanyProfile(req: Request, res: Response) {
  const { items } = req.body;
  const result = await companyProfileService.bulkUpsertCompanyProfile(items);
  sendSuccess({ res, message: 'Company profile berhasil diupdate', data: result });
}
