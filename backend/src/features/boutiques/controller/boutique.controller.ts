import { Request, Response } from 'express';
import * as boutiqueService from '../service/boutique.service';
import { sendSuccess } from '../../../core/utils/response';

export async function getAllBoutiques(req: Request, res: Response) {
  const { isActive, search } = req.query;
  const boutiques = await boutiqueService.getAllBoutiques({
    isActive: isActive !== undefined ? isActive === 'true' : undefined,
    search: search as string,
  });

  sendSuccess({ res, data: boutiques });
}

export async function getBoutique(req: Request, res: Response) {
  const boutique = await boutiqueService.getBoutiqueBySlug(req.params.slug);
  sendSuccess({ res, data: boutique });
}

export async function createBoutique(req: Request, res: Response) {
  const boutique = await boutiqueService.createBoutique(req.body);
  sendSuccess({ res, statusCode: 201, message: 'Butik berhasil dibuat', data: boutique });
}

export async function updateBoutique(req: Request, res: Response) {
  const boutique = await boutiqueService.updateBoutique(req.params.id, req.body);
  sendSuccess({ res, message: 'Butik berhasil diupdate', data: boutique });
}

export async function deleteBoutique(req: Request, res: Response) {
  await boutiqueService.deleteBoutique(req.params.id);
  sendSuccess({ res, message: 'Butik berhasil dihapus' });
}
