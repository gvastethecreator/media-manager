import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import { prompts } from '../schema';
import { seedLogger } from './index';

/**
 * Siembra prompts minimalistas para verificación del sistema
 */
export async function seedPrompts(db: LibSQLDatabase<Record<string, never>>) {
  seedLogger.info('🔮 Creando prompts de prueba...');

  try {
    const samplePrompts = [
      {
        id: 'prompt-1',
        name: 'Paisaje Fantástico',
        description: 'Prompt para generar paisajes de fantasía',
        emoji: '🏔️',
        color: '#10b981',
        category: 'paisaje',
        isPublic: true,
        isFavorite: true,
        totalImages: 0,
        totalVideos: 0,
        type: 'generativo',
        content: 'Un paisaje montañoso con castillo flotante, cielo púrpura, iluminación mágica',
        parameters: 'style: fantasy, quality: high, aspect: 16:9',
        style: 'fantasy art',
        mood: 'místico',
        lighting: 'mágica',
        composition: 'panorámica',
        technique: 'digital painting',
        inspiration: 'Studio Ghibli',
        notes: 'Ideal para fondos épicos',
        featuredImage: null,
        parentId: null,
      },
      {
        id: 'prompt-2',
        name: 'Retrato Cyberpunk',
        description: 'Prompt para retratos estilo cyberpunk',
        emoji: '🤖',
        color: '#ef4444',
        category: 'retrato',
        isPublic: true,
        isFavorite: false,
        totalImages: 0,
        totalVideos: 0,
        type: 'generativo',
        content: 'Retrato futurista con implantes cibernéticos, neón azul y rosa',
        parameters: 'style: cyberpunk, quality: ultra, ratio: 1:1',
        style: 'cyberpunk',
        mood: 'futurista',
        lighting: 'neón',
        composition: 'primer plano',
        technique: '3D render',
        inspiration: 'Blade Runner',
        notes: 'Perfecto para personajes sci-fi',
        featuredImage: null,
        parentId: null,
      },
    ];

    await db.insert(prompts).values(samplePrompts);

    seedLogger.success(`✅ ${samplePrompts.length} prompts creados`);
  } catch (error) {
    seedLogger.error('❌ Error creando prompts:', error);
    throw error;
  }
}
