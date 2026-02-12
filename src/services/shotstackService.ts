import axios from 'axios';

/**
 * Shotstack Video Rendering Service
 * 
 * Takes a video script (text) and renders it into an actual .mp4 video
 * using Shotstack's Edit API with TTS voiceover, text overlays, and background.
 * 
 * Flow: Script text → Shotstack API → renders video → returns URL
 */

// Shotstack API endpoints
const SHOTSTACK_STAGE_URL = 'https://api.shotstack.io/stage';
const SHOTSTACK_PROD_URL = 'https://api.shotstack.io/v1';

function getApiUrl(): string {
  return process.env.SHOTSTACK_ENV === 'production' ? SHOTSTACK_PROD_URL : SHOTSTACK_STAGE_URL;
}

function getApiKey(): string {
  const key = process.env.SHOTSTACK_API_KEY;
  if (!key) throw new Error('SHOTSTACK_API_KEY non configurata');
  return key;
}

// ---- Interfaces ----

interface VideoSection {
  timing: string;
  text: string;
  visualDirection?: string;
  voiceover?: string;
}

interface ParsedScript {
  hook: string;
  sections: VideoSection[];
  fullText: string;
}

interface RenderResult {
  success: boolean;
  renderId?: string;
  error?: string;
}

interface RenderStatusResult {
  success: boolean;
  status?: string;
  url?: string;
  error?: string;
}

// ---- Script Parsing ----

/**
 * Parse the AI-generated script into sections for video rendering.
 * The script format is: [SECTION - Xs] text...
 */
function parseScript(scriptText: string): ParsedScript {
  const sectionRegex = /\[([^\]]+)\]\s*/g;
  const sections: VideoSection[] = [];
  let lastIndex = 0;
  let match;
  let hook = '';

  // Try to find sections in the [TIMING] format
  while ((match = sectionRegex.exec(scriptText)) !== null) {
    if (lastIndex > 0) {
      // Get text between previous section header and this one
      const prevText = scriptText.substring(lastIndex, match.index).trim();
      if (sections.length > 0 && prevText) {
        const lastSection = sections[sections.length - 1];
        if (lastSection) {
          lastSection.text = prevText;
        }
      }
    }

    sections.push({
      timing: match[1] || '',
      text: '',
    });

    lastIndex = sectionRegex.lastIndex;
  }

  // Get remaining text after last section header
  if (sections.length > 0 && lastIndex < scriptText.length) {
    const lastSection = sections[sections.length - 1];
    if (lastSection) {
      lastSection.text = scriptText.substring(lastIndex).trim();
    }
  }

  // Extract hook (first section or first sentence)
  if (sections.length > 0 && sections[0]) {
    hook = sections[0].text;
  } else {
    hook = scriptText.split('.')[0] || scriptText.substring(0, 100);
  }

  // If no sections found, treat the whole text as one section
  if (sections.length === 0) {
    sections.push({ timing: '0-10s', text: scriptText });
  }

  return {
    hook,
    sections,
    fullText: scriptText,
  };
}

/**
 * Build the voiceover text from parsed sections.
 * Cleans up timing markers and keeps only the spoken text.
 */
function buildVoiceoverText(parsed: ParsedScript): string {
  return parsed.sections
    .map((s) => s.text)
    .filter((t) => t.length > 0)
    .join('. ')
    .replace(/\s+/g, ' ')
    .trim();
}

// ---- Shotstack Edit API ----

/**
 * Build a Shotstack Edit API timeline for a short social video.
 * 
 * Structure:
 * - Track 1 (top): Text overlays (hook + CTA)
 * - Track 2 (middle): TTS voiceover
 * - Track 3 (bottom): Solid color background
 * 
 * Duration: 8-10 seconds as requested
 */
