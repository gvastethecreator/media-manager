/**
 * 🏷️ TAG BASE TYPES - MIGRADO A DRIZZLE
 *
 * Tipos base para tags usando tipos locales de Drizzle.
 * Eliminadas todas las dependencias de @prisma/client.
 *
 * @updated 2025-01-27
 */

/**
 * 🗿 Modelo base de Tag, derivado del schema de Drizzle.
 */
export interface TagBase {
	id: string;
	name: string;
	description: string | null;
	emoji: string | null;
	color: string | null;
	category: string | null;
	shortcut: string | null;
	featuredImage: string | null;
	isFavorite: boolean;
	createdAt: Date;
	updatedAt: Date;
}

/**
 *  COUNTS
 * 🤖 Conteos de relaciones para la entidad Tag.
 * [Automáticamente generado por el asistente el 2025-01-27]
 */
export const TAG_COUNTS_RELATIONS = [
	'images',
	'videos',
	'albums',
	'collections',
	'characters',
	'places',
	'worldItems',
	'concepts',
	'prompts',
	'notes',
	'wildcards',
	'properties',
	'groups',
] as const;

/**
 * 🤖 El tipo de un Tag con sus conteos de relaciones.
 */
export interface TagWithCounts extends TagBase {
	_count: {
		images: number;
		videos: number;
		albums: number;
		collections: number;
		characters: number;
		places: number;
		worldItems: number;
		concepts: number;
		prompts: number;
		notes: number;
		wildcards: number;
		properties: number;
		groups: number;
	};
}

/**
 * 📊 Estadísticas calculadas para un Tag.
 */
export interface TagStatistics {
	totalRelations: number; // Suma de todas las relaciones
	usageDiversity: number; // Cuán distribuido está el uso del tag entre diferentes tipos de entidades
	popularity: number; // Un score de popularidad general
	completenessScore: number; // Qué tan completo está el perfil del tag (descripción, etc.)
}

/**
 * ✨ Modelo extendido de Tag con estadísticas.
 * Este es el tipo canónico que se debe usar en toda la aplicación.
 */
export interface TagWithStats extends TagBase {
	stats: TagStatistics;
	_count: {
		images: number;
		videos: number;
		albums: number;
		collections: number;
		characters: number;
		places: number;
		worldItems: number;
		concepts: number;
		prompts: number;
		notes: number;
		wildcards: number;
		properties: number;
		groups: number;
	};
}

/**
 * 📝 Datos para crear un Tag
 */
export interface TagCreateInput {
	name: string;
	description?: string | null;
	emoji?: string | null;
	color?: string | null;
	category?: string | null;
	shortcut?: string | null;
	featuredImage?: string | null;
	isFavorite?: boolean;
}

/**
 * 📝 Datos para actualizar un Tag
 */
export interface TagUpdateInput {
	name?: string;
	description?: string | null;
	emoji?: string | null;
	color?: string | null;
	category?: string | null;
	shortcut?: string | null;
	featuredImage?: string | null;
	isFavorite?: boolean;
}

// ----------------------------------------------------------------
// TIPOS LEGACY PARA COMPATIBILIDAD TEMPORAL
// ----------------------------------------------------------------

/**
 * @deprecated Usar TagWithCounts en su lugar
 */
export type PrismaTagWithCounts = TagWithCounts;
