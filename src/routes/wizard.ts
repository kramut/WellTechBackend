import { Router } from 'express';
import { wizardController } from '../controllers/wizardController';

const router = Router();

router.get('/', wizardController.getAll);
router.get('/:category', wizardController.getByCategory);

export default router;
