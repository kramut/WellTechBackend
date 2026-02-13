import { Router } from 'express';
import { pathController } from '../controllers/pathController';

const router = Router();

router.get('/', pathController.getAll);
router.post('/seed', pathController.seed);
router.get('/:goalId', pathController.getByGoalId);
router.put('/:goalId', pathController.update);

export default router;
