'use server';

import { getPrismaClient } from '@/lib/database/db';
import { serverLogger } from '@/lib/logger/server-logger';
import { emit } from '@/lib/server/events.server';
import { createNoteSchema, updateNoteSchema } from '@/lib/utils/note/validators';
import { noteService } from '@/services/note';
import { STATS_EVENTS, statsEventEmitter } from '@/services/stats';
import type {
    CreateNoteData,
    NoteBase,
    NoteComplete,
    NoteCreateInput,
    NoteFilters,
    NoteSearchOptions,
    NoteUpdateInput,
    NoteWithStats,
} from '@/types/entities/note';
import type { FileItem } from '@/types/files';
import { revalidatePath } from 'next/cache';

// Utilidades y logging
const noteLogger = serverLogger.withContext('NoteActions');

const REVALIDATE_PATHS = ['/settings', '/notes', '/notes/[id]'] as const;

const revalidateAllPaths = async () => {
	for (const path of REVALIDATE_PATHS) {
		revalidatePath(path);
	}
	noteLogger.info('🔄 Rutas revalidadas');
};

// Manejo de errores - enfoque funcional
enum NoteErrorCode {
	NOT_FOUND = 'NOT_FOUND',
	VALIDATION_ERROR = 'VALIDATION_ERROR',
	OPERATION_FAILED = 'OPERATION_FAILED',
}

const createNoteError = (message: string, code: NoteErrorCode = NoteErrorCode.OPERATION_FAILED, cause?: unknown) => {
	const error = new Error(message);
	error.name = 'NoteError';
	Object.assign(error, { code, cause });
	return error;
};

// Interfaz para notas con imágenes (mantenemos para compatibilidad)
export interface NoteWithImages extends NoteBase {
	images: FileItem[];
}

// Función para conversión de CreateNoteData a NoteCreateInput
function mapCreateNoteDataToInput(data: CreateNoteData): NoteCreateInput {
	return {
		title: data.title,
		content: data.content || '',
		category: data.category || 'general',
		priority: data.priority || 0,
		status: data.status || 'draft',
		color: data.color,
		emoji: data.emoji,
		featuredImage: data.featuredImage,
		isFavorite: data.isFavorite || false,
		presetId: data.presetId,
	};
}

// Funciones exportadas refactorizadas para usar el servicio
export async function getNotes(): Promise<NoteWithStats[]> {
	try {
		noteLogger.info('📝 Obteniendo notas con estadísticas');
		const result = await noteService.getNotesWithStats();

		noteLogger.info(`✅ Obtenidas ${result.length} notas`);
		return result;
	} catch (error) {
		noteLogger.error('❌ Error al obtener notas', error);
		throw createNoteError('No se pudieron obtener las notas', NoteErrorCode.OPERATION_FAILED, error);
	}
}

export async function getNote(id: string): Promise<NoteComplete> {
	try {
		noteLogger.info('🔍 Obteniendo nota:', id);
		const note = await noteService.getNote(id);

		if (!note) {
			throw createNoteError('Nota no encontrada', NoteErrorCode.NOT_FOUND);
		}

		noteLogger.info('✅ Nota obtenida:', note.title);
		return note;
	} catch (error) {
		noteLogger.error('❌ Error al obtener nota:', error);
		if (error instanceof Error && error.name === 'NoteError') {
			throw error;
		}
		throw createNoteError('No se pudo obtener la nota', NoteErrorCode.OPERATION_FAILED, error);
	}
}

export async function createNote(data: CreateNoteData): Promise<NoteComplete> {
	try {
		noteLogger.info('📝 Creando nota:', data.title);

		// Validar datos de entrada
		const validationResult = createNoteSchema.safeParse(data);
		if (!validationResult.success) {
			const errorMessage = validationResult.error.errors.map((e) => e.message).join(', ');
			throw createNoteError(errorMessage, NoteErrorCode.VALIDATION_ERROR);
		}

		// Mapear datos al formato del servicio
		const createInput = mapCreateNoteDataToInput(data);

		// Usar el servicio para crear la nota
		const noteComplete = await noteService.createNote(createInput);

		// Emitir eventos adicionales para compatibilidad
		await emit({
			type: 'notes:modified',
			data: { action: 'create', note: noteComplete },
		});
		statsEventEmitter.emit(STATS_EVENTS.NOTE_CHANGE);

		noteLogger.info('✅ Nota creada:', noteComplete.title);
		await revalidateAllPaths();
		return noteComplete;
	} catch (error) {
		noteLogger.error('❌ Error al crear nota:', error);
		throw createNoteError('No se pudo crear la nota', NoteErrorCode.OPERATION_FAILED, error);
	}
}

