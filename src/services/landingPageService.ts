import axios from 'axios';
import * as cheerio from 'cheerio';

export interface ScrapedPageData {
  url: string;
  finalUrl: string;
  title: string;
  metaDescription: string;
  headings: string[];
  bodyText: string;
  images: { src: string; alt: string }[];
  links: string[];
  rawTextLength: number;
}

/**
 * Fetches a landing page URL (following redirects) and extracts structured text content.
 * Works with ClickBank hop links, direct URLs, etc.
 */
export async function scrapeLandingPage(url: string): Promise<ScrapedPageData> {
  // Follow redirects and fetch the final page
  const response = await axios.get(url, {
    timeout: 30000,
    maxRedirects: 10,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9,it;q=0.8',
    },
    responseType: 'text',
    validateStatus: (status) => status < 400,
  });

  const finalUrl = response.request?.res?.responseUrl || response.config.url || url;
  const html = response.data as string;
  const $ = cheerio.load(html);

  // Remove scripts, styles, nav, footer, and hidden elements
  $('script, style, noscript, nav, footer, header, iframe, svg, [style*="display:none"], [style*="display: none"], .hidden').remove();

  // Extract title
  const title = $('title').text().trim() || $('h1').first().text().trim() || '';

  // Extract meta description
  const metaDescription = $('meta[name="description"]').attr('content')?.trim() || 
                          $('meta[property="og:description"]').attr('content')?.trim() || '';

  // Extract headings
  const headings: string[] = [];
  $('h1, h2, h3, h4').each((_, el) => {
    const text = $(el).text().trim();
    if (text && text.length > 2) {
      headings.push(text);
    }
  });

  // Extract body text - clean up whitespace
  const bodyText = $('body').text()
    .replace(/\s+/g, ' ')
    .replace(/\n+/g, '\n')
    .trim();

  // Extract images with alt text
  const images: { src: string; alt: string }[] = [];
  $('img').each((_, el) => {
    const src = $(el).attr('src') || '';
    const alt = $(el).attr('alt') || '';
    if (src && (alt || src.includes('product'))) {
      images.push({ src, alt });
    }
  });

  // Extract meaningful links
  const links: string[] = [];
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href') || '';
    if (href && !href.startsWith('#') && !href.startsWith('javascript:')) {
      links.push(href);
    }
  });

  // Truncate body text to avoid exceeding token limits (keep ~8000 chars for AI analysis)
  const truncatedBodyText = bodyText.length > 8000 
    ? bodyText.substring(0, 8000) + '... [truncated]'
    : bodyText;

  return {
    url,
    finalUrl: finalUrl as string,
    title,
    metaDescription,
    headings: headings.slice(0, 30),
    bodyText: truncatedBodyText,
    images: images.slice(0, 10),
    links: links.slice(0, 20),
    rawTextLength: bodyText.length,
  };
}
