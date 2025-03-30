/**
 * @file Funciones de mapeo para la entidad Tag
 * @module transformers/tag/mappers
 */

import { serverLogger } from '@/lib/logger/server-logger';
import type { CreateTagData, TagBase, TagComplete, TagFilters, UpdateTagData } from '../../types/entities/tag/index';
import { fromTagComplete, generateTagColor, generateTagEmoji } from './serializers';

// Logger específico para mappers de Tag
const mapperLogger = serverLogger.withContext('TagMappers');

/**
 * Convierte un TagBase de Prisma a un objeto TagComplete
 * @param tag Objeto TagBase de Prisma
 * @returns Objeto TagComplete con campos deserializados
 */
export function transformTagToPrisma(tag: TagBase): TagBase {
	try {
		return tag; // Actualmente no hay campos que requieran transformación
	} catch (error) {
		mapperLogger.error('❌ Error al transformar Tag a formato Prisma:', error);
		return tag;
	}
}

/**
 * Convierte un TagComplete a formato Prisma
 * @param tag Objeto TagComplete
 * @returns Objeto en formato para Prisma
 */
export function transformCompleteTagToPrisma(tag: TagComplete): TagBase {
	try {
		return fromTagComplete(tag);
	} catch (error) {
		mapperLogger.error('❌ Error al transformar TagComplete a formato Prisma:', error);
		return tag as TagBase;
	}
}

/**
 * Mapea datos de creación de etiqueta a formato compatible con Prisma
 * @param data Datos de creación de etiqueta
 * @returns Objeto formateado para Prisma
 */
export function mapCreateTagDataToPrisma(data: CreateTagData) {
	try {
		// Generar color y emoji si no se proporcionan
		const emoji = data.emoji || generateTagEmoji(data.category);
		const color = data.color || generateTagColor(data.category);

		return {
			name: data.name,
			emoji,
			color,
			description: data.description || null,
			shortcut: data.shortcut || null,
			category: data.category || 'general',
			featuredImage: data.featuredImage || null,
			isFavorite: data.isFavorite || false,
			// Relaciones
			...(data.imageIds?.length && {
				images: {
					connect: data.imageIds.map(id => ({ id }))
				}
			}),
			...(data.videoIds?.length && {
				videos: {
					connect: data.videoIds.map(id => ({ id }))
				}
			}),
			...(data.groupIds?.length && {
				groups: {
					connect: data.groupIds.map(id => ({ id }))
				}
			}),
		};
	} catch (error) {
		mapperLogger.error('❌ Error al mapear datos de creación de etiqueta:', error);
		return {
			name: data.name,
			emoji: '🏷️',
			color: '#3b82f6',
		};
	}
}

/**
 * Mapea datos de actualización de etiqueta a formato compatible con Prisma
 * @param data Datos de actualización de etiqueta
 * @returns Objeto formateado para Prisma
 */
export function mapUpdateTagDataToPrisma(data: UpdateTagData) {
	try {
		const updateData: any = {};

		// Mapear solo los campos proporcionados
		if (data.name !== undefined) updateData.name = data.name;
		if (data.emoji !== undefined) updateData.emoji = data.emoji;
		if (data.color !== undefined) updateData.color = data.color;
		if (data.description !== undefined) updateData.description = data.description;
		if (data.shortcut !== undefined) updateData.shortcut = data.shortcut;
		if (data.category !== undefined) updateData.category = data.category;
		if (data.featuredImage !== undefined) updateData.featuredImage = data.featuredImage;
		if (data.isFavorite !== undefined) updateData.isFavorite = data.isFavorite;

		// Manejar relaciones
		if (data.imageIds !== undefined) {
			updateData.images = {
				set: data.imageIds.map(id => ({ id }))
			};
		}

		if (data.videoIds !== undefined) {
			updateData.videos = {
				set: data.videoIds.map(id => ({ id }))
			};
		}

		if (data.groupIds !== undefined) {
			updateData.groups = {
				set: data.groupIds.map(id => ({ id }))
			};
		}

		return updateData;
	} catch (error) {
		mapperLogger.error('❌ Error al mapear datos de actualización de etiqueta:', error);
		return {};
	}
}

/**
 * Crea filtros para consulta de etiquetas basados en criterios
 * @param filters Objeto con criterios de filtrado
 * @returns Filtro formateado para Prisma
 */
export function createTagFilter(filters?: TagFilters) {
	if (!filters) return {};

	const conditions: any = {};
	const AND: any[] = [];

	// Filtro de búsqueda por texto
	if (filters.searchQuery) {
		conditions.OR = [
			{ name: { contains: filters.searchQuery, mode: 'insensitive' } },
			{ description: { contains: filters.searchQuery, mode: 'insensitive' } },
		];
	}

	// Filtro por categorías
	if (filters.categories?.length) {
		AND.push({
			category: {
				in: filters.categories
			}
		});
	}

	// Filtro por favoritos
	if (filters.onlyFavorites) {
		AND.push({
			isFavorite: true
		});
	}

	if (AND.length) {
		conditions.AND = AND;
	}

	return conditions;
}

/**
 * Crea ordenamiento para consulta de etiquetas
 * @param sortBy Criterio de ordenamiento (ej: 'name:asc', 'createdAt:desc')
 * @returns Ordenamiento formateado para Prisma
 */
export function createTagOrderBy(sortBy: string = 'name:asc') {
	const [field, direction] = sortBy.split(':');
	return {
		[field]: direction.toLowerCase() === 'desc' ? 'desc' : 'asc'
	};
}

/**
 * Mapea filtros de etiqueta a formato compatible con Prisma para consultas
 * @param filters Filtros de etiqueta
 * @returns Objeto de condiciones para Prisma
 */
export function mapTagFiltersToPrisma(filters: TagFilters) {
	try {
		const where: Record<string, any> = {};

		// Filtrar por término de búsqueda
		if (filters.searchQuery) {
			where.OR = [
				{ name: { contains: filters.searchQuery, mode: 'insensitive' } },
				{ description: { contains: filters.searchQuery, mode: 'insensitive' } },
			];
		}

		// Filtrar por categorías
		if (filters.categories && filters.categories.length > 0) {
			where.category = { in: filters.categories };
		}

		// Filtrar por rarezas
		if (filters.rarities && filters.rarities.length > 0) {
			where.rarity = { in: filters.rarities };
		}

		// Filtrar favoritos
		if (filters.onlyFavorites) {
			where.isFavorite = true;
		}

		// No podemos filtrar directamente por count en Prisma,
		// esto tendría que hacerse post-procesando los resultados

		return { where };
	} catch (error) {
		mapperLogger.error('❌ Error al mapear filtros de Tag a formato Prisma:', error);
		throw error;
	}
}

/**
 * Mapea una etiqueta a su versión simplificada para relaciones
 * @param tag Etiqueta completa
 * @returns Etiqueta simplificada
 */
export function mapTagToRelatedTag(tag: any) {
	try {
		return {
			id: tag.id,
			name: tag.name,
			color: tag.color,
			emoji: tag.emoji,
			count: tag._count?.images || 0,
		};
	} catch (error) {
		mapperLogger.error('❌ Error al mapear Tag a RelatedTag:', error);
		return {
			id: tag.id || 'unknown',
			name: tag.name || 'Error',
			color: tag.color || '#ff0000',
			emoji: tag.emoji || '⚠️',
			count: 0,
		};
	}
}
