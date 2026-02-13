import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const wizardController = {
  async getAll(req: Request, res: Response) {
    try {
      if (!prisma) return res.json([]);
      const recommendations = await prisma.wizardRecommendation.findMany({
        orderBy: { category: 'asc' },
      });
      res.json(recommendations);
    } catch (error) {
      console.error('Error fetching wizard recommendations:', error);
      res.status(500).json({ error: 'Failed to fetch wizard recommendations' });
    }
  },

  async getByCategory(req: Request, res: Response) {
    try {
      if (!prisma) return res.status(503).json({ error: 'Database not configured' });
      const { category } = req.params;

      const recommendation = await prisma.wizardRecommendation.findUnique({
        where: { category },
      });

      if (!recommendation) return res.status(404).json({ error: 'No recommendations for this category' });

      // Fetch full product and article data
      let products: any[] = [];
      let articles: any[] = [];
      let guides: any[] = [];

      if (recommendation.productIds.length > 0) {
        products = await prisma.product.findMany({
          where: { id: { in: recommendation.productIds } },
        });
      }

      if (recommendation.articleIds.length > 0) {
        articles = await prisma.article.findMany({
          where: { id: { in: recommendation.articleIds } },
          select: { id: true, title: true, slug: true, category: true, featuredImageUrl: true },
        });
      }

      if (recommendation.guideIds.length > 0) {
        guides = await prisma.guide.findMany({
          where: { id: { in: recommendation.guideIds } },
          select: { id: true, title: true, slug: true, category: true, imageUrl: true },
        });
      }

      res.json({ ...recommendation, products, articles, guides });
    } catch (error) {
      console.error('Error fetching wizard recommendation:', error);
      res.status(500).json({ error: 'Failed to fetch wizard recommendation' });
    }
  },
};
