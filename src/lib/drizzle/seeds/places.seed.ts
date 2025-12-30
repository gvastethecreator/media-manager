import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import { places } from '../schema';
import { seedLogger } from './index';

/**
 * Siembra lugares minimalistas para verificación del sistema
 */
export async function seedPlaces(db: LibSQLDatabase<Record<string, never>>) {
	seedLogger.info('📍 Creando lugares de prueba...');

	try {
		const samplePlaces = [
			{
				id: '77777777-7777-4777-a777-777777777771',
				name: 'Ciudad Central',
				description: 'Centro neurálgico del mundo',
				emoji: '🏙️',
				color: '#3b82f6',
				category: 'ciudad',
				isPublic: true,
				isFavorite: true,
				totalImages: 0,
				totalVideos: 0,
				type: 'urbano',
				location: 'Lat:0,Long:0',
				climate: 'templado',
				population: '1M',
				government: 'República',
				economy: 'Tecnológica',
				culture: 'Cosmopolita',
				history: 'Fundada hace 200 años',
				geography: 'Llanura',
				landmarks: 'Torre Central',
				dangers: 'Baja',
				resources: 'Alta',
				notes: 'Lugar principal para pruebas',
				featuredImage: null,
				parentId: null,
			},
			{
				id: '77777777-7777-4777-a777-777777777772',
				name: 'Bosque Antiguo',
				description: 'Bosque místico y extenso',
				emoji: '🌲',
				color: '#10b981',
				category: 'naturaleza',
				isPublic: false,
				isFavorite: false,
				totalImages: 0,
				totalVideos: 0,
				type: 'bosque',
				location: 'Lat:10,Long:10',
				climate: 'húmedo',
				population: 'Deshabitado',
				government: null,
				economy: null,
				culture: null,
				history: 'Antiguo como el mundo',
				geography: 'Boscoso',
				landmarks: 'Árbol Sagrado',
				dangers: 'Media',
				resources: 'Madera',
				notes: 'Ideal para pruebas de naturaleza',
				featuredImage: null,
				parentId: null,
			},
			{
				id: '77777777-7777-4777-a777-777777777773',
				name: 'Fortaleza Costera',
				description: 'Castillo defensivo frente al mar',
				emoji: '🏰',
				color: '#64748b',
				category: 'construcción',
				isPublic: true,
				isFavorite: true,
				totalImages: 0,
				totalVideos: 0,
				type: 'fortaleza',
				location: 'Lat:25,Long:-15',
				climate: 'marítimo',
				population: '500',
				government: 'Militar',
				economy: 'Pesca y comercio',
				culture: 'Marítima',
				history: 'Construida para defender la costa',
				geography: 'Acantilados',
				landmarks: 'Faro del Norte, Muelle Principal',
				dangers: 'Baja',
				resources: 'Pesca, sal',
				notes: 'Punto estratégico de defensa',
				featuredImage: null,
				parentId: null,
			},
			{
				id: '77777777-7777-4777-a777-777777777774',
				name: 'Ruinas del Templo Solar',
				description: 'Restos de un templo dedicado al sol',
				emoji: '🏛️',
				color: '#f59e0b',
				category: 'ruinas',
				isPublic: true,
				isFavorite: false,
				totalImages: 0,
				totalVideos: 0,
				type: 'templo',
				location: 'Lat:35,Long:40',
				climate: 'desértico',
				population: 'Deshabitado',
				government: null,
				economy: null,
				culture: 'Antigua civilización solar',
				history: 'Centro ceremonial de hace 1000 años',
				geography: 'Montañas desérticas',
				landmarks: 'Obelisco Central, Cámara de los Espejos',
				dangers: 'Alta (trampas antiguas)',
				resources: 'Artefactos, oro',
				notes: 'Se dice que guarda secretos mágicos',
				featuredImage: null,
				parentId: null,
			},
		];

		await db.insert(places).values(samplePlaces);

		seedLogger.success(`✅ ${samplePlaces.length} lugares creados`);
	} catch (error) {
		seedLogger.error('❌ Error creando lugares:', error);
		throw error;
	}
}
