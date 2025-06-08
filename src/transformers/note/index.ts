/**
 * @file Índice de transformadores para la entidad Note
 * @module transformers/note
 */

import { DEFAULT_VIEW_CONFIG } from '@/lib/constants';
import { EntityError, EntityErrorCode } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import type {
	NoteComplete,
	NoteCreateInput,
	NoteFilters,
	NoteSearchOptions,
	NoteSearchResult,
	NoteUpdateInput,
} from '@/types/entities/note/types';
import { TransformerError } from '@/utils/transformers/errors';
import {
	mapCreateNoteDataToPrisma,
	mapNoteFiltersToPrisma,
	mapNoteSearchOptionsToPrisma,
	mapUpdateNoteDataToPrisma,
} from './mappers';
import { fromPrismaNote, validateNote } from './serializers';

// const logger = serverLogger.withContext('NoteTransformer'); // Comentado o eliminado si no se usa más

/**
 * Busca notas según los filtros proporcionados
 */
export async function searchNotes(
	filters: NoteFilters = {},
	options: NoteSearchOptions = {}
): Promise<NoteSearchResult> {
	try {
		const { page = 1, pageSize = DEFAULT_VIEW_CONFIG.pageSize, sortBy = 'updatedAt', sortOrder = 'desc' } = options;

		// Limitar el tamaño de página
		const limitedPageSize = Math.min(pageSize, 100);

		// Obtener argumentos para Prisma
		const prismaArgs = mapNoteSearchOptionsToPrisma({
			...options,
			pageSize: limitedPageSize,
			page,
		});

		// Convertir filtros a formato Prisma
		const whereConditions = mapNoteFiltersToPrisma(filters);
		prismaArgs.where = whereConditions;

		// Agregar filtro para incluir/excluir inactivos
		if (!options.includeInactive) {
			prismaArgs.where = {
				...prismaArgs.where,
				isActive: true,
			};
		}

		// Ejecutar consulta
		const [notes, totalCount] = await Promise.all([
			prisma.note.findMany(prismaArgs),
			prisma.note.count({ where: whereConditions }),
		]);

		// Calcular metadata de paginación
		const totalPages = Math.ceil(totalCount / limitedPageSize);
		const hasMore = page < totalPages;

		// Mapear resultados
		const items = notes.map((note) => fromPrismaNote(note, { includeUI: true }));

		return {
			items,
			pagination: {
				page,
				pageSize: limitedPageSize,
				totalItems: totalCount,
				totalPages,
				hasMore,
			},
		};
	} catch (error) {
		logger.error('Error buscando notas:', error);
		throw new TransformerError('Error al buscar notas', { cause: error });
	}
}

/**
 * Obtiene una nota por su ID
 */
export async function getNoteById(
	id: string,
	options: {
		includeRelations?: boolean;
		includeUI?: boolean;
		throwIfNotFound?: boolean;
	} = {}
): Promise<NoteComplete | null> {
	try {
		const { includeRelations = false, includeUI = false, throwIfNotFound = true } = options;

		// Construir opciones de inclusión de relaciones
		const include = includeRelations
			? {
					images: true,
					videos: true,
					albums: true,
					collections: true,
					tags: true,
					characters: true,
					places: true,
					worldItems: true,
					concepts: true,
					prompts: true,
					wildcards: true,
					properties: true,
					groups: true,
					_count: {
						select: {
							images: true,
							videos: true,
							albums: true,
							collections: true,
							tags: true,
							characters: true,
							places: true,
							worldItems: true,
							concepts: true,
							prompts: true,
							wildcards: true,
							properties: true,
							groups: true,
						},
					},
				}
			: undefined;

		// Buscar nota
		const note = await prisma.note.findUnique({
			where: { id },
			include,
		});

		// Si no existe y se debe lanzar error
		if (!note && throwIfNotFound) {
			throw new EntityError(`Nota con ID ${id} no encontrada`, EntityErrorCode.NOT_FOUND);
		}

		// Si no existe, devolver null
		if (!note) {
			return null;
		}

		// Transformar a formato completo
		return fromPrismaNote(note, {
			includeRelations,
			includeUI,
			deserializeFields: true,
		});
	} catch (error) {
		if (error instanceof EntityError && error.code === EntityErrorCode.NOT_FOUND) {
			throw error;
		}
		logger.error(`Error obteniendo nota ${id}:`, error);
		throw new TransformerError(`Error al obtener nota ${id}`, { cause: error });
	}
}

/**
 * Obtiene varias notas por sus IDs
 */
