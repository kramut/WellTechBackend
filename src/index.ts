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

// Middleware
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/', (req: Request, res: Response) => {
  res.json({ 
    message: 'WellTech Backend API is running!',
    version: '1.0.0',
    status: '✅ Server attivo',
      endpoints: {
      products: '/api/products',
      articles: '/api/articles',
      videos: '/api/videos',
      affiliateEarnings: '/api/affiliate-earnings',
      analytics: '/api/analytics/dashboard',
      workflows: '/api/workflows',
      productCandidates: '/api/product-candidates',
      clickbank: '/api/workflows/clickbank',
    },
    preview: '/api/preview',
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
app.use('/api/workflows', workflowsRouter);
app.use('/api/product-candidates', productCandidatesRouter);

// Error handler (deve essere l'ultimo middleware)
app.use(errorHandler);

app.listen(port, () => {
  console.log(`⚡️ Server is running on port ${port}`);
  console.log(`📚 API available at http://localhost:${port}/api`);
});
