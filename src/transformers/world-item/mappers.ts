/**
 * @file Mapeadores para la entidad WorldItem
 * @module transformers/world-item/mappers
 */

import type { Prisma } from '@prisma/client';
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
  serializeWorldItemStats,
  serializeWorldItemTags
} from './serializers';

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
 * Prepara los datos para crear un objeto del mundo
 * @param data Datos de creación
 * @returns Datos preparados para la base de datos
 */
export function prepareCreateWorldItemData(data: CreateWorldItemData): Record<string, any> {
	// Asignar valores por defecto si no se proporcionan
	if (!data.emoji) {
		data.emoji = generateWorldItemEmoji(data.type || 'misc', data.name);
	}

	if (!data.color) {
		data.color = generateWorldItemColor(data.name, data.category);
	}

	// Preparar datos para inserción
	return {
		name: data.name,
		emoji: data.emoji,
		color: data.color,
		description: data.description ?? null,
		shortcut: data.shortcut ?? null,
		type: data.type ?? 'misc',
		rarity: data.rarity ?? 'common',
		properties: data.properties ?? 'empty_array',
		requirements: data.requirements ?? '{}',
		origin: data.origin ?? '',
		stats: data.stats ?? '{}',
		sortBy: data.sortBy ?? 'name',
		filters: data.filters ?? 'empty_array',
		featuredImage: data.featuredImage ?? null,
		isFavorite: data.isFavorite ?? false,
		category: data.category ?? null,
	};
}

/**
 * Prepara los datos para actualizar un objeto del mundo
 * @param data Datos de actualización
 * @returns Datos preparados para la base de datos
 */
export function prepareUpdateWorldItemData(data: UpdateWorldItemData): Record<string, any> {
	// Filtrar campos nulos o indefinidos para actualización
	const updateData: Record<string, any> = {};

	for (const [key, value] of Object.entries(data)) {
		if (value !== undefined) {
			updateData[key] = value;
		}
	}

	return updateData;
}

/**
 * Prepara los datos para actualizar configuración visual
 * @param data Datos de actualización de configuración visual
 * @returns Datos preparados para la base de datos
 */
export function prepareVisualConfigUpdateData(data: WorldItemVisualConfigUpdateData): Record<string, any> {
	const updateData: Record<string, any> = {};

	if (data.view !== undefined) {
		updateData.view = data.view;
	}

	if (data.sortBy !== undefined) {
		updateData.sortBy = data.sortBy;
	}

	if (data.filters !== undefined) {
		updateData.filters = serializeWorldItemFilters(data.filters);
	}

	if (data.lastViewedWorldItemId !== undefined) {
		updateData.lastViewedWorldItemId = data.lastViewedWorldItemId;
	}

	if (data.expandedWorldItemIds !== undefined) {
		updateData.expandedWorldItemIds = data.expandedWorldItemIds;
	}

	if (data.selectedWorldItemIds !== undefined) {
		updateData.selectedWorldItemIds = data.selectedWorldItemIds;
	}

	return updateData;
}

/**
 * Mapea datos de creación de objeto del mundo a formato Prisma
 * @param data Datos para crear un objeto del mundo
 * @returns Objeto con formato para Prisma
 */
export function mapCreateWorldItemDataToPrisma(data: CreateWorldItemData): Prisma.WorldItemCreateInput {
	return {
		name: data.name,
		emoji: data.emoji || generateWorldItemEmoji(data.type || 'misc', data.name),
		color: data.color || generateWorldItemColor(data.name, data.category),
		description: data.description || null,
		shortcut: data.shortcut || null,
		category: data.category || null,
		type: data.type || WorldItemType.MISC,
		rarity: data.rarity || 'common',
		attributes: serializeWorldItemAttributes(data.attributes || []),
		effects: serializeWorldItemEffects(data.effects || []),
		size: (data.size as string) || WorldItemSize.MEDIUM,
		requirements: serializeWorldItemRequirements(data.requirements || {}),
		origin: data.origin || '',
		stats: serializeWorldItemStats(data.stats || {}),
		tags: serializeWorldItemTags(data.tags || []),
		featuredImage: data.featuredImage || null,
		isFavorite: data.isFavorite || false,
		sortBy: data.sortBy || 'name:asc',
		filters: serializeWorldItemFilters(data.filters || {}),

		// Conexiones con relaciones
		...(data.groupIds?.length && {
			groups: {
				connect: data.groupIds.map((id) => ({ id })),
			},
		}),
		...(data.propertyIds?.length && {
			properties: {
				connect: data.propertyIds.map((id) => ({ id })),
			},
		}),
		...(data.wildcardIds?.length && {
			wildcards: {
				connect: data.wildcardIds.map((id) => ({ id })),
			},
		}),
		...(data.tagIds?.length && {
			tagEntities: {
				connect: data.tagIds.map((id) => ({ id })),
			},
		}),
	};
}

/**
 * Mapea datos de actualización de objeto del mundo a formato Prisma
 * @param data Datos para actualizar un objeto del mundo
 * @returns Objeto con formato para Prisma
 */
