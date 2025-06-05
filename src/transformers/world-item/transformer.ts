/**
 * @file Transformadores principales para la entidad WorldItem
 * @module transformers/world-item/transformer
 */

import { TransformerError } from '@/lib/errors';
import { serverLogger } from '@/lib/logger/server-logger';
import type { WorldItem, WorldItemExtended, WorldItemWithStats } from '@/types/entities/world-item/types';
import { extendWorldItem, fromPrismaWorldItem } from './serializers';

const logger = serverLogger.withContext('WorldItemTransformer');

/**
 * 🔄 Transforma un objeto a WorldItem, validando su estructura
 * @param worldItem Objeto a transformar
 * @returns WorldItem validado y estructurado
 * @throws TransformerError si la validación falla
 */
export function transformWorldItem(worldItem: unknown): WorldItem {
	try {
		if (!worldItem) {
			throw new Error('El objeto WorldItem es nulo o indefinido');
		}

		// Si el item viene de Prisma, transformarlo
		if ('images' in (worldItem as any) && 'videos' in (worldItem as any)) {
			return fromPrismaWorldItem(worldItem as any);
		}

		// Si es un objeto simple, extenderlo
		return extendWorldItem(worldItem as any);
	} catch (error) {
		logger.error('Error transformando WorldItem:', { error });
		throw new TransformerError('Error al transformar WorldItem', { cause: error });
	}
}

/**
 * 🔄 Transforma una lista de objetos a WorldItems
 * @param worldItems Array de objetos a transformar
 * @returns Array de WorldItems validados
 * @throws TransformerError si la validación falla para algún elemento
 */
export function transformWorldItems(worldItems: unknown[]): WorldItem[] {
	try {
		if (!Array.isArray(worldItems)) {
			throw new Error('El parámetro no es un array');
		}

		return worldItems.map((item) => transformWorldItem(item));
	} catch (error) {
		logger.error('Error transformando lista de WorldItems:', { error });
		throw new TransformerError('Error al transformar lista de WorldItems', { cause: error });
	}
}

/**
 * 🔄 Transforma un WorldItem a su versión extendida con propiedades para UI
 * @param worldItem WorldItem base a extender
 * @returns WorldItem extendido con propiedades adicionales
 */
export function transformWorldItemToExtended(worldItem: WorldItem): WorldItemExtended {
	try {
		const baseItem = transformWorldItem(worldItem);

		// Extender el WorldItem con propiedades para UI
		return {
			...baseItem,
			isSelected: false,
			isHighlighted: false,
			isEditing: false,
			isExpanded: false,
			displayOrder: 0,
			// Propiedades calculadas para UI
			attributesArray:
				typeof baseItem.attributes === 'string' ? JSON.parse(baseItem.attributes || '[]') : baseItem.attributes || [],
			effectsArray:
				typeof baseItem.effects === 'string' ? JSON.parse(baseItem.effects || '[]') : baseItem.effects || [],
			requirementsArray:
				typeof baseItem.requirements === 'string'
					? JSON.parse(baseItem.requirements || '[]')
					: baseItem.requirements || [],
			statsObject: typeof baseItem.stats === 'string' ? JSON.parse(baseItem.stats || '{}') : baseItem.stats || {},
		};
	} catch (error) {
		logger.error('Error transformando WorldItem a versión extendida:', { error, worldItemId: (worldItem as any)?.id });
		throw new TransformerError('Error al transformar WorldItem a versión extendida', { cause: error });
	}
}

/**
 * 🔄 Transforma un WorldItem a su versión con estadísticas
 * @param worldItem WorldItem base
 * @returns WorldItem con estadísticas calculadas
 */
export function transformWorldItemToWithStats(worldItem: WorldItem): WorldItemWithStats {
	try {
		const baseItem = transformWorldItem(worldItem);

		// Calcular totales para las estadísticas
		const counts = baseItem._count || {
			images: 0,
			videos: 0,
			collections: 0,
			albums: 0,
			tags: 0,
			characters: 0,
			places: 0,
			concepts: 0,
			prompts: 0,
			notes: 0,
			wildcards: 0,
			properties: 0,
			groups: 0,
		};

		// Determinar la última actualización
		const lastUpdated = baseItem.updatedAt || new Date();

		// Calcular nivel de rareza numérico
		const rarityLevel = calculateRarityLevel(baseItem.rarity);

		// Construir y devolver el objeto extendido
		return {
			...baseItem,
			lastUpdated,
			imageCount: counts.images,
			videoCount: counts.videos,
			albumCount: counts.albums,
			tagCount: counts.tags,
			characterCount: counts.characters,
			placeCount: counts.places,
			rarityLevel,
			statsDisplay: generateStatsDisplay(baseItem),
			distribution: [
				{ name: 'images', count: counts.images },
				{ name: 'videos', count: counts.videos },
				{ name: 'characters', count: counts.characters },
				{ name: 'places', count: counts.places },
			],
		};
	} catch (error) {
		logger.error('Error transformando WorldItem a versión con estadísticas:', {
			error,
			worldItemId: (worldItem as any)?.id,
		});
		throw new TransformerError('Error al transformar WorldItem a versión con estadísticas', { cause: error });
	}
}

/**
 * Calcula el nivel numérico de rareza basado en el string de rareza
 * @private
 */
function calculateRarityLevel(rarity: string): number {
	try {
		// Mapeo de rareza a nivel numérico
		const rarityMap: Record<string, number> = {
			common: 1,
			uncommon: 2,
			rare: 3,
			epic: 4,
			legendary: 5,
			mythic: 6,
			artifact: 7,
			unique: 8,
		};

		return rarityMap[rarity.toLowerCase()] || 1;
	} catch (error) {
		logger.warn('Error calculando nivel de rareza, usando valor por defecto:', error);
		return 1; // Valor por defecto
	}
}

/**
 * Genera presentación de estadísticas del item para visualización
 * @private
 */
function generateStatsDisplay(worldItem: WorldItem): Array<{ name: string; value: number }> {
	try {
		// Si ya tenemos stats como objeto, usar eso directamente
		const stats = typeof worldItem.stats === 'string' ? JSON.parse(worldItem.stats || '{}') : worldItem.stats || {};

		// Convertir a formato para gráfico
		return Object.entries(stats).map(([name, value]) => ({
			name,
			value: typeof value === 'number' ? value : 0,
		}));
	} catch (error) {
		logger.warn('Error generando datos de estadísticas, devolviendo array vacío:', error);
		return []; // Valor por defecto
	}
}
