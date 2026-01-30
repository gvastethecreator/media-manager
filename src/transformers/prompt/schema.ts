/**
 * @file Esquemas Zod para la entidad Prompt
 * @module transformers/prompt/schema
 
 */

import { z } from 'zod';

export const PromptBaseSchema = z.object({
	id: z.string().uuid(),
	title: z.string().min(1).max(255),
	content: z.string().min(1),
	description: z.string().max(1000).nullable(),
	category: z.string().max(100).nullable(),
	tags: z.array(z.string()),
	parameters: z.any(),

	isFavorite: z.boolean(),
	createdAt: z.date(),
	updatedAt: z.date(),
});

export const PromptStatisticsSchema = z.object({
	useCount: z.number().int().min(0),
	favoriteCount: z.number().int().min(0),
	shareCount: z.number().int().min(0),
	wordCount: z.number().int().min(0),
	parameterCount: z.number().int().min(0),
	tagCount: z.number().int().min(0),
	lastUsed: z.date().optional(),
	popularity: z.number().min(0).max(100),
});

export const PromptWithStatsSchema = PromptBaseSchema.extend({
	stats: PromptStatisticsSchema,
});

export type PromptSchemaType = z.infer<typeof PromptBaseSchema>;
export type PromptStatisticsSchemaType = z.infer<typeof PromptStatisticsSchema>;
export type PromptWithStatsSchemaType = z.infer<typeof PromptWithStatsSchema>;
