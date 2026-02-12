import { Router } from 'express';
import { productCandidateController } from '../controllers/productCandidateController';
import { landingPageController } from '../controllers/landingPageController';
import { contentGeneratorController } from '../controllers/contentGeneratorController';

const router = Router();

router.get('/', productCandidateController.getAll);
router.post('/bulk', productCandidateController.bulkCreate);
router.post('/analyze-all', landingPageController.analyzeAll);
router.get('/:id', productCandidateController.getById);
router.get('/:id/analysis', landingPageController.getAnalysis);
router.post('/:id/analyze', landingPageController.analyzeOne);
router.post('/:id/generate-content', contentGeneratorController.generateAllContent);
router.post('/:id/generate-article', contentGeneratorController.generateArticleEndpoint);
router.post('/:id/generate-video', contentGeneratorController.generateVideoEndpoint);
router.post('/', productCandidateController.create);
router.put('/:id', productCandidateController.update);
router.post('/:id/approve', productCandidateController.approve);
router.post('/:id/reject', productCandidateController.reject);
router.delete('/:id', productCandidateController.delete);

export default router;

