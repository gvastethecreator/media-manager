/**
 * 🗿 Modelo base de Group, basado en el esquema de Drizzle.
 */
export interface GroupBase {
	cardId?: string;
	category?: string | null;
	color?: string | null;
	createdAt: Date;
	description: string | null;
	emoji?: string | null;
	featuredImage?: string;
	filters?: any;
	flexibilityScore?: number;
	hp?: number;
	id: string;
	isFavorite?: boolean;
	mp?: number;
	name: string;
	organizationLevel?: number;
	organizationType?: string | null;
	power?: number;
	rarityLevel?: string | null;
	recentImages?: any[];
	recentVideos?: any[];
	shortcut?: string;
	sortBy?: string;
	updatedAt: Date;
}

import { EntityStats } from '../entity.types';

/**
 * 📊 Estadísticas calculadas y derivadas para un Group.
 * Principalmente, los conteos de las relaciones.
 */
export interface GroupStatistics extends EntityStats {
	completeness: number;
	lastUpdated: Date;
}

/**
 * ✨ Modelo extendido de Group con estadísticas.
 * Este es el tipo canónico que se debe usar en toda la aplicación.
 */
export interface GroupWithStats extends GroupBase {
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
	entityType: 'group';
	/** Alias para compatibilidad - apunta a stats */
	statistics?: GroupStatistics;
	stats: GroupStatistics;
}

/**
 * 🌟 Tipo completo de Group con todas las relaciones
 */
export interface GroupComplete extends GroupWithStats {
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
		properties: string[];
		groups: string[];
	};
	tags: string[];
}

/**
 * 🎛️ Modos de visualización para la entidad Group
 */
export enum GroupViewMode {
	GRID = 'grid',
	LIST = 'list',
	DETAIL = 'detail',
}

/**
 * 🔄 Claves de ordenamiento para la entidad Group
 */
export type GroupSortKey = 'name' | 'category' | 'createdAt';
