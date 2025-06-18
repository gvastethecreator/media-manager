/**
 * @file Tipos canónicos para la entidad Wildcard
 * @module types/entities/wildcard/types
 * @warning ⚠️ No importar tipos de Prisma ni de archivos legacy. Usar solo estos tipos en transformers, server actions y validaciones.
 * @description Estructura unificada y validada para Wildcard.
 * Última migración: 2025-06-18
 */

import { z } from 'zod';

/**
 * Tipo base canónico para Wildcard
 */
export interface WildcardBase {
	id: string;
	name: string;
	emoji: string;
	color: string;
	description?: string | null;
	shortcut?: string | null;
	category?: string | null;
	children: string; // JSON string de hijos
	featuredImage?: string | null;
	isFavorite: boolean;
	parentId?: string | null;
	createdAt: Date;
	updatedAt: Date;
}

/**
 * Input para creación
 */
export interface WildcardCreateInput {
	name: string;
	emoji?: string;
	color?: string;
	description?: string | null;
	shortcut?: string | null;
	category?: string | null;
	children?: string;
	featuredImage?: string | null;
	isFavorite?: boolean;
	parentId?: string | null;
}

/**
 * Input para actualización
 */
export type WildcardUpdateInput = Partial<Omit<WildcardBase, 'id' | 'createdAt' | 'updatedAt'>>;

/**
 * Esquema Zod para validación de Wildcard
 */
export const WildcardSchema = z.object({
	id: z.string(),
	name: z.string(),
	emoji: z.string(),
	color: z.string(),
	description: z.string().nullable().optional(),
	shortcut: z.string().nullable().optional(),
	category: z.string().nullable().optional(),
	children: z.string(),
	featuredImage: z.string().nullable().optional(),
	isFavorite: z.boolean(),
	parentId: z.string().nullable().optional(),
	createdAt: z.date(),
	updatedAt: z.date(),
});

// 🟢 Documentación y advertencia:
// - Usar solo estos tipos en transformers, server actions y validaciones.
// - No importar tipos de Prisma ni de archivos legacy.
// - Validar siempre con WildcardSchema antes de persistir.
