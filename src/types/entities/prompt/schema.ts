/**
 * @file Esquemas de validación para la entidad Prompt
 * @module types/entities/prompt/schema
 */

import { z } from 'zod';

/**
 * Esquema para validación básica de Prompt
 */
export const PromptSchema = z.object({
	id: z.string().uuid().optional(),
	name: z.string().min(1, 'El nombre es requerido'),
	emoji: z.string().default('📝'),
	color: z.string().default('#3b82f6'),
	description: z.string().nullable().default(null),
	content: z.string().default(''),
	purpose: z.string().default(''),
	category: z.string().default('general'),
	parameters: z.string().default('{}').or(z.record(z.any())),
	tags: z.string().default('[]').or(z.array(z.string())),
	featuredImage: z.string().nullable().default(null),
	isFavorite: z.boolean().default(false),
	createdAt: z
		.date()
		.optional()
		.default(() => new Date()),
	updatedAt: z
		.date()
		.optional()
		.default(() => new Date()),
});

/**
 * Esquema para crear un nuevo Prompt
 */
export const CreatePromptSchema = PromptSchema.omit({
	id: true,
	createdAt: true,
	updatedAt: true,
});

/**
 * Esquema para actualizar un Prompt existente
 */
export const UpdatePromptSchema = PromptSchema.partial().extend({
	id: z.string().uuid(),
});

/**
 * Esquema para validar parámetros de ejecución de Prompt
 */
export const PromptExecutionParamsSchema = z.object({
	promptId: z.string().uuid(),
	variables: z.record(z.any()).optional(),
	context: z.string().optional(),
	options: z
		.object({
			maxTokens: z.number().positive().optional(),
			temperature: z.number().min(0).max(2).optional(),
			topP: z.number().min(0).max(1).optional(),
			frequencyPenalty: z.number().min(-2).max(2).optional(),
			presencePenalty: z.number().min(-2).max(2).optional(),
			model: z.string().optional(),
		})
		.optional(),
});

export type PromptSchemaType = z.infer<typeof PromptSchema>;
export type CreatePromptSchemaType = z.infer<typeof CreatePromptSchema>;
export type UpdatePromptSchemaType = z.infer<typeof UpdatePromptSchema>;
export type PromptExecutionParamsSchemaType = z.infer<typeof PromptExecutionParamsSchema>;
