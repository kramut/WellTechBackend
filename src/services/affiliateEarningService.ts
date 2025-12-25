import { prisma } from '../lib/prisma';
import { CreateAffiliateEarningInput, UpdateAffiliateEarningInput } from '../types';

export const affiliateEarningService = {
  async getAll() {
    return prisma.affiliateEarning.findMany({
      include: {
        product: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  },

  async getById(id: number) {
    return prisma.affiliateEarning.findUnique({
      where: { id },
      include: {
        product: true,
      },
    });
  },

  async getByProductId(productId: number) {
    return prisma.affiliateEarning.findMany({
      where: { productId },
      orderBy: {
        createdAt: 'desc',
      },
    });
  },

  async getStats() {
    const earnings = await prisma.affiliateEarning.findMany({
      include: {
        product: true,
      },
    });

    const totalClicks = earnings.reduce((sum: number, e: { clicks: number }) => sum + e.clicks, 0);
    const totalConversions = earnings.reduce((sum: number, e: { conversions: number }) => sum + e.conversions, 0);
    const totalRevenue = earnings.reduce((sum: number, e: { revenue: number | string }) => sum + Number(e.revenue), 0);
    const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;

    return {
      totalClicks,
      totalConversions,
      totalRevenue,
      conversionRate: Number(conversionRate.toFixed(2)),
      earnings,
    };
  },

  async create(data: CreateAffiliateEarningInput) {
    return prisma.affiliateEarning.create({
      data: {
        productId: data.productId,
        clicks: data.clicks || 0,
        conversions: data.conversions || 0,
        revenue: data.revenue || 0,
      },
      include: {
        product: true,
      },
    });
  },

  async update(id: number, data: UpdateAffiliateEarningInput) {
    return prisma.affiliateEarning.update({
      where: { id },
      data: {
        ...(data.clicks !== undefined && { clicks: data.clicks }),
        ...(data.conversions !== undefined && { conversions: data.conversions }),
        ...(data.revenue !== undefined && { revenue: data.revenue }),
      },
      include: {
        product: true,
      },
    });
  },

  async delete(id: number) {
    return prisma.affiliateEarning.delete({
      where: { id },
    });
  },
};

