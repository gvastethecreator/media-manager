/**
 * @file Esquemas Zod para la entidad Group
 * @module transformers/group/schema
 * @description Definición de esquemas de validación para Group
 
 */

import { z } from 'zod';

export const GroupSchema = z.object({
	id: z.string().uuid(),
	name: z.string().min(1).max(100),
	description: z.string().max(500).nullable(),
	emoji: z.string().max(10).nullable(),
	color: z
		.string()
		.regex(/^#[0-9A-Fa-f]{6}$/)
		.nullable(),
	isFavorite: z.boolean(),
	createdAt: z.date(),
	updatedAt: z.date(),
});

export const GroupCreateSchema = z.object({
	name: z.string().min(1).max(100),
	description: z.string().max(500).optional(),
	emoji: z.string().max(10).optional(),
	color: z
		.string()
		.regex(/^#[0-9A-Fa-f]{6}$/)
		.optional(),
});

export const GroupUpdateSchema = z.object({
	name: z.string().min(1).max(100).optional(),
	description: z.string().max(500).optional(),
	emoji: z.string().max(10).optional(),
	color: z
		.string()
		.regex(/^#[0-9A-Fa-f]{6}$/)
		.optional(),
});

export const GroupStatisticsSchema = z.object({
	imageCount: z.number().int().min(0),
	videoCount: z.number().int().min(0),
	albumCount: z.number().int().min(0),
	collectionCount: z.number().int().min(0),
	tagCount: z.number().int().min(0),
	characterCount: z.number().int().min(0),
	placeCount: z.number().int().min(0),
	worldItemCount: z.number().int().min(0),
	conceptCount: z.number().int().min(0),
	promptCount: z.number().int().min(0),
	noteCount: z.number().int().min(0),
	wildcardCount: z.number().int().min(0),
	propertyCount: z.number().int().min(0),
});

export const GroupWithStatsSchema = GroupSchema.extend({
	stats: GroupStatisticsSchema,
});

export type GroupSchemaType = z.infer<typeof GroupSchema>;
export type GroupCreateSchemaType = z.infer<typeof GroupCreateSchema>;
export type GroupUpdateSchemaType = z.infer<typeof GroupUpdateSchema>;
export type GroupStatisticsSchemaType = z.infer<typeof GroupStatisticsSchema>;
export type GroupWithStatsSchemaType = z.infer<typeof GroupWithStatsSchema>;
