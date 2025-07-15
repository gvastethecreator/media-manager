import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import { notes } from '../schema';
import { seedLogger } from './index';

/**
 * Siembra notas minimalistas para verificación del sistema
 */
export async function seedNotes(db: LibSQLDatabase<Record<string, never>>) {
	seedLogger.info('📝 Creando notas de prueba...');

	try {
		const sampleNotes = [
			{
				id: 'note-1',
				title: 'Nota de bienvenida',
				content: 'Esta es una nota de ejemplo para verificar el sistema.',
				category: 'general',
				priority: 1,
				status: 'active',
				featuredImage: null,
				isFavorite: true,
				presetId: null,
			},
			{
				id: 'note-2',
				title: 'Nota secundaria',
				content: 'Otra nota para pruebas básicas.',
				category: 'ideas',
				priority: 0,
				status: 'archived',
				featuredImage: null,
				isFavorite: false,
				presetId: null,
			},
		];

		await db.insert(notes).values(sampleNotes);

		seedLogger.success(`✅ ${sampleNotes.length} notas creadas`);
	} catch (error) {
		seedLogger.error('❌ Error creando notas:', error);
		throw error;
	}
}
