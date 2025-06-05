/**
 * @file Tipos base para la entidad Tag derivados del modelo Prisma
 * @module types/entities/tag/base
 */

import type { Tag as PrismaTag } from '@prisma/client';

/**
 * Tipo base para Tag derivado directamente del tipo Prisma
 */
export type TagBase = PrismaTag;

/**
 * Interfaz para crear una nueva etiqueta
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
 * Interfaz para actualizar una etiqueta existente
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
