/**
 * @file Tipos base para la entidad Tag
 * @module types/entities/tag/base
 */

/**
 * 🏷️ Tipo base para Tag, solo campos canónicos y serializables
 */
export interface TagBase {
	id: string;
	name: string;
	emoji?: string;
	color?: string;
	description?: string | null;
	shortcut?: string | null;
	category?: string | null;
	featuredImage?: string | null;
	isFavorite?: boolean;
	createdAt?: Date;
	updatedAt?: Date;
}

/**
 * Datos para crear una etiqueta
 */
export interface TagCreateInput {
	name: string;
	emoji?: string;
	color?: string;
	description?: string | null;
	shortcut?: string | null;
	category?: string | null;
	featuredImage?: string | null;
	isFavorite?: boolean;
}

/**
 * Datos para actualizar una etiqueta
 */
export interface TagUpdateInput {
	name?: string;
	emoji?: string;
	color?: string;
	description?: string | null;
	shortcut?: string | null;
	category?: string | null;
	featuredImage?: string | null;
	isFavorite?: boolean;
}

// Archivo eliminado: tipos base migrados a types.ts. Usar solo '@/types/entities/tag/types'.
