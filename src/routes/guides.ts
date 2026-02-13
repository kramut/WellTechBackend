import { Router } from 'express';
import { guideController } from '../controllers/guideController';

const router = Router();

router.get('/', guideController.getAll);
router.get('/slug/:slug', guideController.getBySlug);
router.get('/:id', guideController.getById);
router.post('/', guideController.create);
router.put('/:id', guideController.update);
router.delete('/:id', guideController.delete);

export default router;
