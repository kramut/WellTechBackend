import { Request, Response } from 'express';
import { trendService, TrendAnalysisInput } from '../services/trendService';
import { googleTrendsService } from '../services/googleTrendsService';

export const trendController = {
  async getAllTrends(req: Request, res: Response) {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const trends = await trendService.getAllTrends(limit);
      res.json(trends);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Error fetching trends' });
    }
  },

  async getTrendsByCategory(req: Request, res: Response) {
    try {
      const category = req.params.category as string;
      if (!category) {
        return res.status(400).json({ error: 'Category parameter is required' });
      }
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const trends = await trendService.getTrendsByCategory(category, limit);
      res.json(trends);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Error fetching trends by category' });
    }
  },

  async analyzeTrends(req: Request, res: Response) {
    try {
      const data: TrendAnalysisInput = req.body;
      
      if (!data.trends || !Array.isArray(data.trends)) {
        return res.status(400).json({ error: 'Invalid request body. Expected { trends: [...] }' });
      }

      const result = await trendService.analyzeTrends(data);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Error analyzing trends' });
    }
  },

  async createTrend(req: Request, res: Response) {
    try {
      const { keyword, source, score, category, metadata } = req.body;

      if (!keyword || !source || score === undefined) {
        return res.status(400).json({ 
          error: 'Missing required fields: keyword, source, score' 
        });
      }

      const trend = await trendService.createTrend({
        keyword,
        source,
        score: parseFloat(score),
        category,
        metadata,
      });

      res.status(201).json(trend);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Error creating trend' });
    }
  },

  async fetchGoogleTrends(req: Request, res: Response) {
    try {
      const { keywords, geo, category } = req.query;

      // Verifica che SERPAPI_KEY sia configurata
      if (!process.env.SERPAPI_KEY) {
        console.warn('SERPAPI_KEY not configured, returning mock data');
        // Restituisci dati mock per permettere il test del workflow
        const mockTrends = [
          { keyword: 'wellness', source: 'google', score: 7.5, category: 'wellbeing', metadata: { note: 'Mock data - SERPAPI_KEY not configured' } },
          { keyword: 'fitness', source: 'google', score: 8.2, category: 'wellbeing', metadata: { note: 'Mock data - SERPAPI_KEY not configured' } },
          { keyword: 'meditation', source: 'google', score: 6.8, category: 'wellbeing', metadata: { note: 'Mock data - SERPAPI_KEY not configured' } },
        ];
        return res.json({ trends: mockTrends, warning: 'SERPAPI_KEY not configured, returning mock data' });
      }

      let trends;

      if (category && typeof category === 'string') {
        // Ottieni trend per categoria
        const geoParam = (typeof geo === 'string') ? geo : 'IT';
        trends = await googleTrendsService.getTrendsByCategory(category, geoParam);
      } else if (keywords) {
        // Ottieni trend per keyword specifiche
        const keywordsArray = typeof keywords === 'string' 
          ? keywords.split(',').map(k => k.trim())
          : Array.isArray(keywords) 
            ? keywords.map(k => String(k).trim())
            : [];
        
        if (keywordsArray.length === 0) {
          return res.status(400).json({ error: 'Invalid keywords parameter' });
        }

        const geoParam = (typeof geo === 'string') ? geo : 'IT';
        trends = await googleTrendsService.getTrendsForKeywords(keywordsArray, geoParam);
      } else {
        // Default: keyword predefinite
        const defaultKeywords = ['wellness', 'fitness', 'meditation', 'sexual wellness', 'sustainability'];
        const geoParam = (typeof geo === 'string') ? geo : 'IT';
        trends = await googleTrendsService.getTrendsForKeywords(defaultKeywords, geoParam);
      }

      res.json({ trends });
    } catch (error: any) {
      console.error('Error fetching Google Trends:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Error fetching Google Trends';
      res.status(500).json({ 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  },
};

