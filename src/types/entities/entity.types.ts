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
	id: string;
	name: string;
	description: string | null;
	createdAt: Date;
	updatedAt: Date;
}

/**
 * 📊 Interface base para las estadísticas de entidades
 * @description Define la estructura común de estadísticas que todas las entidades pueden tener
 */
export interface EntityStats {
	// Conteos de relaciones
	imageCount: number;
	videoCount: number;
	albumCount: number;
	collectionCount: number;
	tagCount: number;
	characterCount: number;
	placeCount: number;
	worldItemCount: number;
	conceptCount: number;
	promptCount: number;
	noteCount: number;
	wildcardCount: number;
	propertyCount: number;
	groupCount: number;

	// Métricas globales
	totalItems: number;
	totalAssociations: number;

	// Timestamps
	lastUpdated: Date;
	lastViewed?: Date;
	lastModified?: Date;

	// Métricas de uso
	viewCount?: number;
	downloadCount?: number;
	likeCount?: number;
	commentCount?: number;

	// Métricas de calidad
	qualityScore?: number;
	completenessScore?: number;

	// Estado
	isDuplicate?: boolean;
	isOrphaned?: boolean;
	needsAttention?: boolean;
}

/**
 * ✨ Interface genérica para entidades con estadísticas
 * @description Interface que combina una entidad base con sus estadísticas
 * @template TStats Tipo de estadísticas específicas de la entidad
 */
export interface EntityWithStats<TStats = EntityStats> extends EntityBase {
	// Discriminador para identificar el tipo de entidad
	entityType: EntityStatsTypeValue;

	// Estadísticas de la entidad
	stats: TStats;

	// Campo de compatibilidad legacy
	statistics?: TStats;

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
}