function buildTimeline(
  voiceoverText: string,
  hookText: string,
  ctaText: string,
  videoDurationSec: number = 10
) {
  // Shotstack timeline
  return {
    timeline: {
      background: '#000000',
      tracks: [
        // Track 1: Text overlays
        {
          clips: [
            // Hook text (first 3 seconds)
            {
              asset: {
                type: 'html',
                html: `<p style="font-family: 'Montserrat'; color: #ffffff; font-size: 42px; font-weight: 800; text-align: center; text-shadow: 2px 2px 8px rgba(0,0,0,0.8); padding: 20px;">${escapeHtml(hookText)}</p>`,
                width: 900,
                height: 400,
              },
              start: 0,
              length: 3,
              position: 'center',
              transition: {
                in: 'fade',
                out: 'fade',
              },
              effect: 'zoomIn',
            },
            // CTA text (last 2 seconds)
            {
              asset: {
                type: 'html',
                html: `<p style="font-family: 'Montserrat'; color: #FFD700; font-size: 32px; font-weight: 700; text-align: center; text-shadow: 2px 2px 8px rgba(0,0,0,0.8); padding: 20px;">👆 ${escapeHtml(ctaText)}</p>`,
                width: 900,
                height: 200,
              },
              start: videoDurationSec - 2.5,
              length: 2.5,
              position: 'bottom',
              offset: { y: -0.1 },
              transition: {
                in: 'slideUp',
              },
            },
          ],
        },
        // Track 2: TTS voiceover
        {
          clips: [
            {
              asset: {
                type: 'text-to-speech',
                text: voiceoverText.substring(0, 500), // Limit for short video
                language: 'it-IT',
                voice: 'Giorgio',
              },
              start: 0.5,
              length: videoDurationSec - 1,
            },
          ],
        },
        // Track 3: Background gradient (dark wellness theme)
        {
          clips: [
            {
              asset: {
                type: 'html',
                html: '<div style="width: 100%; height: 100%; background: linear-gradient(160deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);"></div>',
                width: 1080,
                height: 1920,
              },
              start: 0,
              length: videoDurationSec,
            },
          ],
        },
      ],
    },
    output: {
      format: 'mp4',
      resolution: 'hd', // 1080p
      aspectRatio: '9:16', // Vertical for TikTok/Reels
      fps: 30,
      size: {
        width: 1080,
        height: 1920,
      },
    },
  };
}

/**
 * Submit a video render job to Shotstack.
 */
export async function submitRender(
  scriptText: string,
  hookOverride?: string,
  ctaText: string = 'Link in bio!'
): Promise<RenderResult> {
  try {
    const apiKey = getApiKey();
    const apiUrl = getApiUrl();
    const parsed = parseScript(scriptText);
    const voiceoverText = buildVoiceoverText(parsed);
    const hook = hookOverride || parsed.hook;

    // Keep video short: 8-10 seconds
    const videoDuration = 10;

    const payload = buildTimeline(voiceoverText, hook, ctaText, videoDuration);

    const response = await axios.post(`${apiUrl}/render`, payload, {
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
    });

    const renderId = response.data?.response?.id;
    if (!renderId) {
      return { success: false, error: 'Shotstack non ha restituito un render ID' };
    }

    return { success: true, renderId };
  } catch (err: any) {
    const message = err.response?.data?.message || err.message || 'Unknown error';
    console.error('Shotstack render error:', message);
    return { success: false, error: `Shotstack error: ${message}` };
  }
}

/**
 * Check the status of a render job.
 * Returns the video URL when the render is complete.
 */
export async function getRenderStatus(renderId: string): Promise<RenderStatusResult> {
  try {
    const apiKey = getApiKey();
    const apiUrl = getApiUrl();

    const response = await axios.get(`${apiUrl}/render/${renderId}`, {
      headers: {
        'x-api-key': apiKey,
      },
    });

    const data = response.data?.response;
    const status = data?.status;

    if (status === 'done') {
      return { success: true, status: 'done', url: data.url };
    } else if (status === 'failed') {
      return { success: false, status: 'failed', error: data.error || 'Render failed' };
    } else {
      // queued, fetching, rendering, saving
      return { success: true, status };
    }
  } catch (err: any) {
    const message = err.response?.data?.message || err.message || 'Unknown error';
    return { success: false, error: `Shotstack status error: ${message}` };
  }
}

/**
 * Submit render and poll until complete (with timeout).
 * Returns the final video URL or an error.
 */
export async function renderAndWait(
  scriptText: string,
  hookOverride?: string,
  ctaText: string = 'Link in bio!',
  maxWaitMs: number = 120000 // 2 minutes max
): Promise<{ success: boolean; url?: string; renderId?: string; error?: string }> {
  const submitResult = await submitRender(scriptText, hookOverride, ctaText);
  if (!submitResult.success || !submitResult.renderId) {
    return { success: false, error: submitResult.error };
  }

  const renderId = submitResult.renderId;
  const startTime = Date.now();
  const pollInterval = 3000; // 3 seconds

  while (Date.now() - startTime < maxWaitMs) {
    await sleep(pollInterval);

    const statusResult = await getRenderStatus(renderId);

    if (statusResult.status === 'done' && statusResult.url) {
      return { success: true, url: statusResult.url, renderId };
    }

    if (statusResult.status === 'failed' || !statusResult.success) {
      return { success: false, error: statusResult.error, renderId };
    }

    // Still processing, continue polling
  }

  return {
    success: false,
    error: `Render timeout dopo ${maxWaitMs / 1000}s. Render ID: ${renderId} - controlla lo stato manualmente.`,
    renderId,
  };
}

// ---- Utilities ----

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
