import OpenAI from 'openai';
import { scrapeLandingPage } from './landingPageService';
import type { ScrapedPageData } from './landingPageService';

export interface LandingPageAnalysis {
  productName: string;
  shortDescription: string;
  mainClaims: string[];
  benefits: string[];
  ingredients: string[];       // or features/components
  targetAudience: string;
  problemSolved: string;
  price: string | null;
  guarantee: string | null;
  callToAction: string;
  testimonials: string[];
  tone: string;                // "scientific", "emotional", "hype", etc.
  category: string;            // "wellness", "beauty", "fitness", "sexual-wellbeing", "sustainability"
  keywordsForSEO: string[];
  videoScriptHook: string;     // Suggested hook for video content
  articleAngle: string;        // Suggested angle for SEO article
  overallQuality: number;      // 1-10 quality/trust score
  warnings: string[];          // Red flags (fake claims, etc.)
}

export interface AnalysisResult {
  success: boolean;
  scrapedData?: ScrapedPageData;
  analysis?: LandingPageAnalysis;
  error?: string;
}

const ANALYSIS_PROMPT = `Sei un esperto di marketing digitale e affiliate marketing. Analizza il contenuto di questa landing page di prodotto e restituisci un JSON strutturato con le seguenti informazioni.

CONTENUTO DELLA LANDING PAGE:
---
Titolo: {title}
Meta Description: {metaDescription}
Headings: {headings}
Testo della pagina: {bodyText}
---

Restituisci SOLO un JSON valido (senza markdown, senza backtick) con questa struttura esatta:
{
  "productName": "nome del prodotto",
  "shortDescription": "descrizione breve (max 200 caratteri)",
  "mainClaims": ["claim principale 1", "claim principale 2", "claim principale 3"],
  "benefits": ["beneficio 1", "beneficio 2", "beneficio 3", "beneficio 4", "beneficio 5"],
  "ingredients": ["ingrediente o componente 1", "ingrediente o componente 2"],
  "targetAudience": "descrizione del target (es: uomini over 40 con problemi di prostata)",
  "problemSolved": "quale problema risolve il prodotto",
  "price": "prezzo se indicato, altrimenti null",
  "guarantee": "garanzia se indicata (es: 60 days money back), altrimenti null",
  "callToAction": "la CTA principale della pagina",
  "testimonials": ["testimonianza 1 breve", "testimonianza 2 breve"],
  "tone": "scientific|emotional|hype|balanced|informative",
  "category": "wellness|beauty|fitness|sexual-wellbeing|sustainability|nutrition|mental-health",
  "keywordsForSEO": ["keyword 1", "keyword 2", "keyword 3", "keyword 4", "keyword 5"],
  "videoScriptHook": "frase hook suggerita per iniziare un video TikTok/Reels su questo prodotto (in italiano)",
  "articleAngle": "angolo suggerito per un articolo SEO su questo prodotto (in italiano)",
  "overallQuality": 7,
  "warnings": ["eventuali red flag o claim esagerati"]
}

REGOLE:
- Se un campo non è determinabile, usa stringa vuota o array vuoto
- Per overallQuality: 1-3 = bassa qualità/scam, 4-6 = medio, 7-10 = buona qualità
- Per warnings: segnala claim medici non supportati, linguaggio troppo aggressivo, etc.
- keywordsForSEO devono essere in italiano
- videoScriptHook e articleAngle devono essere in italiano
- Restituisci SOLO il JSON, nessun altro testo`;

/**
 * Analyzes a landing page by scraping it and using OpenAI to extract structured data.
 */
export async function analyzeLandingPage(affiliateLink: string): Promise<AnalysisResult> {
  const openaiApiKey = process.env.OPENAI_API_KEY;
  if (!openaiApiKey) {
    return {
      success: false,
      error: 'OPENAI_API_KEY non configurata. Aggiungi la variabile d\'ambiente.',
    };
  }

  // Step 1: Scrape the landing page
  let scrapedData: ScrapedPageData;
  try {
    scrapedData = await scrapeLandingPage(affiliateLink);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown scraping error';
    return {
      success: false,
      error: `Errore nello scraping della landing page: ${message}`,
    };
  }

  if (!scrapedData.bodyText || scrapedData.bodyText.length < 100) {
    return {
      success: false,
      scrapedData,
      error: 'Landing page con contenuto insufficiente per l\'analisi (meno di 100 caratteri di testo).',
    };
  }

  // Step 2: Build the prompt with scraped data
  const prompt = ANALYSIS_PROMPT
    .replace('{title}', scrapedData.title)
    .replace('{metaDescription}', scrapedData.metaDescription)
    .replace('{headings}', scrapedData.headings.join('\n'))
    .replace('{bodyText}', scrapedData.bodyText);

  // Step 3: Call OpenAI for analysis
  try {
    const openai = new OpenAI({ apiKey: openaiApiKey });
    
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Sei un analista esperto di marketing e prodotti affiliate. Rispondi solo in JSON valido.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 2000,
    });

    const responseText = completion.choices[0]?.message?.content?.trim();
    if (!responseText) {
      return {
        success: false,
        scrapedData,
        error: 'OpenAI ha restituito una risposta vuota.',
      };
    }

    // Parse JSON response (handle potential markdown wrapping)
    let cleanJson = responseText;
    if (cleanJson.startsWith('```')) {
      cleanJson = cleanJson.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }

    const analysis: LandingPageAnalysis = JSON.parse(cleanJson);

    return {
      success: true,
      scrapedData,
      analysis,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown AI analysis error';
    return {
      success: false,
      scrapedData,
      error: `Errore nell'analisi AI: ${message}`,
    };
  }
}
