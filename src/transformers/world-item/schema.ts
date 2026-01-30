/**
 * 🌍 WORLD-ITEM SCHEMA
 *
 * Schema de validación con Zod para la entidad WorldItem.
 * Derivado del schema de Drizzle.
 *
 * @updated 2025-01-27
 */

import { z } from 'zod';

/**
 * Schema Zod para WorldItemBase
 */
export const ZodWorldItemSchema = z.object({
	id: z.string().min(1, 'ID es requerido'),
	name: z.string().min(1, 'Nombre es requerido'),
	description: z.string().nullable(),
	type: z.string().nullable(),
	category: z.string().nullable(),
	rarity: z.string().nullable(),
	properties: z.string().nullable(), // JSON string con propiedades
	lore: z.string().nullable(),
	isActive: z.boolean(),
	worldId: z.string().nullable(),
	parentId: z.string().nullable(),
	imageUrl: z.string().nullable(),
	tags: z.array(z.string()).default([]),
	metadata: z.string().nullable(),
	createdAt: z.date(),
	updatedAt: z.date(),
});

/**
 * Schema para crear un WorldItem
 */
export const ZodWorldItemCreateSchema = ZodWorldItemSchema.omit({
	id: true,
	createdAt: true,
	updatedAt: true,
}).extend({
	isActive: z.boolean().default(true),
});

/**
 * Schema para actualizar un WorldItem
 */
export const ZodWorldItemUpdateSchema = ZodWorldItemCreateSchema.partial();

export type ZodWorldItemType = z.infer<typeof ZodWorldItemSchema>;
export type ZodWorldItemCreateType = z.infer<typeof ZodWorldItemCreateSchema>;
export type ZodWorldItemUpdateType = z.infer<typeof ZodWorldItemUpdateSchema>;
