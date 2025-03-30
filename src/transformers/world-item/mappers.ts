/**
 * @file Mapeadores para la entidad WorldItem
 * @module transformers/world-item/mappers
 */

import { createLogger } from '@/lib/logger';
import {
    WorldItemCategory,
    WorldItemType
} from '@/types/entities/world-item/enums';
import {
    WORLD_ITEM_SORT_PROPERTY_MAP,
    WorldItemCreateInput,
    WorldItemFilters,
    WorldItemSearchOptions,
    WorldItemSortCriteria,
    WorldItemUpdateInput
} from '@/types/entities/world-item/types';
import { Prisma } from '@prisma/client';
import {
    serializeAttributes,
    serializeEffects,
    serializeFilters,
    serializeProperties,
    serializeRequirements,
    serializeStats,
    serializeTags
} from './serializers';

// Logger específico para este módulo
const logger = createLogger('WorldItemTransformer:Mappers');

/**
 * Genera un color aleatorio para un objeto del mundo basado en su nombre y categoría
 * @param name - Nombre del objeto
 * @param category - Categoría opcional
 * @returns Color hexadecimal
 */
export function generateColor(name: string, category?: string | null): string {
	try {
		// Colores predeterminados por categoría
		const categoryColors: Record<string, string> = {
			[WorldItemCategory.EQUIPMENT]: '#ef4444', // Rojo
			[WorldItemCategory.QUEST]: '#8b5cf6', // Violeta
			[WorldItemCategory.CRAFTING]: '#3b82f6', // Azul
			[WorldItemCategory.LORE]: '#10b981', // Verde
			[WorldItemCategory.COLLECTIBLE]: '#ec4899', // Rosa
			[WorldItemCategory.UTILITY]: '#f59e0b', // Ámbar
			[WorldItemCategory.MAGICAL]: '#0ea5e9', // Azul cielo
			[WorldItemCategory.TECHNOLOGICAL]: '#f97316', // Naranja
			[WorldItemCategory.GENERAL]: '#64748b', // Gris azulado
		};

		// Si hay una categoría válida, usar su color
		if (category && categoryColors[category]) {
			return categoryColors[category];
		}

		// Si no hay categoría, generar un color basado en el nombre
		const hash = Array.from(name).reduce((acc, char) => acc + char.charCodeAt(0), 0);
		const hue = hash % 360;
		const saturation = 65 + (hash % 20);
		const lightness = 45 + (hash % 10);

		// Convertir HSL a hexadecimal
		return hslToHex(hue, saturation, lightness);
	} catch (error) {
		logger.error('Error generando color para WorldItem', error);
		return '#6D28D9'; // Color por defecto (púrpura)
	}
}

/**
 * Convierte HSL a formato hexadecimal (función auxiliar)
 * @param h - Tono (0-360)
 * @param s - Saturación (0-100)
 * @param l - Luminosidad (0-100)
 * @returns Color en formato hexadecimal #RRGGBB
 */
