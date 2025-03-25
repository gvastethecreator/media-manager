'use server';

import { serverLogger } from '@/lib/logger/server-logger';
import { prisma } from '@/lib/prisma';
import { emit } from '@/lib/server/events.server';
import { STATS_EVENTS, statsEventEmitter } from '@/services/stats.service';
import {
	processNoteFields,
	serializeTags
} from '@/transformers/note';
import type {
	NoteBase,
	NoteCreateInput,
	NoteUpdateInput,
	NoteWithStats
} from '@/types/entities/note';
import type { FileItem } from '@/types/file-item';
import {
	createNoteSchema,
	updateNoteSchema
} from '@/utils/note/validators';
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

// Funciones exportadas
export async function getNotes(): Promise<NoteWithStats[]> {
	try {
		noteLogger.info('📝 Obteniendo notas con estadísticas');

		const notes = await prisma.note.findMany({
			include: {
				_count: {
					select: {
						concepts: true,
						prompts: true,
						characters: true,
						places: true,
						worldItems: true,
					},
				},
			},
			orderBy: {
				updatedAt: 'desc',
			},
		});

		// Procesamos los campos serializados
		return notes.map((note) => ({
			...note,
			_count: {
				...note._count,
				images: 0 // Añadimos este campo para cumplir con NoteStats
			},
			// Mantenemos lastUpdated para compatibilidad
			lastUpdated: note.updatedAt,
		}));
	} catch (error) {
		noteLogger.error('❌ Error al obtener notas', error);
		throw createNoteError('No se pudieron obtener las notas', NoteErrorCode.OPERATION_FAILED, error);
	}
}

