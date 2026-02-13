import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { contentPopulationService } from '../services/contentPopulationService';

export const pathController = {
  async getAll(req: Request, res: Response) {
    try {
      if (!prisma) return res.json([]);
      const paths = await prisma.pathJourney.findMany({
        orderBy: { createdAt: 'asc' },
      });
      res.json(paths);
    } catch (error) {
      console.error('Error fetching paths:', error);
      res.status(500).json({ error: 'Failed to fetch paths' });
    }
  },

  async getByGoalId(req: Request, res: Response) {
    try {
      if (!prisma) return res.status(503).json({ error: 'Database not configured' });
      const { goalId } = req.params;

      const path = await prisma.pathJourney.findUnique({ where: { goalId } });
      if (!path) return res.status(404).json({ error: 'Path not found' });

      res.json(path);
    } catch (error) {
      console.error('Error fetching path:', error);
      res.status(500).json({ error: 'Failed to fetch path' });
    }
  },

  async update(req: Request, res: Response) {
    try {
      if (!prisma) return res.status(503).json({ error: 'Database not configured' });
      const { goalId } = req.params;

      const path = await prisma.pathJourney.update({
        where: { goalId },
        data: req.body,
      });
      res.json(path);
    } catch (error) {
      console.error('Error updating path:', error);
      res.status(500).json({ error: 'Failed to update path' });
    }
  },

  /**
   * POST /api/paths/seed - Seed initial paths from frontend data
   */
  async seed(req: Request, res: Response) {
    try {
      if (!prisma) return res.status(503).json({ error: 'Database not configured' });
      const { paths } = req.body;

      if (!paths || !Array.isArray(paths)) {
        return res.status(400).json({ error: 'Expected { paths: [...] }' });
      }

      const created = await contentPopulationService.seedPaths(paths);
      res.json({ success: true, created, message: `${created} paths created` });
    } catch (error) {
      console.error('Error seeding paths:', error);
      res.status(500).json({ error: 'Failed to seed paths' });
    }
  },
};
