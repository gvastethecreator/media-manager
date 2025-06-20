/**
 * @file Mapeadores para la entidad WorldItem
 * @module transformers/world-item/mappers
 */

import { createLogger } from '@/lib/logger';
import { WorldItemCategory, WorldItemType } from '@/types/entities/world-item/enums';
import {
    WORLD_ITEM_SORT_PROPERTY_MAP,
    type WorldItemCreateInput,
    type WorldItemFilters,
    type WorldItemSearchOptions,
    type WorldItemSortCriteria,
    type WorldItemUpdateInput,
} from '@/types/entities/world-item/types';
import {
    serializeAttributes,
    serializeEffects,
    serializeFilters,
    serializeProperties,
    serializeRequirements,
    serializeStats,
    serializeTags,
} from './serializers';

// Logger específico para este módulo
const logger = createLogger('WorldItemTransformer:Mappers');

/**
 * Tipos simplificados para mapeo - compatibles con cualquier implementación
 */
interface SimpleWorldItemCreateInput {
	id?: string;
	name: string;
	description?: string | null;
	shortcut?: string | null;
	category?: string;
	type?: string;
	rarity?: string;
	size?: string;
	origin?: string;
	emoji?: string;
	color?: string;
	isFavorite?: boolean;
	sortBy?: string;
	featuredImage?: string | null;
	attributes?: string;
	effects?: string;
	requirements?: string;
	stats?: string;
	properties?: string;
	filters?: string;
	tags?: string;
	images?: {
		connect: Array<{ id: string }>;
	};
}

interface SimpleWorldItemUpdateInput {
	name?: string;
	description?: string | null;
	shortcut?: string | null;
	category?: string;
	type?: string;
	rarity?: string;
	size?: string;
	origin?: string;
	emoji?: string;
	color?: string;
	isFavorite?: boolean;
	sortBy?: string;
	featuredImage?: string | null;
	attributes?: string;
	effects?: string;
	requirements?: string;
	stats?: string;
	properties?: string;
	filters?: string;
	tags?: string;
	images?: {
		set: Array<{ id: string }>;
	};
}

interface SimpleWorldItemWhereInput {
	AND?: SimpleWorldItemWhereInput[];
	OR?: SimpleWorldItemWhereInput[];
	NOT?: SimpleWorldItemWhereInput[];
	name?: { contains: string; mode: 'insensitive' };
	description?: { contains: string; mode: 'insensitive' };
	type?: { in: string[] };
	category?: { in: string[] };
	rarity?: { in: string[] };
	isFavorite?: boolean;
	images?: { some: Record<string, any> };
}

