import { Request, Response } from 'express';
import { trendService, TrendAnalysisInput } from '../services/trendService';

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
      const category = req.params.category;
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
};

