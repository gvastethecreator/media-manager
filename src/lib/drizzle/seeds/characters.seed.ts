import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import { generateReadableId } from '@/lib/utils/id-generator';
import { characters } from '../schema';
import { seedLogger } from './index';

/**
 * Siembra personajes con IDs legibles
 * Formato: char-nombre-01, char-nombre-02, etc.
 */
export async function seedCharacters(db: LibSQLDatabase<Record<string, never>>) {
	seedLogger.info('🎭 Creando personajes de prueba...');

	try {
		const sampleCharacters = [
			{
				id: generateReadableId('character', 'Heroe Principal', 1),
				name: 'Héroe Principal',
				description: 'Protagonista de la historia',
				notes: 'Valiente y decidido',
				personality: 'Valiente, determinado, altruista',
				isFavorite: true,
				category: 'principal',
				parentId: null,
			},
			{
				id: generateReadableId('character', 'Mentor Sabio', 1),
				name: 'Mentor Sabio',
				description: 'Guía del héroe en su viaje',
				notes: 'Posee conocimientos antiguos',
				personality: 'Sabio, paciente, enigmático',
				isFavorite: false,
				category: 'apoyo',
				parentId: null,
			},
			{
				id: generateReadableId('character', 'Villano Oscuro', 1),
				name: 'Villano Oscuro',
				description: 'Antagonista principal',
				notes: 'Maestro de las sombras',
				personality: 'Calculador, ambicioso, despiadado',
				isFavorite: true,
				category: 'antagonista',
				parentId: null,
			},
			{
				id: generateReadableId('character', 'Aliado Comico', 1),
				name: 'Aliado Cómico',
				description: 'Alivio cómico de la historia',
				notes: 'Siempre tiene un chiste listo',
				personality: 'Gracioso, leal, optimista',
				isFavorite: false,
				category: 'apoyo',
				parentId: null,
			},
		];

		await db.insert(characters).values(sampleCharacters);

		seedLogger.success(`✅ ${sampleCharacters.length} personajes creados`);
	} catch (error) {
		seedLogger.error('❌ Error creando personajes:', error);
		throw error;
	}
}