interface SimpleWorldItemOrderByInput {
	name?: 'asc' | 'desc';
	type?: 'asc' | 'desc';
	rarity?: 'asc' | 'desc';
	createdAt?: 'asc' | 'desc';
	updatedAt?: 'asc' | 'desc';
}

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
		let hash = 0;
		for (const char of Array.from(name)) {
			hash += char.charCodeAt(0);
		}
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

	let r: number;
	let g: number;
	let b: number;

	if (sNormalized === 0) {
		r = g = b = lNormalized;
	} else {
		const hue2rgb = (p: number, q: number, t: number) => {
			let tValue = t;
			if (tValue < 0) tValue += 1;
			if (tValue > 1) tValue -= 1;
			if (tValue < 1 / 6) return p + (q - p) * 6 * tValue;
			if (tValue < 1 / 2) return q;
			if (tValue < 2 / 3) return p + (q - p) * (2 / 3 - tValue) * 6;
			return p;
		};

		const q =
			lNormalized < 0.5 ? lNormalized * (1 + sNormalized) : lNormalized + sNormalized - lNormalized * sNormalized;
		const p = 2 * lNormalized - q;
		r = hue2rgb(p, q, hNormalized + 1 / 3);
		g = hue2rgb(p, q, hNormalized);
		b = hue2rgb(p, q, hNormalized - 1 / 3);
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
		const genericEmojis = [
			'🗿',
			'🎭',
			'🔮',
			'💎',
			'⚱️',
			'🧩',
			'🎯',
			'🎪',
			'🎠',
			'🎨',
			'🎰',
			'🧸',
			'🎁',
			'🎊',
			'🎷',
			'🎸',
			'🎺',
			'🎻',
		];

		// Si hay un nombre, generar un emoji basado en él
		if (name) {
			let hash = 0;
			for (const char of Array.from(name)) {
				hash += char.charCodeAt(0);
			}
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
export function toCreateData(data: WorldItemCreateInput): any {
	try {
		const serializedData: any = {
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
			featuredImage: data.featuredImage ?? null,
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
				connect: data.images.connect.map((item) => ({ id: item.id })),
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
export function toUpdateData(data: WorldItemUpdateInput): any {
	try {
		const updateData: any = {};

		// Copiar campos simples si están presentes
		if (data.name !== undefined) updateData.name = data.name;
		if (data.description !== undefined) updateData.description = data.description;
		if (data.shortcut !== undefined) updateData.shortcut = data.shortcut;
		if (data.category !== undefined) updateData.category = data.category;
		if (data.type !== undefined) updateData.type = data.type;
		if (data.rarity !== undefined) updateData.rarity = data.rarity;
		if (data.size !== undefined) updateData.size = data.size;
		if (data.origin !== undefined) updateData.origin = data.origin;
		if (data.emoji !== undefined) updateData.emoji = data.emoji;
		if (data.color !== undefined) updateData.color = data.color;
		if (data.isFavorite !== undefined) updateData.isFavorite = data.isFavorite;
		if (data.sortBy !== undefined) updateData.sortBy = data.sortBy;
		if (data.featuredImage !== undefined) updateData.featuredImage = data.featuredImage;

		// Serializar campos JSON si están presentes
		if (data.attributes !== undefined) {
			updateData.attributes = serializeAttributes(data.attributes);
		}

		if (data.effects !== undefined) {
			updateData.effects = serializeEffects(data.effects);
		}

		if (data.requirements !== undefined) {
			updateData.requirements = serializeRequirements(data.requirements);
		}

		if (data.stats !== undefined) {
			updateData.stats = serializeStats(data.stats);
		}

		if (data.properties !== undefined) {
			updateData.properties = serializeProperties(data.properties);
		}

		if (data.filters !== undefined) {
			updateData.filters = serializeFilters(data.filters);
		}

		if (data.tags !== undefined) {
			updateData.tags = serializeTags(data.tags);
		}

		// Manejar relaciones
		if (data.images) {
			updateData.images = {
				set: data.images.set.map((item) => ({ id: item.id })),
			};
		}

		return updateData;
	} catch (error) {
		logger.error('Error mapeando datos de actualización de WorldItem', error);
		throw new Error(`Error mapeando datos de actualización: ${error instanceof Error ? error.message : String(error)}`);
	}
}

/**
 * Mapea opciones de búsqueda a formato Prisma
 * @param options - Opciones de búsqueda
 * @returns Argumentos de búsqueda para Prisma
 */
export function toSearchOptions(options: WorldItemSearchOptions = {}): SimpleWorldItemWhereInput {
	try {
		const { filters, sortBy, page = 1, pageSize = 20, includeImages = false, includeStats = false } = options;

		// Crear objeto de opciones
		const findOptions: SimpleWorldItemWhereInput = {};

		// Aplicar paginación
		findOptions.skip = (page - 1) * pageSize;
		findOptions.take = pageSize;

		// Aplicar ordenación
		if (sortBy) {
			findOptions.orderBy = createOrderBy(sortBy);
		}

		// Aplicar filtros
		if (filters) {
			findOptions.where = createFilter(filters);
		}

		// Incluir relaciones
		if (includeImages || includeStats) {
			findOptions.include = {};

			if (includeImages) {
				findOptions.include.images = true;
			}

			if (includeStats) {
				findOptions.include._count = true;
			}
		}

		return findOptions;
	} catch (error) {
		logger.error('Error mapeando opciones de búsqueda de WorldItem', error);
		return { take: 20 }; // Opciones mínimas por defecto
	}
}

/**
 * Crea un filtro Prisma a partir de filtros de WorldItem
 * @param filters - Filtros de WorldItem
 * @returns Filtro para Prisma
 */
export function createFilter(filters: WorldItemFilters = {}): any {
	try {
		const where: any = {};
		const conditions: any[] = [];

		// Búsqueda por texto
		if (filters.searchTerm) {
			conditions.push({
				OR: [
					{ name: { contains: filters.searchTerm, mode: 'insensitive' } },
					{ description: { contains: filters.searchTerm, mode: 'insensitive' } },
				],
			});
		}

		// Filtrar por tipos
		if (filters.type) {
			conditions.push({
				type: { equals: filters.type },
			});
		}

		// Filtrar por categorías
		if (filters.category) {
			conditions.push({
				category: { equals: filters.category },
			});
		}

		// Filtrar por rareza
		if (filters.rarity) {
			conditions.push({
				rarity: { equals: filters.rarity },
			});
		}

		// Filtrar por favoritos
		if (filters.isFavorite !== undefined) {
			conditions.push({
				isFavorite: filters.isFavorite,
			});
		}

		// Filtrar por presencia de imágenes
		if (filters.hasImages) {
			conditions.push({
				images: { some: {} },
			});
		}

		// Aplicar todos los filtros con AND
		if (conditions.length > 0) {
			where.AND = conditions;
		}

		return where;
	} catch (error) {
		logger.error('Error creando filtro de WorldItem', error);
		return {}; // Filtro vacío por defecto
	}
}

/**
 * Crea un objeto de ordenación para Prisma
 * @param sortBy - Criterio de ordenación
 * @returns Objeto de ordenación para Prisma
 */
export function createOrderBy(sortBy?: WorldItemSortCriteria): any {
	try {
		if (!sortBy) {
			return { updatedAt: 'desc' }; // Ordenación por defecto
		}

		const [field, direction] = sortBy.split(':');
		const property = WORLD_ITEM_SORT_PROPERTY_MAP[sortBy as WorldItemSortCriteria] || field;
		const order = direction === 'asc' ? 'asc' : 'desc';

		// Crear objeto de ordenación
		return { [property]: order };
	} catch (error) {
		logger.error('Error creando ordenación de WorldItem', error);
		return { updatedAt: 'desc' }; // Ordenación por defecto
	}
}

// Funciones alias para compatibilidad con código existente
export const generateWorldItemColor = generateColor;
export const generateWorldItemEmoji = generateEmoji;
export const toCreateWorldItemData = toCreateData;
export const toUpdateWorldItemData = toUpdateData;
export const createWorldItemFilter = createFilter;
export const createWorldItemOrderBy = createOrderBy;
export const mapCreateWorldItemDataToPrisma = toCreateData;
export const mapUpdateWorldItemDataToPrisma = toUpdateData;
