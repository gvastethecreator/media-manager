import { serverLogger } from '@/lib/logger/server-logger';
import type {
  NoteBase,
  NoteComplete,
  NoteCompleteTransform,
  NoteTags
} from '@/types/entities/note';

const serializersLogger = serverLogger.withContext('Note:Serializers');

/**
 * Serializa un array de tags a string para almacenar en BD
 * @param tags Array de tags
 * @returns String JSON serializado
 */
export function serializeTags(tags: string[]): string {
	try {
		const tagsObj: NoteTags = { items: tags };
		return JSON.stringify(tagsObj);
	} catch (error) {
		serializersLogger.error('❌ Error serializando tags:', error);
		return JSON.stringify({ items: [] });
	}
}

/**
 * Deserializa string JSON de tags a array
 * @param tagsJson String JSON de tags
 * @returns Array de tags
 */
export function deserializeTags(tagsJson: string | null | undefined): string[] {
	if (!tagsJson || tagsJson === 'empty_array') return [];

	try {
		const parsed = JSON.parse(tagsJson) as NoteTags;
		return Array.isArray(parsed.items) ? parsed.items : [];
	} catch (error) {
		serializersLogger.error('❌ Error deserializando tags:', error);
		return [];
	}
}

/**
 * Transforma una nota con campos JSON serializados a formato completo con campos deserializados
 * @param note Nota con campos JSON serializados
 * @returns Nota con campos JSON deserializados
 */
export function toNoteComplete<T extends NoteBase>(note: T): NoteCompleteTransform<T> {
	try {
		return {
			...note,
			tags: deserializeTags(note.tags),
		} as NoteCompleteTransform<T>;
	} catch (error) {
		serializersLogger.error('❌ Error en toNoteComplete:', error);
		return {
			...note,
			tags: [],
		} as NoteCompleteTransform<T>;
	}
}

/**
 * Transforma una nota con campos JSON deserializados a formato con campos serializados para BD
 * @param note Nota con campos JSON deserializados
 * @returns Nota con campos JSON serializados
 */
export function fromNoteComplete<T extends NoteComplete>(note: T): Omit<T, 'tags'> & { tags: string } {
	try {
		return {
			...note,
			tags: serializeTags(note.tags),
		} as Omit<T, 'tags'> & { tags: string };
	} catch (error) {
		serializersLogger.error('❌ Error en fromNoteComplete:', error);
		return {
			...note,
			tags: JSON.stringify({ items: [] }),
		} as Omit<T, 'tags'> & { tags: string };
	}
}

/**
 * Procesa una nota para asegurar que todos los campos JSON estén deserializados
 * @param note Nota a procesar
 * @returns Nota con campos deserializados
 * @deprecated Use toNoteComplete instead
 */
export function processNoteFields(note: NoteBase): NoteBase & { parsedTags: string[] } {
	return {
		...note,
		parsedTags: deserializeTags(note.tags),
	};
}

/**
 * Extiende una nota con información adicional para UI
 * @param note Nota base o completa
 * @returns Nota extendida con campos adicionales para UI
 */
export function extendNote<T extends NoteBase | NoteComplete>(note: T): T & {
	isSelected?: boolean;
	isEditing?: boolean;
	excerpt?: string;
	formattedDate?: string;
} {
	// Calcular excerpt del contenido
	const contentText = note.content || '';
	const excerpt = contentText.length > 150 ? `${contentText.substring(0, 150)}...` : contentText;

	// Formatear fecha si es necesario
	const formattedDate = note.updatedAt
		? new Intl.DateTimeFormat('es-ES', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(note.updatedAt))
		: '';

	return {
		...note,
		isSelected: false,
		isEditing: false,
		excerpt,
		formattedDate,
	};
}

/**
 * Extiende un array de notas con información adicional para UI
 * @param notes Array de notas
 * @returns Array de notas extendidas
 */
export function extendNotes<T extends NoteBase | NoteComplete>(notes: T[]): ReturnType<typeof extendNote<T>>[] {
	return notes.map(extendNote);
}
