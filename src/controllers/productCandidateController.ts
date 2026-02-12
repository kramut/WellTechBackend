import { Request, Response } from 'express';
import { productCandidateService } from '../services/productCandidateService';
import { CreateProductCandidateInput, UpdateProductCandidateInput } from '../types';

export const productCandidateController = {
  async getAll(req: Request, res: Response) {
    try {
      const { status, category, source } = req.query;
      
      if (status && typeof status === 'string') {
        const candidates = await productCandidateService.getByStatus(status);
        return res.json(candidates);
      }
      
      if (category && typeof category === 'string') {
        const candidates = await productCandidateService.getByCategory(category);
        return res.json(candidates);
      }
      
      if (source && typeof source === 'string') {
        const candidates = await productCandidateService.getBySource(source);
        return res.json(candidates);
      }
      
      const candidates = await productCandidateService.getAll();
      res.json(candidates);
    } catch (error) {
      console.error('Error fetching product candidates:', error);
      res.status(500).json({ error: 'Failed to fetch product candidates' });
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id || '');
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid product candidate ID' });
      }

      const candidate = await productCandidateService.getById(id);
      if (!candidate) {
        return res.status(404).json({ error: 'Product candidate not found' });
      }

      res.json(candidate);
    } catch (error) {
      console.error('Error fetching product candidate:', error);
      res.status(500).json({ error: 'Failed to fetch product candidate' });
    }
  },

  async bulkCreate(req: Request, res: Response) {
    try {
      const { items } = req.body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          error: 'Invalid request body. Expected { items: [ { name, category, affiliateLink, affiliateProgram, source, ... }, ... ] }',
        });
      }

      if (items.length > 50) {
        return res.status(400).json({
          error: 'Too many items. Maximum 50 items per bulk request.',
        });
      }

      // Validate each item before processing
      const validationErrors: { index: number; error: string }[] = [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (!item.name || !item.category || !item.affiliateLink || !item.affiliateProgram || !item.source) {
          validationErrors.push({
            index: i,
            error: 'Missing required fields: name, category, affiliateLink, affiliateProgram, source',
          });
        }
      }

      if (validationErrors.length > 0) {
        return res.status(400).json({
          error: 'Validation failed for some items',
          validationErrors,
        });
      }

      const results = await productCandidateService.createMany(items);

      res.status(201).json({
        success: true,
        summary: {
          total: items.length,
          created: results.created.length,
          failed: results.failed.length,
        },
        created: results.created,
        failed: results.failed.length > 0 ? results.failed : undefined,
      });
    } catch (error) {
      console.error('Error bulk creating product candidates:', error);
      res.status(500).json({ error: 'Failed to bulk create product candidates' });
    }
  },

  async create(req: Request, res: Response) {
    try {
      const data: CreateProductCandidateInput = req.body;
      
      if (!data.name || !data.category || !data.affiliateLink || !data.affiliateProgram || !data.source) {
        return res.status(400).json({ 
          error: 'Missing required fields: name, category, affiliateLink, affiliateProgram, source' 
        });
      }

      const candidate = await productCandidateService.create(data);
      res.status(201).json(candidate);
    } catch (error) {
      console.error('Error creating product candidate:', error);
      res.status(500).json({ error: 'Failed to create product candidate' });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id || '');
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid product candidate ID' });
      }

      const data: UpdateProductCandidateInput = req.body;
      const candidate = await productCandidateService.update(id, data);
      res.json(candidate);
    } catch (error) {
      console.error('Error updating product candidate:', error);
      res.status(500).json({ error: 'Failed to update product candidate' });
    }
  },

  async approve(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id || '');
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid product candidate ID' });
      }

      const approvedBy = req.body.approvedBy || req.headers['x-user-id'] || 'system';
      const candidate = await productCandidateService.approve(id, approvedBy);
      res.json(candidate);
    } catch (error) {
      console.error('Error approving product candidate:', error);
      res.status(500).json({ error: 'Failed to approve product candidate' });
    }
  },

  async reject(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id || '');
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid product candidate ID' });
      }

      const { rejectionReason } = req.body;
      if (!rejectionReason) {
        return res.status(400).json({ error: 'rejectionReason is required' });
      }

      const rejectedBy = req.body.rejectedBy || req.headers['x-user-id'] || 'system';
      const candidate = await productCandidateService.reject(id, rejectionReason, rejectedBy);
      res.json(candidate);
    } catch (error) {
      console.error('Error rejecting product candidate:', error);
      res.status(500).json({ error: 'Failed to reject product candidate' });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id || '');
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid product candidate ID' });
      }

      await productCandidateService.delete(id);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting product candidate:', error);
      res.status(500).json({ error: 'Failed to delete product candidate' });
    }
  },
};