export function mapUpdateWorldItemDataToPrisma(data: UpdateWorldItemData): Prisma.WorldItemUpdateInput {
	const updateData: Prisma.WorldItemUpdateInput = {};

	// Campos básicos
	if (data.name !== undefined) updateData.name = data.name;
	if (data.emoji !== undefined) updateData.emoji = data.emoji;
	if (data.color !== undefined) updateData.color = data.color;
	if (data.description !== undefined) updateData.description = data.description;
	if (data.shortcut !== undefined) updateData.shortcut = data.shortcut;
	if (data.category !== undefined) updateData.category = data.category;
	if (data.type !== undefined) updateData.type = data.type;
	if (data.rarity !== undefined) updateData.rarity = data.rarity;
	if (data.size !== undefined) updateData.size = data.size as string;
	if (data.origin !== undefined) updateData.origin = data.origin;
	if (data.featuredImage !== undefined) updateData.featuredImage = data.featuredImage;
	if (data.isFavorite !== undefined) updateData.isFavorite = data.isFavorite;
	if (data.sortBy !== undefined) updateData.sortBy = data.sortBy;

	// Campos JSON que requieren serialización
	if (data.attributes !== undefined)
		updateData.attributes = serializeWorldItemAttributes(data.attributes);

	if (data.effects !== undefined)
		updateData.effects = serializeWorldItemEffects(data.effects);

	if (data.requirements !== undefined)
		updateData.requirements = serializeWorldItemRequirements(data.requirements);

	if (data.stats !== undefined)
		updateData.stats = serializeWorldItemStats(data.stats);

	if (data.tags !== undefined)
		updateData.tags = serializeWorldItemTags(data.tags);

	if (data.filters !== undefined)
		updateData.filters = serializeWorldItemFilters(data.filters);

	// Relaciones
	if (data.groupIds !== undefined) {
		updateData.groups = {
			set: data.groupIds.map((id) => ({ id })),
		};
	}

	if (data.propertyIds !== undefined) {
		updateData.properties = {
			set: data.propertyIds.map((id) => ({ id })),
		};
	}

	if (data.wildcardIds !== undefined) {
		updateData.wildcards = {
			set: data.wildcardIds.map((id) => ({ id })),
		};
	}

	if (data.tagIds !== undefined) {
		updateData.tagEntities = {
			set: data.tagIds.map((id) => ({ id })),
		};
	}

	return updateData;
}

/**
 * Mapea la configuración visual a formato para la UI
 * @param config Configuración visual
 * @returns Configuración visual parseada
 */
export function mapVisualConfig(config: WorldItemVisualConfig) {
	return parseVisualConfig(config);
}

/**
 * Crea un filtro de búsqueda para Prisma basado en los criterios proporcionados
 * @param filters - Filtros para la búsqueda
 * @returns Condiciones para consulta Prisma
 */
export function createWorldItemFilter(filters?: WorldItemFilters): Prisma.WorldItemWhereInput {
  if (!filters) return {};

  const conditions: Prisma.WorldItemWhereInput = {};
  const AND: Prisma.WorldItemWhereInput[] = [];

  // Búsqueda por texto
  if (filters.searchQuery) {
    conditions.OR = [
      { name: { contains: filters.searchQuery, mode: 'insensitive' } },
      { description: { contains: filters.searchQuery, mode: 'insensitive' } },
      { origin: { contains: filters.searchQuery, mode: 'insensitive' } },
    ];
  }

  // Filtro por categorías
  if (filters.categories?.length) {
    AND.push({
      category: {
        in: filters.categories,
      },
    });
  }

  // Filtro por tipos
  if (filters.types?.length) {
    AND.push({
      type: {
        in: filters.types,
      },
    });
  }

  // Filtro por rarezas
  if (filters.rarities?.length) {
    AND.push({
      rarity: {
        in: filters.rarities,
      },
    });
  }

  // Filtro por tamaños
  if (filters.sizes?.length) {
    AND.push({
      size: {
        in: filters.sizes,
      },
    });
  }

  // Filtro por favoritos
  if (filters.onlyFavorites) {
    AND.push({
      isFavorite: true,
    });
  }

  if (AND.length) {
    conditions.AND = AND;
  }

  return conditions;
}

/**
 * Crea un ordenamiento para Prisma basado en el criterio de ordenación
 * @param sortCriteria - Criterio de ordenación
 * @param sortPropertyMap - Mapa de propiedades para ordenación
 * @returns Ordenamiento para Prisma
 */
export function createWorldItemOrderBy(
  sortCriteria: WorldItemSortCriteria = WorldItemSortCriteria.NAME_ASC,
  sortPropertyMap: typeof WORLD_ITEM_SORT_PROPERTY_MAP = WORLD_ITEM_SORT_PROPERTY_MAP
): Prisma.WorldItemOrderByWithRelationInput {
  const [_, direction] = sortCriteria.split(':');
  const property = sortPropertyMap[sortCriteria];

  return {
    [property]: direction as Prisma.SortOrder,
  };
}
