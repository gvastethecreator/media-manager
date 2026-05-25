import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import { generateReadableId } from '@/lib/utils/id-generator';
import { notes } from '../schema';
import { seedLogger } from './index';

/**
 * Siembra notas con IDs legibles
 * Formato: note-titulo-01, note-titulo-02, etc.
 */
export async function seedNotes(db: LibSQLDatabase<Record<string, never>>) {
	seedLogger.info('📝 Creando notas de prueba...');

	try {
		const sampleNotes = [
			{
				id: generateReadableId('note', 'Bienvenida', 1),
				title: 'Nota de bienvenida',
				content: 'Esta es una nota de ejemplo para verificar el sistema.',
				category: 'general',
			},
			{
				id: generateReadableId('note', 'Ideas', 1),
				title: 'Nota secundaria',
				content: 'Otra nota para pruebas básicas.',
				category: 'ideas',
			},
			{
				id: generateReadableId('note', 'Lista Tareas', 1),
				title: 'Lista de Tareas',
				content: '- Tarea 1: Organizar archivos\n- Tarea 2: Revisar etiquetas\n- Tarea 3: Crear álbumes nuevos',
				category: 'tareas',
			},
			{
				id: generateReadableId('note', 'Referencias Estilo', 1),
				title: 'Referencias de Estilo',
				content: 'Estilos artísticos para explorar: Art Nouveau, Cyberpunk, Steampunk, Vaporwave.',
				category: 'referencias',
			},
		];

		await db.insert(notes).values(sampleNotes);

		seedLogger.success(`✅ ${sampleNotes.length} notas creadas`);
	} catch (error) {
		seedLogger.error('❌ Error creando notas:', error);
		throw error;
	}
}
