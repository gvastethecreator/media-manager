import { serverLogger } from '@/lib/logger/server-logger';
import type {
  CreateNoteData,
  NoteBase,
  NoteCreateInput,
  NoteExtended,
  NoteUpdateInput,
  UpdateNoteData
} from '@/types/entities/note';
import { format } from 'date-fns';
import { processNoteFields, serializeTags } from './serializers';

const mappersLogger = serverLogger.withContext('Note:Mappers');

/**
 * Transforma una nota básica a formato extendido para UI
 * @param note Nota base
 * @returns Nota extendida con propiedades adicionales para UI
 * @deprecated Use toNoteComplete and extendNote instead
 */
export function toNoteExtended(note: NoteBase): NoteExtended {
	const processedNote = processNoteFields(note);

	// Calcular excerpt del contenido
	const contentText = processedNote.content || '';
	const excerpt = contentText.length > 150 ? `${contentText.substring(0, 150)}...` : contentText;

	// Calcular conteo de palabras
	const wordCount = contentText ? contentText.split(/\s+/).filter(Boolean).length : 0;

	return {
		...processedNote,
		isSelected: false,
		isEditing: false,
		isNew: false,
		isExpanded: false,
		isHovered: false,
		formattedDate: format(new Date(processedNote.updatedAt), 'dd/MM/yyyy HH:mm'),
		excerpt,
		wordCount,
		// Propiedades calculadas adicionales
		relationsCount: 0,
	};
}

/**
 * Transforma un array de notas básicas a formato extendido
 * @param notes Array de notas base
 * @returns Array de notas extendidas
 * @deprecated Use extendNotes instead
 */
export function toNotesExtended(notes: NoteBase[]): NoteExtended[] {
	return notes.map(toNoteExtended);
}

/**
 * Prepara una nota con datos completos para creación en base de datos
 * @param data Datos de la nota con posibles campos deserializados
 * @returns Datos de la nota con campos serializados listos para BD
 */
export function toCreateNoteData(data: CreateNoteData): NoteCreateInput {
	try {
		// Convertir tags a string JSON si es un array
		const tags = Array.isArray(data.tags)
			? serializeTags(data.tags)
			: typeof data.tags === 'string'
				? data.tags // Ya es un string, posiblemente JSON
				: 'empty_array';

		return {
			title: data.title,
			content: data.content || '',
			category: data.category || 'general',
			priority: data.priority !== undefined ? data.priority : 0,
			status: data.status || 'active',
			tags,
			featuredImage: data.featuredImage || null,
			isFavorite: data.isFavorite || false,
		};
	} catch (error) {
		mappersLogger.error('❌ Error en toCreateNoteData:', error);

		// Devolver valores por defecto en caso de error
		return {
			title: data.title,
			content: '',
			category: 'general',
			priority: 0,
			status: 'active',
			tags: 'empty_array',
			featuredImage: null,
			isFavorite: false,
		};
	}
}

/**
 * Prepara una nota con datos completos para actualización en base de datos
 * @param data Datos de la nota con posibles campos deserializados
 * @returns Datos de la nota con campos serializados listos para BD
 */
export function toUpdateNoteData(data: UpdateNoteData & { id: string }): NoteUpdateInput {
	try {
		const updateData: NoteUpdateInput = { id: data.id };

		// Copiar solo campos presentes en el input
		if (data.title !== undefined) updateData.title = data.title;
		if (data.content !== undefined) updateData.content = data.content;
		if (data.category !== undefined) updateData.category = data.category;
		if (data.priority !== undefined) updateData.priority = data.priority;
		if (data.status !== undefined) updateData.status = data.status;
		if (data.featuredImage !== undefined) updateData.featuredImage = data.featuredImage;
		if (data.isFavorite !== undefined) updateData.isFavorite = data.isFavorite;

		// Convertir tags a string JSON si está presente y es un array
		if (data.tags !== undefined) {
			updateData.tags = Array.isArray(data.tags)
				? serializeTags(data.tags)
				: typeof data.tags === 'string'
					? data.tags // Ya es un string, posiblemente JSON
					: 'empty_array';
		}

		return updateData;
	} catch (error) {
		mappersLogger.error('❌ Error en toUpdateNoteData:', error);

		// Devolver solo el ID en caso de error
		return { id: data.id };
	}
}

/**
 * Prepara una nota para creación, serializando campos necesarios
 * @param note Datos para crear nota
 * @returns Objeto preparado para crear nota
 * @deprecated Use toCreateNoteData instead
 */
export function prepareNoteForCreate(note: NoteCreateInput): NoteCreateInput {
	return {
		...note,
		tags: note.tags
			? serializeTags(typeof note.tags === 'string' ? [note.tags] : (note.tags as unknown as string[]))
			: 'empty_array',
	};
}

/**
 * Prepara una nota para actualización, serializando campos necesarios
 * @param note Datos para actualizar nota
 * @returns Objeto preparado para actualizar nota
 * @deprecated Use toUpdateNoteData instead
 */
export function prepareNoteForUpdate(note: NoteUpdateInput): NoteUpdateInput {
	const prepared: NoteUpdateInput = { ...note };

	// Solo serializar tags si está presente en el input
	if (note.tags !== undefined) {
		prepared.tags = serializeTags(typeof note.tags === 'string' ? [note.tags] : (note.tags as unknown as string[]));
	}

	return prepared;
}
