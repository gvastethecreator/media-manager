import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import { characters } from '../schema';
import { seedLogger } from './index';

/**
 * Siembra personajes minimalistas para verificación del sistema
 */
export async function seedCharacters(db: LibSQLDatabase<Record<string, never>>) {
	seedLogger.info('👤 Creando personajes de prueba...');

	try {
		const sampleCharacters = [
			{
				id: 'character-1',
				name: 'Héroe Principal',
				description: 'Protagonista principal de la historia',
				emoji: '🦸',
				color: '#3b82f6',
				category: 'protagonista',
				isPublic: true,
				isFavorite: true,
				totalImages: 0,
				totalVideos: 0,
				age: 'Adulto',
				gender: 'Neutro',
				species: 'Humano',
				occupation: 'Aventurero',
				personality: 'Valiente y decidido',
				background: 'Origen humilde',
				relationships: null,
				skills: 'Combat, liderazgo',
				equipment: 'Espada, escudo',
				notes: 'Personaje principal para pruebas',
				featuredImage: null,
				parentId: null,
			},
			{
				id: 'character-2',
				name: 'Compañero Mágico',
				description: 'Aliado con habilidades mágicas',
				emoji: '🧙',
				color: '#8b5cf6',
				category: 'aliado',
				isPublic: true,
				isFavorite: false,
				totalImages: 0,
				totalVideos: 0,
				age: 'Anciano',
				gender: 'Masculino',
				species: 'Mago',
				occupation: 'Hechicero',
				personality: 'Sabio y misterioso',
				background: 'Torre de magia',
				relationships: null,
				skills: 'Magia elemental',
				equipment: 'Bastón, túnica',
				notes: 'Mentor y guía',
				featuredImage: null,
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
