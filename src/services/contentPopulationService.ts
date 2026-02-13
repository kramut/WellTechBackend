/**
 * Content Population Service
 * Automatically populates Guides, Paths, and Wizard recommendations
 * when a product is approved.
 */
import { prisma } from '../lib/prisma';

// Category → Goals mapping for path matching
const CATEGORY_GOAL_MAP: Record<string, string[]> = {
  'Wellbeing': ['feel-better', 'inner-peace', 'sleep', 'energy'],
  'Nutrition': ['feel-better', 'energy', 'detox-physical', 'fitness'],
  'Fitness': ['fitness', 'energy', 'feel-better'],
  'Mindset': ['find-motivation', 'inner-peace', 'detox-mental', 'focus'],
  'Productivity': ['focus', 'find-motivation'],
  'Wealth': ['make-money', 'sustainability'],
  'Sexual Wellbeing': ['sexual-wellbeing', 'feel-better', 'energy'],
  'Sustainability': ['sustainability'],
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[àáâãäå]/g, 'a')
    .replace(/[èéêë]/g, 'e')
    .replace(/[ìíîï]/g, 'i')
    .replace(/[òóôõö]/g, 'o')
    .replace(/[ùúûü]/g, 'u')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// Default guide templates per category
const GUIDE_TEMPLATES: Record<string, { title: string; description: string; duration: string; difficulty: string; imageUrl: string }> = {
  'Wellbeing': {
    title: 'Guida al Benessere Completo',
    description: 'Scopri i migliori prodotti e strategie per il tuo benessere olistico. Una selezione curata di integratori, strumenti e risorse.',
    duration: '4 settimane',
    difficulty: 'Facile',
    imageUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&h=600&fit=crop',
  },
  'Nutrition': {
    title: 'Guida alla Nutrizione Ottimale',
    description: 'I migliori integratori e superfoods per supportare energia, digestione e salute generale. Selezione basata su evidenze scientifiche.',
    duration: '30 giorni',
    difficulty: 'Facile',
    imageUrl: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&h=600&fit=crop',
  },
  'Fitness': {
    title: 'Guida al Fitness e Performance',
    description: 'Attrezzi, integratori e programmi per allenarti efficacemente e raggiungere i tuoi obiettivi fisici.',
    duration: '8 settimane',
    difficulty: 'Media',
    imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop',
  },
  'Mindset': {
    title: 'Guida alla Crescita Mentale',
    description: 'Strumenti, libri e risorse per sviluppare una mentalità di crescita e gestire lo stress efficacemente.',
    duration: '21 giorni',
    difficulty: 'Media',
    imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=600&fit=crop',
  },
  'Productivity': {
    title: 'Guida alla Produttività Personale',
    description: 'Sistemi, strumenti e metodi per massimizzare la tua produttività e raggiungere i tuoi obiettivi.',
    duration: '14 giorni',
    difficulty: 'Media',
    imageUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=600&fit=crop',
  },
  'Wealth': {
    title: 'Guida alla Crescita Finanziaria',
    description: 'Corsi, libri e strumenti per investire, risparmiare e costruire la tua indipendenza finanziaria.',
    duration: '4 settimane',
    difficulty: 'Media',
    imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop',
  },
};

