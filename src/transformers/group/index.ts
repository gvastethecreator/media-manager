/**
 * @file Transformer para la entidad Group
 * @module transformers/group
 */

import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '@/lib/constants';
import { EntityError, EntityErrorCode } from '@/lib/errors';
import { serverLogger } from '@/lib/logger/server-logger';
import { prisma } from '@/lib/prisma';
import type { GroupCreateInput, GroupExtended, GroupSearchResult, GroupUpdateInput } from '@/types/entities/group';
import { TransformerError } from '@/utils/transformers/errors';
import { toGroupListItem } from './mappers';
import { parseGroupFilterObject, toExtendedGroup, toPrismaGroup, validateGroup } from './serializers';

const logger = serverLogger.withContext('GroupTransformer');

/**
 * Busca grupos según los filtros proporcionados
 */
export async function searchGroups(
	filters: Record<string, any> = {},
	options: {
		page?: number;
		pageSize?: number;
		sortBy?: string;
		sortOrder?: 'asc' | 'desc';
		includeInactive?: boolean;
	} = {}
): Promise<GroupSearchResult> {
	try {
		const {
			page = 1,
			pageSize = DEFAULT_PAGE_SIZE,
			sortBy = 'name',
			sortOrder = 'asc',
			includeInactive = false,
		} = options;

		// Limitar el tamaño de página
		const limitedPageSize = Math.min(pageSize, MAX_PAGE_SIZE);

		// Calcular offset para paginación
		const skip = (page - 1) * limitedPageSize;

		// Parsear filtros
		const parsedFilters = parseGroupFilterObject(filters);

		// Agregar filtro para incluir/excluir inactivos
		if (!includeInactive) {
			parsedFilters.isActive = true;
		}

		// Ordenación
		const orderBy = { [sortBy]: sortOrder };

		// Ejecutar consulta
		const [groups, totalCount] = await Promise.all([
			prisma.group.findMany({
				where: parsedFilters,
				orderBy,
				skip,
				take: limitedPageSize,
			}),
			prisma.group.count({
				where: parsedFilters,
			}),
		]);

		// Calcular metadata de paginación
		const totalPages = Math.ceil(totalCount / limitedPageSize);
		const hasMore = page < totalPages;

		// Mapear resultados
		const items = groups.map((group) => toGroupListItem(group));

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
		logger.error('Error buscando grupos:', error);
		throw new TransformerError('Error al buscar grupos');
	}
}

/**
 * Obtiene un grupo por su ID
 */
export async function getGroupById(
	id: string,
	options: {
		includeRelations?: boolean;
		throwIfNotFound?: boolean;
	} = {}
): Promise<GroupExtended | null> {
	try {
		const { includeRelations = false, throwIfNotFound = true } = options;

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
					notes: true,
					wildcards: true,
					properties: true,
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
							notes: true,
							wildcards: true,
							properties: true,
						},
					},
				}
			: undefined;

		// Buscar grupo
		const group = await prisma.group.findUnique({
			where: { id },
			include,
		});

		// Si no existe y se debe lanzar error
		if (!group && throwIfNotFound) {
			throw new EntityError(`Grupo con ID ${id} no encontrado`, EntityErrorCode.NOT_FOUND);
		}

		// Si no existe, devolver null
		if (!group) {
			return null;
		}

		// Transformar a formato extendido
		return toExtendedGroup(group);
	} catch (error) {
		if (error instanceof EntityError && error.code === EntityErrorCode.NOT_FOUND) {
			throw error;
		}
		logger.error(`Error obteniendo grupo ${id}:`, error);
		throw new TransformerError(`Error al obtener grupo ${id}`);
	}
}

/**
 * Obtiene varios grupos por sus IDs
 */
export async function getGroupsByIds(
	ids: string[],
	options: {
		includeRelations?: boolean;
	} = {}
): Promise<GroupExtended[]> {
	try {
		const { includeRelations = false } = options;

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
					notes: true,
					wildcards: true,
					properties: true,
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
							notes: true,
							wildcards: true,
							properties: true,
						},
					},
				}
			: undefined;

		// Buscar grupos
		const groups = await prisma.group.findMany({
			where: {
				id: { in: ids },
			},
			include,
		});

		// Transformar a formato extendido
		return groups.map((group) => toExtendedGroup(group));
	} catch (error) {
		logger.error('Error obteniendo grupos por IDs:', error);
		throw new TransformerError('Error al obtener grupos por IDs');
	}
}

