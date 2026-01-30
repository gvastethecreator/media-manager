/**
 * 🃏 WILDCARD SCHEMA
 *
 * Schema de validación con Zod para la entidad Wildcard.
 * Derivado del schema de Drizzle.
 *
 * @updated 2025-01-27
 */

import { z } from 'zod';

/**
 * Schema Zod para WildcardBase
 */
export const ZodWildcardSchema = z.object({
	id: z.string().min(1, 'ID es requerido'),
	content: z.string().min(1, 'Contenido es requerido'),
	type: z.string().nullable(),
	category: z.string().nullable(),
	difficulty: z.string().nullable(),
	theme: z.string().nullable(),
	description: z.string().nullable(),
	isActive: z.boolean(),
	version: z.string().nullable(),
	author: z.string().nullable(),
	createdAt: z.date(),
	updatedAt: z.date(),
});

/**
 * Schema para crear un Wildcard
 */
export const ZodWildcardCreateSchema = ZodWildcardSchema.omit({
	id: true,
	createdAt: true,
	updatedAt: true,
}).extend({
	isActive: z.boolean().default(true),
});

/**
 * Schema para actualizar un Wildcard
 */
export const ZodWildcardUpdateSchema = ZodWildcardCreateSchema.partial();

export type ZodWildcardType = z.infer<typeof ZodWildcardSchema>;
export type ZodWildcardCreateType = z.infer<typeof ZodWildcardCreateSchema>;
export type ZodWildcardUpdateType = z.infer<typeof ZodWildcardUpdateSchema>;
