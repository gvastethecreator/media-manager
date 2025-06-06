/**
 * @file Transformadores principales para la entidad WorldItem
 * @module transformers/world-item/transformer
 */

import { TransformerError } from '@/lib/errors';
import { serverLogger } from '@/lib/logger/server-logger';
import type { WorldItemExtended } from '@/types/entities/world-item/extended';
import type { WorldItemDeserialized } from '@/types/entities/world-item/types';
import { extendWorldItem, fromPrismaWorldItem } from './serializers';

const logger = serverLogger.withContext('WorldItemTransformer');

// 📊 Tipo local para WorldItem con estadísticas
interface WorldItemWithStats extends WorldItemDeserialized {
	_count?: {
		images: number;
		videos: number;
		collections: number;
		albums: number;
		tags: number;
		characters: number;
		places: number;
		concepts: number;
		prompts: number;
		notes: number;
		wildcards: number;
		properties: number;
		groups: number;
	};
	lastUpdated: Date;
	imageCount: number;
	videoCount: number;
	albumCount: number;
	tagCount: number;
	characterCount: number;
	placeCount: number;
	rarityLevel: number;
	statsDisplay: Array<{ name: string; value: number }>;
	distribution: Array<{ name: string; count: number }>;
}

/**
 * 🔄 Transforma un objeto a WorldItem, validando su estructura
 * @param worldItem Objeto a transformar
 * @returns WorldItem validado y estructurado
 * @throws TransformerError si la validación falla
 */
export function transformWorldItem(worldItem: unknown): WorldItemDeserialized {
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
		throw new TransformerError(`Error al transformar WorldItem: ${error instanceof Error ? error.message : String(error)}`);
	}
}

/**
 * 🔄 Transforma una lista de objetos a WorldItems
 * @param worldItems Array de objetos a transformar
 * @returns Array de WorldItems validados
 * @throws TransformerError si la validación falla para algún elemento
 */
export function transformWorldItems(worldItems: unknown[]): WorldItemDeserialized[] {
	try {
		if (!Array.isArray(worldItems)) {
			throw new Error('El parámetro no es un array');
		}

		return worldItems.map((item) => transformWorldItem(item));
	} catch (error) {
		logger.error('Error transformando lista de WorldItems:', { error });
		throw new TransformerError(`Error al transformar lista de WorldItems: ${error instanceof Error ? error.message : String(error)}`);
	}
}

/**
 * 🔄 Transforma un WorldItem a su versión extendida con propiedades para UI
 * @param worldItem WorldItem base a extender
 * @returns WorldItem extendido con propiedades adicionales
 */
export function transformWorldItemToExtended(worldItem: WorldItemDeserialized): WorldItemExtended {
	try {
		// 🛡️ Validación mejorada de entrada
		if (!worldItem) {
			throw new Error('El WorldItem de entrada es nulo o indefinido');
		}

		// 🛡️ Verificar que worldItem es un objeto válido
		if (typeof worldItem !== 'object' || !worldItem.id) {
			throw new Error('El WorldItem debe ser un objeto válido con un ID');
		}

		const baseItem = transformWorldItem(worldItem);

		// 🛡️ Helper para parsear JSON de forma segura
		const safeJsonParse = <T>(jsonString: string | T | null | undefined, fallback: T): T => {
			// Si ya es el tipo esperado, devolverlo directamente
			if (typeof jsonString !== 'string') {
				return jsonString || fallback;
			}

			// Si es string vacío o null, usar fallback
			if (!jsonString || jsonString.trim() === '') {
				return fallback;
			}

			// Valores especiales conocidos
			if (jsonString === 'empty_array') return [] as unknown as T;
			if (jsonString === 'empty_object') return {} as unknown as T;
			if (jsonString === '[]') return [] as unknown as T;
			if (jsonString === '{}') return {} as unknown as T;

			try {
				const parsed = JSON.parse(jsonString);
				return parsed || fallback;
			} catch (error) {
				logger.warn('Error parseando JSON en transformWorldItemToExtended, usando fallback:', {
					worldItemId: baseItem.id,
					jsonString: jsonString.substring(0, 100) + (jsonString.length > 100 ? '...' : ''),
					error: error instanceof Error ? error.message : String(error)
				});
				return fallback;
			}
		};

		// Extender el WorldItem con propiedades para UI usando parseo seguro
		const extendedItem: WorldItemExtended = {
			...baseItem,
			// Propiedades de UI básicas
			isSelected: false,
			isExpanded: false,
			isEditing: false,
			// Propiedades calculadas para UI con parseo seguro
			stats: safeJsonParse(baseItem.stats, {}),
			attributes: safeJsonParse(baseItem.attributes, []),
			effects: safeJsonParse(baseItem.effects, []),
			properties: safeJsonParse(baseItem.properties, []),
			requirements: safeJsonParse(baseItem.requirements, {}),
			filters: safeJsonParse(baseItem.filters, {}),
		};

		logger.debug('✅ WorldItem transformado a versión extendida exitosamente:', {
			worldItemId: baseItem.id,
			attributesCount: extendedItem.attributes?.length || 0,
			effectsCount: extendedItem.effects?.length || 0,
		});

		return extendedItem;
	} catch (error) {
		logger.error('Error transformando WorldItem a versión extendida:', {
			error: error instanceof Error ? { message: error.message, stack: error.stack } : error,
			worldItemId: (worldItem as any)?.id,
			worldItemType: typeof worldItem
		});
		throw new TransformerError(`Error al transformar WorldItem a versión extendida: ${error instanceof Error ? error.message : String(error)}`);
	}
}

/**
 * 🔄 Transforma un WorldItem a su versión con estadísticas
 * @param worldItem WorldItem base
 * @returns WorldItem con estadísticas calculadas
 */
export function transformWorldItemToWithStats(worldItem: any): WorldItemWithStats {
	try {
		const baseItem = transformWorldItem(worldItem);

		// Calcular totales para las estadísticas - usar casting a any para acceder a _count
		const counts = (baseItem as any)._count || {
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
		throw new TransformerError(`Error al transformar WorldItem a versión con estadísticas: ${error instanceof Error ? error.message : String(error)}`);
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
function generateStatsDisplay(worldItem: WorldItemDeserialized): Array<{ name: string; value: number }> {
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