/**
 * Crea un nuevo grupo
 */
export async function createGroup(data: GroupCreateInput): Promise<GroupExtended> {
	try {
		// Validar datos
		validateGroup(data);

		// Transformar a formato Prisma
		const prismaData = toPrismaGroup(data);

		// Crear grupo
		const group = await prisma.group.create({
			data: prismaData as any,
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
						notes: true,
						wildcards: true,
						properties: true,
					},
				},
			},
		});

		// Transformar resultado
		return toExtendedGroup(group);
	} catch (error) {
		logger.error('Error creando grupo:', error);
		throw new TransformerError('Error al crear grupo');
	}
}

/**
 * Actualiza un grupo existente
 */
export async function updateGroup(id: string, data: GroupUpdateInput): Promise<GroupExtended> {
	try {
		// Validar que el grupo existe
		const existingGroup = await prisma.group.findUnique({
			where: { id },
		});

		if (!existingGroup) {
			throw new EntityError(`Grupo con ID ${id} no encontrado`, EntityErrorCode.NOT_FOUND);
		}

		// Validar datos de actualización
		validateGroup({ ...existingGroup, ...data });

		// Transformar a formato Prisma
		const prismaData = toPrismaGroup(data);

		// Actualizar grupo
		const updatedGroup = await prisma.group.update({
			where: { id },
			data: prismaData as any,
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
						notes: true,
						wildcards: true,
						properties: true,
					},
				},
			},
		});

		// Transformar resultado
		return toExtendedGroup(updatedGroup);
	} catch (error) {
		if (error instanceof EntityError && error.code === EntityErrorCode.NOT_FOUND) {
			throw error;
		}
		logger.error(`Error actualizando grupo ${id}:`, error);
		throw new TransformerError(`Error al actualizar grupo ${id}`);
	}
}

/**
 * Elimina un grupo
 */
export async function deleteGroup(
	id: string,
	options: {
		softDelete?: boolean;
	} = {}
): Promise<boolean> {
	try {
		const { softDelete = true } = options;

		// Validar que el grupo existe
		const existingGroup = await prisma.group.findUnique({
			where: { id },
		});

		if (!existingGroup) {
			throw new EntityError(`Grupo con ID ${id} no encontrado`, EntityErrorCode.NOT_FOUND);
		}

		if (softDelete) {
			// Soft delete (marcar como inactivo)
			await prisma.group.update({
				where: { id },
				data: {
					isActive: false,
					updatedAt: new Date(),
				},
			});
		} else {
			// Hard delete (borrado físico)
			await prisma.group.delete({
				where: { id },
			});
		}

		return true;
	} catch (error) {
		if (error instanceof EntityError && error.code === EntityErrorCode.NOT_FOUND) {
			throw error;
		}
		logger.error(`Error eliminando grupo ${id}:`, error);
		throw new TransformerError(`Error al eliminar grupo ${id}`);
	}
}

/**
 * Transforma un grupo para su uso en relaciones
 */
export function toRelatedGroup(
	group: Record<string, any>,
	_options: {
		includeDetails?: boolean;
	} = {}
): Record<string, any> {
	try {
		return mapGroupToRelatedGroup(group);
	} catch (error) {
		throw handleTransformerError(error);
	}
}

// Objeto de compatibilidad para código anterior
export const GroupTransformer = {
	searchGroups,
	getGroupById,
	getGroupsByIds,
	createGroup,
	updateGroup,
	deleteGroup,
	toRelatedGroup,
};

export default GroupTransformer;

// Exportar otros mappers y converters
// export {
// 	mapCreateGroupDataToPrisma,
// 	mapGroupFiltersToPrisma,
// 	mapGroupToRelatedGroup,
// 	mapUpdateGroupDataToPrisma,
// 	transformCompleteGroupToPrisma,
// 	transformGroupToPrisma,
// } from './mappers';

// Re-exportar funciones específicas de v2
// export {
// 	mapCompleteToGroup,
// 	mapGroupToComplete,
// 	groupToDisplayObject,
// } from './v2/converters';
