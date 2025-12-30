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
				id: '33333333-3333-4333-a333-333333333331',
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
				id: '33333333-3333-4333-a333-333333333332',
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
			{
				id: '33333333-3333-4333-a333-333333333333',
				name: 'Guerrera del Norte',
				description: 'Luchadora feroz con honor inquebrantable',
				emoji: '⚔️',
				color: '#ef4444',
				category: 'aliado',
				isPublic: true,
				isFavorite: true,
				totalImages: 0,
				totalVideos: 0,
				age: 'Adulto joven',
				gender: 'Femenino',
				species: 'Humano',
				occupation: 'Guerrera',
				personality: 'Feroz pero leal',
				background: 'Clan del Norte',
				relationships: null,
				skills: 'Combate cuerpo a cuerpo, supervivencia',
				equipment: 'Hacha de batalla, armadura de cuero',
				notes: 'Experta en combate invernal',
				featuredImage: null,
				parentId: null,
			},
			{
				id: '33333333-3333-4333-a333-333333333334',
				name: 'Inventor Excéntrico',
				description: 'Genio creador de artefactos mágico-tecnológicos',
				emoji: '🔧',
				color: '#f59e0b',
				category: 'neutral',
				isPublic: true,
				isFavorite: false,
				totalImages: 0,
				totalVideos: 0,
				age: 'Mediana edad',
				gender: 'No binario',
				species: 'Humano',
				occupation: 'Inventor',
				personality: 'Curioso y distraído',
				background: 'Academia de Ingeniería',
				relationships: null,
				skills: 'Ingeniería, alquimia, mecánica',
				equipment: 'Herramientas, gafas de aumento, guantes',
				notes: 'Crea gadgets únicos',
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
