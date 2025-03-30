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
 * Procesa los campos de una nota para su uso en UI
 * @param note Nota con campos serializados
 * @returns Nota con campos procesados
 * @deprecated Use toNoteComplete en su lugar
 */
export function processNoteFields(note: NoteBase): NoteBase & { tags: string[] } {
	serializersLogger.warn('⚠️ Usando función obsoleta processNoteFields. Use toNoteComplete en su lugar.');
	return {
		...note,
		tags: deserializeTags(note.tags),
	};
}

/**
 * Extiende una nota con propiedades adicionales para UI
 * @param note Nota completa
 * @returns Nota extendida con propiedades para UI
 */
export function extendNote<T extends NoteComplete>(note: T): T & {
	excerpt: string;
	wordCount: number;
	formattedDate: string;
	isSelected: boolean;
	isEditing: boolean;
	isNew: boolean;
	isExpanded: boolean;
	isHovered: boolean;
} {
	// Calcular extracto del contenido
	const contentText = note.content || '';
	const excerpt = contentText.length > 150 ? `${contentText.substring(0, 150)}...` : contentText;

	// Calcular conteo de palabras
	const wordCount = contentText ? contentText.split(/\s+/).filter(Boolean).length : 0;

	return {
		...note,
		excerpt,
		wordCount,
		formattedDate: note.updatedAt instanceof Date
			? note.updatedAt.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
			: new Date(note.updatedAt).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
		isSelected: false,
		isEditing: false,
		isNew: false,
		isExpanded: false,
		isHovered: false,
	};
}

/**
 * Extiende un array de notas para UI
 * @param notes Array de notas completas
 * @returns Array de notas extendidas
 */
export function extendNotes<T extends NoteComplete>(notes: T[]): ReturnType<typeof extendNote<T>>[] {
	return notes.map(extendNote);
}