export async function updateNote(id: string, data: Partial<CreateNoteData>): Promise<NoteComplete> {
	try {
		noteLogger.info('📝 Actualizando nota:', id);

		// Validar datos de entrada
		const validationData = { ...data, id };
		const validationResult = updateNoteSchema.safeParse(validationData);
		if (!validationResult.success) {
			const errorMessage = validationResult.error.errors.map((e) => e.message).join(', ');
			throw createNoteError(errorMessage, NoteErrorCode.VALIDATION_ERROR);
		}

		// Mapear datos parciales para actualización
		const updateInput: NoteUpdateInput = {
			title: data.title,
			content: data.content,
			category: data.category,
			priority: data.priority,
			status: data.status,
			color: data.color,
			emoji: data.emoji,
			featuredImage: data.featuredImage,
			isFavorite: data.isFavorite,
			presetId: data.presetId,
		};

		// Usar el servicio para actualizar la nota
		const noteComplete = await noteService.updateNote(id, updateInput);

		// Emitir eventos adicionales para compatibilidad
		await emit({
			type: 'notes:modified',
			id,
			data: { action: 'update', note: noteComplete },
		});
		statsEventEmitter.emit(STATS_EVENTS.NOTE_CHANGE);

		noteLogger.info('✅ Nota actualizada:', noteComplete.title);
		await revalidateAllPaths();
		return noteComplete;
	} catch (error) {
		noteLogger.error('❌ Error al actualizar nota:', error);
		throw createNoteError('No se pudo actualizar la nota', NoteErrorCode.OPERATION_FAILED, error);
	}
}

export async function deleteNote(id: string): Promise<void> {
	try {
		noteLogger.info('🗑️ Eliminando nota:', id);

		// Verificar si la nota existe antes de eliminar
		const existingNote = await noteService.getNote(id);
		if (!existingNote) {
			throw createNoteError('Nota no encontrada', NoteErrorCode.NOT_FOUND);
		}

		// Usar el servicio para eliminar la nota
		await noteService.deleteNote(id);

		// Emitir eventos adicionales para compatibilidad
		await emit({
			type: 'notes:modified',
			id,
			data: { action: 'delete', noteId: id },
		});
		statsEventEmitter.emit(STATS_EVENTS.NOTE_CHANGE);

		noteLogger.info('✅ Nota eliminada:', id);
		await revalidateAllPaths();
	} catch (error) {
		noteLogger.error('❌ Error al eliminar nota:', error);
		if (error instanceof Error && error.name === 'NoteError') {
			throw error;
		}
		throw createNoteError('No se pudo eliminar la nota', NoteErrorCode.OPERATION_FAILED, error);
	}
}

/**
 * Obtiene una nota con campos procesados (para compatibilidad)
 * @param id ID de la nota
 * @returns Nota con campos procesados
 * @deprecated Use getNote instead
 */
export async function getNoteWithProcessedFields(id: string): Promise<NoteBase & { parsedTags: string[] }> {
	const note = await getNote(id);
	return {
		...note,
		parsedTags: [],
	};
}

/**
 * Obtiene todas las notas con campos procesados (para compatibilidad)
 * @returns Array de notas con campos procesados
 * @deprecated Use getNotes instead
 */
export async function getNotesWithProcessedFields(): Promise<Array<NoteBase & { parsedTags: string[] }>> {
	const notes = await getNotes();
	return notes.map((note) => ({
		...note,
		parsedTags: [],
	}));
}

