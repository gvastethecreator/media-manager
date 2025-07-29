/**
 * 🏠 PROPERTY BASE TYPES
 *
 * Tipos base para properties usando tipos locales de Drizzle.
 *
 * @updated 2025-01-27
 */

/**
 * 🗿 Modelo base de Property, derivado del schema de Drizzle.
 */
export interface PropertyBase {
	id: string;
	name: string;
	value: string | number;
	description: string | null;
	emoji: string | null;
	color: string | null;
	shortcut: string | null;
	category: string | null;
	featuredImage: string | null;
	isFavorite: boolean;
	createdAt: Date;
	updatedAt: Date;
}

/**
 *  COUNTS
 * 🤖 Conteos de relaciones para la entidad Property.
 * [Automáticamente generado por el asistente el 2025-01-27]
 */
export const PROPERTY_COUNTS_RELATIONS = [
	'images',
	'videos',
	'albums',
	'collections',
	'tags',
	'characters',
	'places',
	'worldItems',
	'concepts',
	'prompts',
	'notes',
	'wildcards',
	'groups',
] as const;

/**
 * 🤖 El tipo de una Property con sus conteos de relaciones.
 */
export interface PropertyWithCounts extends PropertyBase {
	_count: {
		images: number;
		videos: number;
		albums: number;
		collections: number;
		tags: number;
		characters: number;
		places: number;
		worldItems: number;
		concepts: number;
		prompts: number;
		notes: number;
		wildcards: number;
		groups: number;
	};
}

/**
 * 📊 Estadísticas calculadas para una Property.
 */
export interface PropertyStatistics {
	totalRelations: number; // Suma de todas las relaciones (también conocido como totalAssociations)
	totalAssociations: number; // Alias para totalRelations para compatibilidad
	usageDiversity: number; // Cuán distribuido está el uso de la propiedad entre diferentes tipos de entidades
	popularity: number; // Un score de popularidad general
	completenessScore: number; // Qué tan completo está el perfil de la propiedad (descripción, etc.)

	// File system properties for browser integration
	/** File size in bytes */
	size: number;
	/** Last modification time */
	mtime: Date;
	/** File creation time */
	birthtime: Date;
	/** File type for browser compatibility */
	type: string;
	/** Whether this is a directory */
	isDirectory: boolean;
	/** Whether this is a file */
	isFile: boolean;
}

/**
 * ✨ Modelo extendido de Property con estadísticas.
 * Este es el tipo canónico que se debe usar en toda la aplicación.
 */
export interface PropertyWithStats extends PropertyBase {
	entityType: 'property';
	type?: string; // Alias para category para compatibilidad
	stats: PropertyStatistics;
	/** Alias para compatibilidad - apunta a stats */
	statistics?: PropertyStatistics;
	_count?: {
		images: number;
		videos: number;
		albums: number;
		collections: number;
		tags: number;
		characters: number;
		places: number;
		worldItems: number;
		concepts: number;
		prompts: number;
		notes: number;
		wildcards: number;
		groups: number;
	};
}

/**
 * 🌟 Tipo completo de Property con todas las relaciones
 */
export interface PropertyComplete extends PropertyWithStats {
	tags: string[];
	relations: {
		images: string[];
		videos: string[];
		albums: string[];
		collections: string[];
		characters: string[];
		places: string[];
		worldItems: string[];
		concepts: string[];
		prompts: string[];
		notes: string[];
		wildcards: string[];
		groups: string[];
	};
}

/**
 * 📝 Datos para crear una Property
 */
export interface PropertyCreateInput {
	name: string;
	value?: string | number;
	description?: string | null;
	emoji?: string | null;
	color?: string | null;
	shortcut?: string | null;
	category?: string | null;
	featuredImage?: string | null;
	isFavorite?: boolean;
}

/**
 * 📝 Datos para actualizar una Property
 */
export interface PropertyUpdateInput {
	name?: string;
	value?: string | number;
	description?: string | null;
	emoji?: string | null;
	color?: string | null;
	shortcut?: string | null;
	category?: string | null;
	featuredImage?: string | null;
	isFavorite?: boolean;
}

// ----------------------------------------------------------------
// TIPOS LEGACY PARA COMPATIBILIDAD TEMPORAL
// ----------------------------------------------------------------
