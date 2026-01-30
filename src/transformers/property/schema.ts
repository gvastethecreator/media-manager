/**
 * @file Esquemas Zod para la entidad Property
 * @module transformers/property/schema
 
 */

import { z } from 'zod';

export const PropertyBaseSchema = z.object({
	id: z.string().uuid(),
	key: z.string().min(1).max(100),
	value: z.any(),
	type: z.enum(['string', 'number', 'boolean', 'object', 'array']),
	entityId: z.string().uuid(),
	entityType: z.string().min(1),
	isSystem: z.boolean(),
	isRequired: z.boolean(),
	createdAt: z.date(),
	updatedAt: z.date(),
});

export const PropertyStatisticsSchema = z.object({
	totalRelations: z.number().int().min(0),
	totalAssociations: z.number().int().min(0),
	usageDiversity: z.number().min(0),
	popularity: z.number().min(0),
	completenessScore: z.number().min(0).max(100),
	lastUpdated: z.date(),
});

export const PropertyWithStatsSchema = PropertyBaseSchema.extend({
	stats: PropertyStatisticsSchema,
});

export type PropertySchemaType = z.infer<typeof PropertyBaseSchema>;
export type PropertyStatisticsSchemaType = z.infer<typeof PropertyStatisticsSchema>;
export type PropertyWithStatsSchemaType = z.infer<typeof PropertyWithStatsSchema>;
