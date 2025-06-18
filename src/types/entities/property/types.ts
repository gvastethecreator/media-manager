/**
 * @file Tipos canónicos para la entidad Property
 * @module types/entities/property/types
 * @warning ⚠️ No importar tipos de Prisma ni de archivos legacy. Usar solo estos tipos en transformers, server actions y validaciones.
 * @description Estructura unificada y validada para Property.
 * Última migración: 2025-06-18
 */

import { z } from 'zod';

/**
 * Criterios de ordenación para propiedades
 */
export enum PropertySortCriteria {
    NAME_ASC = 'name:asc',
    NAME_DESC = 'name:desc',
    USAGE_ASC = 'usage:asc',
    USAGE_DESC = 'usage:desc',
    CREATED_ASC = 'createdAt:asc',
    CREATED_DESC = 'createdAt:desc',
    UPDATED_ASC = 'updatedAt:asc',
    UPDATED_DESC = 'updatedAt:desc',
}

/**
 * Modos de visualización para propiedades
 */
export enum PropertyViewMode {
    GRID = 'grid',
    LIST = 'list',
    DETAIL = 'detail',
    COMPACT = 'compact',
}

/**
 * Tipo base canónico para Property
 */
export interface PropertyBase {
	id: string;
	name: string;
	emoji: string;
	color: string;
	description?: string | null;
	shortcut?: string | null;
	category?: string | null;
	featuredImage?: string | null;
	isFavorite: boolean;
	createdAt: Date;
	updatedAt: Date;
}

/**
 * Input para creación
 */
export interface PropertyCreateInput {
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
 * Input para actualización
 */
export type PropertyUpdateInput = Partial<Omit<PropertyBase, 'id' | 'createdAt' | 'updatedAt'>>;

/**
 * Esquema Zod para validación de Property
 */
export const PropertySchema = z.object({
	id: z.string(),
	name: z.string(),
	emoji: z.string(),
	color: z.string(),
	description: z.string().nullable().optional(),
	shortcut: z.string().nullable().optional(),
	category: z.string().nullable().optional(),
	featuredImage: z.string().nullable().optional(),
	isFavorite: z.boolean(),
	createdAt: z.date(),
	updatedAt: z.date(),
});

/**
 * Relaciones de la propiedad con otras entidades
 */
export interface PropertyRelations {
	images?: { id: string }[];
	videos?: { id: string }[];
	albums?: { id: string }[];
	collections?: { id: string }[];
	characters?: { id: string }[];
	places?: { id: string }[];
	worldItems?: { id: string }[];
	concepts?: { id: string }[];
	prompts?: { id: string }[];
	notes?: { id: string }[];
	wildcards?: { id: string }[];
	groups?: { id: string }[];
}

/**
 * Property con sus relaciones
 */
export interface PropertyWithRelations extends PropertyBase, PropertyRelations {}

// 🟢 Documentación y advertencia:
// - Usar solo estos tipos en transformers, server actions y validaciones.
// - No importar tipos de Prisma ni de archivos legacy.
// - Validar siempre con PropertySchema antes de persistir.
