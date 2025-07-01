import type { Prisma } from '@prisma/client';

// TODO: Estos tipos genéricos deben moverse a un archivo centralizado, por ejemplo, src/types/common/entities.ts
export type EntityWithStats<T, S> = T & { stats: S };

// ----------------------------------------------------------------

/**
 * PLACE BASE TYPE
 *
 * Este es el tipo base para un lugar, derivado directamente del schema de Prisma.
 * Incluye todos los campos escalares y las relaciones básicas.
 *
 * @see Prisma.PlaceCreateInput
 */
export type PlaceBase = Prisma.PlaceGetPayload<{
include: {
images: true;
tags: true;
notes: true;
};
}>;

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
 * PRISMA PLACE WITH COUNTS
 *
 * Extiende el tipo de Prisma para incluir los conteos de relaciones.
 * Optimizado para consultas eficientes que solo necesitan los conteos, no los datos completos.
 */
export type PrismaPlaceWithCounts = PlaceBase & {
_count: {
images?: number;
tags?: number;
notes?: number;
characters?: number;
collections?: number;
concepts?: number;
};
};

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
/** Conteos de relaciones desde Prisma */
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
 * Se basa en PlaceUncheckedCreateInput pero puede ser extendido.
 */
export type PlaceCreateInput = Prisma.PlaceUncheckedCreateInput;

/**
 * PLACE UPDATE INPUT
 *
 * Tipo para la actualización de un lugar existente.
 * Se basa en PlaceUncheckedUpdateInput pero puede ser extendido.
 */
export type PlaceUpdateInput = Prisma.PlaceUncheckedUpdateInput;

/**
 * PLACE PREVIEW
 *
 * Tipo para previsualizaciones de lugares, con un subconjunto de campos.
 */
export type PlacePreview = Pick<PlaceBase, 'id' | 'name' | 'description' | 'createdAt' | 'updatedAt'> & {
imageUrl?: string;
};
