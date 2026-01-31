import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import { generateReadableId } from '@/lib/utils/id-generator';
import { prompts } from '../schema';
import { seedLogger } from './index';

/**
 * Siembra prompts con IDs legibles
 * Formato: prmpt-nombre-01, prmpt-nombre-02, etc.
 *
 * NOTA: Los colores hex en este archivo son datos de prueba para inicializar la DB.
 * No se usan directamente en la UI de producción - la UI usa tokens CSS
 * definidos en src/styles/tokens.css y src/styles/design-tokens.css.
 */
export async function seedPrompts(db: LibSQLDatabase<Record<string, never>>) {
	seedLogger.info('🔮 Creando prompts de prueba...');

	try {
		const samplePrompts = [
			{
				id: generateReadableId('prompt', 'Paisaje Fantastico', 1),
				name: 'Paisaje Fantástico',
				description: 'Prompt para generar paisajes de fantasía',
				content: 'Un paisaje montañoso con castillo flotante, cielo púrpura, iluminación mágica',
				emoji: '🏔️',
				color: '#22c55e',
				category: 'paisaje',
				isFavorite: true,
				type: 'generativo',
				notes: 'Ideal para fondos épicos',
				parentId: null,
			},
			{
				id: generateReadableId('prompt', 'Retrato Cyberpunk', 1),
				name: 'Retrato Cyberpunk',
				description: 'Prompt para retratos estilo cyberpunk',
				content: 'Retrato futurista con implantes cibernéticos, neón azul y rosa',
				emoji: '🤖',
				color: '#ef4444',
				category: 'retrato',
				isFavorite: false,
				type: 'generativo',
				notes: 'Perfecto para personajes sci-fi',
				parentId: null,
			},
			{
				id: generateReadableId('prompt', 'Criatura Mitica', 1),
				name: 'Criatura Mítica',
				description: 'Prompt para crear criaturas de fantasía',
				content: 'Dragón majestuoso con escamas iridiscentes, alas de cristal, ojos brillantes',
				emoji: '🐉',
				color: '#a855f7',
				category: 'criatura',
				isFavorite: true,
				type: 'generativo',
				notes: 'Ideal para concept art de criaturas',
				parentId: null,
			},
			{
				id: generateReadableId('prompt', 'Arquitectura Art Deco', 1),
				name: 'Arquitectura Art Deco',
				description: 'Edificios con estética art deco de los años 20',
				content: 'Rascacielos art deco dorado, líneas geométricas, ornamentos metálicos',
				emoji: '🏙️',
				color: '#f59e0b',
				category: 'arquitectura',
				isFavorite: false,
				type: 'generativo',
				notes: 'Perfecto para escenarios retrofuturistas',
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
