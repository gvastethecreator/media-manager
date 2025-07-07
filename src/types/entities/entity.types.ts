/**
 * @file Tipos base de entidades con estadísticas
 * @module types/entities/entity.types
 */

export interface EntityBase {
	id: string;
	name: string;
	description: string | null;
	createdAt: Date;
	updatedAt: Date;
}

export interface EntityStats {
	imageCount?: number;
	totalItems?: number;
	lastUpdated?: Date;
}

export interface EntityWithStats extends EntityBase {
	entityType: EntityType;
	stats?: EntityStats;
	[key: string]: any;
}
