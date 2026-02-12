import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { generateArticle } from '../services/articleGeneratorService';
import { generateVideoScript } from '../services/videoScriptGeneratorService';

export const contentGeneratorController = {
  /**
   * POST /api/product-candidates/:id/generate-article
   * Generate SEO article from analyzed product candidate
   */
  async generateArticleEndpoint(req: Request, res: Response) {
    try {
      if (!prisma) return res.status(503).json({ error: 'Database non configurato.' });

      const id = parseInt(req.params.id || '');
      if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });

      const candidate = await prisma.productCandidate.findUnique({ where: { id } });
      if (!candidate) return res.status(404).json({ error: 'Product candidate not found' });

      if (!candidate.landingPageData || candidate.analysisStatus !== 'completed') {
        return res.status(422).json({
          error: 'Il candidato non ha ancora un\'analisi completata. Esegui prima POST /api/product-candidates/' + id + '/analyze',
        });
      }

      const analysis = candidate.landingPageData as any;

      const result = await generateArticle(candidate.name, candidate.affiliateLink, analysis);

      if (!result.success || !result.article) {
        return res.status(422).json({ success: false, error: result.error });
      }

      // Save article to DB
      const article = await prisma.article.create({
        data: {
          title: result.article.title,
          slug: result.article.slug + '-' + Date.now(), // Ensure unique slug
          category: result.article.category || candidate.category,
          content: result.article.content,
          seoMetaTitle: result.article.seoMetaTitle,
          seoMetaDescription: result.article.seoMetaDescription,
          productIds: [candidate.id],
        },
      });

      res.status(201).json({
        success: true,
        article,
        candidateId: candidate.id,
      });
    } catch (error) {
      console.error('Error generating article:', error);
      res.status(500).json({ error: 'Failed to generate article' });
    }
  },

  /**
   * POST /api/product-candidates/:id/generate-video
   * Generate video script from analyzed product candidate
   */
  async generateVideoEndpoint(req: Request, res: Response) {
    try {
      if (!prisma) return res.status(503).json({ error: 'Database non configurato.' });

      const id = parseInt(req.params.id || '');
      if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });

      const candidate = await prisma.productCandidate.findUnique({ where: { id } });
      if (!candidate) return res.status(404).json({ error: 'Product candidate not found' });

      if (!candidate.landingPageData || candidate.analysisStatus !== 'completed') {
        return res.status(422).json({
          error: 'Il candidato non ha ancora un\'analisi completata. Esegui prima POST /api/product-candidates/' + id + '/analyze',
        });
      }

      const analysis = candidate.landingPageData as any;

      const result = await generateVideoScript(candidate.name, candidate.affiliateLink, analysis);

      if (!result.success || !result.videoScript) {
        return res.status(422).json({ success: false, error: result.error });
      }

      // Save video script to DB
      const video = await prisma.video.create({
        data: {
          title: result.videoScript.title,
          script: result.videoScript.script,
        },
      });

      res.status(201).json({
        success: true,
        video,
        videoScript: result.videoScript, // Include full data (hashtags, caption, hook)
        candidateId: candidate.id,
      });
    } catch (error) {
      console.error('Error generating video script:', error);
      res.status(500).json({ error: 'Failed to generate video script' });
    }
  },

  /**
   * POST /api/product-candidates/:id/generate-content
   * Generate BOTH article + video script from analyzed product candidate
   */
  async generateAllContent(req: Request, res: Response) {
    try {
      if (!prisma) return res.status(503).json({ error: 'Database non configurato.' });

      const id = parseInt(req.params.id || '');
      if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });

      const candidate = await prisma.productCandidate.findUnique({ where: { id } });
      if (!candidate) return res.status(404).json({ error: 'Product candidate not found' });

      if (!candidate.landingPageData || candidate.analysisStatus !== 'completed') {
        return res.status(422).json({
          error: 'Il candidato non ha ancora un\'analisi completata. Esegui prima POST /api/product-candidates/' + id + '/analyze',
        });
      }

      const analysis = candidate.landingPageData as any;

      // Generate both in parallel
      const [articleResult, videoResult] = await Promise.all([
        generateArticle(candidate.name, candidate.affiliateLink, analysis),
        generateVideoScript(candidate.name, candidate.affiliateLink, analysis),
      ]);

      const results: {
        article?: any;
        video?: any;
        videoScript?: any;
        errors: string[];
      } = { errors: [] };

      // Save article if successful
      if (articleResult.success && articleResult.article) {
        results.article = await prisma.article.create({
          data: {
            title: articleResult.article.title,
            slug: articleResult.article.slug + '-' + Date.now(),
            category: articleResult.article.category || candidate.category,
            content: articleResult.article.content,
            seoMetaTitle: articleResult.article.seoMetaTitle,
            seoMetaDescription: articleResult.article.seoMetaDescription,
            productIds: [candidate.id],
          },
        });
      } else {
        results.errors.push(`Articolo: ${articleResult.error}`);
      }

      // Save video if successful
      if (videoResult.success && videoResult.videoScript) {
        results.video = await prisma.video.create({
          data: {
            title: videoResult.videoScript.title,
            script: videoResult.videoScript.script,
            ...(results.article ? { articleId: results.article.id } : {}),
          },
        });
        results.videoScript = videoResult.videoScript;
      } else {
        results.errors.push(`Video: ${videoResult.error}`);
      }

      // Update candidate status
      await prisma.productCandidate.update({
        where: { id },
        data: {
          status: results.article ? 'content_generated' : 'pending',
          metadata: {
            ...(candidate.metadata as any || {}),
            articleId: results.article?.id,
            videoId: results.video?.id,
            contentGeneratedAt: new Date().toISOString(),
          },
        },
      });

      const allSuccess = results.errors.length === 0;

      res.status(allSuccess ? 201 : 207).json({
        success: allSuccess,
        candidateId: candidate.id,
        article: results.article || null,
        video: results.video || null,
        videoDetails: results.videoScript || null,
        errors: results.errors.length > 0 ? results.errors : undefined,
      });
    } catch (error) {
      console.error('Error generating content:', error);
      res.status(500).json({ error: 'Failed to generate content' });
    }
  },
};
