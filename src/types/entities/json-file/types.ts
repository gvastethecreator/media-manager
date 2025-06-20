/**
 * 🟫 Tipos canónicos para la entidad JsonFile
 * - Usar SIEMPRE estos tipos en transformers, services y server actions.
 * - Validar con Zod antes de persistir datos.
 * - No usar ni importar tipos legacy.
 * - Basado en el schema real de Prisma.
 */

import { type BaseEntity } from '@/types/common/transformer';

/**
 * 🟫 Tipo canónico para un archivo JSON.
 * Este es el tipo principal que se usa en toda la aplicación.
 * Basado en el schema real de Prisma.
 */
export interface JsonFile extends BaseEntity {
	id: string;
	name: string;
	filePath: string;
	content: string;
	createdAt: Date;
	updatedAt: Date;
}

/**
 * 🧱 Tipo base para un archivo JSON, sin relaciones.
 * Alias del tipo canónico para compatibilidad.
 */
export type JsonFileBase = JsonFile;

/**
 * 📊 Conteos de relaciones de JsonFile (actualmente vacío porque no tiene relaciones en Prisma)
 */
export interface JsonFileCounts {
	_count: Record<string, never>; // JsonFile no tiene relaciones en el schema actual
}

/**
 * 💾 Datos para crear o actualizar un archivo JSON.
 */
export type JsonFileFormData = Omit<JsonFile, 'id' | 'createdAt' | 'updatedAt'> & {
	// Campos opcionales para compatibilidad con formularios
	description?: string | null;
	format?: string;
	size?: number;
	isFavorite?: boolean;
	// Relaciones legacy que se ignoran pero se mantienen para compatibilidad
	images?: { id: string }[];
	videos?: { id: string }[];
	audio?: { id: string }[];
	file3d?: { id: string }[];
	documents?: { id: string }[];
	albums?: { id: string }[];
	collections?: { id: string }[];
	tags?: { id: string }[];
	characters?: { id: string }[];
	places?: { id: string }[];
	worldItems?: { id: string }[];
	concepts?: { id: string }[];
	prompts?: { id: string }[];
	notes?: { id: string }[];
	wildcards?: { id: string }[];
	properties?: { id: string }[];
	groups?: { id: string }[];
};

/**
 * 🔗 Datos de relación para input (legacy, se mantiene para compatibilidad)
 */
export type JsonFileRelationInput = Pick<
	JsonFileFormData,
	| 'images'
	| 'videos'
	| 'audio'
	| 'file3d'
	| 'documents'
	| 'albums'
	| 'collections'
	| 'tags'
	| 'characters'
	| 'places'
	| 'worldItems'
	| 'concepts'
	| 'prompts'
	| 'notes'
	| 'wildcards'
	| 'properties'
	| 'groups'
>;

/**
 * 📝 Datos para crear un JsonFile
 */
export type JsonFileCreateInput = Omit<JsonFileBase, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * 📝 Datos para actualizar un JsonFile
 */
export type JsonFileUpdateInput = Partial<Omit<JsonFileBase, 'id'>>;

/**
 * 🔢 Tipo de un archivo JSON con los conteos de sus relaciones.
 */
export type JsonFileWithCounts = JsonFile & JsonFileCounts;

/**
 * 🔄 Tipo completo de JsonFile (actualmente igual a JsonFileWithCounts)
 */
export type JsonFileComplete = JsonFileWithCounts;

/**
 * 🎯 Filtros específicos para JsonFile
 */
export interface JsonFileFilters {
	search?: string;
	contentSearch?: string;
	dateRange?: {
		start?: Date;
		end?: Date;
	};
}

/**
 * 🔍 Opciones de búsqueda para JsonFile
 */
export interface JsonFileSearchOptions {
	skip?: number;
	take?: number;
	orderBy?: {
		[key in keyof JsonFile]?: 'asc' | 'desc';
	};
	where?: JsonFileFilters;
}

/**
 * 📊 Resultado de búsqueda de JsonFiles
 */
export interface JsonFileSearchResult {
	items: JsonFileComplete[];
	total: number;
	hasMore: boolean;
}

// Legacy types maintained for compatibility
export type JsonFileRelations = JsonFileRelationInput;
export type JsonFileWithRelations = JsonFile;
