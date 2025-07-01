import type { Prisma } from '@prisma/client';

// ----------------------------------------------------------------

/**
 * 🃏 WILDCARD BASE TYPE
 *
 * El tipo base para un wildcard, derivado directamente del schema de Prisma.
 * Los wildcards son elementos flexibles que pueden representar casi cualquier cosa.
 *
 * @see Prisma.WildcardCreateInput
 */
export type WildcardBase = Prisma.WildcardGetPayload<{
	include: {
		tags: true;
	};
}>;

/**
 * 🃏 WILDCARD STATISTICS
 *
 * Métricas para analizar la flexibilidad y adaptabilidad de un Wildcard.
 */
export interface WildcardStatistics {
	/** Puntuación de adaptabilidad basada en la diversidad de su contenido y relaciones. */
	adaptabilityScore: number;
	/** Nivel de uso en diferentes contextos (imágenes, personajes, etc.). */
	usageDiversity: number;
	/** Puntuación de la completitud de la información del wildcard. */
	completenessScore: number;
	/** Popularidad basada en el número de entidades relacionadas. */
	popularity: number;
}

/**
 * 🃏 PRISMA WILDCARD WITH COUNTS
 *
 * Extiende el tipo de Prisma para incluir los conteos de relaciones de forma eficiente.
 */
export interface PrismaWildcardWithCounts extends WildcardBase {
	_count: {
		tags: number;
		images: number;
		characters: number;
		places: number;
		notes: number;
	};
}

/**
 * 🃏 WILDCARD WITH STATS
 *
 * El tipo principal y enriquecido para la entidad Wildcard.
 * Combina el tipo base con las estadísticas calculadas. Este es el tipo que se
 * debe usar en toda la UI y la lógica de negocio.
 */
export interface WildcardWithStats extends WildcardBase {
	statistics: WildcardStatistics;
	_count: {
		tags: number;
		images: number;
		characters: number;
		places: number;
		notes: number;
	};
}

/**
 * 🃏 WILDCARD CREATE INPUT
 *
 * Tipo para la creación de un nuevo wildcard.
 */
export type WildcardCreateInput = Prisma.WildcardUncheckedCreateInput;

/**
 * 🃏 WILDCARD UPDATE INPUT
 *
 * Tipo para la actualización de un wildcard existente.
 */
export type WildcardUpdateInput = Prisma.WildcardUncheckedUpdateInput;

/**
 * 🃏 WILDCARD PREVIEW
 *
 * Tipo para previsualizaciones de wildcards, con un subconjunto de campos.
 */
export type WildcardPreview = Pick<WildcardBase, 'id' | 'name' | 'description' | 'createdAt' | 'updatedAt'> & {
	imageUrl?: string;
};
