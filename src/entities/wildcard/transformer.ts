/**
 * @file Transformer para la entidad Wildcard
 * @module entities/wildcard/transformer
 */

import { serverLogger } from '@/lib/logger/server-logger';
import { prisma } from '@/lib/prisma';
import type {
	CreateWildcardData,
	UpdateWildcardData,
	WildcardBase,
	WildcardFilters,
	WildcardSortCriteria,
	WildcardWithRelations,
} from '@/types/entities/wildcard/types';
import {
	mapCreateWildcardDataToPrisma,
	mapUpdateWildcardDataToPrisma,
	mapWildcardSearchOptionsToPrisma,
} from './mappers';
import {
	buildWildcardTree,
	calculateWildcardStats,
	deserializeWildcardChildren,
	extendWildcard,
	validateWildcard,
} from './serializers';

// Logger específico para el transformer
const logger = serverLogger.withContext('WildcardTransformer');

/**
 * Busca múltiples comodines con opciones de filtrado y paginación
 */
export async function findMany(options: {
	take?: number;
	skip?: number;
	sortBy?: WildcardSortCriteria;
	filters?: WildcardFilters;
	include?: Record<string, boolean>;
	asTree?: boolean;
}): Promise<{
	items: WildcardWithRelations[];
	totalCount: number;
	hasMore: boolean;
}> {
	try {
		const { take = 10, skip = 0, asTree = false } = options;

		// Mapear opciones de búsqueda a formato Prisma
		const prismaOptions = mapWildcardSearchOptionsToPrisma(options);

		// Ejecutar consulta para obtener comodines y contar total
		const [items, totalCount] = await Promise.all([
			prisma.wildcard.findMany(prismaOptions),
			prisma.wildcard.count({ where: prismaOptions.where }),
		]);

		// Extender comodines con campos deserializados
		let extendedItems = items.map((item) => {
			const extendedItem = extend(item as WildcardBase);
			if (item.children) {
				extendedItem.childrenData = deserializeWildcardChildren(item.children);
			}
			return extendedItem;
		});

		// Construir árbol si se solicita
		if (asTree) {
			extendedItems = buildWildcardTree(extendedItems);
		}

		return {
			items: extendedItems,
			totalCount,
			hasMore: skip + take < totalCount,
		};
	} catch (error) {
		logger.error('Error al buscar comodines:', error);
		throw error;
	}
}

/**
 * Busca un comodín por su ID
 */
export async function findById(id: string, include?: Record<string, boolean>): Promise<WildcardWithRelations | null> {
	try {
		// Preparar opciones de inclusión para relaciones
		const includeOptions = {
			_count: true,
			...(include?.parent && { parent: true }),
			...(include?.childWildcards && { childWildcards: true }),
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
			...(include?.properties && { properties: true }),
			...(include?.groups && { groups: true }),
		};

		// Buscar comodín con relaciones
		const wildcard = await prisma.wildcard.findUnique({
			where: { id },
			include: includeOptions,
		});

		if (!wildcard) {
			return null;
		}

		// Extender comodín con campos deserializados
		const extendedWildcard = extend(wildcard as WildcardBase);

		// Deserializar los hijos
		if (wildcard.children) {
			extendedWildcard.childrenData = deserializeWildcardChildren(wildcard.children);
		}

		return extendedWildcard;
	} catch (error) {
		logger.error(`Error al buscar comodín con ID ${id}:`, error);
		throw error;
	}
}

/**
 * Busca comodines por categoría
 */
export async function findByCategory(category: string, limit = 10): Promise<WildcardWithRelations[]> {
	try {
		const wildcards = await prisma.wildcard.findMany({
			where: { category },
			take: limit,
			include: { _count: true },
		});

		return wildcards.map((wildcard) => extend(wildcard as WildcardBase));
	} catch (error) {
		logger.error(`Error al buscar comodines por categoría ${category}:`, error);
		throw error;
	}
}

/**
 * Busca comodines favoritos
 */
export async function findFavorites(limit = 10): Promise<WildcardWithRelations[]> {
	try {
		const wildcards = await prisma.wildcard.findMany({
			where: { isFavorite: true },
			take: limit,
			include: { _count: true },
		});

		return wildcards.map((wildcard) => extend(wildcard as WildcardBase));
	} catch (error) {
		logger.error('Error al buscar comodines favoritos:', error);
		throw error;
	}
}

/**
 * Busca comodines hijo de un comodín específico
 */
export async function findChildren(parentId: string, limit = 100): Promise<WildcardWithRelations[]> {
	try {
		const wildcards = await prisma.wildcard.findMany({
			where: { parentId },
			take: limit,
			include: { _count: true },
		});

		return wildcards.map((wildcard) => extend(wildcard as WildcardBase));
	} catch (error) {
		logger.error(`Error al buscar comodines hijos de ${parentId}:`, error);
		throw error;
	}
}

