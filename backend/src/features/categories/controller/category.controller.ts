import { Request, Response } from 'express';
import * as categoryService from '../service/category.service';
import { sendSuccess } from '../../../core/utils/response';

export async function getAllCategories(_req: Request, res: Response) {
  const categories = await categoryService.getAllCategories();
  sendSuccess({ res, data: categories });
}

export async function getCategory(req: Request, res: Response) {
  const category = await categoryService.getCategoryBySlug(req.params.slug);
  sendSuccess({ res, data: category });
}

export async function createCategory(req: Request, res: Response) {
  const category = await categoryService.createCategory(req.body);
  sendSuccess({ res, statusCode: 201, message: 'Kategori berhasil dibuat', data: category });
}

export async function updateCategory(req: Request, res: Response) {
  const category = await categoryService.updateCategory(req.params.id, req.body);
  sendSuccess({ res, message: 'Kategori berhasil diupdate', data: category });
}

export async function deleteCategory(req: Request, res: Response) {
  await categoryService.deleteCategory(req.params.id);
  sendSuccess({ res, message: 'Kategori berhasil dihapus' });
}
