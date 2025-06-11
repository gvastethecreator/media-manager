import type { Prisma } from '@prisma/client';
import type { EntityType } from '../entities';

/**
 * Tipo base para Concept derivado del schema de Prisma
 */
export type ConceptBase = Prisma.ConceptGetPayload<{
	include: { _count: true };
}>;

/**
 * Interfaz para crear un nuevo concepto
 */
export interface ConceptCreateInput {
	name: string;
	emoji?: string;
	color?: string;
	description?: string | null;
	content?: string;
	category?: string;
	tags?: string | string[];
	featuredImage?: string | null;
	isFavorite?: boolean;
}

/**
 * Interfaz para actualizar un concepto existente
 */
export interface ConceptUpdateInput {
	id: string;
	name?: string;
	emoji?: string;
	color?: string;
	description?: string | null;
	content?: string;
	category?: string;
	tags?: string | string[];
	featuredImage?: string | null;
	isFavorite?: boolean;
}

/**
 * Tipo para la relación de concepto con otras entidades
 */
export interface ConceptRelation {
	entityId: string;
	entityType: EntityType;
	conceptId: string;
}

/**
 * Interfaz para estadísticas de un concepto
 */
export interface ConceptStats {
	characters: number;
	places: number;
	worldItems: number;
	notes: number;
	prompts: number;
	images: number;
}

// --- Eliminada la interfaz ConceptWithStats por incompatibilidad de tipos y herencia ---
