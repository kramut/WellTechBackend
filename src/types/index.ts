// Types will be available after Prisma Client generation
// export type { Product, Article, Video, AffiliateEarning } from '@prisma/client';

export interface CreateProductInput {
  name: string;
  category: string;
  description?: string;
  price?: number;
  affiliateLink: string;
  affiliateProgram?: string;
  commissionPercentage?: number;
  imageUrl?: string;
}

export interface UpdateProductInput {
  name?: string;
  category?: string;
  description?: string;
  price?: number;
  affiliateLink?: string;
  affiliateProgram?: string;
  commissionPercentage?: number;
  imageUrl?: string;
}

export interface CreateArticleInput {
  title: string;
  slug: string;
  category: string;
  content: string;
  seoMetaTitle?: string;
  seoMetaDescription?: string;
  featuredImageUrl?: string;
  productIds?: number[];
  publishedAt?: Date;
}

export interface UpdateArticleInput {
  title?: string;
  slug?: string;
  category?: string;
  content?: string;
  seoMetaTitle?: string;
  seoMetaDescription?: string;
  featuredImageUrl?: string;
  productIds?: number[];
  publishedAt?: Date;
}

export interface CreateVideoInput {
  title: string;
  articleId?: number;
  script: string;
  videoUrl?: string;
  tiktokUrl?: string;
}

export interface UpdateVideoInput {
  title?: string;
  articleId?: number;
  script?: string;
  videoUrl?: string;
  tiktokUrl?: string;
  tiktokViews?: number;
}

export interface CreateAffiliateEarningInput {
  productId: number;
  clicks?: number;
  conversions?: number;
  revenue?: number;
}

export interface UpdateAffiliateEarningInput {
  clicks?: number;
  conversions?: number;
  revenue?: number;
}

export interface CreateProductCandidateInput {
  name: string;
  category: string;
  description?: string;
  price?: number;
  affiliateLink: string;
  affiliateProgram: string; // "awin", "clickbank", "amazon"
  commissionPercentage?: number;
  imageUrl?: string;
  rating?: number;
  reviewCount?: number;
  source: string; // "awin", "clickbank", etc.
  sourceId?: string; // ID nel sistema sorgente
  metadata?: Record<string, any>;
}

export interface UpdateProductCandidateInput {
  name?: string;
  category?: string;
  description?: string;
  price?: number;
  affiliateLink?: string;
  affiliateProgram?: string;
  commissionPercentage?: number;
  imageUrl?: string;
  rating?: number;
  reviewCount?: number;
  source?: string;
  sourceId?: string;
  status?: string; // "pending", "approved", "rejected"
  rejectionReason?: string;
  approvedAt?: Date;
  approvedBy?: string;
  metadata?: Record<string, any>;
}

