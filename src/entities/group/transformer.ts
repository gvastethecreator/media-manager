/**
 * @file Transformer para la entidad Group
 * @module entities/group/transformer
 */

import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import type {
	GroupBase,
	GroupComplete,
	GroupCreateInput,
	GroupFilters,
	GroupSortCriteria,
	GroupUpdateInput,
	GroupWithStats,
} from '@/types/entities/group/types';
import { mapCreateGroupDataToPrisma, mapGroupSearchOptionsToPrisma, mapUpdateGroupDataToPrisma } from './mappers';
import {
	calculateGroupStats,
	deserializeGroupFilters,
	extendGroup,
	extendGroupWithStats,
	validateGroup,
} from './serializers';

/**
 * Busca múltiples grupos con opciones de filtrado y paginación
 */
export async function findMany(options: {
	take?: number;
	skip?: number;
	sortBy?: GroupSortCriteria;
	filters?: GroupFilters;
	include?: Record<string, boolean>;
	includeStats?: boolean;
}): Promise<{
	items: GroupComplete[] | GroupWithStats[];
	totalCount: number;
	hasMore: boolean;
}> {
	try {
		const { take = 10, skip = 0, includeStats = false } = options;

		// Mapear opciones de búsqueda a formato Prisma
		const prismaOptions = mapGroupSearchOptionsToPrisma(options);

		// Ejecutar consulta para obtener grupos y contar total
		const [items, totalCount] = await Promise.all([
			prisma.group.findMany(prismaOptions),
			prisma.group.count({ where: prismaOptions.where }),
		]);

		// Extender grupos con campos deserializados
		let extendedItems = items.map((item) => {
			const baseItem = extendGroup(item as GroupBase);

			// Deserializar los filtros JSON
			if (item.filters) {
				baseItem.filtersData = deserializeGroupFilters(item.filters);
			}

			return baseItem;
		});

		// Añadir estadísticas si se solicitan
		if (includeStats) {
			extendedItems = extendedItems.map((item) => extendGroupWithStats(item));
		}

		return {
			items: extendedItems,
			totalCount,
			hasMore: skip + take < totalCount,
		};
	} catch (error) {
		logger.error('Error al buscar grupos:', error);
		throw error;
	}
}

/**
 * Busca un grupo por su ID
 */
export async function findById(
	id: string,
	options?: {
		include?: Record<string, boolean>;
		includeStats?: boolean;
	}
): Promise<GroupComplete | GroupWithStats | null> {
	try {
		const { include, includeStats = false } = options || {};

		// Preparar opciones de inclusión para relaciones
		const includeOptions = {
			_count: true,
			...(include?.images && { images: true }),
			...(include?.videos && { videos: true }),
			...(include?.albums && { albums: true }),
			...(include?.collections && { collections: true }),
			...(include?.tags && { tags: true }),
			...(include?.characters && { characters: true }),
			...(include?.places && { places: true }),
			...(include?.worldItems && { worldItems: true }),
			...(include?.concepts && { concepts: true }),
			...(include?.prompts && { prompts: true }),
			...(include?.notes && { notes: true }),
			...(include?.wildcards && { wildcards: true }),
			...(include?.properties && { properties: true }),
		};

		// Buscar grupo con relaciones
		const group = await prisma.group.findUnique({
			where: { id },
			include: includeOptions,
		});

		if (!group) {
			return null;
		}

		// Extender grupo con campos deserializados
		let extendedGroup = extendGroup(group as GroupBase);

		// Deserializar los filtros JSON
		if (group.filters) {
			extendedGroup.filtersData = deserializeGroupFilters(group.filters);
		}

		// Añadir estadísticas si se solicitan
		if (includeStats) {
			extendedGroup = extendGroupWithStats(extendedGroup);
		}

		return extendedGroup;
	} catch (error) {
		logger.error(`Error al buscar grupo con ID ${id}:`, error);
		throw error;
	}
}

/**
 * Busca grupos por categoría
 */
export async function findByCategory(category: string, limit = 10): Promise<GroupComplete[]> {
	try {
		const groups = await prisma.group.findMany({
			where: { category },
			take: limit,
			include: { _count: true },
		});

		return groups.map((group) => extendGroup(group as GroupBase));
	} catch (error) {
		logger.error(`Error al buscar grupos por categoría ${category}:`, error);
		throw error;
	}
}

/**
 * Busca grupos favoritos
 */
export async function findFavorites(limit = 10): Promise<GroupComplete[]> {
	try {
		const groups = await prisma.group.findMany({
			where: { isFavorite: true },
			take: limit,
			include: { _count: true },
		});

		return groups.map((group) => extendGroup(group as GroupBase));
	} catch (error) {
		logger.error('Error al buscar grupos favoritos:', error);
		throw error;
	}
}

