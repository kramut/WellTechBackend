import { Router, Request, Response } from 'express';
import { trendController } from '../controllers/trendController';

const router = Router();

console.log('🔧 Initializing workflows router...');

// Trend analysis endpoints
router.get('/trends', trendController.getAllTrends);
router.get('/trends/category/:category', trendController.getTrendsByCategory);
router.get('/trends/google', trendController.fetchGoogleTrends);
router.post('/trends/analyze', trendController.analyzeTrends);
router.post('/trends', trendController.createTrend);

// ClickBank API endpoints - registra PRIMA di caricare il controller
console.log('🔧 Registering ClickBank base route...');
router.get('/clickbank', (req: Request, res: Response) => {
  console.log('✅ ClickBank base endpoint called');
  res.json({ 
    message: 'ClickBank API endpoints are available',
    status: 'ok',
    timestamp: new Date().toISOString(),
    endpoints: {
      test: '/api/workflows/clickbank/test',
      endpoints: '/api/workflows/clickbank/endpoints',
      orders: '/api/workflows/clickbank/orders',
      stats: '/api/workflows/clickbank/stats'
    }
  });
});

// Carica il controller ClickBank - usa import statico invece di require
console.log('🔧 Loading ClickBank controller...');
try {
  // Import statico invece di require dinamico
  const { clickbankController } = require('../controllers/clickbankController');
  
  if (!clickbankController) {
    console.error('❌ clickbankController is null or undefined');
    throw new Error('clickbankController not found');
  }
  
  console.log('✅ ClickBank controller loaded, registering routes...');
  
  router.get('/clickbank/test', clickbankController.testConnection);
  router.get('/clickbank/endpoints', clickbankController.testEndpoints);
  router.get('/clickbank/orders', clickbankController.getOrders);
  router.get('/clickbank/stats', clickbankController.getStats);
  router.get('/clickbank/marketplace', clickbankController.searchMarketplaceProducts);
  
  console.log('✅ All ClickBank routes registered');
} catch (error) {
  console.error('❌ Error loading ClickBank controller:', error);
  console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
  
  // Fallback: endpoint che indica che il controller non è disponibile
  router.get('/clickbank/test', (req: Request, res: Response) => {
    res.status(500).json({
      error: 'ClickBank controller not loaded',
      message: error instanceof Error ? error.message : 'Unknown error',
      hint: 'Check server logs for details',
      timestamp: new Date().toISOString()
    });
  });
  
  router.get('/clickbank/endpoints', (req: Request, res: Response) => {
    res.status(500).json({
      error: 'ClickBank controller not loaded',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  });
}

console.log('✅ Workflows router initialized');
export default router;