export async function getNoteImages(noteId: string): Promise<FileItem[]> {
	noteLogger.info('🖼️ Obteniendo imágenes de nota:', noteId);

	if (!noteId || typeof noteId !== 'string' || noteId.trim() === '') {
		noteLogger.warn('❌ Intento de obtener imágenes con ID de nota inválido:', noteId);
		throw createNoteError('ID de nota inválido proporcionado.', NoteErrorCode.VALIDATION_ERROR);
	}

	try {
		const prisma = await getPrismaClient();
		const note = await prisma.note.findUnique({
			where: { id: noteId },
			include: {
				images: {
					select: {
						id: true,
						name: true,
						description: true,
						path: true,
						size: true,
						width: true,
						height: true,
						createdAt: true,
						updatedAt: true,
					},
				},
			},
		});

		if (!note) {
			throw createNoteError('Nota no encontrada', NoteErrorCode.NOT_FOUND);
		}

		noteLogger.info('✅ Imágenes obtenidas:', note.images.length);
		return note.images.map((image) => ({
			id: image.id,
			name: image.name || '',
			path: image.path,
			type: 'image' as const,
			size: image.size,
			width: image.width,
			height: image.height,
			src: `/api/images/${image.id}/content`,
			tags: [], // Las tags se cargarían por separado si es necesario
			collections: [], // Las collections se cargarían por separado si es necesario
			isPublic: false, // Por defecto false
			isFavorite: false, // Por defecto false, se cargaría por separado si es necesario
			createdAt: image.createdAt,
			updatedAt: image.updatedAt,
		}));
	} catch (error) {
		noteLogger.error('❌ Error al obtener imágenes de nota:', error);
		if (error instanceof Error && error.name === 'NoteError') {
			throw error;
		}
		throw createNoteError('No se pudieron obtener las imágenes de la nota', NoteErrorCode.OPERATION_FAILED, error);
	}
}

export async function addImageToNote(noteId: string, imageId: string): Promise<void> {
	try {
		noteLogger.info('📝 Añadiendo imagen a nota:', { noteId, imageId });

		// Verificar si la nota existe
		const prisma = await getPrismaClient();
		const note = await prisma.note.findUnique({
			where: { id: noteId },
		});

		if (!note) {
			throw createNoteError('Nota no encontrada', NoteErrorCode.NOT_FOUND);
		}

		// Verificar si la imagen existe
		const image = await prisma.image.findUnique({
			where: { id: imageId },
		});

		if (!image) {
			throw createNoteError('Imagen no encontrada', NoteErrorCode.NOT_FOUND);
		}

		// Añadir imagen a la nota
		await prisma.note.update({
			where: { id: noteId },
			data: {
				images: {
					connect: { id: imageId },
				},
			},
		});

		await emit({
			type: 'notes:modified',
			id: noteId,
			data: { action: 'addImage', noteId, imageId },
		});
		statsEventEmitter.emit(STATS_EVENTS.NOTE_CHANGE);

		noteLogger.info('✅ Imagen añadida a nota:', { noteId, imageId });
		await revalidateAllPaths();
	} catch (error) {
		noteLogger.error('❌ Error al añadir imagen a nota:', error);
		throw createNoteError('No se pudo añadir la imagen a la nota', NoteErrorCode.OPERATION_FAILED, error);
	}
}

export async function removeImageFromNote(noteId: string, imageId: string): Promise<void> {
	try {
		noteLogger.info('🔄 Eliminando imagen de nota:', { noteId, imageId });

		// Verificar si la nota existe
		const prisma = await getPrismaClient();
		const note = await prisma.note.findUnique({
			where: { id: noteId },
		});

		if (!note) {
			throw createNoteError('Nota no encontrada', NoteErrorCode.NOT_FOUND);
		}

		// Eliminar relación entre nota e imagen
		await prisma.note.update({
			where: { id: noteId },
			data: {
				images: {
					disconnect: { id: imageId },
				},
			},
		});

		await emit({
			type: 'notes:modified',
			id: noteId,
			data: { action: 'removeImage', noteId, imageId },
		});
		statsEventEmitter.emit(STATS_EVENTS.NOTE_CHANGE);

		noteLogger.info('✅ Imagen eliminada de nota:', { noteId, imageId });
		await revalidateAllPaths();
	} catch (error) {
		noteLogger.error('❌ Error al eliminar imagen de nota:', error);
		throw createNoteError('No se pudo eliminar la imagen de la nota', NoteErrorCode.OPERATION_FAILED, error);
	}
}

// Función wrapper async para compatibilidad con "use server"
export async function searchNotes(filters: NoteFilters = {}, options: NoteSearchOptions = {}) {
	const { searchNotes: searchNotesImpl } = await import('@/transformers/note');
	return searchNotesImpl(filters, options);
}
