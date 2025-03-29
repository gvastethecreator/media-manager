/**
 * @file Mappers para la entidad Place
 * @module transformers/place/mappers
 */

import { serverLogger } from '@/lib/logger/server-logger';
import {
  type CreatePlaceData,
  type PlaceBase,
  PlaceCategory,
  type PlaceExtendedComplete,
  PlaceType,
  type UpdatePlaceData
} from '@/types/entities/place';
import {
  mapPlaceExtendedFromComplete,
  serializePlaceDangers,
  serializePlaceFilters,
  serializePlaceResources,
  serializePlaceStats,
  toPlaceComplete
} from './serializers';

const mapperLogger = serverLogger.withContext('PlaceMapper');

/**
 * Genera un color aleatorio para un lugar basado en su nombre y categoría
 * @param name Nombre del lugar
 * @param category Categoría opcional
 * @returns Color hexadecimal
 */
export function generatePlaceColor(name: string, category?: string | null): string {
	// Colores predeterminados por categoría
	const categoryColors: Record<string, string> = {
		[PlaceCategory.SETTLEMENT]: '#3b82f6', // Azul
		[PlaceCategory.LANDSCAPE]: '#10b981', // Verde
		[PlaceCategory.STRUCTURE]: '#6366f1', // Índigo
		[PlaceCategory.BIOME]: '#84cc16', // Lima
		[PlaceCategory.UNDERGROUND]: '#7c3aed', // Violeta
		[PlaceCategory.MYTHICAL]: '#ec4899', // Rosa
		[PlaceCategory.HISTORICAL]: '#f59e0b', // Ámbar
		[PlaceCategory.OTHER]: '#64748b', // Gris azulado
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
 * Genera un emoji para un lugar basado en su tipo y categoría
 * @param type Tipo de lugar
 * @param category Categoría del lugar
 * @returns Emoji representativo
 */
export function generatePlaceEmoji(type?: string | null, category?: string | null): string {
	// Emojis por tipo
	const typeEmojis: Record<string, string> = {
		[PlaceType.CITY]: '🏙️',
		[PlaceType.TOWN]: '🏘️',
		[PlaceType.VILLAGE]: '🏡',
		[PlaceType.RUIN]: '🏚️',
		[PlaceType.CASTLE]: '🏰',
		[PlaceType.FORTRESS]: '🏯',
		[PlaceType.DUNGEON]: '🔒',
		[PlaceType.CAVE]: '🕳️',
		[PlaceType.FOREST]: '🌲',
		[PlaceType.MOUNTAIN]: '⛰️',
		[PlaceType.VALLEY]: '🏞️',
		[PlaceType.ISLAND]: '🏝️',
		[PlaceType.LAKE]: '🌊',
		[PlaceType.RIVER]: '🌊',
		[PlaceType.OCEAN]: '🌊',
		[PlaceType.DESERT]: '🏜️',
		[PlaceType.TUNDRA]: '❄️',
		[PlaceType.JUNGLE]: '🌴',
		[PlaceType.SWAMP]: '🦟',
	};

	// Emojis por categoría (fallback)
	const categoryEmojis: Record<string, string> = {
		[PlaceCategory.SETTLEMENT]: '🏙️',
		[PlaceCategory.LANDSCAPE]: '🏞️',
		[PlaceCategory.STRUCTURE]: '🏛️',
		[PlaceCategory.BIOME]: '🌍',
		[PlaceCategory.UNDERGROUND]: '⛏️',
		[PlaceCategory.MYTHICAL]: '✨',
		[PlaceCategory.HISTORICAL]: '🏺',
		[PlaceCategory.OTHER]: '📍',
	};

	// Intentar obtener emoji por tipo
	if (type && typeEmojis[type]) {
		return typeEmojis[type];
	}

	// Intentar obtener emoji por categoría
	if (category && categoryEmojis[category]) {
		return categoryEmojis[category];
	}

	// Emoji por defecto
	return '📍';
}

/**
 * Convierte componentes HSL a color hexadecimal
 * @param hue Matiz (0-360)
 * @param saturation Saturación (0-100)
 * @param lightness Luminosidad (0-100)
 * @returns Color en formato hexadecimal
 */
function hslToHex(hue: number, saturation: number, lightness: number): string {
	const s = saturation / 100;
	const l = lightness / 100;

	const c = (1 - Math.abs(2 * l - 1)) * s;
	const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
	const m = l - c / 2;

	let r = 0;
	let g = 0;
	let b = 0;

	if (0 <= hue && hue < 60) {
		r = c; g = x; b = 0;
	} else if (60 <= hue && hue < 120) {
		r = x; g = c; b = 0;
	} else if (120 <= hue && hue < 180) {
		r = 0; g = c; b = x;
	} else if (180 <= hue && hue < 240) {
		r = 0; g = x; b = c;
	} else if (240 <= hue && hue < 300) {
		r = x; g = 0; b = c;
	} else if (300 <= hue && hue < 360) {
		r = c; g = 0; b = x;
	}

	const rHex = Math.round((r + m) * 255).toString(16).padStart(2, '0');
	const gHex = Math.round((g + m) * 255).toString(16).padStart(2, '0');
	const bHex = Math.round((b + m) * 255).toString(16).padStart(2, '0');

	return `#${rHex}${gHex}${bHex}`;
}

/**
 * Mapea datos de creación a formato Prisma
 * @param data Datos de creación del lugar
 * @returns Datos formateados para Prisma
 */
export function mapCreatePlaceDataToPrisma(data: CreatePlaceData): Record<string, any> {
	try {
		const createData: Record<string, any> = {
			name: data.name,
			emoji: data.emoji || generatePlaceEmoji(data.type, data.category),
			color: data.color || generatePlaceColor(data.name, data.category),
			description: data.description || null,
			shortcut: data.shortcut || null,
			category: data.category || null,
			region: data.region || 'unknown',
			type: data.type || 'unknown',
			climate: data.climate || 'temperate',
			population: data.population ?? 0,
			government: data.government || 'unknown',
			lore: data.lore || '',
			history: data.history || '',
			featuredImage: data.featuredImage || null,
			isFavorite: data.isFavorite || false,
			sortBy: data.sortBy || 'name',
		};

		// Manejar campos JSON
		if (data.dangers) {
			if (typeof data.dangers === 'string') {
				createData.dangers = data.dangers;
			} else {
				createData.dangers = serializePlaceDangers(data.dangers);
			}
		} else {
			createData.dangers = '[]';
		}

		if (data.resources) {
			if (typeof data.resources === 'string') {
				createData.resources = data.resources;
			} else {
				createData.resources = serializePlaceResources(data.resources);
			}
		} else {
			createData.resources = '[]';
		}

		if (data.stats) {
			if (typeof data.stats === 'string') {
				createData.stats = data.stats;
			} else {
				createData.stats = serializePlaceStats(data.stats);
			}
		} else {
			createData.stats = '{}';
		}

		if (data.filters) {
			if (typeof data.filters === 'string') {
				createData.filters = data.filters;
			} else {
				createData.filters = serializePlaceFilters(data.filters);
			}
		} else {
			createData.filters = '{}';
		}

		// Manejar relaciones
		if (data.groupIds?.length) {
			createData.groups = {
				connect: data.groupIds.map(id => ({ id }))
			};
		}

		if (data.propertyIds?.length) {
			createData.properties = {
				connect: data.propertyIds.map(id => ({ id }))
			};
		}

		if (data.wildcardIds?.length) {
			createData.wildcards = {
				connect: data.wildcardIds.map(id => ({ id }))
			};
		}

		return createData;
	} catch (error) {
		mapperLogger.error('❌ Error al mapear datos de creación de Place:', error);
		throw error;
	}
}

/**
 * Mapea datos de actualización a formato Prisma
 * @param data Datos de actualización del lugar
 * @returns Datos formateados para Prisma
 */
export function mapUpdatePlaceDataToPrisma(data: UpdatePlaceData): Record<string, any> {
	try {
		const updateData: Record<string, any> = {};

		// Copiar propiedades simples
		if (data.name !== undefined) updateData.name = data.name;
		if (data.emoji !== undefined) updateData.emoji = data.emoji;
		if (data.color !== undefined) updateData.color = data.color;
		if (data.description !== undefined) updateData.description = data.description;
		if (data.shortcut !== undefined) updateData.shortcut = data.shortcut;
		if (data.category !== undefined) updateData.category = data.category;
		if (data.region !== undefined) updateData.region = data.region;
		if (data.type !== undefined) updateData.type = data.type;
		if (data.climate !== undefined) updateData.climate = data.climate;
		if (data.population !== undefined) updateData.population = data.population;
		if (data.government !== undefined) updateData.government = data.government;
		if (data.lore !== undefined) updateData.lore = data.lore;
		if (data.history !== undefined) updateData.history = data.history;
		if (data.featuredImage !== undefined) updateData.featuredImage = data.featuredImage;
		if (data.isFavorite !== undefined) updateData.isFavorite = data.isFavorite;
		if (data.sortBy !== undefined) updateData.sortBy = data.sortBy;

		// Manejar campos JSON
		if (data.dangers !== undefined) {
			if (typeof data.dangers === 'string') {
				updateData.dangers = data.dangers;
			} else {
				updateData.dangers = serializePlaceDangers(data.dangers);
			}
		}

		if (data.resources !== undefined) {
			if (typeof data.resources === 'string') {
				updateData.resources = data.resources;
			} else {
				updateData.resources = serializePlaceResources(data.resources);
			}
		}

		if (data.stats !== undefined) {
			if (typeof data.stats === 'string') {
				updateData.stats = data.stats;
			} else {
				updateData.stats = serializePlaceStats(data.stats);
			}
		}

		if (data.filters !== undefined) {
			if (typeof data.filters === 'string') {
				updateData.filters = data.filters;
			} else {
				updateData.filters = serializePlaceFilters(data.filters);
			}
		}

		// Manejar relaciones
		if (data.groupIds !== undefined) {
			updateData.groups = {
				set: data.groupIds?.map(id => ({ id })) || []
			};
		}

		if (data.propertyIds !== undefined) {
			updateData.properties = {
				set: data.propertyIds?.map(id => ({ id })) || []
			};
		}

		if (data.wildcardIds !== undefined) {
			updateData.wildcards = {
				set: data.wildcardIds?.map(id => ({ id })) || []
			};
		}

		return updateData;
	} catch (error) {
		mapperLogger.error('❌ Error al mapear datos de actualización de Place:', error);
		throw error;
	}
}

/**
 * Transforma y extiende un lugar con información adicional
 * @param place Lugar a extender
 * @param counts Conteos opcionales de relaciones
 * @returns Lugar extendido con datos adicionales
 */
export function extendPlace(
	place: PlaceBase,
	counts?: { images?: number; notes?: number; concepts?: number; prompts?: number }
): PlaceExtendedComplete {
	try {
		// Convertir a formato completo
		const placeComplete = toPlaceComplete(place);

		// Luego a formato extendido
		return mapPlaceExtendedFromComplete(placeComplete, counts);
	} catch (error) {
		mapperLogger.error('❌ Error al extender Place:', error);
		// Fallback seguro
		const placeComplete = toPlaceComplete(place);
		return mapPlaceExtendedFromComplete(placeComplete);
	}
}

/**
 * Transforma y extiende una lista de lugares
 * @param places Lista de lugares a extender
 * @param countsMap Mapa opcional de conteos por ID
 * @returns Lista de lugares extendidos
 */
export function extendPlaces(
	places: PlaceBase[],
	countsMap?: Map<string, { images?: number; notes?: number; concepts?: number; prompts?: number }>
): PlaceExtendedComplete[] {
	return places.map(place => {
		const counts = countsMap?.get(place.id);
		return extendPlace(place, counts);
	});
}
