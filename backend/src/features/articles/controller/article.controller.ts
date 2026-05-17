import { Request, Response } from 'express';
import * as articleService from '../service/article.service';
import { sendSuccess, paginate, parsePagination } from '../../../core/utils/response';
import { buildUploadedFileDataUrl } from '../../../core/utils/public-url';

export async function getAllArticles(req: Request, res: Response) {
  const { page, limit } = parsePagination(req.query as any);
  const { isPublished, search } = req.query;
  const result = await articleService.getAllArticles({
    page,
    limit,
    isPublished: isPublished !== undefined ? isPublished === 'true' : undefined,
    search: search as string,
  });
  sendSuccess({ res, data: result.articles, meta: paginate(result.total, page, limit) });
}

export async function getArticle(req: Request, res: Response) {
  const article = await articleService.getArticleBySlug(req.params.slug);
  sendSuccess({ res, data: article });
}

export async function createArticle(req: Request, res: Response) {
  const authorId = (req as any).user.userId;
  const article = await articleService.createArticle(authorId, req.body);
  sendSuccess({ res, statusCode: 201, message: 'Artikel berhasil dibuat', data: article });
}

export async function updateArticle(req: Request, res: Response) {
  const article = await articleService.updateArticle(req.params.id, req.body);
  sendSuccess({ res, message: 'Artikel berhasil diupdate', data: article });
}

export async function deleteArticle(req: Request, res: Response) {
  await articleService.deleteArticle(req.params.id);
  sendSuccess({ res, message: 'Artikel berhasil dihapus' });
}

export async function uploadArticleCover(req: Request, res: Response) {
  const file = req.file;
  if (!file) return sendSuccess({ res, statusCode: 400, message: 'Tidak ada file yang diupload' });
  const coverUrl = await buildUploadedFileDataUrl(file);
  const article = await articleService.updateArticle(req.params.id, { coverUrl });
  sendSuccess({ res, statusCode: 201, message: 'Cover berhasil diupload', data: article });
}
