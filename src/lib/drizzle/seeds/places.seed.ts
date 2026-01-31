import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import { generateReadableId } from '@/lib/utils/id-generator';
import { places } from '../schema';
import { seedLogger } from './index';

/**
 * Siembra lugares con IDs legibles
 * Formato: place-nombre-01, place-nombre-02, etc.
 *
 * NOTA: Los colores hex en este archivo son datos de prueba para inicializar la DB.
 * No se usan directamente en la UI de producción - la UI usa tokens CSS
 * definidos en src/styles/tokens.css y src/styles/design-tokens.css.
 */
export async function seedPlaces(db: LibSQLDatabase<Record<string, never>>) {
	seedLogger.info('📍 Creando lugares de prueba...');

	try {
		const samplePlaces = [
			{
				id: generateReadableId('place', 'Ciudad Central', 1),
				name: 'Ciudad Central',
				description: 'Centro neurálgico del mundo',
				emoji: '🏙️',
				color: '#3b82f6',
				category: 'ciudad',
				isFavorite: true,
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
				parentId: null,
			},
			{
				id: generateReadableId('place', 'Bosque Antiguo', 1),
				name: 'Bosque Antiguo',
				description: 'Bosque místico y extenso',
				emoji: '🌲',
				color: '#22c55e',
				category: 'naturaleza',
				isFavorite: false,
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
				parentId: null,
			},
			{
				id: generateReadableId('place', 'Fortaleza Costera', 1),
				name: 'Fortaleza Costera',
				description: 'Castillo defensivo frente al mar',
				emoji: '🏰',
				color: '#64748b',
				category: 'construcción',
				isFavorite: true,
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
				parentId: null,
			},
			{
				id: generateReadableId('place', 'Ruinas Templo Solar', 1),
				name: 'Ruinas del Templo Solar',
				description: 'Restos de un templo dedicado al sol',
				emoji: '🏛️',
				color: '#f59e0b',
				category: 'ruinas',
				isFavorite: false,
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
