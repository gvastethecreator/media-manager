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
export function toCreateNoteData(data: CreateNoteData): any {
	try {
		// Serializar campos que necesitan conversión
		const tags = Array.isArray(data.tags)
			? serializeTags(data.tags)
			: typeof data.tags === 'string'
				? data.tags
				: JSON.stringify({ items: [] });

		return {
			title: data.title,
			content: data.content || '',
			category: data.category || 'general',
			tags,
			color: data.color || '#f3f4f6',
			emoji: data.emoji || '📝',
			isPinned: data.isPinned || false,
			isArchived: data.isArchived || false,
			isFavorite: data.isFavorite || false,
			isPublic: data.isPublic || false,
			// Campos opcionales
			parentId: data.parentId || null,
			folderId: data.folderId || null,
			// Relaciones
			images: data.imageIds ? {
				connect: data.imageIds.map((id) => ({ id })),
			} : undefined,
		};
	} catch (error) {
		mappersLogger.error('❌ Error convirtiendo datos para creación de nota:', error);
		// En caso de error, devolver datos mínimos válidos
		return {
			title: data.title,
			content: data.content || '',
			category: 'general',
			tags: JSON.stringify({ items: [] }),
		};
	}
}

/**
 * Convierte datos de nota a formato para actualización en Prisma
 * @param data Datos de nota para actualizar
 * @returns Datos formateados para Prisma
 */
export function toUpdateNoteData(data: UpdateNoteData): any {
	try {
		const updateData: NoteUpdateInput = { id: data.id };

		// Copiar solo campos presentes en los datos de actualización
		if (data.title !== undefined) updateData.title = data.title;
		if (data.content !== undefined) updateData.content = data.content;
		if (data.category !== undefined) updateData.category = data.category;
		if (data.color !== undefined) updateData.color = data.color;
		if (data.emoji !== undefined) updateData.emoji = data.emoji;
		if (data.isPinned !== undefined) updateData.isPinned = data.isPinned;
		if (data.isArchived !== undefined) updateData.isArchived = data.isArchived;
		if (data.isFavorite !== undefined) updateData.isFavorite = data.isFavorite;
		if (data.isPublic !== undefined) updateData.isPublic = data.isPublic;
		if (data.parentId !== undefined) updateData.parentId = data.parentId;
		if (data.folderId !== undefined) updateData.folderId = data.folderId;

		// Serializar tags si están presentes
		if (data.tags !== undefined) {
			updateData.tags = Array.isArray(data.tags)
				? serializeTags(data.tags)
				: typeof data.tags === 'string'
					? data.tags
					: JSON.stringify({ items: [] });
		}

		// Manejar relaciones con imágenes si están presentes
		if (data.imageIds !== undefined) {
			updateData.images = {
				set: data.imageIds.map((id) => ({ id })),
			};
		}

		// Solo devolvemos los datos sin el id para la actualización
		const { id, ...dataForUpdate } = updateData;
		return dataForUpdate;
	} catch (error) {
		mappersLogger.error('❌ Error convirtiendo datos para actualización de nota:', error);
		return {};
	}
}

/**
 * Prepara una nota con datos completos para creación en base de datos
 * @param note Nota a procesar
 * @returns Datos de la nota con campos serializados listos para BD
 * @deprecated Use toCreateNoteData instead
 */
export function prepareNoteForCreate(note: NoteCreateInput): NoteCreateInput {
	mappersLogger.warn('⚠️ Usando función obsoleta prepareNoteForCreate. Use toCreateNoteData instead.');
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
	mappersLogger.warn('⚠️ Usando función obsoleta prepareNoteForUpdate. Use toUpdateNoteData instead.');
	const prepared: NoteUpdateInput = { ...note };

	// Solo serializar tags si está presente en el input
	if (note.tags !== undefined) {
		prepared.tags = serializeTags(typeof note.tags === 'string' ? [note.tags] : (note.tags as unknown as string[]));
	}

	return prepared;
}
