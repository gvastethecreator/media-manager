import type { Prisma } from '@prisma/client';
import type { EntityType } from '../entities';

/**
 * Tipo base para Prompt derivado del schema de Prisma
 */
export type PromptBase = Prisma.PromptGetPayload<{}>;

/**
 * Interfaz para crear un nuevo prompt
 */
export interface PromptCreateInput {
	name: string;
	emoji?: string;
	color?: string;
	description?: string | null;
	content?: string;
	category?: string;
	parameters?: string;
	tags?: string;
	featuredImage?: string | null;
	isFavorite?: boolean;
}

/**
 * Interfaz para actualizar un prompt existente
 */
export interface PromptUpdateInput {
	id: string;
	name?: string;
	emoji?: string;
	color?: string;
	description?: string | null;
	content?: string;
	category?: string;
	parameters?: string;
	tags?: string;
	featuredImage?: string | null;
	isFavorite?: boolean;
}

/**
 * Tipo para la relación de prompt con otras entidades
 */
export interface PromptRelation {
	entityId: string;
	entityType: EntityType;
	promptId: string;
}

/**
 * Interfaz para estadísticas de un prompt
 */
export interface PromptStats {
	characters: number;
	places: number;
	worldItems: number;
	notes: number;
	concepts: number;
	images: number;
}

/**
 * Interfaz para prompt con estadísticas incluidas
 */
export interface PromptWithStats extends PromptBase {
	_count: PromptStats;
}
