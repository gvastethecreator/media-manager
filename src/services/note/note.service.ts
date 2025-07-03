// Drizzle imports


import { prisma } from '@/lib/database/prisma';
import { db } from '@/lib/drizzle';
import { notes } from '@/lib/drizzle/schema';
import { serverLogger } from '@/lib/logger/server-logger';
import { type EventType, emit } from '@/lib/server/events.server';
import { fromPrismaNote } from '@/transformers/note';
import { mapCreateNoteDataToPrisma, mapUpdateNoteDataToPrisma } from '@/transformers/note/mappers';
import type { NoteComplete, NoteCreateInput, NoteUpdateInput, NoteWithStats } from '@/types/entities/note';
import { and, asc, count, desc, eq, like, or } from 'drizzle-orm';

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

			// Transformar a formato compatible con Prisma
			const transformedNote = {
				...drizzleNote[0],
				// Mapear campos para compatibilidad con transformador
				name: drizzleNote[0].title, // Mapear title -> name para compatibilidad
				description: '', // Campo no existe en BD real
				emoji: '📝', // Campo no existe en BD real
				color: '#3b82f6', // Campo no existe en BD real
				isPublic: false, // Campo no existe en BD real
				totalImages: 0, // Campo no existe en BD real
				totalVideos: 0, // Campo no existe en BD real
				type: 'general', // Campo no existe en BD real
				tags: '[]', // Campo no existe en BD real
				dueDate: null, // Campo no existe en BD real
				completedAt: null, // Campo no existe en BD real
				parentId: null, // Campo no existe en BD real
				isFavorite: Boolean(drizzleNote[0].isFavorite),
				// Counts vacíos por ahora (TODO: implementar subqueries)
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

			// **VALIDACIÓN DUAL EN DESARROLLO**
			if (process.env.NODE_ENV === 'development') {
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

					if (note && transformedNote) {
						noteLogger.info('✅ Validación dual exitosa getNote:', { id });
					} else if (!note && !transformedNote) {
						noteLogger.info('✅ Validación dual exitosa getNote (ambos null):', { id });
					} else {
						noteLogger.warn('⚠️ Diferencia en getNote:', {
							drizzleFound: !!transformedNote,
							prismaFound: !!note
						});
					}
				} catch (validationError) {
					noteLogger.error('❌ Error en validación dual getNote:', validationError);
				}
			}

			// Transformar usando el transformador canónico
			const result = fromPrismaNote(transformedNote, {
				includeRelations: true,
				includeUI: true,
				deserializeFields: true,
			});

			noteLogger.info(`✅ Nota encontrada: ${result.name}`);
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
			const conditions = [];

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
				conditions.push(
					or(
						like(notes.title, `%${search}%`),
						like(notes.content, `%${search}%`)
					)
				);
			}

			const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

			// Determinar orden
			const orderByClause = sortOrder === 'desc'
				? desc(notes[sortBy] as any)
				: asc(notes[sortBy] as any);

			// Ejecutar consultas en paralelo
			const [drizzleNotes, totalCount] = await Promise.all([
				db.select({
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

				db.select({ count: count() })
				.from(notes)
				.where(whereClause)
				.then(result => result[0]?.count || 0)
			]);

			// Transformar notas de Drizzle al formato esperado
			const transformedNotes = drizzleNotes.map(note => ({
				...note,
				// Mapear campos para compatibilidad con transformador
				name: note.title, // Mapear title -> name para compatibilidad
				description: '', // Campo no existe en BD real
				emoji: '📝', // Campo no existe en BD real
				color: '#3b82f6', // Campo no existe en BD real
				isPublic: false, // Campo no existe en BD real
				totalImages: 0, // Campo no existe en BD real
				totalVideos: 0, // Campo no existe en BD real
				type: 'general', // Campo no existe en BD real
				tags: '[]', // Campo no existe en BD real
				dueDate: null, // Campo no existe en BD real
				completedAt: null, // Campo no existe en BD real
				parentId: null, // Campo no existe en BD real
				isFavorite: Boolean(note.isFavorite),
				// Counts vacíos por ahora (TODO: implementar subqueries)
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
			}));

			// **VALIDACIÓN DUAL EN DESARROLLO**
			if (process.env.NODE_ENV === 'development') {
				try {
					const prismaTotal = await prisma.note.count();
					noteLogger.info('✅ Validación dual getNotes:', {
						drizzleTotal: totalCount,
						prismaTotal,
						drizzleResults: drizzleNotes.length
					});
				} catch (validationError) {
					noteLogger.error('❌ Error en validación dual getNotes:', validationError);
				}
			}

			// Transformar notas usando transformador y construir NoteWithStats manualmente
			const items: NoteWithStats[] = transformedNotes.map((note) => {
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
						completionScore: Math.min(100, Math.max(0, totalItems * 10 + noteComplete.content.length / 10)),
						lastUpdated: noteComplete.updatedAt,
					},
					excerpt: noteComplete.content.substring(0, 150) + (noteComplete.content.length > 150 ? '...' : ''),
					formattedDate: noteComplete.updatedAt.toLocaleDateString(),
					priorityLabel: this.getPriorityLabel(noteComplete.priority),
					statusLabel: this.getStatusLabel(noteComplete.status),
					categoryLabel: this.getCategoryLabel(noteComplete.category),
				};
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

export const noteService = NoteService;