function hslToHex(h: number, s: number, l: number): string {
	const hNormalized = h / 360;
	const sNormalized = s / 100;
	const lNormalized = l / 100;

	let r: number, g: number, b: number;

	if (sNormalized === 0) {
		r = g = b = lNormalized;
	} else {
		const hue2rgb = (p: number, q: number, t: number) => {
			let tValue = t;
			if (tValue < 0) tValue += 1;
			if (tValue > 1) tValue -= 1;
			if (tValue < 1/6) return p + (q - p) * 6 * tValue;
			if (tValue < 1/2) return q;
			if (tValue < 2/3) return p + (q - p) * (2/3 - tValue) * 6;
			return p;
		};

		const q = lNormalized < 0.5 ? lNormalized * (1 + sNormalized) : lNormalized + sNormalized - lNormalized * sNormalized;
		const p = 2 * lNormalized - q;
		r = hue2rgb(p, q, hNormalized + 1/3);
		g = hue2rgb(p, q, hNormalized);
		b = hue2rgb(p, q, hNormalized - 1/3);
	}

	const toHex = (x: number) => {
		const hex = Math.round(x * 255).toString(16);
		return hex.length === 1 ? `0${hex}` : hex;
	};

	return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Genera un emoji para un objeto del mundo basado en su tipo y nombre
 * @param type - Tipo de objeto
 * @param name - Nombre del objeto
 * @returns Emoji representativo
 */
export function generateEmoji(type: string, name?: string): string {
	try {
		const typeEmojis: Record<string, string> = {
			[WorldItemType.WEAPON]: '⚔️',
			[WorldItemType.ARMOR]: '🛡️',
			[WorldItemType.ACCESSORY]: '💍',
			[WorldItemType.CONSUMABLE]: '🧪',
			[WorldItemType.MATERIAL]: '📦',
			[WorldItemType.ARTIFACT]: '🏺',
			[WorldItemType.RELIC]: '✨',
			[WorldItemType.KEY_ITEM]: '🔑',
			[WorldItemType.MISC]: '🎲',
		};

		// Si hay un tipo válido, usar su emoji
		if (typeEmojis[type]) {
			return typeEmojis[type];
		}

		// Set de emojis genéricos
		const genericEmojis = ['🗿', '🎭', '🔮', '💎', '⚱️', '🧩', '🎯', '🎪', '🎠', '🎨', '🎰', '🧸', '🎁', '🎊', '🎷', '🎸', '🎺', '🎻'];

		// Si hay un nombre, generar un emoji basado en él
		if (name) {
			const hash = Array.from(name).reduce((acc, char) => acc + char.charCodeAt(0), 0);
			return genericEmojis[hash % genericEmojis.length];
		}

		// Emoji predeterminado
		return '🧰';
	} catch (error) {
		logger.error('Error generando emoji para WorldItem', error);
		return '🔮'; // Emoji por defecto
	}
}

/**
 * Mapea datos de creación de WorldItem para Prisma
 * @param data - Datos de creación
 * @returns Objeto formateado para Prisma
 */
export function toCreateData(data: WorldItemCreateInput): Prisma.WorldItemCreateInput {
	try {
		const serializedData: Prisma.WorldItemCreateInput = {
			id: data.id,
			name: data.name,
			description: data.description ?? null,
			shortcut: data.shortcut ?? null,
			category: data.category ?? 'general',
			type: data.type ?? 'misc',
			rarity: data.rarity ?? 'common',
			size: data.size ?? 'medium',
			origin: data.origin ?? 'unknown',
			emoji: data.emoji ?? generateEmoji(data.type ?? 'misc', data.name),
			color: data.color ?? generateColor(data.name, data.category ?? 'general'),
			isFavorite: data.isFavorite ?? false,
			sortBy: data.sortBy ?? 'name:asc',
			featuredImage: data.featuredImage ?? null
		};

		// Serializar campos JSON
		if (data.attributes) {
			serializedData.attributes = serializeAttributes(data.attributes);
		}

		if (data.effects) {
			serializedData.effects = serializeEffects(data.effects);
		}

		if (data.requirements) {
			serializedData.requirements = serializeRequirements(data.requirements);
		}

		if (data.stats) {
			serializedData.stats = serializeStats(data.stats);
		}

		if (data.properties) {
			serializedData.properties = serializeProperties(data.properties);
		}

		if (data.filters) {
			serializedData.filters = serializeFilters(data.filters);
		}

		if (data.tags) {
			serializedData.tags = serializeTags(data.tags);
		}

		// Manejar relaciones
		if (data.images) {
			serializedData.images = {
				connect: data.images.connect.map(item => ({ id: item.id }))
			};
		}

		return serializedData;
	} catch (error) {
		logger.error('Error mapeando datos de creación de WorldItem', error);
		throw new Error(`Error mapeando datos de creación: ${error instanceof Error ? error.message : String(error)}`);
	}
}

/**
 * Mapea datos de actualización de WorldItem para Prisma
 * @param data - Datos de actualización
 * @returns Objeto formateado para Prisma
 */
export function toUpdateData(data: WorldItemUpdateInput): Prisma.WorldItemUpdateInput {
	try {
		const serializedData: Prisma.WorldItemUpdateInput = {
			...data
		};

		// Remover campos que necesitan serialización
		delete serializedData.attributes;
		delete serializedData.effects;
		delete serializedData.requirements;
		delete serializedData.stats;
		delete serializedData.properties;
		delete serializedData.filters;
		delete serializedData.tags;
		delete serializedData.images;

		// Serializar campos JSON si existen en los datos originales
		if (data.attributes) {
			serializedData.attributes = serializeAttributes(data.attributes);
		}

		if (data.effects) {
			serializedData.effects = serializeEffects(data.effects);
		}

		if (data.requirements) {
			serializedData.requirements = serializeRequirements(data.requirements);
		}

		if (data.stats) {
			serializedData.stats = serializeStats(data.stats);
		}

		if (data.properties) {
			serializedData.properties = serializeProperties(data.properties);
		}

		if (data.filters) {
			serializedData.filters = serializeFilters(data.filters);
		}

		if (data.tags) {
			serializedData.tags = serializeTags(data.tags);
		}

		// Manejar relaciones
		if (data.images) {
			serializedData.images = {
				set: data.images.set.map(item => ({ id: item.id }))
			};
		}

		return serializedData;
	} catch (error) {
		logger.error('Error mapeando datos de actualización de WorldItem', error);
		throw new Error(`Error mapeando datos de actualización: ${error instanceof Error ? error.message : String(error)}`);
	}
}

/**
 * Mapea opciones de búsqueda a formato Prisma
 * @param options - Opciones de búsqueda
 * @returns Objeto de opciones para Prisma
 */
export function toSearchOptions(options: WorldItemSearchOptions = {}): Prisma.WorldItemFindManyArgs {
	try {
		const { filters, sortBy, page = 1, pageSize = 20, includeImages, includeStats } = options;
		const skip = (page - 1) * pageSize;
		const take = pageSize;

		const args: Prisma.WorldItemFindManyArgs = {
			skip,
			take,
			orderBy: createOrderBy(sortBy),
			where: createFilter(filters)
		};

		// Incluir relaciones si se solicitan
		if (includeImages) {
			args.include = {
				...args.include,
				images: true
			};
		}

		// Incluir conteos si se requieren estadísticas
		if (includeStats) {
			args.include = {
				...args.include,
				_count: {
					select: {
						images: true,
						relatedItems: true
					}
				}
			};
		}

		return args;
	} catch (error) {
		logger.error('Error creando opciones de búsqueda para WorldItem', error);
		// Devolver opciones por defecto en caso de error
		return {
			skip: 0,
			take: 20,
			orderBy: { name: 'asc' }
		};
	}
}

/**
 * Crea el filtro para la consulta Prisma basado en los filtros proporcionados
 * @param filters - Filtros de búsqueda
 * @returns Cláusula where para Prisma
 */
export function createFilter(filters: WorldItemFilters = {}): Prisma.WorldItemWhereInput {
	try {
		const where: Prisma.WorldItemWhereInput = {};
		const conditions: Prisma.WorldItemWhereInput[] = [];

		// Filtro de texto
		if (filters.query) {
			conditions.push({
				OR: [
					{ name: { contains: filters.query, mode: 'insensitive' } },
					{ description: { contains: filters.query, mode: 'insensitive' } },
					{ shortcut: { contains: filters.query, mode: 'insensitive' } },
					{ origin: { contains: filters.query, mode: 'insensitive' } }
				]
			});
		}

		// Filtro por tipos
		if (filters.types && filters.types.length > 0) {
			conditions.push({
				type: { in: filters.types }
			});
		}

		// Filtro por categorías
		if (filters.categories && filters.categories.length > 0) {
			conditions.push({
				category: { in: filters.categories }
			});
		}

		// Filtro por rarezas
		if (filters.rarities && filters.rarities.length > 0) {
			conditions.push({
				rarity: { in: filters.rarities }
			});
		}

		// Filtro por nivel mínimo/máximo (asumiendo que hay un campo de nivel en los datos)
		if (filters.minLevel !== undefined) {
			conditions.push({
				requirements: { contains: `"level":${filters.minLevel}` }
			});
		}

		if (filters.maxLevel !== undefined) {
			conditions.push({
				requirements: { contains: `"level":${filters.maxLevel}` }
			});
		}

		// Filtro por valor mínimo/máximo (asumiendo que hay un campo de valor en los datos)
		if (filters.minValue !== undefined) {
			conditions.push({
				properties: { contains: `"value":${filters.minValue}` }
			});
		}

		if (filters.maxValue !== undefined) {
			conditions.push({
				properties: { contains: `"value":${filters.maxValue}` }
			});
		}

		// Filtro por favoritos
		if (filters.isFavorite !== undefined) {
			conditions.push({
				isFavorite: filters.isFavorite
			});
		}

		// Filtro por presencia de imágenes
		if (filters.hasImages !== undefined) {
			if (filters.hasImages) {
				conditions.push({
					OR: [
						{ featuredImage: { not: null } },
						{ images: { some: {} } }
					]
				});
			} else {
				conditions.push({
					AND: [
						{ featuredImage: null },
						{ images: { none: {} } }
					]
				});
			}
		}

		// Combinar todas las condiciones si existen
		if (conditions.length > 0) {
			where.AND = conditions;
		}

		return where;
	} catch (error) {
		logger.error('Error creando filtros para WorldItem', error);
		return {}; // Devolver filtro vacío en caso de error
	}
}

/**
 * Crea la cláusula de ordenación para Prisma
 * @param sortBy - Criterio de ordenación
 * @returns Cláusula orderBy para Prisma
 */
export function createOrderBy(sortBy?: WorldItemSortCriteria): Prisma.WorldItemOrderByWithRelationInput {
	try {
		if (!sortBy) {
			return { name: 'asc' };
		}

		const propertyName = WORLD_ITEM_SORT_PROPERTY_MAP[sortBy];
		const direction = sortBy.endsWith(':desc') ? 'desc' : 'asc';

		// Crear objeto de ordenación dinámicamente
		return { [propertyName]: direction };
	} catch (error) {
		logger.error('Error creando ordenación para WorldItem', error);
		return { name: 'asc' }; // Ordenación por defecto en caso de error
	}
}

// Exportar versiones anteriores con nombres obsoletos
/**
 * @deprecated Usar generateColor en su lugar
 */
export function generateWorldItemColor(name: string, category?: string | null): string {
	logger.warn('generateWorldItemColor está obsoleto. Use generateColor en su lugar.');
	return generateColor(name, category);
}

/**
 * @deprecated Usar generateEmoji en su lugar
 */
export function generateWorldItemEmoji(type: string, name?: string): string {
	logger.warn('generateWorldItemEmoji está obsoleto. Use generateEmoji en su lugar.');
	return generateEmoji(type, name);
}

/**
 * @deprecated Usar toCreateData en su lugar
 */
export function toCreateWorldItemData(data: WorldItemCreateInput): Prisma.WorldItemCreateInput {
	logger.warn('toCreateWorldItemData está obsoleto. Use toCreateData en su lugar.');
	return toCreateData(data);
}

/**
 * @deprecated Usar toUpdateData en su lugar
 */
export function toUpdateWorldItemData(data: WorldItemUpdateInput): Prisma.WorldItemUpdateInput {
	logger.warn('toUpdateWorldItemData está obsoleto. Use toUpdateData en su lugar.');
	return toUpdateData(data);
}

/**
 * @deprecated Usar createFilter en su lugar
 */
export function createWorldItemFilter(filters: WorldItemFilters = {}): Prisma.WorldItemWhereInput {
	logger.warn('createWorldItemFilter está obsoleto. Use createFilter en su lugar.');
	return createFilter(filters);
}

/**
 * @deprecated Usar createOrderBy en su lugar
 */
export function createWorldItemOrderBy(sortBy?: WorldItemSortCriteria): Prisma.WorldItemOrderByWithRelationInput {
	logger.warn('createWorldItemOrderBy está obsoleto. Use createOrderBy en su lugar.');
	return createOrderBy(sortBy);
}

/**
 * @deprecated Usar toCreateData en su lugar
 */
export function mapCreateWorldItemDataToPrisma(data: WorldItemCreateInput): Prisma.WorldItemCreateInput {
	logger.warn('mapCreateWorldItemDataToPrisma está obsoleto. Use toCreateData en su lugar.');
	return toCreateData(data);
}

/**
 * @deprecated Usar toUpdateData en su lugar
 */
export function mapUpdateWorldItemDataToPrisma(data: WorldItemUpdateInput): Prisma.WorldItemUpdateInput {
	logger.warn('mapUpdateWorldItemDataToPrisma está obsoleto. Use toUpdateData en su lugar.');
	return toUpdateData(data);
}
