import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import { groups } from '../schema';
import { seedLogger } from './index';

/**
 * Siembra grupos minimalistas para verificación del sistema
 */
export async function seedGroups(db: LibSQLDatabase<Record<string, never>>) {
	seedLogger.info('👥 Creando grupos de prueba...');

	try {
		const sampleGroups = [
			{
				id: 'group-1',
				name: 'Administradores',
				description: 'Grupo de usuarios con permisos administrativos',
			},
			{
				id: 'group-2',
				name: 'Colaboradores',
				description: 'Grupo de usuarios para pruebas y colaboración',
			},
		];

		await db.insert(groups).values(sampleGroups);

		seedLogger.success(`✅ ${sampleGroups.length} grupos creados`);
	} catch (error) {
		seedLogger.error('❌ Error creando grupos:', error);
		throw error;
	}
}
