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
export type PlaceBase = {
    id: string;
    name: string;
    description: string | null;
    emoji: string | null;
    color: string | null;
    category: string | null;
    isPublic: boolean;
    isFavorite: boolean;
    totalImages: number;
    totalVideos: number;
    type: string | null;
    location: string | null;
    climate: string | null;
    population: string | null;
    government: string | null;
    economy: string | null;
    culture: string | null;
    history: string | null;
    geography: string | null;
    landmarks: string | null;
    dangers: string | null;
    resources: string | null;
    notes: string | null;
    featuredImage: string | null;
    parentId: string | null;
    createdAt: Date;
    updatedAt: Date;
};

/**
 * PLACE STATISTICS
 *
 * Métricas y análisis específicos para la entidad Place.
 * Estas estadísticas proporcionan una visión más profunda del contexto y la relevancia del lugar.
 */
export interface PlaceStatistics {
	/** Relevancia espacial calculada (ej: cercanía a otros puntos de interés) */
	spatialRelevance: number;
	/** Puntuación de la completitud de la información del lugar */
	completenessScore: number;
	/** Nivel de contexto geográfico (ej: cuánta información de los alrededores se tiene) */
	geoContextLevel: number;
	/** Popularidad basada en el número de entidades relacionadas */
	popularity: number;
}

/**
 * PLACE WITH STATS
 *
 * El tipo principal y enriquecido para la entidad Place.
 * Combina el tipo base con las estadísticas calculadas, proporcionando una vista completa.
 * Este es el tipo que se debe usar en toda la UI y la lógica de negocio.
 */
export type PlaceWithStats = PlaceBase & {
	/** Estadísticas calculadas de la entidad */
	_stats: PlaceStatistics;
	/** Conteos de relaciones desde Drizzle */
	_count: {
		images?: number;
		tags?: number;
		notes?: number;
		characters?: number;
		collections?: number;
		concepts?: number;
	};
	/** Campos JSON parseados */
	dangers: any[];
	resources: any[];
	stats: any;
	filters: any;
};

/**
 * PLACE CREATE INPUT
 *
 * Tipo para la creación de un nuevo lugar.
 */
export type PlaceCreateInput = Omit<PlaceBase, 'id' | 'createdAt' | 'updatedAt'>;

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
