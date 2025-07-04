/**
 * @file Esquemas Zod para la entidad Metadata
 * @module transformers/metadata/schema
 * ✅ MIGRADO A DRIZZLE - Sin dependencias de Prisma
 */

import { z } from 'zod';

export const MetadataBaseSchema = z.object({
	id: z.string().uuid(),
	type: z.string().min(1),
	data: z.any(),
	entityId: z.string().uuid(),
	entityType: z.string().min(1),
	source: z.string().nullable(),
	createdAt: z.date(),
	updatedAt: z.date(),
});

export const MetadataStatisticsSchema = z.object({
	dataSize: z.number().int().min(0),
	keyCount: z.number().int().min(0),
	depth: z.number().int().min(0),
	isValid: z.boolean(),
	lastValidated: z.date().optional(),
});

export const MetadataWithStatsSchema = MetadataBaseSchema.extend({
	stats: MetadataStatisticsSchema,
});

export type MetadataSchemaType = z.infer<typeof MetadataBaseSchema>;
export type MetadataStatisticsSchemaType = z.infer<typeof MetadataStatisticsSchema>;
export type MetadataWithStatsSchemaType = z.infer<typeof MetadataWithStatsSchema>;