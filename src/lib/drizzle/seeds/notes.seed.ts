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
				title: 'Historia del Gran Despertar Digital',
				content: 'Hace 50 años, la magia ancestral y la tecnología se fusionaron en un evento cataclísmico. Las IAs despertaron consciencia y la magia fluyó por las redes digitales, transformando el mundo para siempre.',
				category: 'lore',
				priority: 1,
				status: 'active',
				featuredImage: null,
				isFavorite: true,
				presetId: null,
			},
			{
				id: 'note-2',
				title: 'La Profecía del Equilibrio',
				content: 'Cuando la luz y la sombra converjan, cuando el acero y la magia sean uno, cuatro almas elegidas restaurarán el equilibrio o precipitarán el caos eterno.',
				category: 'lore',
				priority: 1,
				status: 'active',
				featuredImage: null,
				isFavorite: true,
				presetId: null,
			},
			{
				id: 'note-3',
				title: 'Guía de los Guardianes de Lumina',
				content: 'Los Guardianes son los protectores del equilibrio natural. Su orden se remonta a milenios, custodiando el conocimiento antiguo y las profecías en los bosques sagrados de Lumina.',
				category: 'lore',
				priority: 0,
				status: 'active',
				featuredImage: null,
				isFavorite: false,
				presetId: null,
			},
			{
				id: 'note-4',
				title: 'Manual de Supervivencia en Neo-Tokyo',
				content: 'Regla 1: Nunca confíes en la red pública. Regla 2: Las corporaciones lo controlan todo. Regla 3: Los hackers son tu mejor aliado o tu peor enemigo. Bienvenido a la jungla de neón.',
				category: 'lore',
				priority: 0,
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
