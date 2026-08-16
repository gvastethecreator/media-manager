/**
 * @file Exportaciones principales del transformador Note
 * @module transformers/note
 * @description Barrel file que centraliza las exportaciones del transformador Note.
 * Las implementaciones CRUD están distribuidas en archivos específicos.
 */

// --- Mappers ---
export {
	mapCreateNoteDataToDrizzle,
	mapNoteFiltersToDrizzle,
	mapNoteSearchOptionsToDrizzle,
	mapUpdateNoteDataToDrizzle,
	toCreateNoteData,
	toNoteWithStats,
	toUpdateNoteData,
} from './mappers';

// --- Schemas ---
export * from './schema';

// --- Serializers ---
export { fromDrizzleNote, validateNote } from './serializers';

// --- Transformers ---
export * from './transformer';

// --- Validators ---
export * from './validators';

/**
 * Transforma una nota para su uso en relaciones
 */
export function toRelatedNote(
	note: Record<string, any>,
	options: {
		includeDetails?: boolean;
	} = {}
): Record<string, any> {
	try {
		const { includeDetails = false } = options;

		// Datos básicos
		const relatedNote = {
			id: note.id,
			title: note.title || 'Untitled',
			type: 'note',
		};

		// Si se solicitan detalles, incluir más información
		if (includeDetails) {
			return {
				...relatedNote,
				emoji: note.emoji || '📝',
				color: note.color || 'var(--dt-primary-500)',
				category: note.category || 'general',
				excerpt: note.excerpt || note.content?.substring(0, 100) || '',
				isFavorite: note.isFavorite || note.isFavorite,
				createdAt: note.createdAt,
				updatedAt: note.updatedAt,
			};
		}

		return relatedNote;
	} catch (error) {
		// En caso de error, devolver al menos el ID
		return {
			id: note.id,
			title: 'Error',
			type: 'note',
		};
	}
}
