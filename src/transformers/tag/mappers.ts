/**
 * @file Funciones de mapeo para la entidad Tag
 * @module transformers/tag/mappers
 */

import type { CreateTagData, TagFilters, UpdateTagData } from '../../types/entities/tag/index';
import { generateTagColor, generateTagEmoji } from './serializers';

/**
 * Mapea datos de creación de etiqueta a formato compatible con Prisma
 * @param data Datos de creación de etiqueta
 * @returns Objeto formateado para Prisma
 */
export function mapCreateTagDataToPrisma(data: CreateTagData) {
	// Generar color y emoji si no se proporcionan
	const color = data.color || generateTagColor(data.name);
	const emoji = data.emoji || generateTagEmoji(data.name, data.category || undefined);

	return {
		name: data.name,
		emoji,
		color,
		description: data.description || null,
		shortcut: data.shortcut || null,
		category: data.category || null,
		rarity: data.rarity || null,
		texture: data.texture || null,
		isFavorite: data.isFavorite || false,
		featuredImage: data.featuredImage || null,
		// Conexión con grupos si existen
		groups: data.groupIds ? {
			connect: data.groupIds.map((id) => ({ id })),
		} : undefined,
		// Conexión con propiedades si existen
		properties: data.propertyIds ? {
			connect: data.propertyIds.map((id) => ({ id })),
		} : undefined,
		// Conexión con comodines si existen
		wildcards: data.wildcardIds ? {
			connect: data.wildcardIds.map((id) => ({ id })),
		} : undefined,
	};
}

/**
 * Mapea datos de actualización de etiqueta a formato compatible con Prisma
 * @param data Datos de actualización de etiqueta
 * @returns Objeto formateado para Prisma
 */
export function mapUpdateTagDataToPrisma(data: UpdateTagData) {
	// Crear objeto con solo las propiedades definidas
	const prismaData: Record<string, any> = {};

	if (data.name !== undefined) prismaData.name = data.name;
	if (data.emoji !== undefined) prismaData.emoji = data.emoji;
	if (data.color !== undefined) prismaData.color = data.color;
	if (data.description !== undefined) prismaData.description = data.description;
	if (data.shortcut !== undefined) prismaData.shortcut = data.shortcut;
	if (data.featuredImage !== undefined) prismaData.featuredImage = data.featuredImage;
	if (data.isFavorite !== undefined) prismaData.isFavorite = data.isFavorite;
	if (data.category !== undefined) prismaData.category = data.category;
	if (data.rarity !== undefined) prismaData.rarity = data.rarity;
	if (data.texture !== undefined) prismaData.texture = data.texture;

	// Gestionar relaciones con grupos
	if (data.groupIds !== undefined) {
		prismaData.groups = {
			set: data.groupIds.map((id) => ({ id })),
		};
	}

	// Gestionar relaciones con propiedades
	if (data.propertyIds !== undefined) {
		prismaData.properties = {
			set: data.propertyIds.map((id) => ({ id })),
		};
	}

	// Gestionar relaciones con comodines
	if (data.wildcardIds !== undefined) {
		prismaData.wildcards = {
			set: data.wildcardIds.map((id) => ({ id })),
		};
	}

	return prismaData;
}

/**
 * Mapea filtros de etiqueta a formato compatible con Prisma para consultas
 * @param filters Filtros de etiqueta
 * @returns Objeto de condiciones para Prisma
 */
export function mapTagFiltersToPrisma(filters: TagFilters) {
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
}

/**
 * Mapea una etiqueta a su versión simplificada para relaciones
 * @param tag Etiqueta completa
 * @returns Etiqueta simplificada
 */
export function mapTagToRelatedTag(tag: any) {
	return {
		id: tag.id,
		name: tag.name,
		color: tag.color,
		emoji: tag.emoji,
		count: tag._count?.images || 0,
	};
}
