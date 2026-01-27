import { prisma } from '../lib/prisma';
import { CreateProductCandidateInput, UpdateProductCandidateInput } from '../types';

export const productCandidateService = {
  async getAll() {
    if (!prisma) return [];
    return prisma.productCandidate.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  },

  async getById(id: number) {
    if (!prisma) return null;
    return prisma.productCandidate.findUnique({
      where: { id },
    });
  },

  async getByStatus(status: string) {
    if (!prisma) return [];
    return prisma.productCandidate.findMany({
      where: { status },
      orderBy: {
        createdAt: 'desc',
      },
    });
  },

  async getByCategory(category: string) {
    if (!prisma) return [];
    return prisma.productCandidate.findMany({
      where: { category },
      orderBy: {
        createdAt: 'desc',
      },
    });
  },

  async getBySource(source: string) {
    if (!prisma) return [];
    return prisma.productCandidate.findMany({
      where: { source },
      orderBy: {
        createdAt: 'desc',
      },
    });
  },

  async create(data: CreateProductCandidateInput) {
    if (!prisma) throw new Error('Database non configurato. Configura DATABASE_URL e esegui le migrazioni.');
    return prisma.productCandidate.create({
      data: {
        name: data.name,
        category: data.category,
        description: data.description,
        price: data.price ? data.price : undefined,
        affiliateLink: data.affiliateLink,
        affiliateProgram: data.affiliateProgram,
        commissionPercentage: data.commissionPercentage ? data.commissionPercentage : undefined,
        imageUrl: data.imageUrl,
        rating: data.rating,
        reviewCount: data.reviewCount,
        source: data.source,
        sourceId: data.sourceId,
        metadata: data.metadata ? data.metadata : undefined,
        status: 'pending', // Default status
      },
    });
  },

  async update(id: number, data: UpdateProductCandidateInput) {
    if (!prisma) throw new Error('Database non configurato.');
    return prisma.productCandidate.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.category && { category: data.category }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.price !== undefined && { price: data.price }),
        ...(data.affiliateLink && { affiliateLink: data.affiliateLink }),
        ...(data.affiliateProgram !== undefined && { affiliateProgram: data.affiliateProgram }),
        ...(data.commissionPercentage !== undefined && { commissionPercentage: data.commissionPercentage }),
        ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl }),
        ...(data.rating !== undefined && { rating: data.rating }),
        ...(data.reviewCount !== undefined && { reviewCount: data.reviewCount }),
        ...(data.source && { source: data.source }),
        ...(data.sourceId !== undefined && { sourceId: data.sourceId }),
        ...(data.status && { status: data.status }),
        ...(data.rejectionReason !== undefined && { rejectionReason: data.rejectionReason }),
        ...(data.approvedAt !== undefined && { approvedAt: data.approvedAt }),
        ...(data.approvedBy !== undefined && { approvedBy: data.approvedBy }),
        ...(data.metadata !== undefined && { metadata: data.metadata }),
      },
    });
  },

  async approve(id: number, approvedBy: string) {
    if (!prisma) throw new Error('Database non configurato.');
    return prisma.productCandidate.update({
      where: { id },
      data: {
        status: 'approved',
        approvedAt: new Date(),
        approvedBy,
        rejectionReason: null,
      },
    });
  },

  async reject(id: number, rejectionReason: string, rejectedBy: string) {
    if (!prisma) throw new Error('Database non configurato.');
    return prisma.productCandidate.update({
      where: { id },
      data: {
        status: 'rejected',
        rejectionReason,
        approvedBy: rejectedBy,
        approvedAt: null,
      },
    });
  },

  async delete(id: number) {
    if (!prisma) throw new Error('Database non configurato.');
    return prisma.productCandidate.delete({
      where: { id },
    });
  },
};

