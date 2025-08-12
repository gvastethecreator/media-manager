/**
 * @file Servicio para la gestión de notas
 * @module services/note
 */

import * as crypto from 'crypto';
import { and, asc, count, desc, eq, like, or } from 'drizzle-orm';
import { db } from '@/lib/drizzle';
import { notes } from '@/lib/drizzle/schema/index';
import { serverLogger } from '@/lib/logger/server-logger';
import { type EventType, emit } from '@/lib/server/events.server';
import { createDefaultEntityStats } from '@/lib/utils';
import { fromDrizzleNoteWithCounts } from '@/transformers/note/transformer';
import type { NoteComplete, NoteCreateInput, NoteUpdateInput, NoteWithStats } from '@/types/entities/note';

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

interface NoteServiceFilters {
	category?: string;
	priority?: number;
	status?: string;
	search?: string;
	sortBy?: 'createdAt' | 'updatedAt' | 'title' | 'category' | 'priority' | 'status';
	sortOrder?: 'asc' | 'desc';
	page?: number;
	pageSize?: number;
}

interface NoteResults {
	items: NoteWithStats[];
	total: number;
	page: number;
	pageSize: number;
}

/**
 * Servicio para gestionar las notas
 * Refactorizado para usar tipos canónicos y transformadores
 */
