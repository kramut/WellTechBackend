import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

// Category → Goals mapping (same as contentPopulationService)
const INITIAL_PATHS = [
  {
    goalId: 'feel-better',
    title: 'Il Tuo Percorso verso il Benessere Completo',
    description: 'Un percorso olistico di 4 settimane per migliorare energia, umore e vitalità.',
    estimatedDuration: '4 settimane',
    color: 'sage',
    steps: [
      { order: 1, title: 'Fondamenta: Sonno e Riposo', description: 'Il sonno è la base di tutto.', articles: [], products: [], icon: '😴' },
      { order: 2, title: 'Nutrizione Consapevole', description: 'Alimenta il tuo corpo con i nutrienti giusti.', articles: [], products: [], icon: '🥗' },
      { order: 3, title: 'Movimento e Vitalità', description: 'Riscopri il piacere del movimento.', articles: [], products: [], icon: '💪' },
      { order: 4, title: 'Equilibrio Mentale', description: 'Coltiva la pace interiore.', articles: [], products: [], icon: '🧘' },
    ],
  },
  {
    goalId: 'make-money',
    title: 'Il Tuo Percorso verso l\'Indipendenza Finanziaria',
    description: 'Un percorso strutturato per costruire ricchezza attraverso investimenti e strategie di crescita.',
    estimatedDuration: '3-6 mesi',
    color: 'gold',
    steps: [
      { order: 1, title: 'Fondamenta Finanziarie', description: 'Impara i concetti base degli investimenti.', articles: [], products: [], icon: '📚' },
      { order: 2, title: 'Strategia e Risparmio', description: 'Scopri come raggiungere l\'indipendenza finanziaria.', articles: [], products: [], icon: '🔥' },
      { order: 3, title: 'Entrate Aggiuntive', description: 'Crea entrate aggiuntive online.', articles: [], products: [], icon: '💼' },
    ],
  },
  {
    goalId: 'find-motivation',
    title: 'Il Tuo Percorso per Ritrovare la Motivazione',
    description: 'Riscopri la tua spinta interiore attraverso mindset, produttività e abitudini.',
    estimatedDuration: '3 settimane',
    color: 'orange',
    steps: [
      { order: 1, title: 'Growth Mindset', description: 'Sviluppa una mentalità di crescita.', articles: [], products: [], icon: '🌱' },
      { order: 2, title: 'Energia e Vitalità', description: 'Aumenta la tua energia.', articles: [], products: [], icon: '⚡' },
      { order: 3, title: 'Sistemi di Produttività', description: 'Implementa sistemi per mantenere il focus.', articles: [], products: [], icon: '📊' },
    ],
  },
  {
    goalId: 'inner-peace',
    title: 'Il Tuo Percorso verso la Pace Interiore',
    description: 'Un viaggio di consapevolezza per trovare equilibrio e serenità.',
    estimatedDuration: '4 settimane',
    color: 'teal',
    steps: [
      { order: 1, title: 'Meditazione e Mindfulness', description: 'Impara le basi della meditazione.', articles: [], products: [], icon: '🧘' },
      { order: 2, title: 'Gestione dello Stress', description: 'Tecniche per ridurre ansia e tensioni.', articles: [], products: [], icon: '🌊' },
      { order: 3, title: 'Routine di Benessere', description: 'Crea abitudini che nutrono la pace interiore.', articles: [], products: [], icon: '✨' },
    ],
  },
  {
    goalId: 'detox-physical',
    title: 'Il Tuo Percorso di Depurazione Fisica',
    description: 'Pulisci il tuo corpo dalle tossine attraverso nutrizione e abitudini salutari.',
    estimatedDuration: '2-3 settimane',
    color: 'sage',
    steps: [
      { order: 1, title: 'Nutrizione Pulita', description: 'Integra alimenti ricchi di nutrienti.', articles: [], products: [], icon: '🌱' },
      { order: 2, title: 'Digestione Ottimale', description: 'Supporta il tuo sistema digestivo.', articles: [], products: [], icon: '🫶' },
      { order: 3, title: 'Movimento e Sudore', description: 'Attiva la circolazione.', articles: [], products: [], icon: '💦' },
    ],
  },
  {
    goalId: 'detox-mental',
    title: 'Il Tuo Percorso di Depurazione Mentale',
    description: 'Libera la mente da stress e pensieri tossici.',
    estimatedDuration: '3 settimane',
    color: 'teal',
    steps: [
      { order: 1, title: 'Digital Minimalism', description: 'Riduci le distrazioni digitali.', articles: [], products: [], icon: '📵' },
      { order: 2, title: 'Meditazione', description: 'Calma la mente.', articles: [], products: [], icon: '🧘' },
      { order: 3, title: 'Gestione dello Stress', description: 'Gestisci ansia e tensioni.', articles: [], products: [], icon: '🌊' },
    ],
  },
  {
    goalId: 'energy',
    title: 'Il Tuo Percorso verso Più Energia',
    description: 'Aumenta la tua vitalità attraverso nutrizione, movimento e abitudini energetiche.',
    estimatedDuration: '3 settimane',
    color: 'orange',
    steps: [
      { order: 1, title: 'Nutrizione Energetica', description: 'Alimenta il corpo con nutrienti energetici.', articles: [], products: [], icon: '⚡' },
      { order: 2, title: 'Routine Mattutina', description: 'Inizia la giornata con energia.', articles: [], products: [], icon: '🌅' },
      { order: 3, title: 'Movimento Regolare', description: 'Attiva il corpo con allenamenti.', articles: [], products: [], icon: '💪' },
    ],
  },
  {
    goalId: 'focus',
    title: 'Il Tuo Percorso verso la Concentrazione Profonda',
    description: 'Sviluppa la capacità di concentrarti senza distrazioni.',
    estimatedDuration: '3 settimane',
    color: 'teal',
    steps: [
      { order: 1, title: 'Deep Work', description: 'L\'arte della concentrazione profonda.', articles: [], products: [], icon: '🎯' },
      { order: 2, title: 'Time Blocking', description: 'Organizza il tempo in blocchi.', articles: [], products: [], icon: '⏰' },
      { order: 3, title: 'Digital Minimalism', description: 'Elimina le distrazioni.', articles: [], products: [], icon: '📵' },
    ],
  },
  {
    goalId: 'sleep',
    title: 'Il Tuo Percorso verso un Sonno di Qualità',
    description: 'Ottimizza il tuo riposo per svegliarti pieno di energia.',
    estimatedDuration: '2 settimane',
    color: 'sage',
    steps: [
      { order: 1, title: 'Fondamenta del Sonno', description: 'Le basi per un sonno riposante.', articles: [], products: [], icon: '😴' },
      { order: 2, title: 'Routine Serale', description: 'Prepara mente e corpo al riposo.', articles: [], products: [], icon: '🌙' },
      { order: 3, title: 'Gestione dello Stress', description: 'Riduci tensioni che interferiscono col sonno.', articles: [], products: [], icon: '🧘' },
    ],
  },
  {
    goalId: 'fitness',
    title: 'Il Tuo Percorso verso la Forma Fisica',
    description: 'Costruisci forza, resistenza e benessere attraverso allenamenti mirati.',
    estimatedDuration: '6-8 settimane',
    color: 'orange',
    steps: [
      { order: 1, title: 'Fondamenta dell\'Allenamento', description: 'Inizia con home workout.', articles: [], products: [], icon: '🏋️' },
      { order: 2, title: 'Nutrizione per la Performance', description: 'Alimenta i tuoi muscoli.', articles: [], products: [], icon: '🥗' },
      { order: 3, title: 'Recupero e Ottimizzazione', description: 'Massimizza i risultati.', articles: [], products: [], icon: '💆' },
      { order: 4, title: 'Allenamento Avanzato', description: 'Progredisci con HIIT.', articles: [], products: [], icon: '🔥' },
    ],
  },
  {
    goalId: 'sustainability',
    title: 'Il Tuo Percorso verso la Sostenibilità',
    description: 'Riduci il tuo impatto ambientale attraverso energia rinnovabile e scelte sostenibili.',
    estimatedDuration: '2-4 mesi',
    color: 'sage',
    steps: [
      { order: 1, title: 'Consapevolezza e Impatto', description: 'Comprendi il tuo impatto ambientale.', articles: [], products: [], icon: '🌍' },
      { order: 2, title: 'Energia Rinnovabile', description: 'Investi nel fotovoltaico.', articles: [], products: [], icon: '☀️' },
      { order: 3, title: 'Stile di Vita Sostenibile', description: 'Abitudini quotidiane green.', articles: [], products: [], icon: '🌿' },
    ],
  },
  {
    goalId: 'sexual-wellbeing',
    title: 'Il Tuo Percorso verso il Benessere Sessuale',
    description: 'Migliora vitalità sessuale, performance e intimità.',
    estimatedDuration: '6-8 settimane',
    color: 'orange',
    steps: [
      { order: 1, title: 'Consapevolezza e Fondamenta', description: 'Comprendi i fattori del benessere sessuale.', articles: [], products: [], icon: '💑' },
      { order: 2, title: 'Energia e Vitalità', description: 'Aumenta energia per la performance.', articles: [], products: [], icon: '⚡' },
      { order: 3, title: 'Intimità e Comunicazione', description: 'Coltiva connessione con il partner.', articles: [], products: [], icon: '💕' },
    ],
  },
];

