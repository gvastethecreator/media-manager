/**
 * @file Mapeadores para la entidad WorldItem
 * @module transformers/world-item/mappers
 */

import { serverLogger } from '@/lib/logger/server-logger';
import {
    type CreateWorldItemData,
    type UpdateWorldItemData,
    WORLD_ITEM_SORT_PROPERTY_MAP,
    type WorldItem,
    type WorldItemBase,
    WorldItemCategory,
    type WorldItemFilters,
    WorldItemSize,
    WorldItemSortCriteria,
    WorldItemType,
    type WorldItemVisualConfig,
    type WorldItemVisualConfigUpdateData
} from '../../types/entities/world-item';
import {
    parseJsonFields,
    parseVisualConfig,
    serializeWorldItemAttributes,
    serializeWorldItemEffects,
    serializeWorldItemFilters,
    serializeWorldItemRequirements,
    serializeWorldItemStats
} from './serializers';

const mappersLogger = serverLogger.withContext('WorldItemMappers');

/**
 * Genera un color aleatorio para un objeto del mundo basado en su nombre y categoría
 * @param name Nombre del objeto
 * @param category Categoría opcional
 * @returns Color hexadecimal
 */
export function generateWorldItemColor(name: string, category?: string | null): string {
	// Colores predeterminados por categoría
	const categoryColors: Record<string, string> = {
		[WorldItemCategory.COMBAT]: '#ef4444', // Rojo
		[WorldItemCategory.MAGIC]: '#8b5cf6', // Violeta
		[WorldItemCategory.TECHNOLOGY]: '#3b82f6', // Azul
		[WorldItemCategory.UTILITY]: '#10b981', // Verde
		[WorldItemCategory.DECORATION]: '#ec4899', // Rosa
		[WorldItemCategory.SURVIVAL]: '#f59e0b', // Ámbar
		[WorldItemCategory.TRANSPORTATION]: '#0ea5e9', // Azul cielo
		[WorldItemCategory.QUEST]: '#f97316', // Naranja
		[WorldItemCategory.LORE]: '#6366f1', // Índigo
		[WorldItemCategory.OTHER]: '#64748b', // Gris azulado
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
}

/**
 * Convierte HSL a formato hexadecimal
 * @param h Tono (0-360)
 * @param s Saturación (0-100)
 * @param l Luminosidad (0-100)
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
 * @param type Tipo de objeto
 * @param name Nombre del objeto
 * @returns Emoji representativo
 */
export function generateWorldItemEmoji(type: string, name?: string): string {
	const typeEmojis: Record<string, string> = {
		[WorldItemType.WEAPON]: '⚔️',
		[WorldItemType.ARMOR]: '🛡️',
		[WorldItemType.ACCESSORY]: '💍',
		[WorldItemType.POTION]: '🧪',
		[WorldItemType.SCROLL]: '📜',
		[WorldItemType.ARTIFACT]: '🏺',
		[WorldItemType.RELIC]: '✨',
		[WorldItemType.TECHNOLOGY]: '🔧',
		[WorldItemType.BOOK]: '📕',
		[WorldItemType.KEY]: '🔑',
		[WorldItemType.CURRENCY]: '💰',
		[WorldItemType.TOOL]: '🔨',
		[WorldItemType.CONTAINER]: '📦',
		[WorldItemType.CLOTHING]: '👕',
		[WorldItemType.FOOD]: '🍖',
		[WorldItemType.CRAFTING]: '⚒️',
		[WorldItemType.QUEST]: '📝',
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
}

/**
 * Extiende un objeto del mundo base con campos adicionales
 * @param worldItem Objeto del mundo base
 * @returns Objeto del mundo extendido
 */
export function extendWorldItem(worldItem: WorldItemBase): WorldItem {
	return parseJsonFields(worldItem);
}

/**
 * Extiende un array de objetos del mundo base con campos adicionales
 * @param worldItems Array de objetos del mundo base
 * @returns Array de objetos del mundo extendidos
 */
export function extendWorldItems(worldItems: WorldItemBase[]): WorldItem[] {
	return worldItems.map(extendWorldItem);
}

/**
 * Mapea datos de creación de objeto del mundo a formato compatible con Prisma
 * @param data Datos de creación del objeto
 * @returns Objeto formateado para Prisma
 */
export function toCreateWorldItemData(data: CreateWorldItemData): any {
	try {
		// Serializar campos JSON si es necesario
		const attributes = data.attributes ?
			(typeof data.attributes === 'string' ? data.attributes : serializeWorldItemAttributes(data.attributes)) :
			'empty_array';

		const effects = data.effects ?
			(typeof data.effects === 'string' ? data.effects : serializeWorldItemEffects(data.effects)) :
			'empty_array';

		const requirements = data.requirements ?
			(typeof data.requirements === 'string' ? data.requirements : serializeWorldItemRequirements(data.requirements)) :
			'';

		const stats = data.stats ?
			(typeof data.stats === 'string' ? data.stats : serializeWorldItemStats(data.stats)) :
			'';

		const filters = data.filters ?
			(typeof data.filters === 'string' ? data.filters : serializeWorldItemFilters(data.filters)) :
			'empty_array';

		return {
			name: data.name,
			description: data.description || null,
			emoji: data.emoji || generateWorldItemEmoji(data.type || 'misc', data.name),
			color: data.color || generateWorldItemColor(data.name, data.category),
			type: data.type || WorldItemType.MISC,
			rarity: data.rarity || 'common',
			size: data.size || WorldItemSize.MEDIUM,
			category: data.category || 'general',
			shortcut: data.shortcut || null,
			isFavorite: data.isFavorite || false,
			origin: data.origin || '',
			attributes,
			effects,
			requirements,
			stats,
			sortBy: data.sortBy || 'name',
			filters,
			featuredImage: data.featuredImage || null,
		};
	} catch (error) {
		mappersLogger.error('❌ Error en toCreateWorldItemData:', error);
		return {
			name: data.name,
			description: null,
			emoji: '🧰',
			color: '#64748b',
			type: WorldItemType.MISC,
			rarity: 'common',
			size: WorldItemSize.MEDIUM,
			category: 'general',
			attributes: 'empty_array',
			effects: 'empty_array',
		};
	}
}

/**
 * Mapea datos de actualización de objeto del mundo a formato compatible con Prisma
 * @param id ID del objeto a actualizar
 * @param data Datos para actualizar el objeto
 * @returns Objeto formateado para Prisma
 */
export function toUpdateWorldItemData(id: string, data: UpdateWorldItemData): any {
	try {
		const updateData: any = {};

		// Incluir solo campos presentes en los datos de actualización
		if (data.name !== undefined) updateData.name = data.name;
		if (data.description !== undefined) updateData.description = data.description;
		if (data.emoji !== undefined) updateData.emoji = data.emoji;
		if (data.color !== undefined) updateData.color = data.color;
		if (data.type !== undefined) updateData.type = data.type;
		if (data.rarity !== undefined) updateData.rarity = data.rarity;
		if (data.size !== undefined) updateData.size = data.size;
		if (data.category !== undefined) updateData.category = data.category;
		if (data.shortcut !== undefined) updateData.shortcut = data.shortcut;
		if (data.isFavorite !== undefined) updateData.isFavorite = data.isFavorite;
		if (data.origin !== undefined) updateData.origin = data.origin;
		if (data.featuredImage !== undefined) updateData.featuredImage = data.featuredImage;
		if (data.sortBy !== undefined) updateData.sortBy = data.sortBy;

		// Serializar campos JSON si están presentes
		if (data.attributes !== undefined) {
			updateData.attributes = typeof data.attributes === 'string'
				? data.attributes
				: serializeWorldItemAttributes(data.attributes);
		}

		if (data.effects !== undefined) {
			updateData.effects = typeof data.effects === 'string'
				? data.effects
				: serializeWorldItemEffects(data.effects);
		}

		if (data.requirements !== undefined) {
			updateData.requirements = typeof data.requirements === 'string'
				? data.requirements
				: serializeWorldItemRequirements(data.requirements);
		}

		if (data.stats !== undefined) {
			updateData.stats = typeof data.stats === 'string'
				? data.stats
				: serializeWorldItemStats(data.stats);
		}

		if (data.filters !== undefined) {
			updateData.filters = typeof data.filters === 'string'
				? data.filters
				: serializeWorldItemFilters(data.filters);
		}

		return updateData;
	} catch (error) {
		mappersLogger.error('❌ Error en toUpdateWorldItemData:', error);
		return { id };
	}
}

/**
 * Filtra una lista de objetos del mundo según criterios
 * @param worldItems Lista de objetos del mundo
 * @param filters Criterios de filtrado
 * @returns Lista filtrada de objetos del mundo
 */
export function filterWorldItems(worldItems: WorldItemBase[], filters: WorldItemFilters = {}): WorldItemBase[] {
	mappersLogger.info('🔍 Filtrando objetos del mundo con criterios:', filters);

	return worldItems.filter((worldItem) => {
		// Filtro por búsqueda
		if (filters.query) {
			const searchLower = filters.query.toLowerCase();
			const nameMatch = worldItem.name.toLowerCase().includes(searchLower);
			const descMatch = worldItem.description?.toLowerCase().includes(searchLower) || false;

			if (!nameMatch && !descMatch) {
				return false;
			}
		}

		// Filtro por tipo
		if (filters.types && filters.types.length > 0) {
			if (!filters.types.includes(worldItem.type as WorldItemType)) {
				return false;
			}
		}

		// Filtro por categoría
		if (filters.categories && filters.categories.length > 0) {
			if (!worldItem.category || !filters.categories.includes(worldItem.category as WorldItemCategory)) {
				return false;
			}
		}

		// Filtro por rareza
		if (filters.rarities && filters.rarities.length > 0) {
			if (!filters.rarities.includes(worldItem.rarity as any)) {
				return false;
			}
		}

		// Filtro por favoritos
		if (filters.isFavorite) {
			if (!worldItem.isFavorite) {
				return false;
			}
		}

		return true;
	});
}

/**
 * Ordena una lista de objetos del mundo según criterio específico
 * @param worldItems Lista de objetos del mundo
 * @param sortBy Criterio de ordenación
 * @returns Lista ordenada de objetos del mundo
 */
export function sortWorldItems(worldItems: WorldItemBase[], sortBy: WorldItemSortCriteria = WorldItemSortCriteria.NAME_ASC): WorldItemBase[] {
	mappersLogger.info('🔄 Ordenando objetos del mundo por:', sortBy);

	// Clonar array para no modificar el original
	const sortedItems = [...worldItems];

	// Obtener la propiedad y dirección para ordenar
	const propertyPath = WORLD_ITEM_SORT_PROPERTY_MAP[sortBy]?.property || 'name';
	const direction = WORLD_ITEM_SORT_PROPERTY_MAP[sortBy]?.direction || 'asc';
	const isAsc = direction === 'asc';

	// Ordenar según criterio
	return sortedItems.sort((a, b) => {
		// Extraer valores para comparar
		let valueA = getNestedProperty(a, propertyPath);
		let valueB = getNestedProperty(b, propertyPath);

		// Normalizar valores para comparación
		if (typeof valueA === 'string') valueA = valueA.toLowerCase();
		if (typeof valueB === 'string') valueB = valueB.toLowerCase();

		// Manejar valores de fecha
		if (propertyPath === 'createdAt' || propertyPath === 'updatedAt') {
			valueA = new Date(valueA as string).getTime();
			valueB = new Date(valueB as string).getTime();
		}

		// Comparar valores
		if (valueA < valueB) return isAsc ? -1 : 1;
		if (valueA > valueB) return isAsc ? 1 : -1;
		return 0;
	});
}

/**
 * Obtiene una propiedad anidada de un objeto usando una ruta de acceso
 * @param obj Objeto del que obtener la propiedad
 * @param path Ruta de acceso (ej: "property.subproperty")
 * @returns Valor de la propiedad o undefined
 */
function getNestedProperty(obj: any, path: string): any {
	const parts = path.split('.');
	let value = obj;

	for (const part of parts) {
		if (value === null || value === undefined) return undefined;
		value = value[part];
	}

	return value;
}

/**
 * Pagina una lista de objetos del mundo
 * @param worldItems Lista de objetos del mundo
 * @param page Número de página
 * @param pageSize Tamaño de página
 * @returns Subconjunto paginado de objetos del mundo
 */
export function paginateWorldItems(worldItems: WorldItemBase[], page = 1, pageSize = 20): WorldItemBase[] {
	const startIndex = (page - 1) * pageSize;
	return worldItems.slice(startIndex, startIndex + pageSize);
}

/**
 * Procesa una lista de objetos del mundo aplicando filtros, ordenación y paginación
 * @param worldItems Lista de objetos del mundo
 * @param filters Filtros a aplicar
 * @param sortBy Criterio de ordenación
 * @param page Número de página
 * @param pageSize Tamaño de página
 * @returns Objetos procesados, total y total de páginas
 */
export function processWorldItems(
	worldItems: WorldItemBase[],
	filters: WorldItemFilters = {},
	sortBy: WorldItemSortCriteria = WorldItemSortCriteria.NAME_ASC,
	page = 1,
	pageSize = 20
): { items: WorldItem[]; total: number; totalPages: number } {
	// Aplicar transformaciones en secuencia
	const filtered = filterWorldItems(worldItems, filters);
	const sorted = sortWorldItems(filtered, sortBy);
	const paginated = paginateWorldItems(sorted, page, pageSize);

	// Calcular total y páginas
	const total = filtered.length;
	const totalPages = Math.ceil(total / pageSize);

	// Transformar a formato extendido con campos JSON deserializados
	const items = paginated.map(extendWorldItem);

	return { items, total, totalPages };
}

/**
 * Mapea la configuración visual de un objeto del mundo
 * @param config Datos de configuración visual
 * @returns Configuración procesada
 */
export function mapWorldItemVisualConfig(config: WorldItemVisualConfig): WorldItemVisualConfig {
	try {
		return parseVisualConfig(config);
	} catch (error) {
		mappersLogger.error('❌ Error al mapear configuración visual:', error);
		return {
			showIcon: true,
			showType: true,
			showRarity: true,
			showStats: true,
			animateIcon: false,
			theme: 'default',
		};
	}
}

/**
 * Actualiza la configuración visual de un objeto del mundo
 * @param current Configuración actual
 * @param updates Actualizaciones a aplicar
 * @returns Configuración actualizada
 */
export function updateWorldItemVisualConfig(
	current: WorldItemVisualConfig,
	updates: WorldItemVisualConfigUpdateData
): WorldItemVisualConfig {
	return {
		...current,
		...updates,
	};
}