export async function getNotesByIds(
	ids: string[],
	options: {
		includeRelations?: boolean;
		includeUI?: boolean;
	} = {}
): Promise<NoteComplete[]> {
	try {
		const { includeRelations = false, includeUI = false } = options;

		// Si no hay IDs, devolver array vacío
		if (!ids.length) {
			return [];
		}

		// Construir opciones de inclusión de relaciones
		const include = includeRelations
			? {
					images: true,
					videos: true,
					albums: true,
					collections: true,
					tags: true,
					characters: true,
					places: true,
					worldItems: true,
					concepts: true,
					prompts: true,
					wildcards: true,
					properties: true,
					groups: true,
					_count: {
						select: {
							images: true,
							videos: true,
							albums: true,
							collections: true,
							tags: true,
							characters: true,
							places: true,
							worldItems: true,
							concepts: true,
							prompts: true,
							wildcards: true,
							properties: true,
							groups: true,
						},
					},
				}
			: undefined;

		// Buscar notas
		const notes = await prisma.note.findMany({
			where: {
				id: { in: ids },
				isActive: true,
			},
			include,
		});

		// Transformar a formato completo
		return notes.map((note) =>
			fromPrismaNote(note, {
				includeRelations,
				includeUI,
				deserializeFields: true,
			})
		);
	} catch (error) {
		logger.error('Error obteniendo notas por IDs:', error);
		throw new TransformerError('Error al obtener notas por IDs', { cause: error });
	}
}

/**
 * Crea una nueva nota
 */
export async function createNote(data: NoteCreateInput): Promise<NoteComplete> {
	try {
		// Validar datos
		validateNote(data);

		// Transformar a formato Prisma
		const prismaData = mapCreateNoteDataToPrisma(data);

		// Crear nota
		const note = await prisma.note.create({
			data: prismaData,
			include: {
				_count: {
					select: {
						images: true,
						videos: true,
						albums: true,
						collections: true,
						tags: true,
						characters: true,
						places: true,
						worldItems: true,
						concepts: true,
						prompts: true,
						wildcards: true,
						properties: true,
						groups: true,
					},
				},
			},
		});

		// Transformar a formato completo
		return fromPrismaNote(note, {
			includeUI: true,
			includeRelations: true,
			deserializeFields: true,
		});
	} catch (error) {
		logger.error('Error creando nota:', error);
		throw new TransformerError('Error al crear nota', { cause: error });
	}
}

/**
 * Actualiza una nota existente
 */
export async function updateNote(id: string, data: NoteUpdateInput): Promise<NoteComplete> {
	try {
		// Verificar que la nota existe
		const existingNote = await prisma.note.findUnique({
			where: { id },
		});

		if (!existingNote) {
			throw new EntityError(`Nota con ID ${id} no encontrada`, EntityErrorCode.NOT_FOUND);
		}

		// Validar los datos de actualización combinados con los existentes
		validateNote({ ...existingNote, ...data });

		// Obtener datos para actualización
		const updateArgs = mapUpdateNoteDataToPrisma(id, data);

		// Actualizar nota
		const updatedNote = await prisma.note.update({
			where: { id },
			data: updateArgs.data,
			include: updateArgs.include,
		});

		// Transformar a formato completo
		return fromPrismaNote(updatedNote, {
			includeUI: true,
			includeRelations: true,
			deserializeFields: true,
		});
	} catch (error) {
		if (error instanceof EntityError && error.code === EntityErrorCode.NOT_FOUND) {
			throw error;
		}
		logger.error(`Error actualizando nota ${id}:`, error);
		throw new TransformerError(`Error al actualizar nota ${id}`, { cause: error });
	}
}

/**
 * Elimina una nota
 */
export async function deleteNote(
	id: string,
	options: {
		softDelete?: boolean;
	} = {}
): Promise<boolean> {
	try {
		const { softDelete = true } = options;

		// Verificar que la nota existe
		const existingNote = await prisma.note.findUnique({
			where: { id },
		});

		if (!existingNote) {
			throw new EntityError(`Nota con ID ${id} no encontrada`, EntityErrorCode.NOT_FOUND);
		}

		if (softDelete) {
			// Soft delete (marcar como inactivo)
			await prisma.note.update({
				where: { id },
				data: {
					isActive: false,
					updatedAt: new Date(),
				},
			});
		} else {
			// Hard delete (borrado físico)
			await prisma.note.delete({
				where: { id },
			});
		}

		return true;
	} catch (error) {
		if (error instanceof EntityError && error.code === EntityErrorCode.NOT_FOUND) {
			throw error;
		}
		logger.error(`Error eliminando nota ${id}:`, error);
		throw new TransformerError(`Error al eliminar nota ${id}`, { cause: error });
	}
}

/**
 * Transforma una nota para su uso en relaciones
 */
export function toRelatedNote(
	note: Record<string, any>,
	options: {
		includeDetails?: boolean;
	} = {}
): Record<string, any> {
	try {
		const { includeDetails = false } = options;

		// Datos básicos
		const relatedNote = {
			id: note.id,
			title: note.title || 'Sin título',
			type: 'note',
		};

		// Si se solicitan detalles, incluir más información
		if (includeDetails) {
			return {
				...relatedNote,
				emoji: note.emoji || '📝',
				color: note.color || '#3b82f6',
				category: note.category || 'general',
				excerpt: note.excerpt || note.content?.substring(0, 100) || '',
				isFavorite: note.favorite || note.isFavorite || false,
				createdAt: note.createdAt,
				updatedAt: note.updatedAt,
			};
		}

		return relatedNote;
	} catch (error) {
		logger.error('Error creando nota relacionada:', error);
		// En caso de error, devolver al menos el ID
		return {
			id: note.id,
			title: 'Error',
			type: 'note',
		};
	}
}