export const contentPopulationService = {
  /**
   * Main entry point: called after product approval
   * Automatically updates Guide, Paths, and Wizard for the product's category
   */
  async onProductApproved(params: {
    productId: number;
    articleId: number | null;
    category: string;
    productName: string;
  }): Promise<{ guide: any; paths: number; wizard: any }> {
    if (!prisma) throw new Error('Database not configured');

    const { productId, articleId, category, productName } = params;
    console.log(`🔄 Auto-populating content for "${productName}" [${category}]...`);

    // 1. Update or create Guide for this category
    const guide = await this.upsertGuideForCategory(category, productId, articleId);
    console.log(`  ✅ Guide "${guide.title}" updated (${guide.productIds.length} products)`);

    // 2. Update Paths that match this category
    const pathsUpdated = await this.updatePathsForCategory(category, productId, articleId);
    console.log(`  ✅ ${pathsUpdated} paths updated`);

    // 3. Update Wizard recommendations for this category
    const wizard = await this.upsertWizardRecommendation(category, productId, articleId, guide.id);
    console.log(`  ✅ Wizard recommendations updated for "${category}"`);

    return { guide, paths: pathsUpdated, wizard };
  },

  /**
   * Find or create guide for a category, add product + article
   */
  async upsertGuideForCategory(
    category: string,
    productId: number,
    articleId: number | null
  ) {
    if (!prisma) throw new Error('Database not configured');

    const existing = await prisma.guide.findFirst({
      where: { category },
    });

    if (existing) {
      // Add product and article if not already present
      const newProductIds = existing.productIds.includes(productId)
        ? existing.productIds
        : [...existing.productIds, productId];

      const newArticleIds = articleId && !existing.articleIds.includes(articleId)
        ? [...existing.articleIds, articleId]
        : existing.articleIds;

      return prisma.guide.update({
        where: { id: existing.id },
        data: {
          productIds: newProductIds,
          articleIds: newArticleIds,
          publishedAt: existing.publishedAt || new Date(),
        },
      });
    }

    // Create new guide from template
    const template = GUIDE_TEMPLATES[category] || {
      title: `Guida ${category}`,
      description: `I migliori prodotti e risorse nella categoria ${category}.`,
      duration: '2 settimane',
      difficulty: 'Media',
      imageUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&h=600&fit=crop',
    };

    return prisma.guide.create({
      data: {
        title: template.title,
        slug: slugify(template.title),
        description: template.description,
        category,
        duration: template.duration,
        difficulty: template.difficulty,
        imageUrl: template.imageUrl,
        productIds: [productId],
        articleIds: articleId ? [articleId] : [],
        publishedAt: new Date(),
      },
    });
  },

  /**
   * Update paths (journeys) that match the product's category
   */
  async updatePathsForCategory(
    category: string,
    productId: number,
    articleId: number | null
  ): Promise<number> {
    if (!prisma) throw new Error('Database not configured');

    const goalIds = CATEGORY_GOAL_MAP[category] || [];
    if (goalIds.length === 0) return 0;

    let updated = 0;
    for (const goalId of goalIds) {
      const path = await prisma.pathJourney.findUnique({
        where: { goalId },
      });

      if (path) {
        const steps = path.steps as any[];
        // Find the most relevant step (last one or one matching category keywords)
        const lastStep = steps[steps.length - 1];
        if (lastStep) {
          // Add product/article to the last step if not already there
          const stepProducts: number[] = lastStep.products || [];
          const stepArticles: number[] = lastStep.articles || [];

          if (!stepProducts.includes(productId)) {
            stepProducts.push(productId);
          }
          if (articleId && !stepArticles.includes(articleId)) {
            stepArticles.push(articleId);
          }

          lastStep.products = stepProducts;
          lastStep.articles = stepArticles;

          await prisma.pathJourney.update({
            where: { goalId },
            data: { steps },
          });
          updated++;
        }
      }
    }

    return updated;
  },

  /**
   * Update wizard recommendations for this category
   */
  async upsertWizardRecommendation(
    category: string,
    productId: number,
    articleId: number | null,
    guideId: number
  ) {
    if (!prisma) throw new Error('Database not configured');

    const existing = await prisma.wizardRecommendation.findUnique({
      where: { category },
    });

    if (existing) {
      const newProductIds = existing.productIds.includes(productId)
        ? existing.productIds
        : [...existing.productIds, productId];

      const newArticleIds = articleId && !existing.articleIds.includes(articleId)
        ? [...existing.articleIds, articleId]
        : existing.articleIds;

      const newGuideIds = existing.guideIds.includes(guideId)
        ? existing.guideIds
        : [...existing.guideIds, guideId];

      return prisma.wizardRecommendation.update({
        where: { category },
        data: {
          productIds: newProductIds,
          articleIds: newArticleIds,
          guideIds: newGuideIds,
        },
      });
    }

    return prisma.wizardRecommendation.create({
      data: {
        category,
        productIds: [productId],
        articleIds: articleId ? [articleId] : [],
        guideIds: [guideId],
      },
    });
  },

  /**
   * Seed initial paths from frontend hardcoded data
   */
  async seedPaths(paths: Array<{
    goalId: string;
    title: string;
    description: string;
    estimatedDuration: string;
    color: string;
    steps: any[];
  }>): Promise<number> {
    if (!prisma) throw new Error('Database not configured');

    let created = 0;
    for (const path of paths) {
      const existing = await prisma.pathJourney.findUnique({
        where: { goalId: path.goalId },
      });
      if (!existing) {
        await prisma.pathJourney.create({
          data: {
            goalId: path.goalId,
            title: path.title,
            description: path.description,
            estimatedDuration: path.estimatedDuration,
            color: path.color,
            steps: path.steps,
          },
        });
        created++;
      }
    }
    return created;
  },
};
