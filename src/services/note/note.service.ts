import { prisma } from '@/lib/database/prisma';
import { serverLogger } from '@/lib/logger/server-logger';
import { type EventType, emit } from '@/lib/server/events.server';
import { fromPrismaNote } from '@/transformers/note';
import {
    mapCreateNoteDataToPrisma,
    mapUpdateNoteDataToPrisma
} from '@/transformers/note/mappers';
import type {
    NoteComplete,
    NoteCreateInput,
    NoteUpdateInput,
    NoteWithStats
} from '@/types/entities/note';
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

interface NoteServiceFilters {
	category?: string;
	priority?: number;
	status?: string;
	search?: string;
	sortBy?: 'createdAt' | 'title' | 'category' | 'priority' | 'status';
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
export const NoteService = {
	async createNote(data: NoteCreateInput): Promise<NoteComplete> {
		try {
			// Usar el transformador para mapear los datos
			const prismaData = mapCreateNoteDataToPrisma(data);

			const note = await prisma.note.create({
				data: prismaData,
				include: {
					_count: {
						select: {
							images: true,
							albums: true,
							collections: true,
							characters: true,
							places: true,
							worldItems: true,
							concepts: true,
							prompts: true,
							groups: true,
							properties: true,
							wildcards: true,
						},
					},
				},
			});

			// Transformar usando el transformador canónico
			const noteComplete = fromPrismaNote(note, {
				includeRelations: true,
				includeUI: true,
				deserializeFields: true,
			});

			// Emitir eventos con el nuevo sistema
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
			// Usar el transformador para mapear los datos
			const { data: prismaData, include } = mapUpdateNoteDataToPrisma(id, data);

			const note = await prisma.note.update({
				where: { id },
				data: prismaData,
				include,
			});

			// Transformar usando el transformador canónico
			const noteComplete = fromPrismaNote(note, {
				includeRelations: true,
				includeUI: true,
				deserializeFields: true,
			});

			// Emitir eventos con el nuevo sistema
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
			await prisma.note.delete({
				where: { id },
			});

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
			const note = await prisma.note.findUnique({
				where: { id },
				include: {
					_count: {
						select: {
							images: true,
							albums: true,
							collections: true,
							characters: true,
							places: true,
							worldItems: true,
							concepts: true,
							prompts: true,
							groups: true,
							properties: true,
							wildcards: true,
						},
					},
				},
			});

			if (!note) {
				return null;
			}

			// Transformar usando el transformador canónico
			return fromPrismaNote(note, {
				includeRelations: true,
				includeUI: true,
				deserializeFields: true,
			});
		} catch (error) {
			noteLogger.error('Error getting note:', { id, error });
			throw new Error('Error al obtener nota');
		}
	},

	async getNotes(filters: NoteServiceFilters = {}): Promise<NoteResults> {
		try {
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

			// Construir where usando filtros compatibles
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

			// Obtener total
			const total = await prisma.note.count({ where });

			// Obtener notas con conteos
			const notes = await prisma.note.findMany({
				where,
				include: {
					_count: {
						select: {
							images: true,
							albums: true,
							collections: true,
							characters: true,
							places: true,
							worldItems: true,
							concepts: true,
							prompts: true,
							groups: true,
							properties: true,
							wildcards: true,
						},
					},
				},
				orderBy: {
					[sortBy]: sortOrder,
				},
				skip: page * pageSize,
				take: pageSize,
			});

			// Transformar notas usando transformador y construir NoteWithStats manualmente
			const items: NoteWithStats[] = notes.map((note) => {
				const noteComplete = fromPrismaNote(note, {
					includeRelations: true,
					includeUI: true,
					deserializeFields: true,
				});

				// Calcular estadísticas básicas
				const totalItems = Object.values(note._count).reduce((sum, count) => sum + count, 0);

				// Convertir a NoteWithStats siguiendo la estructura esperada
				return {
					...noteComplete,
					statistics: {
						totalItems,
						totalImages: note._count.images || 0,
						totalVideos: 0, // No incluido en schema actual
						totalAlbums: note._count.albums || 0,
						totalCollections: note._count.collections || 0,
						totalTags: 0, // No incluido en schema actual
						totalCharacters: note._count.characters || 0,
						totalPlaces: note._count.places || 0,
						totalWorldItems: note._count.worldItems || 0,
						totalConcepts: note._count.concepts || 0,
						totalPrompts: note._count.prompts || 0,
						totalWildcards: note._count.wildcards || 0,
						totalProperties: note._count.properties || 0,
						totalGroups: note._count.groups || 0,
						wordCount: noteComplete.content.split(/\s+/).length,
						characterCount: noteComplete.content.length,
						readingTime: Math.ceil(noteComplete.content.split(/\s+/).length / 200), // aprox. 200 palabras por minuto
						completionScore: Math.min(100, Math.max(0, (totalItems * 10) + (noteComplete.content.length / 10))),
						lastUpdated: noteComplete.updatedAt,
					},
					excerpt: noteComplete.content.substring(0, 150) + (noteComplete.content.length > 150 ? '...' : ''),
					formattedDate: noteComplete.updatedAt.toLocaleDateString(),
					priorityLabel: this.getPriorityLabel(noteComplete.priority),
					statusLabel: this.getStatusLabel(noteComplete.status),
					categoryLabel: this.getCategoryLabel(noteComplete.category),
				};
			});

			return {
				items,
				total,
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
			pending: 'Pendiente'
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
			todo: 'Por Hacer'
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

export const noteService = NoteService;
