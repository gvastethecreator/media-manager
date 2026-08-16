import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import { generateReadableId } from '@/lib/utils/id-generator';
import { collections } from '../schema';
import { seedLogger } from './index';

/**
 * Siembra colecciones con IDs legibles
 * Formato: collection-nombre-01, collection-nombre-02, etc.
 *
 * NOTA: Los colores hex en este archivo son datos de prueba para inicializar la DB.
 * No se usan directamente en la UI de producción - la UI usa tokens CSS
 * definidos en src/styles/tokens.css y src/styles/design-tokens.css.
 */
export async function seedCollections(db: LibSQLDatabase<Record<string, never>>) {
	seedLogger.info('📚 Creando colecciones de prueba...');

	try {
		const sampleCollections = [
			{
				id: generateReadableId('collection', 'Biblioteca Principal', 1),
				name: 'Biblioteca Principal',
				description: 'Main resource collection',
				emoji: '📚',
				color: '#3b82f6',
				featuredImage: null,
				parentId: null,
			},
			{
				id: generateReadableId('collection', 'Archivo Personal', 1),
				name: 'Archivo Personal',
				description: 'Private personal collection',
				emoji: '🗃️',
				color: '#64748b',
				featuredImage: null,
				parentId: null,
			},
			{
				id: generateReadableId('collection', 'Referencias Artistic', 1),
				name: 'Referencias Artísticas',
				description: 'Material de referencia para proyectos',
				emoji: '🎨',
				color: '#f59e0b',
				featuredImage: null,
				parentId: null,
			},
			{
				id: generateReadableId('collection', 'Proyectos Activos', 1),
				name: 'Proyectos Activos',
				description: 'Trabajos en progreso',
				emoji: '🚀',
				color: '#22c55e',
				featuredImage: null,
				parentId: null,
			},
		];

		await db.insert(collections).values(sampleCollections);

		seedLogger.success(`✅ ${sampleCollections.length} collections created`);
	} catch (error) {
		seedLogger.error('❌ Could not create collections:', error);
		throw error;
	}
}
