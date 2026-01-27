import axios from 'axios';

export interface GoogleTrendResult {
  keyword: string;
  source: string;
  score: number;
  category?: string;
  metadata?: any;
}

const SERPAPI_KEY = process.env.SERPAPI_KEY || '';

export const googleTrendsService = {
  /**
   * Ottiene i trend per una lista di keyword usando SerpAPI
   */
  async getTrendsForKeywords(keywords: string[], geo: string = 'IT'): Promise<GoogleTrendResult[]> {
    if (!SERPAPI_KEY) {
      console.warn('SERPAPI_KEY not set, returning empty results');
      return [];
    }

    const results: GoogleTrendResult[] = [];

    for (const keyword of keywords) {
      try {
        // SerpAPI Google Trends endpoint
        const response = await axios.get('https://serpapi.com/search.json', {
          params: {
            engine: 'google_trends',
            q: keyword,
            geo: geo,
            api_key: SERPAPI_KEY,
            data_type: 'TIMESERIES',
            date: 'today 7-d', // Ultimi 7 giorni
          },
          timeout: 10000, // 10 secondi timeout
        });

        const data = response.data;

        // Estrai i dati dalla risposta SerpAPI
        if (data.interest_over_time && data.interest_over_time.length > 0) {
          const timelineData = data.interest_over_time;
          
          // Calcola score medio degli ultimi 7 giorni
          const scores = timelineData.map((item: any) => item.value || 0);
          const avgScore = scores.reduce((a: number, b: number) => a + b, 0) / scores.length;
          
          // Normalizza lo score (0-100 -> 0-10)
          const normalizedScore = (avgScore / 100) * 10;

          // Determina categoria
          let category = 'wellbeing';
          const keywordLower = keyword.toLowerCase();
          if (keywordLower.includes('sexual') || keywordLower.includes('sessual') || keywordLower.includes('intimacy')) {
            category = 'sexual-wellbeing';
          } else if (keywordLower.includes('sustainability') || keywordLower.includes('sostenibilità') || keywordLower.includes('green') || keywordLower.includes('eco') || keywordLower.includes('solar') || keywordLower.includes('renewable')) {
            category = 'sustainability';
          }

          results.push({
            keyword,
            source: 'google',
            score: parseFloat(normalizedScore.toFixed(2)),
            category,
            metadata: {
              region: geo,
              timeframe: 'last_7_days',
              rawScore: avgScore,
              dataPoints: timelineData.length,
              serpapiData: data,
            },
          });
        } else {
          // Se non ci sono dati, assegna uno score basso ma non zero
          let category = 'wellbeing';
          const keywordLower = keyword.toLowerCase();
          if (keywordLower.includes('sexual') || keywordLower.includes('sessual')) {
            category = 'sexual-wellbeing';
          } else if (keywordLower.includes('sustainability') || keywordLower.includes('green') || keywordLower.includes('eco')) {
            category = 'sustainability';
          }

          results.push({
            keyword,
            source: 'google',
            score: 1.0, // Score minimo se non ci sono dati
            category,
            metadata: {
              region: geo,
              timeframe: 'last_7_days',
              note: 'No trend data available',
            },
          });
        }
      } catch (error: any) {
        console.error(`Error fetching trend for keyword "${keyword}":`, error.message);
        // Continua con le altre keyword anche se una fallisce
      }
    }

    return results;
  },

  /**
   * Ottiene le keyword correlate per una keyword usando SerpAPI
   */
  async getRelatedQueries(keyword: string, geo: string = 'IT'): Promise<string[]> {
    if (!SERPAPI_KEY) {
      return [];
    }

    try {
      const response = await axios.get('https://serpapi.com/search.json', {
        params: {
          engine: 'google_trends',
          q: keyword,
          geo: geo,
          api_key: SERPAPI_KEY,
          data_type: 'RELATED_QUERIES',
        },
        timeout: 10000,
      });

      const data = response.data;
      const relatedQueries: string[] = [];

      // Estrai rising queries
      if (data.rising_queries && Array.isArray(data.rising_queries)) {
        data.rising_queries.forEach((item: any) => {
          if (item.query) relatedQueries.push(item.query);
        });
      }

      // Estrai top queries
      if (data.top_queries && Array.isArray(data.top_queries)) {
        data.top_queries.forEach((item: any) => {
          if (item.query && !relatedQueries.includes(item.query)) {
            relatedQueries.push(item.query);
          }
        });
      }

      return relatedQueries.slice(0, 10); // Limita a 10
    } catch (error: any) {
      console.error(`Error fetching related queries for "${keyword}":`, error.message);
      return [];
    }
  },

  /**
   * Ottiene i trend per categoria (usa keyword predefinite)
   */
  async getTrendsByCategory(category: string, geo: string = 'IT'): Promise<GoogleTrendResult[]> {
    const categoryKeywords: Record<string, string[]> = {
      'wellbeing': ['wellness', 'fitness', 'meditation', 'yoga', 'mindfulness', 'health', 'mental health'],
      'sexual-wellbeing': ['sexual wellness', 'intimacy', 'sexual health', 'wellness', 'relationship wellness'],
      'sustainability': ['sustainability', 'green energy', 'eco friendly', 'solar energy', 'renewable energy', 'carbon footprint'],
    };

    const keywords = categoryKeywords[category] ?? categoryKeywords['wellbeing'] ?? [];
    return this.getTrendsForKeywords(keywords, geo);
  },
};
