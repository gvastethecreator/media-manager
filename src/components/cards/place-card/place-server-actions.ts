'use server';

import { getPrismaClient } from '@/lib/db';
import { serverLogger } from '@/lib/logger/server-logger';
import type { Place } from '@/types/entities/place';
import type { PlaceDanger, PlaceResource } from '@/types/entities/place/types';

// Logger específico para acciones de PlaceCard
const placeCardLogger = serverLogger.withContext('PlaceCardActions');

export interface PlaceCardData extends Place {
	_count: {
		images: number;
		videos: number;
		collections: number;
		tags: number;
		characters: number;
		worldItems: number;
		concepts: number;
		prompts: number;
		notes: number;
		wildcards: number;
		properties: number;
		groups: number;
	};
	recentImages?: string[];
	recentVideos?: string[];
	totalSize?: number;
	// Campos parseados para mejor visualización en la UI
	parsedDangers?: Array<PlaceDanger & { type: string; level: number; description?: string }>;
	parsedResources?: Array<PlaceResource & { name: string; abundance: number; description?: string }>;
	parsedStats?: Record<string, number>;
	// Metadatos adicionales
	metadata?: {
		power: number; // Nivel de poder del lugar calculado
		rarityLevel: number; // 1-10 basado en población, recursos y peligros
		healthPoints?: number; // Resistencia del lugar
		cardId: string; // ID único para la carta TCG
		valueLevel?: number; // Valor estratégico (1-10)
	};
}

/**
 * Obtiene los datos de un lugar para mostrar en una tarjeta
 */
export async function getPlaceCardData(
	placeId: string
): Promise<PlaceCardData> {
	const prisma = await getPrismaClient();

	try {
		const place = await prisma.place.findUnique({
			where: {
				id: placeId,
			},
			include: {
				_count: {
					select: {
						images: true,
						videos: true,
						collections: true,
						tags: true,
						characters: true,
						worldItems: true,
						concepts: true,
						prompts: true,
						notes: true,
						wildcards: true,
						properties: true,
						groups: true,
					},
				},
			},
		});

		if (!place) {
			throw new Error(`Lugar no encontrado: ${placeId}`);
		}

		// Obtener imágenes recientes relacionadas con este lugar
		const recentImages = await prisma.image.findMany({
			where: {
				places: {
					some: {
						id: placeId,
					},
				},
			},
			select: {
				id: true,
				path: true,
			},
			orderBy: {
				updatedAt: 'desc',
			},
			take: 6,
		});

		const recentImagePaths = recentImages.map((img) => {
			return `/api/thumbnails/${img.id}`;
		});

		// Obtener videos recientes relacionados con este lugar
		const recentVideos = await prisma.video.findMany({
			where: {
				places: {
					some: {
						id: placeId,
					},
				},
			},
			select: {
				id: true,
				path: true,
			},
			orderBy: {
				updatedAt: 'desc',
			},
			take: 2,
		});

		const recentVideoPaths = recentVideos.map((video) => {
			return `/api/video-thumbnails/${video.id}`;
		});

		// Parsear campos serializados como JSON
		const parsedDangers = parseJsonField<PlaceDanger[]>(place.dangers);
		const parsedResources = parseJsonField<PlaceResource[]>(place.resources);
		const parsedStats = parseJsonField<Record<string, number>>(place.stats);

		// Calcular metadatos para la tarjeta TCG
		const power = calculatePlacePower(place.population, parsedDangers?.length || 0, parsedResources?.length || 0);
		const rarityLevel = determinePlaceRarityLevel(power, place.population);
		const metadata = {
			power,
			rarityLevel,
			cardId: `P${place.id.substring(0, 6)}`,
			healthPoints: calculatePlaceHealth(parsedDangers?.length || 0, parsedResources?.length || 0),
			valueLevel: calculateValueLevel(parsedResources, place.population)
		};

		return {
			...place,
			recentImages: recentImagePaths,
			recentVideos: recentVideoPaths,
			parsedDangers,
			parsedResources,
			parsedStats,
			metadata,
		};
	} catch (error) {
		placeCardLogger.error('Error obteniendo datos de lugar', { placeId, error });
		throw error;
	}
}