const NoteServiceImpl = {
	async createNote(data: NoteCreateInput): Promise<NoteComplete> {
		try {
			const [newNote] = await db
				.insert(notes)
				.values({
					id: crypto.randomUUID(),
					title: data.title,
					content: data.content || '',
					category: data.category || 'general',
					priority: data.priority || 0,
					status: data.status || 'active',
					featuredImage: data.featuredImage || null,
					isFavorite: data.isFavorite,
					createdAt: new Date(),
					updatedAt: new Date(),
					presetId: data.presetId || null,
				})
				.returning();

			const noteComplete: NoteComplete = {
				...newNote,
				name: newNote.title,
				description: '',
				emoji: '📝',
				color: '#3b82f6',
				totalImages: 0,
				totalVideos: 0,
				type: 'general',
				tags: [],
				_count: {
					images: 0,
					albums: 0,
					collections: 0,
					characters: 0,
					places: 0,
					worldItems: 0,
					concepts: 0,
					prompts: 0,
					groups: 0,
					properties: 0,
					wildcards: 0,
				},
			};

			await emit({
				type: EVENT_TYPE_MAPPING[EVENTS.NOTE_CREATED],
				data: { action: 'create', entity: noteComplete, eventType: EVENTS.NOTE_CREATED },
			});

			await emit({
				type: EVENT_TYPE_MAPPING[EVENTS.NOTES_CHANGED],
				data: { action: 'change', eventType: EVENTS.NOTES_CHANGED },
			});

			return noteComplete;
		} catch (error) {
			noteLogger.error('Error creating note:', { data, error });
			throw new Error('Error al crear nota');
		}
	},

	async updateNote(id: string, data: NoteUpdateInput): Promise<NoteComplete> {
		try {
			const [updatedNote] = await db
				.update(notes)
				.set({
					title: data.title,
					content: data.content || '',
					category: data.category || 'general',
					priority: data.priority || 0,
					status: data.status || 'active',
					featuredImage: data.featuredImage || null,
					isFavorite: data.isFavorite,
					updatedAt: new Date(),
				})
				.where(eq(notes.id, id))
				.returning();

			if (!updatedNote) {
				throw new Error('Nota no encontrada');
			}

			const noteComplete: NoteComplete = {
				...updatedNote,
				name: updatedNote.title,
				description: '',
				emoji: '📝',
				color: '#3b82f6',
				totalImages: 0,
				totalVideos: 0,
				type: 'general',
				tags: [],
				_count: {
					images: 0,
					albums: 0,
					collections: 0,
					characters: 0,
					places: 0,
					worldItems: 0,
					concepts: 0,
					prompts: 0,
					groups: 0,
					properties: 0,
					wildcards: 0,
				},
			};

			await emit({
				type: EVENT_TYPE_MAPPING[EVENTS.NOTE_UPDATED],
				data: { action: 'update', entity: noteComplete, eventType: EVENTS.NOTE_UPDATED },
			});

			await emit({
				type: EVENT_TYPE_MAPPING[EVENTS.NOTES_CHANGED],
				data: { action: 'change', eventType: EVENTS.NOTES_CHANGED },
			});

			return noteComplete;
		} catch (error) {
			noteLogger.error('Error updating note:', { id, data, error });
			throw new Error('Error al actualizar nota');
		}
	},

	async deleteNote(id: string): Promise<void> {
		try {
			await db.delete(notes).where(eq(notes.id, id));

			// Emitir eventos con el nuevo sistema
			await emit({
				type: EVENT_TYPE_MAPPING[EVENTS.NOTE_DELETED],
				data: { action: 'delete', entity: { id }, eventType: EVENTS.NOTE_DELETED },
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

	async getNote(id: string): Promise<NoteComplete | null> {
		try {
			// **MIGRACIÓN A DRIZZLE**
			noteLogger.info(`🔍 Obteniendo nota por ID: ${id}`);

			const drizzleNote = await db
				.select({
					id: notes.id,
					title: notes.title, // Campo real
					content: notes.content,
					category: notes.category,
					priority: notes.priority, // INTEGER en BD real
					status: notes.status,
					featuredImage: notes.featuredImage,
					isFavorite: notes.isFavorite,
					createdAt: notes.createdAt,
					updatedAt: notes.updatedAt,
					presetId: notes.presetId, // Campo real
				})
				.from(notes)
				.where(eq(notes.id, id))
				.limit(1);

			if (drizzleNote.length === 0) {
				noteLogger.warn(`Nota no encontrada: ${id}`);
				return null;
			}

			const rawNote = drizzleNote[0];

			const result: NoteComplete = {
				...rawNote,
				name: rawNote.title,
				description: '',
				emoji: '📝',
				color: '#3b82f6',
				totalImages: 0,
				totalVideos: 0,
				type: 'general',
				tags: [],
				dueDate: null,
				completedAt: null,
				parentId: null,
				isFavorite: Boolean(rawNote.isFavorite),
				_count: {
					images: 0,
					albums: 0,
					collections: 0,
					characters: 0,
					places: 0,
					worldItems: 0,
					concepts: 0,
					prompts: 0,
					groups: 0,
					properties: 0,
					wildcards: 0,
				},
			};

			noteLogger.info(`✅ Nota encontrada: ${result.title}`);
			return result;
		} catch (error) {
			noteLogger.error('Error getting note:', { id, error });
			throw new Error('Error al obtener nota');
		}
	},

	async getNotes(filters: NoteServiceFilters = {}): Promise<NoteResults> {
		try {
			// **MIGRACIÓN A DRIZZLE**
			noteLogger.info('🔍 Obteniendo notas con filtros:', filters);

			const {
				category,
				priority,
				status,
				search,
				sortBy = 'createdAt',
				sortOrder = 'desc',
				page = 0,
				pageSize = 50,
			} = filters;

			// Construir condiciones WHERE para Drizzle
			const conditions: any[] = [];

			if (category) {
				conditions.push(eq(notes.category, category));
			}
			if (priority !== undefined) {
				// priority es INTEGER en BD real
				conditions.push(eq(notes.priority, priority));
			}
			if (status) {
				conditions.push(eq(notes.status, status));
			}
			if (search) {
				conditions.push(or(like(notes.title, `%${search}%`), like(notes.content, `%${search}%`)));
			}

			const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

			// Determinar orden
			let orderByClause;
			switch (sortBy) {
				case 'title':
					orderByClause = sortOrder === 'desc' ? desc(notes.title) : asc(notes.title);
					break;
				case 'category':
					orderByClause = sortOrder === 'desc' ? desc(notes.category) : asc(notes.category);
					break;
				case 'priority':
					orderByClause = sortOrder === 'desc' ? desc(notes.priority) : asc(notes.priority);
					break;
				case 'status':
					orderByClause = sortOrder === 'desc' ? desc(notes.status) : asc(notes.status);
					break;
				case 'updatedAt':
					orderByClause = sortOrder === 'desc' ? desc(notes.updatedAt) : asc(notes.updatedAt);
					break;
				default:
					orderByClause = sortOrder === 'desc' ? desc(notes.createdAt) : asc(notes.createdAt);
					break;
			}

			// Ejecutar consultas en paralelo
			const [drizzleNotes, totalCount] = await Promise.all([
				db
					.select({
						id: notes.id,
						title: notes.title, // Campo real
						content: notes.content,
						category: notes.category,
						priority: notes.priority, // INTEGER en BD real
						status: notes.status,
						featuredImage: notes.featuredImage,
						isFavorite: notes.isFavorite,
						createdAt: notes.createdAt,
						updatedAt: notes.updatedAt,
						presetId: notes.presetId, // Campo real
					})
					.from(notes)
					.where(whereClause)
					.orderBy(orderByClause)
					.limit(pageSize)
					.offset(page * pageSize),

				db
					.select({ count: count() })
					.from(notes)
					.where(whereClause)
					.then((result: { count: number }[]) => result[0]?.count || 0),
			]);

			const items: NoteWithStats[] = drizzleNotes.map((note: any) => {
				// Crear un objeto NoteComplete para usar con el transformer
				const noteComplete: NoteComplete = {
					...note,
					name: note.title,
					description: '',
					emoji: '📝',
					color: '#3b82f6',
					totalImages: 0,
					totalVideos: 0,
					type: 'general',
					tags: [],
					dueDate: null,
					completedAt: null,
					parentId: null,
					isFavorite: Boolean(note.isFavorite),
					_count: {
						images: 0,
						videos: 0,
						albums: 0,
						collections: 0,
						tags: 0,
						characters: 0,
						places: 0,
						worldItems: 0,
						concepts: 0,
						prompts: 0,
						groups: 0,
						properties: 0,
						wildcards: 0,
					},
				};

				// Usar el transformer para obtener NoteWithStats
				return fromDrizzleNoteWithCounts(noteComplete);
			});

			noteLogger.info(`✅ Notas obtenidas: ${items.length}/${totalCount}`);
			return {
				items,
				total: totalCount,
				page,
				pageSize,
			};
		} catch (error) {
			noteLogger.error('Error getting notes:', { filters, error });
			throw new Error('Error al obtener notas');
		}
	},

	// Métodos auxiliares para las etiquetas
	getPriorityLabel(priority: number): string {
		const labels = { 0: 'Muy Baja', 1: 'Baja', 2: 'Media', 3: 'Alta', 4: 'Muy Alta' };
		return labels[priority as keyof typeof labels] || 'Desconocida';
	},

	getStatusLabel(status: string): string {
		const labels = {
			draft: 'Borrador',
			published: 'Publicada',
			archived: 'Archivada',
			pending: 'Pendiente',
		};
		return labels[status as keyof typeof labels] || status;
	},

	getCategoryLabel(category: string): string {
		const labels = {
			general: 'General',
			story: 'Historia',
			lore: 'Lore',
			mechanics: 'Mecánicas',
			character: 'Personaje',
			place: 'Lugar',
			world_item: 'Objeto del Mundo',
			prompt: 'Prompt',
			idea: 'Idea',
			todo: 'Por Hacer',
		};
		return labels[category as keyof typeof labels] || category;
	},

	// Método mantenido para compatibilidad con la interfaz existing
	async getNotesWithStats(): Promise<NoteWithStats[]> {
		try {
			const result = await this.getNotes();
			return result.items;
		} catch (error) {
			noteLogger.error('Error getting notes with stats:', error);
			throw new Error('Error al obtener notas con estadísticas');
		}
	},
};

/**
 * Clase de servicio para gestión de notas (wrapper para compatibilidad)
 */
export class NoteService {
	async getNotes(filters?: NoteServiceFilters): Promise<{ notes: NoteWithStats[]; total: number }> {
		const result = await NoteServiceImpl.getNotes(filters || {});
		return { notes: result.items, total: result.total };
	}

	async getNoteById(id: string): Promise<NoteWithStats | null> {
		const note = await NoteServiceImpl.getNote(id);
		if (!note) {
			return null;
		}

		// Convertir a NoteWithStats
		const content = note.content || '';
		const wordCount = content.trim() ? content.split(/\s+/).length : 0;
		const characterCount = content.length;
		const readingTime = Math.ceil(wordCount / 200);
		const completionScore = Math.min(100, Math.max(0, wordCount / 10 + characterCount / 100));

		return {
			...note,
			name: note.title,
			description: note.content,
			entityType: 'note' as const,
			stats: (() => {
				const base = createDefaultEntityStats({ type: 'note' });
				return {
					...base,
					noteCount: 1,
					lastUpdated: new Date(),
					wordCount,
					readingTime,
					completionScore,
					isDirectory: false,
					isFile: true,
				};
			})(),
			_count: {
				images: 0,
				videos: 0,
				albums: 0,
				collections: 0,
				tags: 0,
				characters: 0,
				places: 0,
				worldItems: 0,
				concepts: 0,
				prompts: 0,
				wildcards: 0,
				properties: 0,
				groups: 0,
			},
		};
	}

	async createNote(data: NoteCreateInput): Promise<NoteWithStats> {
		const note = await NoteServiceImpl.createNote(data);
		return this.getNoteById(note.id) as Promise<NoteWithStats>;
	}

	async updateNote(id: string, data: NoteUpdateInput): Promise<NoteWithStats | null> {
		try {
			await NoteServiceImpl.updateNote(id, data);
			return this.getNoteById(id);
		} catch (error) {
			if (error instanceof Error && error.message.includes('Nota no encontrada')) {
				return null;
			}
			throw error;
		}
	}

	async deleteNote(id: string): Promise<boolean> {
		try {
			await NoteServiceImpl.deleteNote(id);
			return true;
		} catch (error) {
			return false;
		}
	}

	async getNoteImages(id: string): Promise<unknown[]> {
		// TODO: Implementar lógica para obtener imágenes de la nota
		noteLogger.info(`Obteniendo imágenes de la nota ${id}`);
		return [];
	}

	async getRecentNoteImages(id: string, limit: number): Promise<unknown[]> {
		// TODO: Implementar lógica para obtener imágenes recientes de la nota
		noteLogger.info(`Obteniendo imágenes recientes de la nota ${id} (limit: ${limit})`);
		return [];
	}

	async getNoteCounts(id: string): Promise<Record<string, number>> {
		// TODO: Implementar lógica para obtener conteos de la nota
		noteLogger.info(`Obteniendo conteos de la nota ${id}`);
		return {
			images: 0,
			videos: 0,
			albums: 0,
			collections: 0,
			tags: 0,
		};
	}

	async getNoteStatuses(): Promise<string[]> {
		return ['draft', 'published', 'archived', 'pending'];
	}
}

export const noteService = NoteServiceImpl;

// Exportar instancia de NoteService para compatibilidad con routes
const noteServiceInstance = new NoteService();

// Exportar métodos individuales para compatibilidad con import * as noteService
export const getNotes = noteServiceInstance.getNotes.bind(noteServiceInstance);
export const getNoteById = noteServiceInstance.getNoteById.bind(noteServiceInstance);
export const createNote = noteServiceInstance.createNote.bind(noteServiceInstance);
export const updateNote = noteServiceInstance.updateNote.bind(noteServiceInstance);
export const deleteNote = noteServiceInstance.deleteNote.bind(noteServiceInstance);
export const getNoteImages = noteServiceInstance.getNoteImages.bind(noteServiceInstance);
export const getRecentNoteImages = noteServiceInstance.getRecentNoteImages.bind(noteServiceInstance);
export const getNoteCounts = noteServiceInstance.getNoteCounts.bind(noteServiceInstance);
export const getNoteStatuses = noteServiceInstance.getNoteStatuses.bind(noteServiceInstance);

export default noteServiceInstance;
