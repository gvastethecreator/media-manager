/**
 * @file Tipos base de entidades con estadísticas
 * @module types/entities/entity.types
 */

// Tipo específico para entityType en entidades con estadísticas
export type EntityStatsTypeValue =
	| 'image'
	| 'video'
	| 'folder'
	| 'tag'
	| 'place'
	| 'world-item'
	| 'note'
	| 'property'
	| 'wildcard'
	| 'audio'
	| 'document'
	| 'collection'
	| 'album'
	| 'character'
	| 'concept'
	| 'prompt'
	| 'group'
	| 'uploaded-image';

/**
 * 🔄 Interface base para todas las entidades del sistema
 * @description Define la estructura base que toda entidad debe tener
 */
export interface EntityBase {
	createdAt: Date;
	description: string | null;
	id: string;
	name: string;
	updatedAt: Date;
}

/**
 * 📊 Interface base para las estadísticas de entidades
 * @description Define la estructura común de estadísticas que todas las entidades pueden tener
 */
export interface EntityStats {
	albumCount: number;
	birthtime: Date;
	characterCount: number;
	collectionCount: number;
	commentCount?: number;
	completenessScore?: number;
	conceptCount: number;
	downloadCount?: number;
	groupCount: number;
	// Conteos de relaciones
	imageCount: number;

	// Estado
	isDuplicate?: boolean;
	isOrphaned?: boolean;
	lastModified?: Date | null;

	// Timestamps
	lastUpdated: Date;
	// Permitir null en derivados (compatibilidad con Album/Video)
	lastViewed?: Date | null;
	likeCount?: number;
	mtime: Date;
	needsAttention?: boolean;
	noteCount: number;
	placeCount: number;
	promptCount: number;
	propertyCount: number;

	// Métricas de calidad
	qualityScore?: number;

	// Propiedades del sistema de archivos
	size: number;
	tagCount: number;
	totalAssociations: number;

	// Métricas globales
	totalItems: number;
	type: string;
	videoCount: number;

	// Métricas de uso
	viewCount?: number;
	wildcardCount: number;
	worldItemCount: number;
}

/**
 * ✨ Interface genérica para entidades con estadísticas
 * @description Interface que combina una entidad base con sus estadísticas
 * @template TStats Tipo de estadísticas específicas de la entidad
 */
export interface EntityWithStats<TStats = EntityStats> extends EntityBase {
	// Conteos y relaciones
	_count?: {
		images?: number;
		videos?: number;
		albums?: number;
		collections?: number;
		tags?: number;
		characters?: number;
		places?: number;
		worldItems?: number;
		concepts?: number;
		prompts?: number;
		notes?: number;
		wildcards?: number;
		properties?: number;
		groups?: number;
	};
	// Discriminador para identificar el tipo de entidad
	entityType: EntityStatsTypeValue;

	// Campo de compatibilidad legacy
	statistics?: TStats;

	// Estadísticas de la entidad
	stats: TStats;
}
