import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const guideController = {
  async getAll(req: Request, res: Response) {
    try {
      if (!prisma) return res.json([]);
      const { category } = req.query;

      const where: any = {};
      if (category && typeof category === 'string') {
        where.category = category;
      }

      const guides = await prisma.guide.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
      });
      res.json(guides);
    } catch (error) {
      console.error('Error fetching guides:', error);
      res.status(500).json({ error: 'Failed to fetch guides' });
    }
  },

  async getById(req: Request, res: Response) {
    try {
      if (!prisma) return res.status(503).json({ error: 'Database not configured' });
      const id = parseInt(req.params.id || '');
      if (isNaN(id)) return res.status(400).json({ error: 'Invalid guide ID' });

      const guide = await prisma.guide.findUnique({ where: { id } });
      if (!guide) return res.status(404).json({ error: 'Guide not found' });

      // Fetch related products and articles
      let products: any[] = [];
      let articles: any[] = [];

      if (guide.productIds.length > 0) {
        products = await prisma.product.findMany({
          where: { id: { in: guide.productIds } },
        });
      }

      if (guide.articleIds.length > 0) {
        articles = await prisma.article.findMany({
          where: { id: { in: guide.articleIds } },
          select: { id: true, title: true, slug: true, category: true, featuredImageUrl: true, publishedAt: true },
        });
      }

      res.json({ ...guide, products, articles });
    } catch (error) {
      console.error('Error fetching guide:', error);
      res.status(500).json({ error: 'Failed to fetch guide' });
    }
  },

  async getBySlug(req: Request, res: Response) {
    try {
      if (!prisma) return res.status(503).json({ error: 'Database not configured' });
      const { slug } = req.params;

      const guide = await prisma.guide.findUnique({ where: { slug } });
      if (!guide) return res.status(404).json({ error: 'Guide not found' });

      let products: any[] = [];
      let articles: any[] = [];

      if (guide.productIds.length > 0) {
        products = await prisma.product.findMany({
          where: { id: { in: guide.productIds } },
        });
      }

      if (guide.articleIds.length > 0) {
        articles = await prisma.article.findMany({
          where: { id: { in: guide.articleIds } },
          select: { id: true, title: true, slug: true, category: true, featuredImageUrl: true, publishedAt: true },
        });
      }

      res.json({ ...guide, products, articles });
    } catch (error) {
      console.error('Error fetching guide:', error);
      res.status(500).json({ error: 'Failed to fetch guide' });
    }
  },

  async create(req: Request, res: Response) {
    try {
      if (!prisma) return res.status(503).json({ error: 'Database not configured' });
      const guide = await prisma.guide.create({ data: req.body });
      res.status(201).json(guide);
    } catch (error) {
      console.error('Error creating guide:', error);
      res.status(500).json({ error: 'Failed to create guide' });
    }
  },

  async update(req: Request, res: Response) {
    try {
      if (!prisma) return res.status(503).json({ error: 'Database not configured' });
      const id = parseInt(req.params.id || '');
      if (isNaN(id)) return res.status(400).json({ error: 'Invalid guide ID' });

      const guide = await prisma.guide.update({
        where: { id },
        data: req.body,
      });
      res.json(guide);
    } catch (error) {
      console.error('Error updating guide:', error);
      res.status(500).json({ error: 'Failed to update guide' });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      if (!prisma) return res.status(503).json({ error: 'Database not configured' });
      const id = parseInt(req.params.id || '');
      if (isNaN(id)) return res.status(400).json({ error: 'Invalid guide ID' });

      await prisma.guide.delete({ where: { id } });
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting guide:', error);
      res.status(500).json({ error: 'Failed to delete guide' });
    }
  },
};
