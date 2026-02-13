import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Routes
import productsRouter from './routes/products';
import articlesRouter from './routes/articles';
import videosRouter from './routes/videos';
import affiliateEarningsRouter from './routes/affiliateEarnings';
import analyticsRouter from './routes/analytics';
import workflowsRouter from './routes/workflows';
import productCandidatesRouter from './routes/productCandidates';
import guidesRouter from './routes/guides';
import pathsRouter from './routes/paths';
import wizardRouter from './routes/wizard';
import seedRouter from './routes/seed';

// Middleware
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// ClickBank routes - registrate PRIMA di tutto per debug
console.log('🔧 Registering ClickBank routes FIRST (before all other routes)...');
app.get('/api/workflows/clickbank', (req: Request, res: Response) => {
  console.log('✅ ClickBank base endpoint called at', new Date().toISOString());
  res.json({ 
    message: 'ClickBank API endpoints are available',
    status: 'ok',
    timestamp: new Date().toISOString(),
    serverTime: Date.now(),
    endpoints: {
      test: '/api/workflows/clickbank/test',
      endpoints: '/api/workflows/clickbank/endpoints',
      orders: '/api/workflows/clickbank/orders',
      stats: '/api/workflows/clickbank/stats',
      marketplace: '/api/workflows/clickbank/marketplace'
    }
  });
});

// Endpoint di test ancora più semplice
app.get('/test-clickbank', (req: Request, res: Response) => {
  res.json({ 
    message: 'Test endpoint works!',
    clickbankRoute: '/api/workflows/clickbank should work too'
  });
});

// Routes
app.get('/', (req: Request, res: Response) => {
  res.json({ 
    message: 'WellTech Backend API is running!',
    version: '1.0.0',
    buildTag: 'cb-route-fix-2026-01-27',
    status: '✅ Server attivo',
      endpoints: {
      products: '/api/products',
      articles: '/api/articles',
      videos: '/api/videos',
      affiliateEarnings: '/api/affiliate-earnings',
      analytics: '/api/analytics/dashboard',
      workflows: '/api/workflows',
      workflowsTrends: '/api/workflows/trends',
      workflowsClickBank: '/api/workflows/clickbank',
      productCandidates: '/api/product-candidates',
    },
    preview: '/api/preview',
    testClickBank: '/api/workflows/clickbank',
  });
});

// Preview endpoint - mostra struttura API senza database
app.get('/api/preview', (req: Request, res: Response) => {
  res.json({
    message: '📋 Preview della struttura API',
    note: 'Questo endpoint mostra la struttura senza richiedere il database',
    endpoints: {
      products: {
        'GET /api/products': 'Lista tutti i prodotti (query: ?category=...)',
        'GET /api/products/:id': 'Ottieni prodotto per ID',
        'POST /api/products': 'Crea nuovo prodotto',
        'PUT /api/products/:id': 'Aggiorna prodotto',
        'DELETE /api/products/:id': 'Elimina prodotto',
        example: {
          create: {
            name: 'string (required)',
            category: 'string (required)',
            affiliateLink: 'string (required)',
            description: 'string?',
            price: 'number?',
            affiliateProgram: 'string?',
            commissionPercentage: 'number?',
            imageUrl: 'string?',
          }
        }
      },
      articles: {
        'GET /api/articles': 'Lista tutti gli articoli (query: ?category=...&published=true)',
        'GET /api/articles/:id': 'Ottieni articolo per ID',
        'GET /api/articles/slug/:slug': 'Ottieni articolo per slug (incrementa views)',
        'POST /api/articles': 'Crea nuovo articolo',
        'PUT /api/articles/:id': 'Aggiorna articolo',
        'DELETE /api/articles/:id': 'Elimina articolo',
        example: {
          create: {
            title: 'string (required)',
            slug: 'string (required, unique)',
            category: 'string (required)',
            content: 'string (required)',
            seoMetaTitle: 'string?',
            seoMetaDescription: 'string?',
            featuredImageUrl: 'string?',
            productIds: 'number[]?',
            publishedAt: 'Date?',
          }
        }
      },
      videos: {
        'GET /api/videos': 'Lista tutti i video (query: ?articleId=...)',
        'GET /api/videos/:id': 'Ottieni video per ID',
        'POST /api/videos': 'Crea nuovo video',
        'PUT /api/videos/:id': 'Aggiorna video',
        'DELETE /api/videos/:id': 'Elimina video',
        example: {
          create: {
            title: 'string (required)',
            script: 'string (required)',
            articleId: 'number?',
            videoUrl: 'string?',
            tiktokUrl: 'string?',
          }
        }
      },
      affiliateEarnings: {
        'GET /api/affiliate-earnings': 'Lista tutti i guadagni (query: ?productId=...)',
        'GET /api/affiliate-earnings/stats': 'Statistiche aggregate',
        'GET /api/affiliate-earnings/:id': 'Ottieni guadagno per ID',
        'POST /api/affiliate-earnings': 'Crea nuovo guadagno',
        'PUT /api/affiliate-earnings/:id': 'Aggiorna guadagno',
        'DELETE /api/affiliate-earnings/:id': 'Elimina guadagno',
        example: {
          create: {
            productId: 'number (required)',
            clicks: 'number?',
            conversions: 'number?',
            revenue: 'number?',
          }
        }
      },
      workflows: {
        'GET /api/workflows/trends': 'Lista tutti i trend (query: ?limit=...)',
        'GET /api/workflows/trends/category/:category': 'Lista trend per categoria',
        'POST /api/workflows/trends/analyze': 'Analizza e salva trend (bulk)',
        'POST /api/workflows/trends': 'Crea singolo trend',
        example: {
          analyze: {
            trends: [
              {
                keyword: 'string (required)',
                source: 'string (required) - "google", "reddit", "amazon"',
                score: 'number (required)',
                category: 'string?',
                metadata: 'object?',
              }
            ]
          }
        }
      },
      clickbank: {
        'GET /api/workflows/clickbank/test': 'Testa connessione API ClickBank',
        'GET /api/workflows/clickbank/endpoints': 'Testa tutti gli endpoint disponibili',
        'GET /api/workflows/clickbank/orders': 'Ottieni ordini ClickBank (query: ?startDate=...&limit=...)',
        'GET /api/workflows/clickbank/stats': 'Ottieni statistiche ClickBank (query: ?startDate=...)',
        note: 'Richiede CLICKBANK_API_KEY nelle variabili d\'ambiente'
      }
    },
    database: {
      status: '⚠️ Database non configurato',
      setup: 'Per configurare: 1) Crea .env con DATABASE_URL, 2) npx prisma migrate dev, 3) npx prisma generate'
    }
  });
});

