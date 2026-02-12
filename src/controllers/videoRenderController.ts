import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { submitRender, getRenderStatus, renderAndWait } from '../services/shotstackService';

export const videoRenderController = {
  /**
   * POST /api/videos/:id/render
   * Submit a video for rendering via Shotstack.
   * Takes the script from the DB and sends it to Shotstack.
   * Returns immediately with a render ID (async processing).
   */
  async startRender(req: Request, res: Response) {
    try {
      if (!prisma) return res.status(503).json({ error: 'Database non configurato.' });

      const id = parseInt(req.params.id || '');
      if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });

      const video = await prisma.video.findUnique({ where: { id } });
      if (!video) return res.status(404).json({ error: 'Video non trovato' });

      if (!video.script || video.script.trim().length === 0) {
        return res.status(422).json({ error: 'Il video non ha uno script. Genera prima lo script.' });
      }

      // Parse JSON script if it's JSON, otherwise use raw text
      let scriptText = video.script;
      let hookText: string | undefined;
      let ctaText = 'Link in bio!';

      try {
        const parsed = JSON.parse(video.script);
        if (parsed.script) scriptText = parsed.script;
        if (parsed.hook) hookText = parsed.hook;
        if (parsed.caption) ctaText = parsed.caption.substring(0, 50);
      } catch {
        // Not JSON, use raw script text
      }

      const result = await submitRender(scriptText, hookText, ctaText);

      if (!result.success) {
        return res.status(422).json({ success: false, error: result.error });
      }

      // Save render ID in video metadata for status tracking
      await prisma.video.update({
        where: { id },
        data: {
          // Store render status info - use videoUrl field temporarily for tracking
          // We'll update it with the actual URL when render completes
        },
      });

      res.json({
        success: true,
        renderId: result.renderId,
        message: 'Rendering avviato. Usa GET /api/videos/:id/render-status/:renderId per controllare lo stato.',
      });
    } catch (error) {
      console.error('Error starting render:', error);
      res.status(500).json({ error: 'Failed to start video render' });
    }
  },

  /**
   * GET /api/videos/:id/render-status/:renderId
   * Check the status of a video render job.
   * When complete, updates the video record with the URL.
   */
  async checkRenderStatus(req: Request, res: Response) {
    try {
      if (!prisma) return res.status(503).json({ error: 'Database non configurato.' });

      const id = parseInt(req.params.id || '');
      const renderId = req.params.renderId;

      if (isNaN(id)) return res.status(400).json({ error: 'Invalid video ID' });
      if (!renderId) return res.status(400).json({ error: 'Missing render ID' });

      const video = await prisma.video.findUnique({ where: { id } });
      if (!video) return res.status(404).json({ error: 'Video non trovato' });

      const result = await getRenderStatus(renderId);

      if (!result.success) {
        return res.status(422).json({ success: false, status: result.status, error: result.error });
      }

      // If render is complete, save the video URL
      if (result.status === 'done' && result.url) {
        await prisma.video.update({
          where: { id },
          data: { videoUrl: result.url },
        });

        return res.json({
          success: true,
          status: 'done',
          videoUrl: result.url,
          message: 'Video renderizzato con successo!',
        });
      }

      // Still processing
      res.json({
        success: true,
        status: result.status,
        message: `Rendering in corso: ${result.status}`,
      });
    } catch (error) {
      console.error('Error checking render status:', error);
      res.status(500).json({ error: 'Failed to check render status' });
    }
  },

  /**
   * POST /api/videos/:id/render-and-wait
   * Submit a video for rendering and wait for completion (synchronous).
   * Polls Shotstack until the video is done or times out (max 2 min).
   * Updates the video record with the final URL.
   */
  async renderAndWaitEndpoint(req: Request, res: Response) {
    try {
      if (!prisma) return res.status(503).json({ error: 'Database non configurato.' });

      const id = parseInt(req.params.id || '');
      if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });

      const video = await prisma.video.findUnique({ where: { id } });
      if (!video) return res.status(404).json({ error: 'Video non trovato' });

      if (!video.script || video.script.trim().length === 0) {
        return res.status(422).json({ error: 'Il video non ha uno script.' });
      }

      // Parse JSON script
      let scriptText = video.script;
      let hookText: string | undefined;
      let ctaText = 'Link in bio!';

      try {
        const parsed = JSON.parse(video.script);
        if (parsed.script) scriptText = parsed.script;
        if (parsed.hook) hookText = parsed.hook;
        if (parsed.caption) ctaText = parsed.caption.substring(0, 50);
      } catch {
        // Not JSON, use raw
      }

      const result = await renderAndWait(scriptText, hookText, ctaText);

      if (!result.success) {
        return res.status(422).json({
          success: false,
          error: result.error,
          renderId: result.renderId,
        });
      }

      // Save the video URL
      if (result.url) {
        await prisma.video.update({
          where: { id },
          data: { videoUrl: result.url },
        });
      }

      res.json({
        success: true,
        videoUrl: result.url,
        renderId: result.renderId,
        message: 'Video renderizzato con successo!',
      });
    } catch (error) {
      console.error('Error in render-and-wait:', error);
      res.status(500).json({ error: 'Failed to render video' });
    }
  },
};
