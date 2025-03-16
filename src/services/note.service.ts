import type { NoteCreate } from '@/app/actions/notes/note.actions';
import { serverLogger } from '@/lib/logger/server-logger';
import { prisma } from '@/lib/prisma';
import { type EventType, emit } from '@/lib/server/events.server';
import type { Note } from '@prisma/client';
import type { Prisma } from '@prisma/client';

const noteLogger = serverLogger.withContext('NoteService');

// Constantes para los tipos de eventos
const EVENTS = {
	NOTE_CREATED: 'note:created',
	NOTE_UPDATED: 'note:updated',
	NOTE_DELETED: 'note:deleted',
	NOTES_CHANGED: 'notes:changed',
};

// Mapeo de eventos a EventType
const EVENT_TYPE_MAPPING: Record<string, EventType> = {
	[EVENTS.NOTE_CREATED]: 'notes:modified',
	[EVENTS.NOTE_UPDATED]: 'notes:modified',
	[EVENTS.NOTE_DELETED]: 'notes:modified',
	[EVENTS.NOTES_CHANGED]: 'notes:modified',
};

interface NoteFilters {
	category?: string;
	priority?: number;
	status?: string;
	search?: string;
	tags?: string[];
	sortBy?: 'createdAt' | 'title' | 'category' | 'priority' | 'status';
	sortOrder?: 'asc' | 'desc';
	page?: number;
	pageSize?: number;
}

interface NoteStats {
	total: number;
	byCategory: Record<string, number>;
	byPriority: Record<number, number>;
	byStatus: Record<string, number>;
	byTag: Record<string, number>;
}

interface NoteResults {
	items: Note[];
	total: number;
	page: number;
	pageSize: number;
	stats: NoteStats;
}

/**
 * Servicio para gestionar las notas
 * Migrado a usar serverEvents en lugar de EventEmitter
 */
export const NoteService = {
	async createNote(data: NoteCreate): Promise<Note> {
		try {
			const note = await prisma.note.create({
				data,
			});

			// Emitir eventos con el nuevo sistema
			await emit({
				type: EVENT_TYPE_MAPPING[EVENTS.NOTE_CREATED],
				data: { action: 'create', entity: note, eventType: EVENTS.NOTE_CREATED },
			});

			await emit({
				type: EVENT_TYPE_MAPPING[EVENTS.NOTES_CHANGED],
				data: { action: 'change', eventType: EVENTS.NOTES_CHANGED },
			});

			return note;
		} catch (error) {
			noteLogger.error('Error creating note:', { data, error });
			throw new Error('Error al crear nota');
		}
	},

	async updateNote(id: string, data: Partial<NoteCreate>): Promise<Note> {
		try {
			const note = await prisma.note.update({
				where: { id },
				data,
			});

			// Emitir eventos con el nuevo sistema
			await emit({
				type: EVENT_TYPE_MAPPING[EVENTS.NOTE_UPDATED],
				data: { action: 'update', entity: note, eventType: EVENTS.NOTE_UPDATED },
			});

			await emit({
				type: EVENT_TYPE_MAPPING[EVENTS.NOTES_CHANGED],
				data: { action: 'change', eventType: EVENTS.NOTES_CHANGED },
			});

			return note;
		} catch (error) {
			noteLogger.error('Error updating note:', { id, data, error });
			throw new Error('Error al actualizar nota');
		}
	},

	async deleteNote(id: string): Promise<void> {
		try {
			const note = await prisma.note.delete({
				where: { id },
			});

			// Emitir eventos con el nuevo sistema
			await emit({
				type: EVENT_TYPE_MAPPING[EVENTS.NOTE_DELETED],
				data: { action: 'delete', entity: note, eventType: EVENTS.NOTE_DELETED },
			});

			await emit({
				type: EVENT_TYPE_MAPPING[EVENTS.NOTES_CHANGED],
				data: { action: 'change', eventType: EVENTS.NOTES_CHANGED },
			});
		} catch (error) {
			noteLogger.error('Error deleting note:', { id, error });
			throw new Error('Error al eliminar nota');
		}
	},

	async getNote(id: string): Promise<Note | null> {
		try {
			return await prisma.note.findUnique({
				where: { id },
			});
		} catch (error) {
			noteLogger.error('Error getting note:', { id, error });
			throw new Error('Error al obtener nota');
		}
	},

	async getNotes(filters: NoteFilters = {}): Promise<NoteResults> {
		try {
			const {
				category,
				priority,
				status,
				search,
				tags,
				sortBy = 'createdAt',
				sortOrder = 'desc',
				page = 0,
				pageSize = 50,
			} = filters;

			// Construir where
			const where: Prisma.NoteWhereInput = {};
			if (category) {
				where.category = category;
			}
			if (priority !== undefined) {
				where.priority = priority;
			}
			if (status) {
				where.status = status;
			}
			if (search) {
				where.OR = [{ title: { contains: search } }, { content: { contains: search } }];
			}
			if (tags && tags.length > 0) {
				// Convertimos el array a un string JSON para compararlo con la columna tags
				const tagsJson = JSON.stringify(tags);
				where.tags = {
					contains: tagsJson.substring(1, tagsJson.length - 1), // Quitamos los corchetes
				};
			}

			// Obtener total
			const total = await prisma.note.count({ where });

			// Obtener notas
			const notes = await prisma.note.findMany({
				where,
				orderBy: {
					[sortBy]: sortOrder,
				},
				skip: page * pageSize,
				take: pageSize,
			});

			// Obtener estadísticas
			const stats = await this.getNoteStats();

			return {
				items: notes,
				total,
				page,
				pageSize,
				stats,
			};
		} catch (error) {
			noteLogger.error('Error getting notes:', { filters, error });
			throw new Error('Error al obtener notas');
		}
	},

	async getNoteStats(): Promise<NoteStats> {
		try {
			const total = await prisma.note.count();

			// Agrupar por categoría
			const byCategory = await prisma.note.groupBy({
				by: ['category'],
				_count: true,
			});

			// Agrupar por prioridad
			const byPriority = await prisma.note.groupBy({
				by: ['priority'],
				_count: true,
			});

			// Agrupar por estado
			const byStatus = await prisma.note.groupBy({
				by: ['status'],
				_count: true,
			});

			// Obtener todos los tags únicos y su conteo
			const notes = await prisma.note.findMany({
				select: {
					tags: true,
				},
			});

			const tagCounts: Record<string, number> = {};
			for (const note of notes) {
				const tags = JSON.parse(note.tags || '[]') as string[];
				for (const tag of tags) {
					tagCounts[tag] = (tagCounts[tag] || 0) + 1;
				}
			}

			return {
				total,
				byCategory: Object.fromEntries(byCategory.map((item) => [item.category, item._count])),
				byPriority: Object.fromEntries(byPriority.map((item) => [item.priority, item._count])),
				byStatus: Object.fromEntries(byStatus.map((item) => [item.status, item._count])),
				byTag: tagCounts,
			};
		} catch (error) {
			noteLogger.error('Error getting note stats:', error);
			throw new Error('Error al obtener estadísticas de notas');
		}
	},
};

export const noteService = NoteService;
