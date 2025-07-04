/**
 * @file Esquemas Zod para la entidad Image
 * @module transformers/image/schema
 * ✅ MIGRADO A DRIZZLE - Sin dependencias de Prisma
 */

import { z } from 'zod';

export const ImageBaseSchema = z.object({
	id: z.string().uuid(),
	name: z.string().min(1).max(255),
	description: z.string().max(1000).nullable(),
	path: z.string().min(1),
	hash: z.string(),
	size: z.number().int().min(0),
	width: z.number().int().min(1),
	height: z.number().int().min(1),
	metadata: z.any().nullable(),
	isFavorite: z.boolean(),
	addedAt: z.date(),
	createdAt: z.date(),
	updatedAt: z.date(),
});

export const ImageStatisticsSchema = z.object({
	viewCount: z.number().int().min(0),
	downloadCount: z.number().int().min(0),
	favoriteCount: z.number().int().min(0),
	tagCount: z.number().int().min(0),
	collectionCount: z.number().int().min(0),
	duplicateCount: z.number().int().min(0),
	aspectRatio: z.number().min(0),
	fileType: z.string(),
	colorSpace: z.string().optional(),
	hasTransparency: z.boolean(),
});

export const ImageWithStatsSchema = ImageBaseSchema.extend({
	stats: ImageStatisticsSchema,
});

export type ImageSchemaType = z.infer<typeof ImageBaseSchema>;
export type ImageStatisticsSchemaType = z.infer<typeof ImageStatisticsSchema>;
export type ImageWithStatsSchemaType = z.infer<typeof ImageWithStatsSchema>;