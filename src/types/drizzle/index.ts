/**
 * @file Exportaciones de tipos para Drizzle ORM
 * @module types/drizzle
 */

// Exportar tipos base
export * from './base';

// Exportar tipos de entidades
export * from './group';
export * from './property';
export * from './queueJob';
export * from './wildcard';

// Tipo de mapa para consultas de relaciones
export interface RelationMap {
	[key: string]: {
		model: string;
		fields: string[];
		references: string[];
	};
}

// Tipo para opciones de consulta comunes
export interface QueryOptions {
	include?: Record<string, boolean | Record<string, any>>;
	select?: Record<string, boolean | Record<string, any>>;
	where?: Record<string, any>;
	orderBy?: Array<Record<string, 'asc' | 'desc'>>;
	skip?: number;
	take?: number;
}

// Tipo para resultados de consultas con paginación
export interface PaginatedResult<T> {
	items: T[];
	total: number;
	page: number;
	limit: number;
	totalPages: number;
	hasMore: boolean;
}