/**
 * Crea un nuevo grupo
 */
export async function create(data: GroupCreateInput): Promise<GroupComplete> {
	try {
		// Validar datos de entrada
		if (!data.name) {
			throw new Error('El nombre del grupo es requerido');
		}

		// Mapear datos al formato de Prisma
		const prismaData = mapCreateGroupDataToPrisma(data);

		// Crear nuevo grupo
		const group = await prisma.group.create({
			data: prismaData,
			include: { _count: true },
		});

		// Extender grupo con campos deserializados
		const extendedGroup = extendGroup(group as GroupBase);

		// Deserializar los filtros JSON
		if (group.filters) {
			extendedGroup.filtersData = deserializeGroupFilters(group.filters);
		}

		return extendedGroup;
	} catch (error) {
		logger.error('Error al crear grupo:', error);
		throw error;
	}
}

/**
 * Actualiza un grupo existente
 */
export async function update(id: string, data: GroupUpdateInput): Promise<GroupComplete> {
	try {
		// Verificar si el grupo existe
		const existingGroup = await prisma.group.findUnique({
			where: { id },
		});

		if (!existingGroup) {
			throw new Error(`Grupo con ID ${id} no encontrado`);
		}

		// Mapear datos al formato de Prisma
		const prismaData = mapUpdateGroupDataToPrisma(data);

		// Actualizar grupo
		const updatedGroup = await prisma.group.update({
			where: { id },
			data: prismaData,
			include: { _count: true },
		});

		// Extender grupo con campos deserializados
		const extendedGroup = extendGroup(updatedGroup as GroupBase);

		// Deserializar los filtros JSON
		if (updatedGroup.filters) {
			extendedGroup.filtersData = deserializeGroupFilters(updatedGroup.filters);
		}

		return extendedGroup;
	} catch (error) {
		logger.error(`Error al actualizar grupo con ID ${id}:`, error);
		throw error;
	}
}

/**
 * Elimina un grupo existente
 */
export async function delete_(id: string): Promise<GroupComplete> {
	try {
		// Verificar si el grupo existe
		const existingGroup = await prisma.group.findUnique({
			where: { id },
			include: { _count: true },
		});

		if (!existingGroup) {
			throw new Error(`Grupo con ID ${id} no encontrado`);
		}

		// Eliminar grupo
		const deletedGroup = await prisma.group.delete({
			where: { id },
			include: { _count: true },
		});

		// Extender grupo con campos deserializados
		return extendGroup(deletedGroup as GroupBase);
	} catch (error) {
		logger.error(`Error al eliminar grupo con ID ${id}:`, error);
		throw error;
	}
}

/**
 * Conecta un grupo con una entidad
 */
export async function connectEntity(
	groupId: string,
	entityType:
		| 'image'
		| 'video'
		| 'album'
		| 'collection'
		| 'tag'
		| 'character'
		| 'place'
		| 'worldItem'
		| 'concept'
		| 'prompt'
		| 'note'
		| 'wildcard'
		| 'property',
	entityId: string
): Promise<boolean> {
	try {
		// Verificar si el grupo existe
		const existingGroup = await prisma.group.findUnique({
			where: { id: groupId },
		});

		if (!existingGroup) {
			throw new Error(`Grupo con ID ${groupId} no encontrado`);
		}

		// Determinar el tipo de entidad y conectarlo
		switch (entityType) {
			case 'image':
				await prisma.group.update({
					where: { id: groupId },
					data: { images: { connect: { id: entityId } } },
				});
				break;
			case 'video':
				await prisma.group.update({
					where: { id: groupId },
					data: { videos: { connect: { id: entityId } } },
				});
				break;
			case 'album':
				await prisma.group.update({
					where: { id: groupId },
					data: { albums: { connect: { id: entityId } } },
				});
				break;
			case 'collection':
				await prisma.group.update({
					where: { id: groupId },
					data: { collections: { connect: { id: entityId } } },
				});
				break;
			case 'tag':
				await prisma.group.update({
					where: { id: groupId },
					data: { tags: { connect: { id: entityId } } },
				});
				break;
			case 'character':
				await prisma.group.update({
					where: { id: groupId },
					data: { characters: { connect: { id: entityId } } },
				});
				break;
			case 'place':
				await prisma.group.update({
					where: { id: groupId },
					data: { places: { connect: { id: entityId } } },
				});
				break;
			case 'worldItem':
				await prisma.group.update({
					where: { id: groupId },
					data: { worldItems: { connect: { id: entityId } } },
				});
				break;
			case 'concept':
				await prisma.group.update({
					where: { id: groupId },
					data: { concepts: { connect: { id: entityId } } },
				});
				break;
			case 'prompt':
				await prisma.group.update({
					where: { id: groupId },
					data: { prompts: { connect: { id: entityId } } },
				});
				break;
			case 'note':
				await prisma.group.update({
					where: { id: groupId },
					data: { notes: { connect: { id: entityId } } },
				});
				break;
			case 'wildcard':
				await prisma.group.update({
					where: { id: groupId },
					data: { wildcards: { connect: { id: entityId } } },
				});
				break;
			case 'property':
				await prisma.group.update({
					where: { id: groupId },
					data: { properties: { connect: { id: entityId } } },
				});
				break;
			default:
				throw new Error(`Tipo de entidad no soportado: ${entityType}`);
		}

		return true;
	} catch (error) {
		logger.error(`Error al conectar entidad ${entityType} con ID ${entityId} al grupo ${groupId}:`, error);
		return false;
	}
}

