import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import { groups } from '../schema';
import { seedLogger } from './index';

/**
 * Siembra grupos para verificación del sistema
 */
export async function seedGroups(db: LibSQLDatabase<Record<string, never>>) {
	seedLogger.info('👥 Creando grupos de prueba...');

	try {
		const sampleGroups = [
			{
				id: '66666666-6666-4666-a666-666666666661',
				name: 'Proyecto Principal',
				description: 'Grupo para el proyecto principal activo',
				emoji: '🎯',
				color: '#3b82f6',
				featuredImage: null,
				isFavorite: true,
				parentId: null,
			},
			{
				id: '66666666-6666-4666-a666-666666666662',
				name: 'Referencias Artísticas',
				description: 'Material de referencia para inspiración',
				emoji: '🎨',
				color: '#8b5cf6',
				featuredImage: null,
				isFavorite: true,
				parentId: null,
			},
			{
				id: '66666666-6666-4666-a666-666666666663',
				name: 'Archivo Histórico',
				description: 'Proyectos completados y archivados',
				emoji: '📦',
				color: '#64748b',
				featuredImage: null,
				isFavorite: false,
				parentId: null,
			},
			{
				id: '66666666-6666-4666-a666-666666666664',
				name: 'Trabajo en Progreso',
				description: 'Contenido en desarrollo activo',
				emoji: '🚧',
				color: '#f59e0b',
				featuredImage: null,
				isFavorite: false,
				parentId: null,
			},
		];

		await db.insert(groups).values(sampleGroups);

		seedLogger.success(`✅ ${sampleGroups.length} grupos creados`);
	} catch (error) {
		seedLogger.error('❌ Error creando grupos:', error);
		throw error;
	}
}
