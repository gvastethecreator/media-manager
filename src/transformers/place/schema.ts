/**
 * @file Esquemas Zod para la entidad Place
 * @module transformers/place/schema
 
 */

import { z } from 'zod';

export const PlaceBaseSchema = z.object({
	id: z.string().uuid(),
	name: z.string().min(1).max(255),
	description: z.string().max(1000).nullable(),
	type: z.string().max(100),
	coordinates: z
		.object({
			lat: z.number().min(-90).max(90),
			lng: z.number().min(-180).max(180),
		})
		.nullable(),
	address: z.string().max(500).nullable(),
	country: z.string().max(100).nullable(),
	region: z.string().max(100).nullable(),
	city: z.string().max(100).nullable(),
	isFavorite: z.boolean(),
	createdAt: z.date(),
	updatedAt: z.date(),
});

export const PlaceStatisticsSchema = z.object({
	imageCount: z.number().int().min(0),
	videoCount: z.number().int().min(0),
	characterCount: z.number().int().min(0),
	eventCount: z.number().int().min(0),
	visitCount: z.number().int().min(0),
	lastVisited: z.date().optional(),
	distance: z.number().min(0).optional(),
	popularity: z.number().min(0).max(100),
});

export const PlaceWithStatsSchema = PlaceBaseSchema.extend({
	stats: PlaceStatisticsSchema,
});

export type PlaceSchemaType = z.infer<typeof PlaceBaseSchema>;
export type PlaceStatisticsSchemaType = z.infer<typeof PlaceStatisticsSchema>;
export type PlaceWithStatsSchemaType = z.infer<typeof PlaceWithStatsSchema>;