/**
 * Desconecta un grupo de una entidad
 */
export async function disconnectEntity(
	groupId: string,
	entityType:
		| 'image'
		| 'video'
		| 'album'
		| 'collection'
		| 'tag'
		| 'character'
		| 'place'
		| 'worldItem'
		| 'concept'
		| 'prompt'
		| 'note'
		| 'wildcard'
		| 'property',
	entityId: string
): Promise<boolean> {
	try {
		// Verificar si el grupo existe
		const existingGroup = await prisma.group.findUnique({
			where: { id: groupId },
		});

		if (!existingGroup) {
			throw new Error(`Grupo con ID ${groupId} no encontrado`);
		}

		// Determinar el tipo de entidad y desconectarlo
		switch (entityType) {
			case 'image':
				await prisma.group.update({
					where: { id: groupId },
					data: { images: { disconnect: { id: entityId } } },
				});
				break;
			case 'video':
				await prisma.group.update({
					where: { id: groupId },
					data: { videos: { disconnect: { id: entityId } } },
				});
				break;
			case 'album':
				await prisma.group.update({
					where: { id: groupId },
					data: { albums: { disconnect: { id: entityId } } },
				});
				break;
			case 'collection':
				await prisma.group.update({
					where: { id: groupId },
					data: { collections: { disconnect: { id: entityId } } },
				});
				break;
			case 'tag':
				await prisma.group.update({
					where: { id: groupId },
					data: { tags: { disconnect: { id: entityId } } },
				});
				break;
			case 'character':
				await prisma.group.update({
					where: { id: groupId },
					data: { characters: { disconnect: { id: entityId } } },
				});
				break;
			case 'place':
				await prisma.group.update({
					where: { id: groupId },
					data: { places: { disconnect: { id: entityId } } },
				});
				break;
			case 'worldItem':
				await prisma.group.update({
					where: { id: groupId },
					data: { worldItems: { disconnect: { id: entityId } } },
				});
				break;
			case 'concept':
				await prisma.group.update({
					where: { id: groupId },
					data: { concepts: { disconnect: { id: entityId } } },
				});
				break;
			case 'prompt':
				await prisma.group.update({
					where: { id: groupId },
					data: { prompts: { disconnect: { id: entityId } } },
				});
				break;
			case 'note':
				await prisma.group.update({
					where: { id: groupId },
					data: { notes: { disconnect: { id: entityId } } },
				});
				break;
			case 'wildcard':
				await prisma.group.update({
					where: { id: groupId },
					data: { wildcards: { disconnect: { id: entityId } } },
				});
				break;
			case 'property':
				await prisma.group.update({
					where: { id: groupId },
					data: { properties: { disconnect: { id: entityId } } },
				});
				break;
			default:
				throw new Error(`Tipo de entidad no soportado: ${entityType}`);
		}

		return true;
	} catch (error) {
		logger.error(`Error al desconectar entidad ${entityType} con ID ${entityId} del grupo ${groupId}:`, error);
		return false;
	}
}

/**
 * Obtener estadísticas de uso de un grupo
 */
export async function getStats(id: string): Promise<{
	usageCount: number;
	relatedEntitiesCount: number;
}> {
	try {
		const group = await prisma.group.findUnique({
			where: { id },
			include: { _count: true },
		});

		if (!group) {
			throw new Error(`Grupo con ID ${id} no encontrado`);
		}

		return calculateGroupStats(group as GroupComplete);
	} catch (error) {
		logger.error(`Error al obtener estadísticas de grupo con ID ${id}:`, error);
		throw error;
	}
}

/**
 * Extiende un grupo con campos deserializados
 */
export function extend(group: GroupBase): GroupComplete {
	return extendGroup(group);
}

/**
 * Extiende un grupo con estadísticas
 */
export function extendWithStats(group: GroupComplete): GroupWithStats {
	return extendGroupWithStats(group);
}

/**
 * Valida un grupo
 */
export function validate(group: GroupBase): boolean {
	return validateGroup(group);
}
