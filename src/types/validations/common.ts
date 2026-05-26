/**
 * @file Validaciones comunes para formularios
 * @module types/validations/common
 */

import { z } from 'zod';

/**
 * Tipo genérico para resolver de formularios
 */
export interface Resolver<T = unknown> {
	(values: T): Promise<{ values: T; errors: Record<string, unknown> }>;
	(values: T): { values: T; errors: Record<string, unknown> };
}

/**
 * Esquema base para entidades con propiedades comunes
 */
export const baseEntitySchema = z.object({
	name: z.string().min(1, 'El nombre es requerido'),
	description: z.string().optional(),
	emoji: z.string().optional(),
	color: z.string().optional(),
	isFavorite: z.boolean().optional().default(false),
});

/**
 * Esquema para colecciones
 */
export const collectionCreateSchema = z.object({
	name: z.string().min(1, 'El nombre es requerido'),
	description: z.string().optional(),
	emoji: z.string().optional(),
	color: z.string().optional(),
	isFavorite: z.boolean().optional().default(false),
});

/**
 * Esquema para grupos
 */
export const groupCreateSchema = z.object({
	name: z.string().min(1, 'El nombre es requerido'),
	description: z.string().optional(),
	emoji: z.string().optional(),
	color: z.string().optional(),
});

/**
 * Esquema para notas
 */
export const noteCreateSchema = z.object({
	title: z.string().min(1, 'El título es requerido'),
	content: z.string().optional(),
	summary: z.string().optional(),
	category: z.string().optional(),
	priority: z.number().optional(),
	status: z.string().optional(),
	color: z.string().optional(),
	emoji: z.string().optional(),
});

/**
 * Esquema para lugares
 */
export const placeCreateSchema = z.object({
	name: z.string().min(1, 'El nombre es requerido'),
	description: z.string().optional(),
	emoji: z.string().optional(),
	color: z.string().optional(),
	category: z.string().optional(),
	type: z.string().optional(),
	location: z.string().optional(),
	region: z.string().optional(),
});

/**
 * Esquema para prompts
 */
export const promptCreateSchema = z.object({
	name: z.string().min(1, 'El nombre es requerido'),
	content: z.string().min(1, 'El contenido es requerido'),
	description: z.string().optional(),
	category: z.string().optional(),
	tags: z.array(z.string()).optional(),
});

/**
 * Esquema para tags
 */
export const tagCreateSchema = z.object({
	name: z.string().min(1, 'El nombre es requerido'),
	description: z.string().optional(),
	emoji: z.string().optional(),
	color: z.string().optional(),
	category: z.string().optional(),
});

// Tipos inferidos
export type CollectionCreateInput = z.infer<typeof collectionCreateSchema>;
export type GroupCreateInput = z.infer<typeof groupCreateSchema>;
export type NoteCreateInput = z.infer<typeof noteCreateSchema>;
export type PlaceCreateInput = z.infer<typeof placeCreateSchema>;
export type PromptCreateInput = z.infer<typeof promptCreateSchema>;
export type TagCreateInput = z.infer<typeof tagCreateSchema>;
