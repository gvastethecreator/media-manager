/**
 * @file Tipos base para la entidad Place.
 * @module types/entities/place/base
 * @description Define los tipos canónicos para la entidad Place, incluyendo el tipo
 *              base y el tipo con estadísticas.
 */

// TODO: Estos tipos genéricos deben moverse a un archivo centralizado, por ejemplo, src/types/common/entities.ts
export type EntityWithStats<T, S> = T & { stats: S };

// ----------------------------------------------------------------

/**
 * PLACE BASE TYPE
 *
 * Este es el tipo base para un lugar, derivado directamente del schema de Drizzle.
 * Incluye todos los campos escalares y las relaciones básicas.
 */
export interface PlaceBase {
	category: string | null;
	climate: string | null;
	color: string | null;
	createdAt: Date;
	culture: string | null;
	dangers: string | null;
	description: string | null;
	economy: string | null;
	emoji: string | null;
	featuredImage: string | null;
	geography: string | null;
	government: string | null;
	history: string | null;
	id: string;

	isFavorite: boolean;
	landmarks: string | null;
	location: string | null;
	lore?: string;
	name: string;
	notes: string | null;
	parentId: string | null;
	population: string | null;
	resources: string | null;
	shortcut?: string;
	totalImages: number;
	totalVideos: number;
	type: string | null;
	updatedAt: Date;
}

import { EntityStats } from '../entity.types';

/**
 * PLACE STATISTICS
 *
 * Métricas y análisis específicos para la entidad Place.
 * Estas estadísticas proporcionan una visión más profunda del contexto y la relevancia del lugar.
 */
export interface PlaceStatistics extends EntityStats {
	/** Puntuación de la completitud de la información del lugar */
	completenessScore: number;
	/** Nivel de contexto geográfico (ej: cuánta información de los alrededores se tiene) */
	geoContextLevel: number;
	/** Fecha de última actualización */
	// lastUpdated: Date; // Comentado temporalmente para resolver errores

	// File system functions
	isDirectory: boolean;
	isFile: boolean;
	/** Popularidad basada en el número de entidades relacionadas */
	popularity: number;
	/** Relevancia espacial calculada (ej: cercanía a otros puntos de interés) */
	spatialRelevance: number;
}

/**
 * PLACE WITH STATS
 *
 * El tipo principal y enriquecido para la entidad Place.
 * Combina el tipo base con las estadísticas calculadas, proporcionando una vista completa.
 * Este es el tipo que se debe usar en toda la UI y la lógica de negocio.
 */
export type PlaceWithStats = PlaceBase & {
	entityType: 'place';
	/** Estadísticas calculadas de la entidad */
	stats: PlaceStatistics;
	/** Alias para compatibilidad - apunta a stats */
	statistics?: PlaceStatistics;
	/** Conteos de relaciones desde Drizzle */
	_count?: {
		images?: number;
		videos?: number;
		tags?: number;
		notes?: number;
		characters?: number;
		collections?: number;
		concepts?: number;
		albums?: number;
		worldItems?: number;
		prompts?: number;
		wildcards?: number;
		properties?: number;
		groups?: number;
	};
	images?: number;
	videos?: number;
	tags?: number;
	notesCount?: number;
	characters?: number;
	collections?: number;
	concepts?: number;
	/** Campos JSON parseados */
	parsedDangers: unknown[];
	parsedResources: unknown[];
	parsedStats: Record<string, unknown>;
	metadata: Record<string, unknown>;
	region: string | null;
};

/**
 * Tipo para respuesta de Places con métodos de array
 */
export interface PlacesResponse {
	filter: (callback: (place: PlaceWithStats, index: number) => boolean) => PlaceWithStats[];
	items: PlaceWithStats[];
	length: number; // Alias para total
	map: <T>(callback: (place: PlaceWithStats, index: number) => T) => T[];
	reduce: <T>(callback: (acc: T, place: PlaceWithStats, index: number) => T, initial: T) => T;
	total: number;
}

/**
 * PLACE CREATE INPUT
 *
 * Tipo para la creación de un nuevo lugar.
 */
export type PlaceCreateInput = Omit<PlaceBase, 'id' | 'createdAt' | 'updatedAt' | 'isFavorite'>;

/**
 * PLACE UPDATE INPUT
 *
 * Tipo para la actualización de un lugar existente.
 */
export type PlaceUpdateInput = Partial<PlaceCreateInput>;

/**
 * PLACE PREVIEW
 *
 * Tipo para previsualizaciones de lugares, con un subconjunto de campos.
 */
export type PlacePreview = Pick<PlaceBase, 'id' | 'name' | 'description' | 'createdAt' | 'updatedAt'> & {
	imageUrl?: string;
};
