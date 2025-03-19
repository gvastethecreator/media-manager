'use server';

import { serverLogger } from '@/lib/logger/server-logger';
import { prisma } from '@/lib/prisma';
import { emit } from '@/lib/server/events.server';
import { STATS_EVENTS, statsEventEmitter } from '@/services/stats.service';
import type { Note } from '@/types/entities/notes';
import type { FileItem } from '@/types/file-item';
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

// Tipos e interfaces
export interface NoteCreate {
	title: string;
	content?: string;
	category?: string;
	priority?: number;
	status?: string;
	tags?: string;
	featuredImage?: string | null;
}

export interface NoteUpdate extends Partial<NoteCreate> {
	id: string;
}

export interface NoteWithImages extends Note {
	images: FileItem[];
}

// Interfaces actualizadas para coincidir con el esquema de Prisma
export interface ExtendedNote extends Omit<Note, 'characters' | 'places' | 'worldItems' | 'concepts' | 'prompts'> {
	concepts?: { id: string; name: string }[];
	prompts?: { id: string; name: string }[];
	characters?: { id: string; name: string }[];
	places?: { id: string; name: string }[];
	worldItems?: { id: string; name: string }[];
}

// Ajustado para coincidir con las propiedades disponibles en el esquema
export interface NoteWithStats extends Note {
	_count: {
		concepts: number;
		prompts: number;
		characters: number;
		places: number;
		worldItems: number;
	};
	lastUpdated: Date;
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

		return notes.map((note) => ({
			...note,
			lastUpdated: note.updatedAt,
		}));
	} catch (error) {
		noteLogger.error('❌ Error al obtener notas', error);
		throw createNoteError('No se pudieron obtener las notas', NoteErrorCode.OPERATION_FAILED, error);
	}
}

export async function getNote(id: string): Promise<Note> {
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

export async function createNote(data: NoteCreate): Promise<Note> {
	try {
		noteLogger.info('📝 Creando nota:', data.title);
		const note = await prisma.note.create({
			data: {
				title: data.title,
				content: data.content || '',
				category: data.category || 'general',
				priority: data.priority || 0,
				status: data.status || 'active',
				tags: data.tags || '[]',
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

export async function updateNote(id: string, data: NoteUpdate): Promise<Note> {
	try {
		noteLogger.info('📝 Actualizando nota:', id);
		const note = await prisma.note.update({
			where: { id },
			data,
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

// En el esquema, no hay una relación directa images en Note
// Esta implementación usa una estrategia alternativa
export async function addNoteToImage(noteId: string, imageId: string): Promise<void> {
	try {
		noteLogger.info('➕ Conectando imagen con nota a través de entidad intermedia');

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
