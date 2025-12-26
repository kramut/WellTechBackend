import { Router } from 'express';
import { trendController } from '../controllers/trendController';
import { clickbankController } from '../controllers/clickbankController';

const router = Router();

// Trend analysis endpoints
router.get('/trends', trendController.getAllTrends);
router.get('/trends/category/:category', trendController.getTrendsByCategory);
router.get('/trends/google', trendController.fetchGoogleTrends); // Nuovo endpoint per Google Trends
router.post('/trends/analyze', trendController.analyzeTrends);
router.post('/trends', trendController.createTrend);

// ClickBank API endpoints
router.get('/clickbank/test', clickbankController.testConnection);
router.get('/clickbank/endpoints', clickbankController.testEndpoints);
router.get('/clickbank/orders', clickbankController.getOrders);
router.get('/clickbank/stats', clickbankController.getStats);

export default router;

