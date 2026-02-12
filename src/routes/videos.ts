import { Router } from 'express';
import { videoController } from '../controllers/videoController';
import { videoRenderController } from '../controllers/videoRenderController';

const router = Router();

router.get('/', videoController.getAll);
router.get('/:id', videoController.getById);
router.post('/', videoController.create);
router.put('/:id', videoController.update);
router.delete('/:id', videoController.delete);

// Shotstack video rendering
router.post('/:id/render', videoRenderController.startRender);
router.get('/:id/render-status/:renderId', videoRenderController.checkRenderStatus);
router.post('/:id/render-and-wait', videoRenderController.renderAndWaitEndpoint);

export default router;




