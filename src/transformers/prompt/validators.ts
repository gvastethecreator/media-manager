/**
 * @file Validadores para la entidad Prompt
 * @module transformers/prompt/validators

 */

import { z } from 'zod';

export const PromptCreateSchema = z.object({
	title: z.string().min(1).max(255),
	content: z.string().min(1),
	description: z.string().max(1000).optional(),
	category: z.string().max(100).optional(),
	tags: z.array(z.string()).default([]),
	parameters: z.any().default({}),

	isFavorite: z.boolean().default(false),
});

export const PromptUpdateSchema = z.object({
	title: z.string().min(1).max(255).optional(),
	content: z.string().min(1).optional(),
	description: z.string().max(1000).optional(),
	category: z.string().max(100).optional(),
	tags: z.array(z.string()).optional(),
	parameters: z.any().optional(),

	isFavorite: z.boolean().optional(),
});

export const PromptSchema = z.object({
	id: z.string().uuid(),
	title: z.string(),
	content: z.string(),
	description: z.string().nullable(),
	category: z.string().nullable(),
	tags: z.array(z.string()),
	parameters: z.any(),

	isFavorite: z.boolean(),
	createdAt: z.date(),
	updatedAt: z.date(),
});

export function validatePromptCreate(data: unknown) {
	return PromptCreateSchema.parse(data);
}

export function validatePromptUpdate(data: unknown) {
	return PromptUpdateSchema.parse(data);
}

export function validatePrompt(data: unknown) {
	return PromptSchema.parse(data);
}