/**
 * Crea un nuevo comodín
 */
export async function create(data: CreateWildcardData): Promise<WildcardWithRelations> {
	try {
		// Validar datos de entrada
		if (!data.name) {
			throw new Error('El nombre del comodín es requerido');
		}

		// Mapear datos al formato de Prisma
		const prismaData = mapCreateWildcardDataToPrisma(data);

		// Crear nuevo comodín
		const wildcard = await prisma.wildcard.create({
			data: prismaData,
			include: { _count: true },
		});

		// Extender comodín con campos deserializados
		return extend(wildcard as WildcardBase);
	} catch (error) {
		logger.error('Error al crear comodín:', error);
		throw error;
	}
}

/**
 * Actualiza un comodín existente
 */
export async function update(id: string, data: UpdateWildcardData): Promise<WildcardWithRelations> {
	try {
		// Verificar si el comodín existe
		const existingWildcard = await prisma.wildcard.findUnique({
			where: { id },
		});

		if (!existingWildcard) {
			throw new Error(`Comodín con ID ${id} no encontrado`);
		}

		// Validar que no se intente establecer un ciclo (un comodín no puede ser hijo de sí mismo)
		if (data.parentId === id) {
			throw new Error('Un comodín no puede ser hijo de sí mismo');
		}

		// Mapear datos al formato de Prisma
		const prismaData = mapUpdateWildcardDataToPrisma(data);

		// Actualizar comodín
		const updatedWildcard = await prisma.wildcard.update({
			where: { id },
			data: prismaData,
			include: { _count: true },
		});

		// Extender comodín con campos deserializados
		return extend(updatedWildcard as WildcardBase);
	} catch (error) {
		logger.error(`Error al actualizar comodín con ID ${id}:`, error);
		throw error;
	}
}

/**
 * Elimina un comodín existente
 */
export async function delete_(id: string): Promise<WildcardWithRelations> {
	try {
		// Verificar si el comodín existe
		const existingWildcard = await prisma.wildcard.findUnique({
			where: { id },
			include: { _count: true },
		});

		if (!existingWildcard) {
			throw new Error(`Comodín con ID ${id} no encontrado`);
		}

		// Verificar si tiene hijos
		const childrenCount = await prisma.wildcard.count({
			where: { parentId: id },
		});

		if (childrenCount > 0) {
			throw new Error(`No se puede eliminar el comodín porque tiene ${childrenCount} comodines hijos`);
		}

		// Eliminar comodín
		const deletedWildcard = await prisma.wildcard.delete({
			where: { id },
			include: { _count: true },
		});

		// Extender comodín con campos deserializados
		return extend(deletedWildcard as WildcardBase);
	} catch (error) {
		logger.error(`Error al eliminar comodín con ID ${id}:`, error);
		throw error;
	}
}

/**
 * Obtener estadísticas de uso de un comodín
 */
export async function getStats(id: string): Promise<{
	usageCount: number;
	relatedEntitiesCount: number;
}> {
	try {
		const wildcard = await prisma.wildcard.findUnique({
			where: { id },
			include: { _count: true },
		});

		if (!wildcard) {
			throw new Error(`Comodín con ID ${id} no encontrado`);
		}

		// Convertir a WildcardWithRelations antes de calcular estadísticas
		const extendedWildcard = extendWildcard(wildcard as WildcardBase);

		return calculateWildcardStats(extendedWildcard);
	} catch (error) {
		logger.error(`Error al obtener estadísticas de comodín con ID ${id}:`, error);
		throw error;
	}
}

/**
 * Conecta un comodín con otra entidad
 */
