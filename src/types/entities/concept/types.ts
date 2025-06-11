/**
 * @file Tipos para la entidad Concept
 * @module types/entities/concept/types
 */

import type { z } from 'zod';
import type { ConceptFilters } from './extended';
import type { ConceptSchema } from './schema';

/**
 * Interfaz base para Concept derivada del schema de Prisma
 */
export interface ConceptBase {
	id: string;
	name: string;
	emoji: string;
	color: string;
	description: string | null;
	content: string;
	category: string;
	tags: string;
	featuredImage: string | null;
	isFavorite: boolean;
	createdAt: Date;
	updatedAt: Date;
}

/**
 * Relaciones de un concepto con otras entidades
 */
export interface ConceptRelations {
	images?: any[];
	videos?: any[];
	albums?: any[];
	collections?: any[];
	tagEntities?: any[];
	characters?: any[];
	places?: any[];
	worldItems?: any[];
	prompts?: any[];
	notes?: any[];
	wildcards?: any[];
	properties?: any[];
	groups?: any[];
}

/**
 * Conteo de entidades relacionadas con un concepto
 */
export interface ConceptCounts {
	images?: number;
	videos?: number;
	albums?: number;
	collections?: number;
	tags?: number;
	characters?: number;
	places?: number;
	worldItems?: number;
	prompts?: number;
	notes?: number;
	wildcards?: number;
	properties?: number;
	groups?: number;
}

/**
 * Propiedades adicionales para UI
 */
export interface ConceptUI {
	previewContent?: string;
	lastUpdated?: Date;
}

/**
 * Concepto completo con todos los campos y relaciones
 */
export interface ConceptComplete extends ConceptBase {
	_count?: ConceptCounts;
	_relations?: ConceptRelations;
	_ui?: ConceptUI;
}

/**
 * Opciones para buscar conceptos
 */
export interface ConceptSearchOptions {
	filters?: ConceptFilters;
	sortBy?: ConceptSortCriteria;
	page?: number;
	pageSize?: number;
	includeRelations?: boolean;
	includeStats?: boolean;
}

/**
 * Respuesta de búsqueda de conceptos
 */
export interface ConceptSearchResult {
	items: ConceptComplete[];
	total: number;
	totalPages: number;
}

/**
 * Criterios de ordenación para conceptos
 */
export enum ConceptSortCriteria {
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
export const CONCEPT_SORT_PROPERTY_MAP: Record<ConceptSortCriteria, string> = {
	[ConceptSortCriteria.NAME_ASC]: 'name',
	[ConceptSortCriteria.NAME_DESC]: 'name',
	[ConceptSortCriteria.CREATED_ASC]: 'createdAt',
	[ConceptSortCriteria.CREATED_DESC]: 'createdAt',
	[ConceptSortCriteria.UPDATED_ASC]: 'updatedAt',
	[ConceptSortCriteria.UPDATED_DESC]: 'updatedAt',
};

/**
 * Alias para opciones de ordenación
 */
export type ConceptSortOption = keyof typeof CONCEPT_SORT_PROPERTY_MAP | string;

/**
 * Tipo para validación con Zod
 */
export type ConceptValidation = z.infer<typeof ConceptSchema>;