const INITIAL_GUIDES = [
  { title: 'Guida al Benessere Completo', slug: 'guida-benessere-completo', description: 'Scopri i migliori prodotti e strategie per il tuo benessere olistico.', category: 'Wellbeing', duration: '4 settimane', difficulty: 'Facile', imageUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&h=600&fit=crop' },
  { title: 'Guida alla Nutrizione Ottimale', slug: 'guida-nutrizione-ottimale', description: 'I migliori integratori e superfoods per energia e salute.', category: 'Nutrition', duration: '30 giorni', difficulty: 'Facile', imageUrl: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&h=600&fit=crop' },
  { title: 'Guida al Fitness e Performance', slug: 'guida-fitness-performance', description: 'Attrezzi, integratori e programmi per allenarti efficacemente.', category: 'Fitness', duration: '8 settimane', difficulty: 'Media', imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop' },
  { title: 'Guida alla Crescita Mentale', slug: 'guida-crescita-mentale', description: 'Strumenti e risorse per sviluppare una mentalità di crescita.', category: 'Mindset', duration: '21 giorni', difficulty: 'Media', imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=600&fit=crop' },
  { title: 'Guida alla Produttività Personale', slug: 'guida-produttivita-personale', description: 'Sistemi e metodi per massimizzare la tua produttività.', category: 'Productivity', duration: '14 giorni', difficulty: 'Media', imageUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=600&fit=crop' },
  { title: 'Guida alla Crescita Finanziaria', slug: 'guida-crescita-finanziaria', description: 'Corsi e strumenti per investire e costruire indipendenza finanziaria.', category: 'Wealth', duration: '4 settimane', difficulty: 'Media', imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop' },
];

export const seedController = {
  /**
   * POST /api/seed - Populate initial paths, guides, and wizard data
   */
  async seedAll(req: Request, res: Response) {
    try {
      if (!prisma) return res.status(503).json({ error: 'Database not configured' });

      const results = {
        paths: 0,
        guides: 0,
        wizard: 0,
      };

      // Seed paths
      for (const path of INITIAL_PATHS) {
        const existing = await prisma.pathJourney.findUnique({ where: { goalId: path.goalId } });
        if (!existing) {
          await prisma.pathJourney.create({ data: path });
          results.paths++;
        }
      }

      // Seed guides
      for (const guide of INITIAL_GUIDES) {
        const existing = await prisma.guide.findUnique({ where: { slug: guide.slug } });
        if (!existing) {
          await prisma.guide.create({
            data: {
              ...guide,
              articleIds: [],
              productIds: [],
              publishedAt: new Date(),
            },
          });
          results.guides++;
        }
      }

      // Seed wizard recommendations (one per category)
      for (const guide of INITIAL_GUIDES) {
        const existing = await prisma.wizardRecommendation.findUnique({ where: { category: guide.category } });
        if (!existing) {
          await prisma.wizardRecommendation.create({
            data: {
              category: guide.category,
              productIds: [],
              articleIds: [],
              guideIds: [],
            },
          });
          results.wizard++;
        }
      }

      res.json({
        success: true,
        message: `Seeded: ${results.paths} paths, ${results.guides} guides, ${results.wizard} wizard categories`,
        results,
      });
    } catch (error) {
      console.error('Error seeding data:', error);
      res.status(500).json({ error: 'Failed to seed data' });
    }
  },
};
