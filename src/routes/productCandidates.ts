import { Router } from 'express';
import { productCandidateController } from '../controllers/productCandidateController';

const router = Router();

router.get('/', productCandidateController.getAll);
router.post('/bulk', productCandidateController.bulkCreate);
router.get('/:id', productCandidateController.getById);
router.post('/', productCandidateController.create);
router.put('/:id', productCandidateController.update);
router.post('/:id/approve', productCandidateController.approve);
router.post('/:id/reject', productCandidateController.reject);
router.delete('/:id', productCandidateController.delete);

export default router;

