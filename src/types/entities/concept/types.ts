/**
 * @file Tipos canónicos para la entidad Concept
 * @module types/entities/concept/types
 * @warning ⚠️ No importar tipos de Prisma ni de archivos legacy. Usar solo estos tipos en transformers, server actions y validaciones.
 * @description Estructura unificada y validada para Concept.
 * Última migración: 2025-06-18
 */

import { z } from 'zod';

/**
 * Tipo base canónico para Concept
 */
export interface ConceptBase {
	id: string;
	name: string;
	emoji: string;
	color: string;
	description: string | null;
	content: string;
	category: string;
	featuredImage: string | null;
	isFavorite: boolean;
	createdAt: Date;
	updatedAt: Date;
}

/**
 * Input para creación
 */
export interface ConceptCreateInput {
	name: string;
	emoji?: string;
	color?: string;
	description?: string | null;
	content: string;
	category?: string;
	featuredImage?: string | null;
	isFavorite?: boolean;
}

/**
 * Input para actualización
 */
export type ConceptUpdateInput = Partial<Omit<ConceptBase, 'id' | 'createdAt' | 'updatedAt'>>;

/**
 * Esquema Zod para validación de Concept
 */
export const ConceptSchema = z.object({
	id: z.string(),
	name: z.string(),
	emoji: z.string(),
	color: z.string(),
	description: z.string().nullable(),
	content: z.string(),
	category: z.string(),
	featuredImage: z.string().nullable(),
	isFavorite: z.boolean(),
	createdAt: z.date(),
	updatedAt: z.date(),
});

// 🟢 Documentación y advertencia:
// - Usar solo estos tipos en transformers, server actions y validaciones.
// - No importar tipos de Prisma ni de archivos legacy.
// - Validar siempre con ConceptSchema antes de persistir.
