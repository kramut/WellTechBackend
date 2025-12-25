import { prisma } from '../lib/prisma';

export const analyticsService = {
  async getDashboard() {
    if (!prisma) {
      throw new Error('Database non configurato');
    }

    // Statistiche prodotti
    const totalProducts = await prisma.product.count();
    const productsByCategory = await prisma.product.groupBy({
      by: ['category'],
      _count: {
        id: true,
      },
    });

    // Statistiche articoli
    const totalArticles = await prisma.article.count();
    const publishedArticles = await prisma.article.count({
      where: {
        publishedAt: {
          not: null,
          lte: new Date(),
        },
      },
    });
    const totalViews = await prisma.article.aggregate({
      _sum: {
        views: true,
      },
    });

    // Statistiche video
    const totalVideos = await prisma.video.count();
    const totalTiktokViews = await prisma.video.aggregate({
      _sum: {
        tiktokViews: true,
      },
    });

    // Statistiche affiliate earnings
    const earnings = await prisma.affiliateEarning.findMany({
      include: {
        product: true,
      },
    });

    const totalClicks = earnings.reduce((sum: number, e: { clicks: number }) => sum + e.clicks, 0);
    const totalConversions = earnings.reduce((sum: number, e: { conversions: number }) => sum + e.conversions, 0);
    const totalRevenue = earnings.reduce((sum: number, e: { revenue: number | string }) => sum + Number(e.revenue), 0);
    const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;

    // Top prodotti per revenue
    const topProducts = await prisma.product.findMany({
      include: {
        affiliateEarnings: true,
      },
      take: 5,
    });

    const productsWithRevenue = topProducts.map((product: { id: number; name: string; category: string; affiliateEarnings: Array<{ revenue: number | string; clicks: number; conversions: number }> }) => {
      const productEarnings = product.affiliateEarnings;
      const revenue = productEarnings.reduce((sum: number, e: { revenue: number | string }) => sum + Number(e.revenue), 0);
      const clicks = productEarnings.reduce((sum: number, e: { clicks: number }) => sum + e.clicks, 0);
      const conversions = productEarnings.reduce((sum: number, e: { conversions: number }) => sum + e.conversions, 0);

      return {
        id: product.id,
        name: product.name,
        category: product.category,
        revenue: Number(revenue.toFixed(2)),
        clicks,
        conversions,
        conversionRate: clicks > 0 ? Number(((conversions / clicks) * 100).toFixed(2)) : 0,
      };
    }).sort((a: { revenue: number }, b: { revenue: number }) => b.revenue - a.revenue);

    // Articoli più visti
    const topArticles = await prisma.article.findMany({
      orderBy: {
        views: 'desc',
      },
      take: 5,
      select: {
        id: true,
        title: true,
        slug: true,
        category: true,
        views: true,
        publishedAt: true,
      },
    });

    // Video più visti su TikTok
    const topVideos = await prisma.video.findMany({
      orderBy: {
        tiktokViews: 'desc',
      },
      take: 5,
      include: {
        article: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
      },
    });

    // Revenue nel tempo (ultimi 30 giorni)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentEarnings = await prisma.affiliateEarning.findMany({
      where: {
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Raggruppa per giorno
    const revenueByDay: Record<string, number> = {};
    recentEarnings.forEach((earning: { createdAt: Date; revenue: number | string }) => {
      const date = earning.createdAt.toISOString().split('T')[0];
      revenueByDay[date] = (revenueByDay[date] || 0) + Number(earning.revenue);
    });

    const revenueTimeline = Object.entries(revenueByDay)
      .map(([date, revenue]) => ({
        date,
        revenue: Number(revenue.toFixed(2)),
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      overview: {
        products: {
          total: totalProducts,
          byCategory: productsByCategory.map((item) => ({
            category: item.category,
            count: item._count.id,
          })),
        },
        articles: {
          total: totalArticles,
          published: publishedArticles,
          draft: totalArticles - publishedArticles,
          totalViews: totalViews._sum.views || 0,
        },
        videos: {
          total: totalVideos,
          totalTiktokViews: totalTiktokViews._sum.tiktokViews || 0,
        },
        earnings: {
          totalClicks,
          totalConversions,
          totalRevenue: Number(totalRevenue.toFixed(2)),
          conversionRate: Number(conversionRate.toFixed(2)),
        },
      },
      topProducts: productsWithRevenue,
      topArticles,
      topVideos: topVideos.map((video: { id: number; title: string; tiktokViews: number; tiktokUrl: string | null; article: { id: number; title: string; slug: string } | null }) => ({
        id: video.id,
        title: video.title,
        tiktokViews: video.tiktokViews,
        tiktokUrl: video.tiktokUrl,
        article: video.article,
      })),
      revenueTimeline,
    };
  },
};




