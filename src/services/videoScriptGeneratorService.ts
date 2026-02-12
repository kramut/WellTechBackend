import OpenAI from 'openai';

export interface GeneratedVideoScript {
  title: string;
  hook: string;
  script: string;
  duration: string;
  hashtags: string[];
  caption: string;
}

interface LandingPageAnalysis {
  productName: string;
  shortDescription: string;
  mainClaims: string[];
  benefits: string[];
  targetAudience: string;
  problemSolved: string;
  callToAction: string;
  category: string;
  keywordsForSEO: string[];
  videoScriptHook: string;
}

function buildVideoPrompt(
  productName: string,
  affiliateLink: string,
  analysis: LandingPageAnalysis
): string {
  return `Crea uno script video per TikTok/Instagram Reels di 60-90 secondi in ITALIANO per promuovere "${productName}".

DATI PRODOTTO:
- Nome: ${productName}
- Descrizione: ${analysis.shortDescription}
- Benefici: ${analysis.benefits.join(', ')}
- Target: ${analysis.targetAudience}
- Problema risolto: ${analysis.problemSolved}
- Hook suggerito: ${analysis.videoScriptHook}
- Link affiliato: ${affiliateLink}

REQUISITI SCRIPT:
1. TUTTO in italiano
2. Tono: coinvolgente, diretto, naturale (come se parlassi a un amico)
3. Adatto per formato verticale (9:16)
4. Hook nei primi 3 secondi per catturare attenzione
5. NO linguaggio troppo commerciale
6. Chiudi con CTA che rimanda al link in bio

STRUTTURA (totale 60-90 secondi):
- [HOOK - 3-5 sec] Frase d'impatto per fermare lo scroll
- [PROBLEMA - 10-15 sec] Descrivi il problema che il target ha
- [SCOPERTA - 5-10 sec] "Ho scoperto qualcosa che..."
- [SOLUZIONE - 20-25 sec] Presenta il prodotto e i benefici principali (max 3)
- [PROVA SOCIALE - 10 sec] Risultati, testimonianze, numeri
- [CTA - 5-10 sec] "Link in bio" / "Trovi tutto qui sotto"

FORMATO OUTPUT - Restituisci SOLO un JSON valido (senza markdown, senza backtick):
{
  "title": "titolo breve del video (per uso interno)",
  "hook": "la frase hook dei primi 3 secondi",
  "script": "script completo con indicazioni di tempo tra parentesi quadre, es: [HOOK - 3s] testo... [PROBLEMA - 12s] testo...",
  "duration": "durata stimata, es: 75 secondi",
  "hashtags": ["#hashtag1", "#hashtag2", "...fino a 15 hashtag rilevanti in italiano"],
  "caption": "caption per il post (max 300 caratteri, include CTA e emoji)"
}`;
}

/**
 * Generates a TikTok/Reels video script from product candidate analysis data.
 */
export async function generateVideoScript(
  productName: string,
  affiliateLink: string,
  analysis: LandingPageAnalysis
): Promise<{ success: boolean; videoScript?: GeneratedVideoScript; error?: string }> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return { success: false, error: 'OPENAI_API_KEY non configurata.' };
  }

  try {
    const openai = new OpenAI({
      apiKey,
      ...(process.env.OPENAI_BASE_URL ? { baseURL: process.env.OPENAI_BASE_URL } : {}),
    });

    const prompt = buildVideoPrompt(productName, affiliateLink, analysis);

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Sei un content creator esperto di video brevi per TikTok e Instagram Reels. Crei script virali e coinvolgenti in italiano. Rispondi solo in JSON valido.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.8,
      max_tokens: 2000,
    });

    const responseText = completion.choices[0]?.message?.content?.trim();
    if (!responseText) {
      return { success: false, error: 'AI ha restituito risposta vuota.' };
    }

    let cleanJson = responseText;
    if (cleanJson.startsWith('```')) {
      cleanJson = cleanJson.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }

    const videoScript: GeneratedVideoScript = JSON.parse(cleanJson);
    return { success: true, videoScript };
  } catch (err) {
    return {
      success: false,
      error: `Errore generazione script video: ${err instanceof Error ? err.message : 'Unknown'}`,
    };
  }
}
