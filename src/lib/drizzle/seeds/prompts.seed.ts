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
				id: '99999999-9999-4999-a999-999999999991',
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
				id: '99999999-9999-4999-a999-999999999992',
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
			{
				id: '99999999-9999-4999-a999-999999999993',
				name: 'Criatura Mítica',
				description: 'Prompt para crear criaturas de fantasía',
				emoji: '🐉',
				color: '#8b5cf6',
				category: 'criatura',
				isPublic: true,
				isFavorite: true,
				totalImages: 0,
				totalVideos: 0,
				type: 'generativo',
				content: 'Dragón majestuoso con escamas iridiscentes, alas de cristal, ojos brillantes',
				parameters: 'style: fantasy, quality: masterpiece, detail: extreme',
				style: 'high fantasy',
				mood: 'majestuoso',
				lighting: 'dramática',
				composition: 'heroico',
				technique: 'digital painting',
				inspiration: 'Tolkien, D&D',
				notes: 'Ideal para concept art de criaturas',
				featuredImage: null,
				parentId: null,
			},
			{
				id: '99999999-9999-4999-a999-999999999994',
				name: 'Arquitectura Art Deco',
				description: 'Edificios con estética art deco de los años 20',
				emoji: '🏙️',
				color: '#f59e0b',
				category: 'arquitectura',
				isPublic: true,
				isFavorite: false,
				totalImages: 0,
				totalVideos: 0,
				type: 'generativo',
				content: 'Rascacielos art deco dorado, líneas geométricas, ornamentos metálicos',
				parameters: 'style: art deco, era: 1920s, quality: high',
				style: 'art deco',
				mood: 'elegante',
				lighting: 'atardecer dorado',
				composition: 'contrapicado',
				technique: '3D architectural',
				inspiration: 'Chrysler Building, Gatsby',
				notes: 'Perfecto para escenarios retrofuturistas',
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