export async function connectEntity(
	wildcardId: string,
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
		| 'property'
		| 'group',
	entityId: string
): Promise<boolean> {
	try {
		// Verificar si el comodín existe
		const existingWildcard = await prisma.wildcard.findUnique({
			where: { id: wildcardId },
		});

		if (!existingWildcard) {
			throw new Error(`Comodín con ID ${wildcardId} no encontrado`);
		}

		// Determinar el tipo de entidad y conectarlo
		switch (entityType) {
			case 'image':
				await prisma.wildcard.update({
					where: { id: wildcardId },
					data: { images: { connect: { id: entityId } } },
				});
				break;
			case 'video':
				await prisma.wildcard.update({
					where: { id: wildcardId },
					data: { videos: { connect: { id: entityId } } },
				});
				break;
			case 'album':
				await prisma.wildcard.update({
					where: { id: wildcardId },
					data: { albums: { connect: { id: entityId } } },
				});
				break;
			case 'collection':
				await prisma.wildcard.update({
					where: { id: wildcardId },
					data: { collections: { connect: { id: entityId } } },
				});
				break;
			case 'tag':
				await prisma.wildcard.update({
					where: { id: wildcardId },
					data: { tags: { connect: { id: entityId } } },
				});
				break;
			case 'character':
				await prisma.wildcard.update({
					where: { id: wildcardId },
					data: { characters: { connect: { id: entityId } } },
				});
				break;
			case 'place':
				await prisma.wildcard.update({
					where: { id: wildcardId },
					data: { places: { connect: { id: entityId } } },
				});
				break;
			case 'worldItem':
				await prisma.wildcard.update({
					where: { id: wildcardId },
					data: { worldItems: { connect: { id: entityId } } },
				});
				break;
			case 'concept':
				await prisma.wildcard.update({
					where: { id: wildcardId },
					data: { concepts: { connect: { id: entityId } } },
				});
				break;
			case 'prompt':
				await prisma.wildcard.update({
					where: { id: wildcardId },
					data: { prompts: { connect: { id: entityId } } },
				});
				break;
			case 'note':
				await prisma.wildcard.update({
					where: { id: wildcardId },
					data: { notes: { connect: { id: entityId } } },
				});
				break;
			case 'property':
				await prisma.wildcard.update({
					where: { id: wildcardId },
					data: { properties: { connect: { id: entityId } } },
				});
				break;
			case 'group':
				await prisma.wildcard.update({
					where: { id: wildcardId },
					data: { groups: { connect: { id: entityId } } },
				});
				break;
			default:
				throw new Error(`Tipo de entidad no soportado: ${entityType}`);
		}

		return true;
	} catch (error) {
		logger.error(`Error al conectar comodín ${wildcardId} con entidad ${entityType} ${entityId}:`, error);
		return false;
	}
}

/**
 * Desconecta un comodín de otra entidad
 */
export async function disconnectEntity(
	wildcardId: string,
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
		| 'property'
		| 'group',
	entityId: string
): Promise<boolean> {
	try {
		// Verificar si el comodín existe
		const existingWildcard = await prisma.wildcard.findUnique({
			where: { id: wildcardId },
		});

		if (!existingWildcard) {
			throw new Error(`Comodín con ID ${wildcardId} no encontrado`);
		}

		// Determinar el tipo de entidad y desconectarlo
		switch (entityType) {
			case 'image':
				await prisma.wildcard.update({
					where: { id: wildcardId },
					data: { images: { disconnect: { id: entityId } } },
				});
				break;
			case 'video':
				await prisma.wildcard.update({
					where: { id: wildcardId },
					data: { videos: { disconnect: { id: entityId } } },
				});
				break;
			case 'album':
				await prisma.wildcard.update({
					where: { id: wildcardId },
					data: { albums: { disconnect: { id: entityId } } },
				});
				break;
			case 'collection':
				await prisma.wildcard.update({
					where: { id: wildcardId },
					data: { collections: { disconnect: { id: entityId } } },
				});
				break;
			case 'tag':
				await prisma.wildcard.update({
					where: { id: wildcardId },
					data: { tags: { disconnect: { id: entityId } } },
				});
				break;
			case 'character':
				await prisma.wildcard.update({
					where: { id: wildcardId },
					data: { characters: { disconnect: { id: entityId } } },
				});
				break;
			case 'place':
				await prisma.wildcard.update({
					where: { id: wildcardId },
					data: { places: { disconnect: { id: entityId } } },
				});
				break;
			case 'worldItem':
				await prisma.wildcard.update({
					where: { id: wildcardId },
					data: { worldItems: { disconnect: { id: entityId } } },
				});
				break;
			case 'concept':
				await prisma.wildcard.update({
					where: { id: wildcardId },
					data: { concepts: { disconnect: { id: entityId } } },
				});
				break;
			case 'prompt':
				await prisma.wildcard.update({
					where: { id: wildcardId },
					data: { prompts: { disconnect: { id: entityId } } },
				});
				break;
			case 'note':
				await prisma.wildcard.update({
					where: { id: wildcardId },
					data: { notes: { disconnect: { id: entityId } } },
				});
				break;
			case 'property':
				await prisma.wildcard.update({
					where: { id: wildcardId },
					data: { properties: { disconnect: { id: entityId } } },
				});
				break;
			case 'group':
				await prisma.wildcard.update({
					where: { id: wildcardId },
					data: { groups: { disconnect: { id: entityId } } },
				});
				break;
			default:
				throw new Error(`Tipo de entidad no soportado: ${entityType}`);
		}

		return true;
	} catch (error) {
		logger.error(`Error al desconectar comodín ${wildcardId} de entidad ${entityType} ${entityId}:`, error);
		return false;
	}
}

/**
 * Extiende un comodín con campos deserializados
 */
export function extend(wildcard: WildcardBase): WildcardWithRelations {
	return extendWildcard(wildcard);
}

/**
 * Valida un comodín
 */
export function validate(wildcard: WildcardBase): boolean {
	return validateWildcard(wildcard);
}
