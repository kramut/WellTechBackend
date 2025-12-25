import { prisma } from '../lib/prisma';
import { Prisma } from '@prisma/client';

export interface TrendInput {
  keyword: string;
  source: string;
  score: number;
  category?: string;
  metadata?: any;
}

export interface TrendAnalysisInput {
  trends: TrendInput[];
}

export const trendService = {
  async getAllTrends(limit?: number) {
    if (!prisma) return [];
    
    return await prisma.trend.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit || 50,
    });
  },

  async getTrendsByCategory(category: string, limit?: number) {
    if (!prisma) return [];
    
    return await prisma.trend.findMany({
      where: { category },
      orderBy: { score: 'desc' },
      take: limit || 20,
    });
  },

  async createTrend(data: TrendInput) {
    if (!prisma) {
      throw new Error('Database not configured');
    }

    return await prisma.trend.create({
      data: {
        keyword: data.keyword,
        source: data.source,
        score: data.score,
        category: data.category || null,
        metadata: data.metadata || null,
      },
    });
  },

  async createTrendsBulk(trends: TrendInput[]) {
    if (!prisma) {
      throw new Error('Database not configured');
    }

    // Rimuovi duplicati basati su keyword + source
    const uniqueTrends = trends.reduce((acc, trend) => {
      const key = `${trend.keyword}-${trend.source}`;
      if (!acc.has(key)) {
        acc.set(key, trend);
      } else {
        // Se esiste, mantieni quello con score più alto
        const existing = acc.get(key)!;
        if (trend.score > existing.score) {
          acc.set(key, trend);
        }
      }
      return acc;
    }, new Map<string, TrendInput>());

    const trendsToCreate = Array.from(uniqueTrends.values());

    // Usa createMany con skipDuplicates
    return await prisma.trend.createMany({
      data: trendsToCreate.map(t => ({
        keyword: t.keyword,
        source: t.source,
        score: t.score,
        category: t.category || null,
        metadata: t.metadata || null,
      })),
      skipDuplicates: true,
    });
  },

  async analyzeTrends(data: TrendAnalysisInput) {
    if (!prisma) {
      throw new Error('Database not configured');
    }

    // Salva i trend nel database
    const result = await this.createTrendsBulk(data.trends);

    // Ritorna i top trend per categoria
    const topTrends = await prisma.trend.findMany({
      orderBy: { score: 'desc' },
      take: 50,
      distinct: ['keyword'],
    });

    return {
      saved: result.count,
      topTrends: topTrends.map(t => ({
        keyword: t.keyword,
        score: t.score,
        source: t.source,
        category: t.category,
        createdAt: t.createdAt,
      })),
    };
  },
};

