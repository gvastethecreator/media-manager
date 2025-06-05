/**
 * @file Tipos para la entidad Prompt
 * @module types/entities/prompt/prompt-types
 */

import type { Album } from '../album';
import type { Character } from '../character';
import type { Collection } from '../collection';
import type { Concept } from '../concept';
import type { Group } from '../group';
import type { Image } from '../image';
import type { Note } from '../note';
import type { Place } from '../place';
import type { Property } from '../property';
import type { Tag } from '../tag';
import type { Video } from '../video';
import type { Wildcard } from '../wildcard';
import type { WorldItem } from '../world-item';

/**
 * Interfaz base para prompt
 * Nota: En la base de datos, algunos campos se almacenan como strings JSON:
 * - parameters: Es un string JSON que representa un objeto de parámetros
 * - tags: Es un string JSON que representa un array de tags (en algunas implementaciones)
 */
export interface PromptBase {
	id: string;
	name: string;
	emoji: string;
	color: string;
	description: string | null;
	content: string;
	purpose: string;
	category: string;
	parameters: string; // String JSON que representa un objeto
	tags?: string; // String JSON que representa un array (opcional)
	featuredImage: string | null;
	isFavorite: boolean;
	createdAt: Date;
	updatedAt: Date;
}

/**
 * Interfaz extendida que incluye relaciones
 */
export interface PromptWithRelations extends PromptBase {
	// Relaciones con contenido
	images?: Image[];
	videos?: Video[];

	// Relaciones con entidades principales
	albums?: Album[];
	collections?: Collection[];
	tagEntities?: Tag[]; // Relación con entidades Tag (renombrado para evitar conflicto)
	characters?: Character[];
	places?: Place[];
	worldItems?: WorldItem[];
	concepts?: Concept[];
	notes?: Note[];
	wildcards?: Wildcard[];
	properties?: Property[];
	groups?: Group[];

	// Contadores
	_count?: {
		images?: number;
		videos?: number;
		albums?: number;
		collections?: number;
		tagEntities?: number; // Renombrado para mantener consistencia
		characters?: number;
		places?: number;
		worldItems?: number;
		concepts?: number;
		notes?: number;
		wildcards?: number;
		properties?: number;
		groups?: number;
	};
}

/**
 * Interfaz para crear un prompt
 * Los objetos complejos deben ser serializados a JSON antes de guardar
 */
export interface CreatePromptData {
	name: string;
	emoji?: string;
	color?: string;
	description?: string | null;
	content?: string;
	purpose?: string;
	category?: string;
	parameters?: string | Record<string, any>; // Puede recibir objeto o string JSON
	tags?: string | string[]; // Puede recibir array o string JSON
	featuredImage?: string | null;
	isFavorite?: boolean;
	groupIds?: string[];
	propertyIds?: string[];
	wildcardIds?: string[];
	tagIds?: string[]; // IDs de tags relacionados
}

/**
 * Interfaz para actualizar un prompt
 * Los objetos complejos deben ser serializados a JSON antes de guardar
 */
export interface UpdatePromptData {
	name?: string;
	emoji?: string;
	color?: string;
	description?: string | null;
	content?: string;
	purpose?: string;
	category?: string;
	parameters?: string | Record<string, any>; // Puede recibir objeto o string JSON
	tags?: string | string[]; // Puede recibir array o string JSON
	featuredImage?: string | null;
	isFavorite?: boolean;
	groupIds?: string[];
	propertyIds?: string[];
	wildcardIds?: string[];
	tagIds?: string[]; // IDs de tags relacionados
}

/**
 * Interfaz para filtros de búsqueda de prompts
 */
export interface PromptFilters {
	searchQuery?: string;
	categories?: string[];
	purposes?: string[];
	onlyFavorites?: boolean;
	contentContains?: string;
}

/**
 * Enumeración para criterios de ordenación
 */
export enum PromptSortCriteria {
	NAME_ASC = 'name:asc',
	NAME_DESC = 'name:desc',
	CREATED_ASC = 'created:asc',
	CREATED_DESC = 'created:desc',
	UPDATED_ASC = 'updated:asc',
	UPDATED_DESC = 'updated:desc',
}

/**
 * Mapa de propiedades para ordenación
 */
export const PROMPT_SORT_PROPERTY_MAP: Record<PromptSortCriteria, string> = {
	[PromptSortCriteria.NAME_ASC]: 'name',
	[PromptSortCriteria.NAME_DESC]: 'name',
	[PromptSortCriteria.CREATED_ASC]: 'createdAt',
	[PromptSortCriteria.CREATED_DESC]: 'createdAt',
	[PromptSortCriteria.UPDATED_ASC]: 'updatedAt',
	[PromptSortCriteria.UPDATED_DESC]: 'updatedAt',
};
