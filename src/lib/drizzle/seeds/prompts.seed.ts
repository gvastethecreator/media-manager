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
				description: 'Prompt for generating fantasy landscapes',
				content: 'Un paisaje montañoso con castillo flotante, cielo púrpura, iluminación mágica',
				emoji: '🏔️',
				color: '#22c55e',
				category: 'paisaje',
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
				type: 'generativo',
				notes: 'Perfecto para personajes sci-fi',
				parentId: null,
			},
			{
				id: generateReadableId('prompt', 'Criatura Mitica', 1),
				name: 'Criatura Mítica',
				description: 'Prompt for creating fantasy creatures',
				content: 'Dragón majestuoso con escamas iridiscentes, alas de cristal, ojos brillantes',
				emoji: '🐉',
				color: '#a855f7',
				category: 'criatura',
				type: 'generativo',
				notes: 'Ideal para concept art de criaturas',
				parentId: null,
			},
			{
				id: generateReadableId('prompt', 'Arquitectura Art Deco', 1),
				name: 'Arquitectura Art Deco',
				description: 'Buildings with a 1920s Art Deco aesthetic',
				content: 'Rascacielos art deco dorado, líneas geométricas, ornamentos metálicos',
				emoji: '🏙️',
				color: '#f59e0b',
				category: 'arquitectura',
				type: 'generativo',
				notes: 'Perfecto para escenarios retrofuturistas',
				parentId: null,
			},
		];

		await db.insert(prompts).values(samplePrompts);

		seedLogger.success(`✅ ${samplePrompts.length} prompts creados`);
	} catch (error) {
		seedLogger.error('❌ Could not create prompts:', error);
		throw error;
	}
}
