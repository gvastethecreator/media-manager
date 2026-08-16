import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import { generateReadableId } from '@/lib/utils/id-generator';
import { groups } from '../schema';
import { seedLogger } from './index';

/**
 * Siembra grupos con IDs legibles
 * Formato: grp-nombre-01, grp-nombre-02, etc.
 */
export async function seedGroups(db: LibSQLDatabase<Record<string, never>>) {
	seedLogger.info('👥 Creando grupos de prueba...');

	try {
		const sampleGroups = [
			{
				id: generateReadableId('group', 'Proyecto Principal', 1),
				name: 'Proyecto Principal',
				description: 'Grupo para el proyecto principal activo',
			},
			{
				id: generateReadableId('group', 'Referencias Artistic', 1),
				name: 'Referencias Artísticas',
				description: 'Reference material for inspiration',
			},
			{
				id: generateReadableId('group', 'Archivo Historico', 1),
				name: 'Archivo Histórico',
				description: 'Proyectos completados y archivados',
			},
			{
				id: generateReadableId('group', 'Trabajo en Progreso', 1),
				name: 'Trabajo en Progreso',
				description: 'Contenido en desarrollo activo',
			},
		];

		await db.insert(groups).values(sampleGroups);

		seedLogger.success(`✅ ${sampleGroups.length} grupos creados`);
	} catch (error) {
		seedLogger.error('❌ Could not create groups:', error);
		throw error;
	}
}
