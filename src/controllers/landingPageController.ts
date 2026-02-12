import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { analyzeLandingPage } from '../services/landingPageAnalyzerService';

export const landingPageController = {
  /**
   * POST /api/product-candidates/:id/analyze
   * Analyze the landing page for a single product candidate
   */
  async analyzeOne(req: Request, res: Response) {
    try {
      if (!prisma) {
        return res.status(503).json({ error: 'Database non configurato.' });
      }

      const id = parseInt(req.params.id || '');
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid product candidate ID' });
      }

      const candidate = await prisma.productCandidate.findUnique({ where: { id } });
      if (!candidate) {
        return res.status(404).json({ error: 'Product candidate not found' });
      }

      // Mark as analyzing
      await prisma.productCandidate.update({
        where: { id },
        data: { analysisStatus: 'analyzing' },
      });

      // Run analysis
      const result = await analyzeLandingPage(candidate.affiliateLink);

      if (result.success && result.analysis) {
        // Save successful analysis
        const updated = await prisma.productCandidate.update({
          where: { id },
          data: {
            landingPageUrl: result.scrapedData?.finalUrl ?? null,
            landingPageData: result.analysis as any,
            analysisStatus: 'completed',
            analysisError: null,
            analyzedAt: new Date(),
            // Auto-fill description if empty
            ...((!candidate.description && result.analysis.shortDescription)
              ? { description: result.analysis.shortDescription }
              : {}),
            // Auto-fill category from AI if generic
            ...((candidate.category === 'unknown' && result.analysis.category)
              ? { category: result.analysis.category }
              : {}),
          },
        });

        res.json({
          success: true,
          candidate: updated,
          analysis: result.analysis,
        });
      } else {
        // Save failed analysis
        await prisma.productCandidate.update({
          where: { id },
          data: {
            analysisStatus: 'failed',
            analysisError: result.error ?? 'Unknown error',
            landingPageUrl: result.scrapedData?.finalUrl ?? null,
          },
        });

        res.status(422).json({
          success: false,
          error: result.error,
          candidateId: id,
        });
      }
    } catch (error) {
      console.error('Error analyzing landing page:', error);
      res.status(500).json({ error: 'Failed to analyze landing page' });
    }
  },

  /**
   * POST /api/product-candidates/analyze-all
   * Analyze landing pages for all candidates that haven't been analyzed yet
   */
  async analyzeAll(req: Request, res: Response) {
    try {
      if (!prisma) {
        return res.status(503).json({ error: 'Database non configurato.' });
      }

      // Find all candidates without analysis
      const candidates = await prisma.productCandidate.findMany({
        where: {
          OR: [
            { analysisStatus: null },
            { analysisStatus: 'pending' },
            { analysisStatus: 'failed' }, // retry failed ones
          ],
        },
        orderBy: { createdAt: 'desc' },
      });

      if (candidates.length === 0) {
        return res.json({
          success: true,
          message: 'Nessun candidato da analizzare.',
          summary: { total: 0, completed: 0, failed: 0 },
        });
      }

      // Respond immediately, process in background
      res.json({
        success: true,
        message: `Analisi avviata per ${candidates.length} candidati. L'analisi viene eseguita in background.`,
        candidateIds: candidates.map((c: { id: number }) => c.id),
        summary: { total: candidates.length, status: 'processing' },
      });

      // Process each candidate in background (sequentially to avoid rate limits)
      for (const candidate of candidates) {
        try {
          await prisma.productCandidate.update({
            where: { id: candidate.id },
            data: { analysisStatus: 'analyzing' },
          });

          const result = await analyzeLandingPage(candidate.affiliateLink);

          if (result.success && result.analysis) {
            await prisma.productCandidate.update({
              where: { id: candidate.id },
              data: {
                landingPageUrl: result.scrapedData?.finalUrl ?? null,
                landingPageData: result.analysis as any,
                analysisStatus: 'completed',
                analysisError: null,
                analyzedAt: new Date(),
                ...((!candidate.description && result.analysis.shortDescription)
                  ? { description: result.analysis.shortDescription }
                  : {}),
                ...((candidate.category === 'unknown' && result.analysis.category)
                  ? { category: result.analysis.category }
                  : {}),
              },
            });
            console.log(`✅ Analyzed candidate #${candidate.id}: ${candidate.name}`);
          } else {
            await prisma.productCandidate.update({
              where: { id: candidate.id },
              data: {
                analysisStatus: 'failed',
                analysisError: result.error ?? 'Unknown error',
                landingPageUrl: result.scrapedData?.finalUrl ?? null,
              },
            });
            console.log(`❌ Failed to analyze candidate #${candidate.id}: ${result.error}`);
          }

          // Small delay between requests to avoid rate limiting
          await new Promise((resolve) => setTimeout(resolve, 2000));
        } catch (err) {
          console.error(`Error processing candidate #${candidate.id}:`, err);
          await prisma.productCandidate.update({
            where: { id: candidate.id },
            data: {
              analysisStatus: 'failed',
              analysisError: err instanceof Error ? err.message : 'Unknown error',
            },
          });
        }
      }

      console.log(`🏁 Landing page analysis batch complete. Processed ${candidates.length} candidates.`);
    } catch (error) {
      console.error('Error in analyze-all:', error);
      // Only send error if response hasn't been sent yet
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to start landing page analysis' });
      }
    }
  },

  /**
   * GET /api/product-candidates/:id/analysis
   * Get the analysis results for a specific candidate
   */
  async getAnalysis(req: Request, res: Response) {
    try {
      if (!prisma) {
        return res.status(503).json({ error: 'Database non configurato.' });
      }

      const id = parseInt(req.params.id || '');
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid product candidate ID' });
      }

      const candidate = await prisma.productCandidate.findUnique({ where: { id } });
      if (!candidate) {
        return res.status(404).json({ error: 'Product candidate not found' });
      }

      res.json({
        candidateId: candidate.id,
        name: candidate.name,
        affiliateLink: candidate.affiliateLink,
        landingPageUrl: candidate.landingPageUrl,
        analysisStatus: candidate.analysisStatus,
        analysisError: candidate.analysisError,
        analyzedAt: candidate.analyzedAt,
        analysis: candidate.landingPageData,
      });
    } catch (error) {
      console.error('Error fetching analysis:', error);
      res.status(500).json({ error: 'Failed to fetch analysis' });
    }
  },
};
