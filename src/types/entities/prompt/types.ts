/**
 * 💬 Tipos canónicos para la entidad Prompt
 *
 * - Este archivo contiene todos los tipos base, relaciones e inputs para Prompt.
 * - Usar SIEMPRE estos tipos en transformers, services y server actions.
 * - No usar ni importar tipos de base.ts (eliminado).
 *
 * Estructura:
 * - PromptBase: tipo canónico principal
 * - PromptRelations: relaciones con otras entidades (any[] si no existen tipos canónicos)
 * - PromptCreateInput, PromptUpdateInput: inputs para mutaciones
 *
 * 🛡️ Todos los campos clave (id, createdAt, updatedAt) son obligatorios.
 * 📝 Documenta cualquier cambio relevante aquí.
 */

/**
 * @file Tipos para la entidad Prompt
 * @module types/entities/prompt/prompt-types
 */

import type { BaseEntity } from '@/types/entities/base';

/**
 * Interfaz base para prompt extendiendo BaseEntity
 */
export interface PromptBase extends BaseEntity {
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
}

/**
 * 🎯 Alias para compatibilidad
 */
export type Prompt = PromptBase;

/**
 * Relaciones que puede tener un Prompt (usando any[] para evitar dependencias circulares)
 */
export interface PromptRelations {
	images?: any[];
	videos?: any[];
	albums?: any[];
	collections?: any[];
	tags?: any[];
	characters?: any[];
	places?: any[];
	worldItems?: any[];
	concepts?: any[];
	notes?: any[];
	wildcards?: any[];
	properties?: any[];
	groups?: any[];
}

/**
 * Conteos de relaciones de un Prompt
 */
export interface PromptCounts {
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
		notes: number;
		wildcards: number;
		properties: number;
		groups: number;
	};
}

/**
 * Tipo completo de Prompt con relaciones y conteos
 */
export type PromptComplete = PromptBase & PromptRelations & PromptCounts;

/**
 * Alias para compatibilidad con código existente
 */
export type PromptWithRelations = PromptComplete;
export type PromptExtended = PromptComplete;
export type PromptWithStats = PromptComplete;

/**
 * Interfaz para crear un prompt
 */
export interface PromptCreateInput extends Omit<PromptBase, 'id' | 'createdAt' | 'updatedAt'> {
	// Relaciones opcionales para conectar al crear
	images?: { id: string }[];
	videos?: { id: string }[];
	albums?: { id: string }[];
	collections?: { id: string }[];
	tags?: { id: string }[];
	characters?: { id: string }[];
	places?: { id: string }[];
	worldItems?: { id: string }[];
	concepts?: { id: string }[];
	notes?: { id: string }[];
	wildcards?: { id: string }[];
	properties?: { id: string }[];
	groups?: { id: string }[];
}

/**
 * Interfaz para actualizar un prompt
 */
export interface PromptUpdateInput extends Partial<Omit<PromptBase, 'id' | 'createdAt' | 'updatedAt'>> {
	// Relaciones para conectar/desconectar
	connect?: Partial<PromptRelations>;
	disconnect?: Partial<PromptRelations>;
}

/**
 * Alias para compatibilidad con código existente
 */
export type CreatePromptData = PromptCreateInput;
export type UpdatePromptData = PromptUpdateInput;

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
