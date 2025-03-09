'use server';

import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { emit } from '@/lib/server/events.server';
import { type ServerImage, convertServerImageToFileItem } from '@/services/image-converter.service';
import { STATS_EVENTS, statsEventEmitter } from '@/services/stats.service';
import type { FileItem } from '@/types/file-item';
import type { Image, Note } from '@prisma/client';
import { revalidatePath } from 'next/cache';

const noteLogger = logger.withContext('NoteActions');

const REVALIDATE_PATHS = ['/settings', '/notes', '/notes/[id]'] as const;

const revalidateAllPaths = () => {
	for (const path of REVALIDATE_PATHS) {
		revalidatePath(path);
	}
	noteLogger.info('🔄 Rutas revalidadas');
};

class NoteError extends Error {
	constructor(
		message: string,
		public cause?: unknown
	) {
		super(message);
		this.name = 'NoteError';
	}
}

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

export interface ExtendedNote extends Note {
	characters: {
		images: Image[];
	}[];
	places: {
		images: Image[];
	}[];
	objects: {
		images: Image[];
	}[];
}

export interface NoteWithStats extends Note {
	_count: {
		concepts: number;
		prompts: number;
		characters: number;
		places: number;
		objects: number;
	};
	lastUpdated: Date;
}

export async function getNotes(): Promise<NoteWithStats[]> {
	try {
		noteLogger.info('📝 Obteniendo notas con estadísticas');

		// Obtener notas con conteos y estadísticas
		const notes = await prisma.note.findMany({
			include: {
				_count: {
					select: {
						concepts: true,
						prompts: true,
						characters: true,
						places: true,
						objects: true,
					},
				},
			},
			orderBy: [
				{
					priority: 'desc',
				},
				{
					title: 'asc',
				},
			],
		});

		// Mapear notas a formato con estadísticas
		const notesWithStats = notes.map((note) => ({
			...note,
			_count: note._count,
			lastUpdated: note.updatedAt,
		}));

		noteLogger.info('✅ Notas obtenidas', { count: notes.length });
		return notesWithStats;
	} catch (error) {
		noteLogger.error('❌ Error al obtener notas', error);
		throw new NoteError('No se pudieron obtener las notas');
	}
}

export async function getNote(id: string): Promise<Note> {
	try {
		noteLogger.info('🔍 Obteniendo nota:', id);
		const note = await prisma.note.findUnique({
			where: { id },
			include: {
				_count: {
					select: {
						concepts: true,
						prompts: true,
						characters: true,
						places: true,
						objects: true,
					},
				},
			},
		});

		if (!note) {
			throw new NoteError('Nota no encontrada');
		}

		noteLogger.info('✅ Nota obtenida:', note.title);
		return {
			...note,
			count: Object.values(note._count).reduce((acc, count) => acc + count, 0),
		};
	} catch (error) {
		noteLogger.error('❌ Error al obtener nota:', error);
		if (error instanceof NoteError) {
			throw error;
		}
		throw new NoteError('No se pudo obtener la nota', error);
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

		// Emitir eventos
		await emit({
			type: 'notes:modified',
			data: { action: 'create', note },
		});
		statsEventEmitter.emit(STATS_EVENTS.NOTE_CHANGE);

		noteLogger.info('✅ Nota creada:', note.title);
		revalidateAllPaths();
		return note;
	} catch (error) {
		noteLogger.error('❌ Error al crear nota:', error);
		throw new NoteError('No se pudo crear la nota', error);
	}
}

export async function updateNote(id: string, data: NoteUpdate): Promise<Note> {
	try {
		noteLogger.info('📝 Actualizando nota:', id);
		const note = await prisma.note.update({
			where: { id },
			data,
		});

		// Emitir eventos
		await emit({
			type: 'notes:modified',
			id,
			data: { action: 'update', note },
		});
		statsEventEmitter.emit(STATS_EVENTS.NOTE_CHANGE);

		noteLogger.info('✅ Nota actualizada:', note.title);
		revalidateAllPaths();
		return note;
	} catch (error) {
		noteLogger.error('❌ Error al actualizar nota:', error);
		throw new NoteError('No se pudo actualizar la nota', error);
	}
}

export async function deleteNote(id: string): Promise<void> {
	try {
		noteLogger.info('🗑️ Eliminando nota:', id);
		await prisma.note.delete({
			where: { id },
		});

		// Emitir eventos
		await emit({
			type: 'notes:modified',
			id,
			data: { action: 'delete', id },
		});
		statsEventEmitter.emit(STATS_EVENTS.NOTE_CHANGE);

		noteLogger.info('✅ Nota eliminada');
		revalidateAllPaths();
	} catch (error) {
		noteLogger.error('❌ Error al eliminar nota:', error);
		throw new NoteError('No se pudo eliminar la nota', error);
	}
}

export async function getNoteImages(id: string) {
	try {
		noteLogger.info('🖼️ Obteniendo imágenes de la nota:', id);
		const note = (await prisma.note.findUnique({
			where: { id },
			include: {
				characters: {
					include: {
						images: {
							include: {
								tags: true,
								collections: true,
								albums: true,
								stats: true,
							},
						},
					},
				},
				places: {
					include: {
						images: {
							include: {
								tags: true,
								collections: true,
								albums: true,
								stats: true,
							},
						},
					},
				},
				objects: {
					include: {
						images: {
							include: {
								tags: true,
								collections: true,
								albums: true,
								stats: true,
							},
						},
					},
				},
			},
		})) as ExtendedNote | null;

		if (!note) {
			throw new NoteError('Nota no encontrada');
		}

		const images = [
			...note.characters.flatMap((char) => char.images),
			...note.places.flatMap((place) => place.images),
			...note.objects.flatMap((obj) => obj.images),
		].map((img) => convertServerImageToFileItem(img as ServerImage));

		noteLogger.info(`✅ ${images.length} imágenes obtenidas`);
		return images;
	} catch (error) {
		noteLogger.error('❌ Error al obtener imágenes de la nota:', error);
		throw new NoteError('No se pudieron obtener las imágenes de la nota', error);
	}
}
