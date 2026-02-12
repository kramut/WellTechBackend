import { Request, Response } from 'express';
import { productCandidateService } from '../services/productCandidateService';
import { CreateProductCandidateInput, UpdateProductCandidateInput } from '../types';
import { prisma } from '../lib/prisma';

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

  /**
   * POST /:id/approve
   * Full approval flow:
   * 1. Create a Product from the candidate data
   * 2. Link article to the product (update productIds)
   * 3. Publish the article (set publishedAt)
   * 4. Link video to the article
   * 5. Update candidate status to 'approved' with product reference
   */
  async approve(req: Request, res: Response) {
    try {
      if (!prisma) return res.status(503).json({ error: 'Database non configurato.' });

      const id = parseInt(req.params.id || '');
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid product candidate ID' });
      }

      const candidate = await prisma.productCandidate.findUnique({ where: { id } });
      if (!candidate) {
        return res.status(404).json({ error: 'Candidato non trovato' });
      }

      if (candidate.status === 'approved') {
        return res.status(400).json({ error: 'Candidato gia\' approvato' });
      }

      const approvedBy = req.body.approvedBy || req.headers['x-user-id'] || 'system';
      const metadata = (candidate.metadata as Record<string, any>) || {};
      const lpData = (candidate.landingPageData as Record<string, any>) || {};

      // Step 1: Create Product in the products table
      const product = await prisma.product.create({
        data: {
          name: candidate.name,
          category: lpData.category || candidate.category,
          description: lpData.shortDescription || candidate.description || null,
          price: candidate.price || null,
          affiliateLink: candidate.affiliateLink,
          affiliateProgram: candidate.affiliateProgram,
          commissionPercentage: candidate.commissionPercentage || null,
          imageUrl: candidate.imageUrl || null,
        },
      });

      // Step 2 & 3: Update article - link to product and publish
      let article = null;
      if (metadata.articleId) {
        article = await prisma.article.update({
          where: { id: metadata.articleId },
          data: {
            productIds: [product.id],
            publishedAt: new Date(),
          },
        });
      }

      // Step 4: Link video to article (if not already linked)
      let video = null;
      if (metadata.videoId) {
        video = await prisma.video.update({
          where: { id: metadata.videoId },
          data: {
            articleId: article ? article.id : null,
          },
        });
      }

      // Step 5: Update candidate status
      const updatedCandidate = await prisma.productCandidate.update({
        where: { id },
        data: {
          status: 'approved',
          approvedAt: new Date(),
          approvedBy,
          rejectionReason: null,
          metadata: {
            ...metadata,
            productId: product.id,
            approvedProductName: product.name,
            articlePublished: !!article?.publishedAt,
          },
        },
      });

      res.json({
        success: true,
        candidate: updatedCandidate,
        product,
        article: article ? { id: article.id, title: article.title, published: !!article.publishedAt } : null,
        video: video ? { id: video.id, title: video.title, videoUrl: video.videoUrl } : null,
        message: `Prodotto "${product.name}" creato e articolo pubblicato!`,
      });
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

