/**
 * @file Tipos base de entidades con estadísticas
 * @module types/entities/entity.types
 */

export interface EntityStats {
	imageCount?: number;
	totalItems?: number;
	lastUpdated?: Date;
}

export interface EntityWithStats {
	id: string;
	name: string;
	description?: string;
	entityType: string;
	stats?: EntityStats;
	createdAt: Date;
	updatedAt: Date;
	[key: string]: any;
}
