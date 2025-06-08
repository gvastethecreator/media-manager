/**
 * @file Transformadores principales para la entidad Place
 * @module transformers/place/transformer
 */

import { serverLogger } from '@/lib/logger/server-logger';
import type { Place, PlaceExtended, PlaceWithStats } from '@/types/entities/place/types';
import { TransformerError } from '@/utils/transformers/errors';
import { extendPlace, fromPrismaPlace } from './serializers';

const logger = serverLogger.withContext('PlaceTransformer');

/**
 * 🔄 Transforma un objeto a Place, validando su estructura
 * @param place Objeto a transformar
 * @returns Place validado y estructurado
 * @throws TransformerError si la validación falla
 */
export function transformPlace(place: unknown): Place {
	try {
		if (!place) {
			throw new Error('El objeto de lugar es nulo o indefinido');
		}

		// Si el lugar viene de Prisma, transformarlo
		if ('images' in (place as any) && 'videos' in (place as any)) {
			return fromPrismaPlace(place as any);
		}

		// Si es un objeto simple, extenderlo
		return extendPlace(place as any);
	} catch (error) {
		logger.error('Error transformando lugar:', { error });
		throw new TransformerError('Error al transformar lugar');
	}
}

/**
 * 🔄 Transforma una lista de objetos a Places
 * @param places Array de objetos a transformar
 * @returns Array de Places validados
 * @throws TransformerError si la validación falla para algún elemento
 */
export function transformPlaces(places: unknown[]): Place[] {
	try {
		if (!Array.isArray(places)) {
			throw new Error('El parámetro no es un array');
		}

		return places.map((place) => transformPlace(place));
	} catch (error) {
		logger.error('Error transformando lista de lugares:', { error });
		throw new TransformerError('Error al transformar lista de lugares');
	}
}

/**
 * 🔄 Transforma un Place a su versión extendida con propiedades para UI
 * @param place Place base a extender
 * @returns Place extendido con propiedades adicionales
 */
export function transformPlaceToExtended(place: Place): PlaceExtended {
	try {
		const basePlace = transformPlace(place);

		// Extender el lugar con propiedades para UI
		return {
			...basePlace,
			isSelected: false,
			isHighlighted: false,
			isEditing: false,
			isExpanded: false,
			displayOrder: 0,
			// Propiedades calculadas para UI
			dangersArray:
				typeof basePlace.dangers === 'string' ? JSON.parse(basePlace.dangers || '[]') : basePlace.dangers || [],
			resourcesArray:
				typeof basePlace.resources === 'string' ? JSON.parse(basePlace.resources || '[]') : basePlace.resources || [],
			statsObject: typeof basePlace.stats === 'string' ? JSON.parse(basePlace.stats || '{}') : basePlace.stats || {},
		};
	} catch (error) {
		logger.error('Error transformando lugar a versión extendida:', { error, placeId: (place as any)?.id });
		throw new TransformerError('Error al transformar lugar a versión extendida');
	}
}

/**
 * 🔄 Transforma un Place a su versión con estadísticas
 * @param place Place base
 * @returns Place con estadísticas calculadas
 */
export function transformPlaceToWithStats(place: Place): PlaceWithStats {
	try {
		const basePlace = transformPlace(place);

		// Calcular totales para las estadísticas
		const counts = basePlace._count || {
			images: 0,
			videos: 0,
			collections: 0,
			albums: 0,
			tags: 0,
			characters: 0,
			worldItems: 0,
			concepts: 0,
			prompts: 0,
			notes: 0,
			wildcards: 0,
			properties: 0,
			groups: 0,
		};

		// Determinar la última actualización
		const lastUpdated = basePlace.updatedAt || new Date();

		// Calcular nivel de importancia basado en relaciones
		const importanceLevel = calculateImportanceLevel(basePlace, counts);

		// Construir y devolver el objeto extendido
		return {
			...basePlace,
			lastUpdated,
			imageCount: counts.images,
			videoCount: counts.videos,
			albumCount: counts.albums,
			tagCount: counts.tags,
			characterCount: counts.characters,
			worldItemCount: counts.worldItems,
			importanceLevel,
			statsDisplay: generateStatsDisplay(basePlace),
			distribution: [
				{ name: 'images', count: counts.images },
				{ name: 'videos', count: counts.videos },
				{ name: 'characters', count: counts.characters },
				{ name: 'items', count: counts.worldItems },
			],
		};
	} catch (error) {
		logger.error('Error transformando lugar a versión con estadísticas:', { error, placeId: (place as any)?.id });
		throw new TransformerError('Error al transformar lugar a versión con estadísticas');
	}
}

/**
 * Calcula el nivel de importancia de un lugar basado en sus relaciones y atributos
 * @private
 */
function calculateImportanceLevel(place: Place, counts: Record<string, number>): number {
	try {
		// Base: población + contenido asociado
		const populationFactor = place.population ? Math.min(place.population / 10000, 10) : 0;
		const relationsFactor = Object.values(counts).reduce((sum, count) => sum + count, 0) * 0.2;

		// Factores de importancia narrativa (lore, historia)
		const loreFactor = place.lore ? Math.min(place.lore.length / 100, 5) : 0;
		const historyFactor = place.history ? Math.min(place.history.length / 100, 5) : 0;

		// Importancia general
		return Math.round(populationFactor + relationsFactor + loreFactor + historyFactor);
	} catch (error) {
		logger.warn('Error calculando nivel de importancia, usando valor por defecto:', error);
		return 1; // Valor por defecto
	}
}

/**
 * Genera presentación de estadísticas del lugar para visualización
 * @private
 */
function generateStatsDisplay(place: Place): Array<{ name: string; value: number }> {
	try {
		// Si ya tenemos stats como objeto, usar eso directamente
		const stats = typeof place.stats === 'string' ? JSON.parse(place.stats || '{}') : place.stats || {};

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
