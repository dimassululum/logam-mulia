import { Router } from 'express';
import * as articleController from '../controller/article.controller';
import { authenticate, isAdmin } from '../../../core/middlewares/auth.middleware';
import { validate } from '../../../core/middlewares/validate.middleware';
import { createArticleSchema, updateArticleSchema } from '../schema/article.schema';
import { upload } from '../../../core/middlewares/upload.middleware';

const router = Router();

// Public
router.get('/', articleController.getAllArticles);
router.get('/:slug', articleController.getArticle);

// Admin only
router.post('/', authenticate, isAdmin, validate(createArticleSchema), articleController.createArticle);
router.put('/:id', authenticate, isAdmin, validate(updateArticleSchema), articleController.updateArticle);
router.delete('/:id', authenticate, isAdmin, articleController.deleteArticle);
router.post('/:id/cover', authenticate, isAdmin, upload.single('cover'), articleController.uploadArticleCover);

export default router;