// Función auxiliar para parsear campos JSON
function parseJsonField<T>(jsonStr: string): T {
	if (!jsonStr || jsonStr === 'empty_array' || jsonStr === '[]') {
		return [] as unknown as T;
	}

	try {
		return JSON.parse(jsonStr) as T;
	} catch (error) {
		console.error('Error parsing JSON field:', error);
		return [] as unknown as T;
	}
}

// Función para calcular el poder del lugar basado en población y recursos
function calculatePlacePower(population: number, dangersCount: number, resourcesCount: number): number {
	// Base del poder: población
	const basePower = Math.min(9, Math.log10(population + 1) * 3);

	// Ajuste por peligros (cada peligro suma 0.5 puntos)
	const dangerBonus = Math.min(4, dangersCount * 0.5);

	// Ajuste por recursos (cada recurso suma 0.7 puntos)
	const resourceBonus = Math.min(5, resourcesCount * 0.7);

	// Calculo total
	const totalPower = Math.round(basePower + dangerBonus + resourceBonus);

	// Limitar entre 1-10
	return Math.max(1, Math.min(10, totalPower));
}

// Determinar nivel de rareza del lugar (1-10)
function determinePlaceRarityLevel(power: number, population: number): number {
	// Base en poder
	let rarityBase = power;

	// Bonus por tamaño de población
	if (population > 1000000) rarityBase += 2;
	else if (population > 100000) rarityBase += 1.5;
	else if (population > 10000) rarityBase += 1;

	// Escalar a 1-10
	return Math.max(1, Math.min(10, Math.round(rarityBase)));
}

// Calcular "salud" del lugar para el diseño TCG
function calculatePlaceHealth(dangersCount: number, resourcesCount: number): number {
	// Base de 100 puntos
	const baseHealth = 100;

	// Bonus por recursos (+10 por recurso)
	const resourceBonus = resourcesCount * 10;

	// Penalización por peligros (-5 por peligro)
	const dangerPenalty = dangersCount * 5;

	return baseHealth + resourceBonus - dangerPenalty;
}

// Calcular valor estratégico del lugar
function calculateValueLevel(resources: PlaceResource[] | undefined, population: number): number {
	// Si no hay recursos, el valor se basa solo en población
	if (!resources || resources.length === 0) {
		return Math.min(5, Math.log10(population + 1) * 2);
	}

	// Calcular valor basado en abundancia de recursos
	const resourceValue = resources.reduce((total, resource) => {
		return total + (resource.abundance || 1);
	}, 0);

	// Combinar con población
	const totalValue = (resourceValue * 0.7) + (Math.log10(population + 1) * 2 * 0.3);

	// Escalar a 1-10
	return Math.max(1, Math.min(10, Math.round(totalValue)));
}

/**
 * Tipo para imágenes con miniatura
 */
interface ThumbnailImage {
	id: string;
	name?: string | null;
	thumbnailUrl: string;
	url?: string;
	isVideo?: boolean;
}

/**
 * Obtiene las imágenes recientes de un lugar para mostrar en la tarjeta
 */
export async function getRecentPlaceImages(placeId: string, limit = 6): Promise<ThumbnailImage[]> {
	const prisma = await getPrismaClient();

	try {
		// Imágenes recientes
		const recentImages = await prisma.image.findMany({
			where: {
				places: {
					some: {
						id: placeId,
					},
				},
			},
			select: {
				id: true,
				name: true,
				path: true,
				thumbnailWidth: true,
				thumbnailHeight: true,
			},
			orderBy: {
				updatedAt: 'desc',
			},
			take: limit,
		});

		// Mapear a formato de thumbnails
		return recentImages.map((image) => ({
			id: image.id,
			name: image.name,
			thumbnailUrl: `/api/thumbnails/${image.id}`,
			url: `/api/images/${image.id}`,
			isVideo: false,
		}));
	} catch (error) {
		placeCardLogger.error('Error obteniendo imágenes recientes', { placeId, error });
		return [];
	}
}