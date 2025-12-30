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
				id: 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa',
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
				id: 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaabbb',
				title: 'Nota secundaria',
				content: 'Otra nota para pruebas básicas.',
				category: 'ideas',
				priority: 0,
				status: 'archived',
				featuredImage: null,
				isFavorite: false,
				presetId: null,
			},
			{
				id: 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaccc',
				title: 'Lista de Tareas',
				content: '- Tarea 1: Organizar archivos\n- Tarea 2: Revisar etiquetas\n- Tarea 3: Crear álbumes nuevos',
				category: 'tareas',
				priority: 2,
				status: 'active',
				featuredImage: null,
				isFavorite: true,
				presetId: null,
			},
			{
				id: 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaddd',
				title: 'Referencias de Estilo',
				content: 'Estilos artísticos para explorar: Art Nouveau, Cyberpunk, Steampunk, Vaporwave.',
				category: 'referencias',
				priority: 1,
				status: 'active',
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
