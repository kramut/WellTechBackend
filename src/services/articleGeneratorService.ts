import OpenAI from 'openai';

export interface GeneratedArticle {
  title: string;
  slug: string;
  content: string;
  seoMetaTitle: string;
  seoMetaDescription: string;
  category: string;
  keywords: string[];
}

interface LandingPageAnalysis {
  productName: string;
  shortDescription: string;
  mainClaims: string[];
  benefits: string[];
  ingredients: string[];
  targetAudience: string;
  problemSolved: string;
  price: string | null;
  guarantee: string | null;
  callToAction: string;
  tone: string;
  category: string;
  keywordsForSEO: string[];
  articleAngle: string;
  overallQuality: number;
}

function buildArticlePrompt(
  productName: string,
  affiliateLink: string,
  analysis: LandingPageAnalysis
): string {
  return `Scrivi un articolo SEO ottimizzato di circa 2000 parole in ITALIANO su "${productName}".

DATI PRODOTTO (dalla nostra analisi):
- Nome: ${productName}
- Descrizione: ${analysis.shortDescription}
- Claims principali: ${analysis.mainClaims.join(', ')}
- Benefici: ${analysis.benefits.join(', ')}
- Ingredienti/Componenti: ${analysis.ingredients.length > 0 ? analysis.ingredients.join(', ') : 'Non specificati'}
- Target: ${analysis.targetAudience}
- Problema risolto: ${analysis.problemSolved}
- Prezzo: ${analysis.price || 'Vedi sito ufficiale'}
- Garanzia: ${analysis.guarantee || 'Non specificata'}
- Angolo suggerito: ${analysis.articleAngle}

KEYWORD SEO DA USARE:
- Keyword principale: ${analysis.keywordsForSEO[0] || productName}
- Long-tail: ${analysis.keywordsForSEO.slice(1).join(', ')}

LINK AFFILIATO (da inserire naturalmente nel testo, 2-3 volte):
${affiliateLink}

REQUISITI:
1. Scrivi TUTTO in italiano
2. Tono: informativo, autorevole ma accessibile
3. NON sembrare una pubblicità. Scrivi come un articolo di blog informativo che recensisce il prodotto
4. Includi il link affiliato 2-3 volte nel testo in modo naturale (come "scopri di più qui", "visita il sito ufficiale", etc.)
5. Keyword density 2-3% per la keyword principale
6. Usa heading markdown (## e ###)

STRUTTURA OBBLIGATORIA:
1. **Introduzione** (~200 parole) - Problema + hook
2. **Cos'è ${productName}** (~300 parole) - Descrizione prodotto
3. **Come funziona** (~300 parole) - Meccanismo/processo
4. **Benefici principali** (~400 parole) - Lista benefici dettagliata
5. **Per chi è adatto** (~200 parole) - Target audience
6. **La nostra opinione** (~200 parole) - Recensione onesta
7. **Domande frequenti** (~300 parole) - 5 FAQ con risposte
8. **Conclusione** (~100 parole) - Riepilogo + CTA con link affiliato

FORMATO OUTPUT - Restituisci SOLO un JSON valido (senza markdown, senza backtick):
{
  "title": "titolo articolo SEO ottimizzato (60-70 caratteri)",
  "slug": "slug-url-ottimizzato-seo",
  "content": "contenuto completo in markdown con ## e ### per headings",
  "seoMetaTitle": "meta title SEO (max 60 caratteri)",
  "seoMetaDescription": "meta description SEO (max 155 caratteri, include keyword principale)",
  "category": "${analysis.category}",
  "keywords": ${JSON.stringify(analysis.keywordsForSEO)}
}`;
}

/**
 * Generates a full SEO article from product candidate analysis data.
 */
export async function generateArticle(
  productName: string,
  affiliateLink: string,
  analysis: LandingPageAnalysis
): Promise<{ success: boolean; article?: GeneratedArticle; error?: string }> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return { success: false, error: 'OPENAI_API_KEY non configurata.' };
  }

  try {
    const openai = new OpenAI({
      apiKey,
      ...(process.env.OPENAI_BASE_URL ? { baseURL: process.env.OPENAI_BASE_URL } : {}),
    });

    const prompt = buildArticlePrompt(productName, affiliateLink, analysis);

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Sei un copywriter SEO esperto italiano. Scrivi articoli di alta qualità per blog di benessere e lifestyle. Rispondi solo in JSON valido.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 4000,
    });

    const responseText = completion.choices[0]?.message?.content?.trim();
    if (!responseText) {
      return { success: false, error: 'AI ha restituito risposta vuota.' };
    }

    let cleanJson = responseText;
    if (cleanJson.startsWith('```')) {
      cleanJson = cleanJson.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }

    const article: GeneratedArticle = JSON.parse(cleanJson);
    return { success: true, article };
  } catch (err) {
    return {
      success: false,
      error: `Errore generazione articolo: ${err instanceof Error ? err.message : 'Unknown'}`,
    };
  }
}
