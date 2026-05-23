import { Request, Response } from 'express';
import * as productService from '../service/product.service';
import { sendSuccess, paginate, parsePagination } from '../../../core/utils/response';
import { buildUploadedFileDataUrl } from '../../../core/utils/public-url';

export async function getAllProducts(req: Request, res: Response) {
  const { page, limit } = parsePagination(req.query as any);
  const { categoryId, search, isActive } = req.query;

  const result = await productService.getAllProducts({
    page,
    limit,
    categoryId: categoryId as string,
    search: search as string,
    isActive: isActive !== undefined ? isActive === 'true' : undefined,
  });

  sendSuccess({
    res,
    data: result.products,
    meta: paginate(result.total, page, limit),
  });
}

export async function getProduct(req: Request, res: Response) {
  const product = await productService.getProductBySlug(req.params.slug);
  sendSuccess({ res, data: product });
}

export async function createProduct(req: Request, res: Response) {
  const product = await productService.createProduct(req.body);
  sendSuccess({ res, statusCode: 201, message: 'Produk berhasil dibuat', data: product });
}

export async function updateProduct(req: Request, res: Response) {
  const product = await productService.updateProduct(req.params.id, req.body);
  sendSuccess({ res, message: 'Produk berhasil diupdate', data: product });
}

export async function deleteProduct(req: Request, res: Response) {
  await productService.deleteProduct(req.params.id);
  sendSuccess({ res, message: 'Produk berhasil dihapus' });
}

export async function uploadImage(req: Request, res: Response) {
  const { id } = req.params;
  const { isPrimary } = req.body;
  const file = req.file;

  if (!file) {
    return sendSuccess({ res, statusCode: 400, message: 'Tidak ada file yang diupload' });
  }

  const imageUrl = await buildUploadedFileDataUrl(file);
  const image = await productService.addProductImage(id, imageUrl, isPrimary === 'true');

  sendSuccess({ res, statusCode: 201, message: 'Foto berhasil ditambahkan', data: image });
}

export async function deleteImage(req: Request, res: Response) {
  await productService.removeProductImage(req.params.imageId);
  sendSuccess({ res, message: 'Foto berhasil dihapus' });
}

export async function createDisplayReview(req: Request, res: Response) {
  const review = await productService.createDisplayReview(req.params.id, req.body);
  sendSuccess({ res, statusCode: 201, message: 'Ulasan berhasil dibuat', data: review });
}

export async function updateDisplayReview(req: Request, res: Response) {
  const review = await productService.updateDisplayReview(req.params.reviewId, req.body);
  sendSuccess({ res, message: 'Ulasan berhasil diupdate', data: review });
}

export async function deleteDisplayReview(req: Request, res: Response) {
  await productService.deleteDisplayReview(req.params.reviewId);
  sendSuccess({ res, message: 'Ulasan berhasil dihapus' });
}