app.use('/api/products', productsRouter);
app.use('/api/articles', articlesRouter);
app.use('/api/videos', videosRouter);
app.use('/api/affiliate-earnings', affiliateEarningsRouter);
app.use('/api/analytics', analyticsRouter);

// Workflows routes - con log per debug
console.log('📋 Loading workflows routes...');
try {
  app.use('/api/workflows', workflowsRouter);
  console.log('✅ Workflows routes loaded successfully');
} catch (error) {
  console.error('❌ Error loading workflows routes:', error);
}

// ClickBank routes - versione semplificata che non blocca l'avvio
// Registriamo prima gli endpoint base, poi proviamo a caricare il controller
app.get('/api/workflows/clickbank/test', (req: Request, res: Response) => {
  res.json({
    message: 'ClickBank test endpoint - controller loading...',
    timestamp: new Date().toISOString(),
    note: 'This is a fallback endpoint. Check logs for controller status.'
  });
});

app.get('/api/workflows/clickbank/endpoints', (req: Request, res: Response) => {
  res.json({
    message: 'ClickBank endpoints test',
    availableEndpoints: [
      '/api/workflows/clickbank/test',
      '/api/workflows/clickbank/endpoints',
      '/api/workflows/clickbank/orders',
      '/api/workflows/clickbank/stats',
      '/api/workflows/clickbank/marketplace'
    ],
    timestamp: new Date().toISOString()
  });
});

app.get('/api/workflows/clickbank/orders', (req: Request, res: Response) => {
  res.status(503).json({
    error: 'ClickBank controller not loaded yet',
    message: 'Controller is loading asynchronously. Try again in a few seconds.',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/workflows/clickbank/stats', (req: Request, res: Response) => {
  res.status(503).json({
    error: 'ClickBank controller not loaded yet',
    message: 'Controller is loading asynchronously. Try again in a few seconds.',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/workflows/clickbank/marketplace', (req: Request, res: Response) => {
  res.status(503).json({
    error: 'ClickBank controller not loaded yet',
    message: 'Controller is loading asynchronously. Try again in a few seconds.',
    timestamp: new Date().toISOString()
  });
});

// Prova a caricare il controller in modo asincrono (non blocca l'avvio)
console.log('📋 Attempting to load ClickBank controller asynchronously...');
setTimeout(() => {
  try {
    const { clickbankController } = require('./controllers/clickbankController');
    console.log('✅ ClickBank controller loaded successfully');
    
    // Sostituisci gli endpoint con quelli reali
    app.get('/api/workflows/clickbank/test', clickbankController.testConnection);
    app.get('/api/workflows/clickbank/endpoints', clickbankController.testEndpoints);
    app.get('/api/workflows/clickbank/orders', clickbankController.getOrders);
    app.get('/api/workflows/clickbank/stats', clickbankController.getStats);
    app.get('/api/workflows/clickbank/marketplace', clickbankController.searchMarketplaceProducts);
    
    console.log('✅ All ClickBank routes upgraded to use real controller');
  } catch (error) {
    console.error('❌ Error loading ClickBank controller (non-blocking):', error);
    console.error('Error details:', error instanceof Error ? error.stack : error);
    console.log('⚠️ ClickBank endpoints will use fallback handlers');
  }
}, 1000); // Aspetta 1 secondo dopo l'avvio del server

app.use('/api/product-candidates', productCandidatesRouter);
app.use('/api/guides', guidesRouter);
app.use('/api/paths', pathsRouter);
app.use('/api/wizard', wizardRouter);
app.use('/api/seed', seedRouter);

// Error handler (deve essere l'ultimo middleware)
app.use(errorHandler);

// Avvia il server - questo deve sempre funzionare
app.listen(port, () => {
  console.log(`⚡️ Server is running on port ${port}`);
  console.log(`📚 API available at http://localhost:${port}/api`);
  console.log(`🔍 Test endpoint: http://localhost:${port}/test-clickbank`);
  console.log(`🔍 ClickBank endpoint: http://localhost:${port}/api/workflows/clickbank`);
  console.log(`✅ Server started successfully at ${new Date().toISOString()}`);
}).on('error', (error: Error) => {
  console.error('❌ FATAL ERROR: Server failed to start:', error);
  console.error('Error details:', error.stack);
  process.exit(1);
});
