import { Router } from 'express';
import { seedController } from '../controllers/seedController';

const router = Router();

router.post('/', seedController.seedAll);

export default router;
