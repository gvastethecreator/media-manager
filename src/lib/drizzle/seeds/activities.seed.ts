import { sql } from 'drizzle-orm';
import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import { activities } from '../schema';
import { seedLogger } from './index';

/**
 * Siembra actividades minimalistas para verificación del sistema
 */
export async function seedActivities(db: LibSQLDatabase<Record<string, never>>) {
	seedLogger.info('📊 Creando actividades de prueba...');

	try {
		const sampleActivities = [
			{
				id: 'activity-1',
				type: 'image',
				entityType: 'image',
				entityId: 'img-example-1',
				userId: 'profile-1',
				action: 'upload',
				description: 'Usuario subió una imagen de paisaje',
				metadata: JSON.stringify({
					filename: 'landscape.jpg',
					size: 2_048_000,
					source: 'camera',
					location: 'mountain',
				}),
			},
			{
				id: 'activity-2',
				type: 'album',
				entityType: 'album',
				entityId: 'album-1',
				userId: 'profile-1',
				action: 'create',
				description: 'Usuario creó un nuevo álbum de fotografía',
				metadata: JSON.stringify({
					name: 'Fotografía de Naturaleza',
					description: 'Colección de paisajes',
					category: 'photography',
					public: true,
				}),
			},
		];

		await db
			.insert(activities)
			.values(sampleActivities)
			.onConflictDoUpdate({
				target: activities.id,
				set: {
					type: sql`excluded.type`,
					entityType: sql`excluded.entityType`,
					entityId: sql`excluded.entityId`,
					userId: sql`excluded.userId`,
					action: sql`excluded.action`,
					description: sql`excluded.description`,
					metadata: sql`excluded.metadata`,
				},
			});
		seedLogger.success(`✅ ${sampleActivities.length} actividades creadas`);
	} catch (error) {
		seedLogger.error('❌ Error creando actividades:', error);
		throw error;
	}
}