export async function getNote(id: string): Promise<NoteBase> {
	try {
		noteLogger.info('🔍 Obteniendo nota:', id);
		const note = await prisma.note.findUnique({
			where: { id },
		});

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

export async function createNote(data: NoteCreateInput): Promise<NoteBase> {
	try {
		noteLogger.info('📝 Creando nota:', data.title);

		// Validar datos de entrada
		const validationResult = createNoteSchema.safeParse(data);
		if (!validationResult.success) {
			const errorMessage = validationResult.error.errors.map(e => e.message).join(', ');
			throw createNoteError(errorMessage, NoteErrorCode.VALIDATION_ERROR);
		}

		// Preparar datos y serializar tags si es necesario
		const { tags, ...otherData } = data;
		const serializedTags = Array.isArray(tags)
			? serializeTags(tags)
			: (typeof tags === 'string' ? tags : serializeTags([]));

		// Crear la nota
		const note = await prisma.note.create({
			data: {
				...otherData,
				tags: serializedTags,
				content: data.content || '',
				category: data.category || 'general',
				priority: data.priority || 0,
				status: data.status || 'active',
				featuredImage: data.featuredImage || null,
			},
		});

		await emit({
			type: 'notes:modified',
			data: { action: 'create', note },
		});
		statsEventEmitter.emit(STATS_EVENTS.NOTE_CHANGE);

		noteLogger.info('✅ Nota creada:', note.title);
		await revalidateAllPaths();
		return note;
	} catch (error) {
		noteLogger.error('❌ Error al crear nota:', error);
		throw createNoteError('No se pudo crear la nota', NoteErrorCode.OPERATION_FAILED, error);
	}
}

export async function updateNote(id: string, data: NoteUpdateInput): Promise<NoteBase> {
	try {
		noteLogger.info('📝 Actualizando nota:', id);

		// Validar datos de entrada
		const validationData = { ...data, id };
		const validationResult = updateNoteSchema.safeParse(validationData);
		if (!validationResult.success) {
			const errorMessage = validationResult.error.errors.map(e => e.message).join(', ');
			throw createNoteError(errorMessage, NoteErrorCode.VALIDATION_ERROR);
		}

		// Crear objeto de actualización
		const updateData: Record<string, any> = { ...data };

		// Manejar tags especialmente
		if ('tags' in data && data.tags !== undefined) {
			const tags = data.tags;
			updateData.tags = Array.isArray(tags)
				? serializeTags(tags)
				: (typeof tags === 'string' ? tags : serializeTags([]));
		}

		const note = await prisma.note.update({
			where: { id },
			data: updateData,
		});

		await emit({
			type: 'notes:modified',
			id,
			data: { action: 'update', note },
		});
		statsEventEmitter.emit(STATS_EVENTS.NOTE_CHANGE);

		noteLogger.info('✅ Nota actualizada:', note.title);
		await revalidateAllPaths();
		return note;
	} catch (error) {
		noteLogger.error('❌ Error al actualizar nota:', error);
		throw createNoteError('No se pudo actualizar la nota', NoteErrorCode.OPERATION_FAILED, error);
	}
}

export async function deleteNote(id: string): Promise<void> {
	try {
		noteLogger.info('🗑️ Eliminando nota:', id);
		await prisma.note.delete({
			where: { id },
		});

		await emit({
			type: 'notes:modified',
			id,
			data: { action: 'delete', id },
		});
		statsEventEmitter.emit(STATS_EVENTS.NOTE_CHANGE);

		noteLogger.info('✅ Nota eliminada');
		await revalidateAllPaths();
	} catch (error) {
		noteLogger.error('❌ Error al eliminar nota:', error);
		throw createNoteError('No se pudo eliminar la nota', NoteErrorCode.OPERATION_FAILED, error);
	}
}

/**
 * Obtiene una nota con los campos procesados (tags deserializados)
 */
export async function getNoteWithProcessedFields(id: string): Promise<NoteBase & { parsedTags: string[] }> {
	const note = await getNote(id);
	return processNoteFields(note);
}

/**
 * Obtiene todas las notas con campos procesados
 */
export async function getNotesWithProcessedFields(): Promise<Array<NoteBase & { parsedTags: string[] }>> {
	const notes = await getNotes();
	return notes.map(note => processNoteFields(note));
}

/**
 * Obtiene las imágenes relacionadas con una nota
 */
export async function getNoteImages(noteId: string): Promise<FileItem[]> {
	try {
		noteLogger.info('🖼️ Obteniendo imágenes relacionadas con la nota:', noteId);

		const note = await prisma.note.findUnique({
			where: { id: noteId },
		});

		if (!note) {
			noteLogger.warn('ℹ️ Nota no encontrada, retornando array vacío:', noteId);
			return [];
		}

		// Solución temporal hasta que se implementen las relaciones correctamente
		noteLogger.info('✅ Esta nota no tiene imágenes definidas aún en el esquema');
		return [];
	} catch (error) {
		noteLogger.error('❌ Error al obtener imágenes de la nota:', error);
		if (error instanceof Error && error.name === 'NoteError') {
			throw error;
		}
		throw createNoteError('No se pudieron obtener las imágenes de la nota', NoteErrorCode.OPERATION_FAILED, error);
	}
}

export async function addImageToNote(noteId: string, imageId: string): Promise<void> {
	try {
		noteLogger.info('➕ Conectando imagen a nota a través de entidad intermedia');

		// Verificar si la nota existe
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

		// Aquí podríamos implementar una estrategia como crear un "Concept" que vincule
		// a la imagen y la nota, o alguna otra entidad que cumpla nuestro propósito
		noteLogger.info('🔄 Se requiere una implementación específica según el modelo de negocio');

		await emit({
			type: 'notes:modified',
			id: noteId,
			imageId,
			data: { action: 'addImage' },
		});
		statsEventEmitter.emit(STATS_EVENTS.NOTE_CHANGE);

		noteLogger.info('✅ Revisa la implementación según el modelo de negocio');
		await revalidateAllPaths();
	} catch (error) {
		noteLogger.error('❌ Error:', error);
		throw createNoteError('Operación no implementada correctamente', NoteErrorCode.OPERATION_FAILED, error);
	}
}

export async function removeNoteFromImage(noteId: string, imageId: string): Promise<void> {
	try {
		noteLogger.info('➖ Desconectando imagen de nota a través de entidad intermedia');

		// Verificar si la nota existe
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

		// Aquí podríamos implementar la eliminación del vínculo a través de la entidad intermedia
		noteLogger.info('🔄 Se requiere una implementación específica según el modelo de negocio');

		await emit({
			type: 'notes:modified',
			id: noteId,
			imageId,
			data: { action: 'removeImage' },
		});
		statsEventEmitter.emit(STATS_EVENTS.NOTE_CHANGE);

		noteLogger.info('✅ Revisa la implementación según el modelo de negocio');
		await revalidateAllPaths();
	} catch (error) {
		noteLogger.error('❌ Error:', error);
		throw createNoteError('Operación no implementada correctamente', NoteErrorCode.OPERATION_FAILED, error);
	}
}
