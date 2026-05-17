import { Request, Response } from 'express';
import * as boutiqueService from '../service/boutique.service';
import { sendSuccess, parsePagination } from '../../../core/utils/response';
import { buildUploadedFileDataUrl } from '../../../core/utils/public-url';

export async function getAllBoutiqueProducts(req: Request, res: Response) {
  const { isActive } = req.query;
  const result = await boutiqueService.getAllBoutiqueProducts(
    isActive !== undefined ? isActive === 'true' : undefined
  );
  sendSuccess({ res, data: result });
}

export async function getBoutiqueProduct(req: Request, res: Response) {
  const product = await boutiqueService.getBoutiqueProductBySlug(req.params.slug);
  sendSuccess({ res, data: product });
}

export async function createBoutiqueProduct(req: Request, res: Response) {
  const product = await boutiqueService.createBoutiqueProduct(req.body);
  sendSuccess({ res, statusCode: 201, message: 'Produk butik berhasil dibuat', data: product });
}

export async function updateBoutiqueProduct(req: Request, res: Response) {
  const product = await boutiqueService.updateBoutiqueProduct(req.params.id, req.body);
  sendSuccess({ res, message: 'Produk butik berhasil diupdate', data: product });
}

export async function deleteBoutiqueProduct(req: Request, res: Response) {
  await boutiqueService.deleteBoutiqueProduct(req.params.id);
  sendSuccess({ res, message: 'Produk butik berhasil dihapus' });
}

export async function uploadBoutiqueImage(req: Request, res: Response) {
  const file = req.file;
  if (!file) return sendSuccess({ res, statusCode: 400, message: 'Tidak ada file yang diupload' });
  const imageUrl = await buildUploadedFileDataUrl(file);
  const product = await boutiqueService.updateBoutiqueProduct(req.params.id, { imageUrl });
  sendSuccess({ res, statusCode: 201, message: 'Foto berhasil diupload', data: product });
}
