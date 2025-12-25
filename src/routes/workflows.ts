import { Router } from 'express';
import { trendController } from '../controllers/trendController';

const router = Router();

// Trend analysis endpoints
router.get('/trends', trendController.getAllTrends);
router.get('/trends/category/:category', trendController.getTrendsByCategory);
router.post('/trends/analyze', trendController.analyzeTrends);
router.post('/trends', trendController.createTrend);

export default router;

