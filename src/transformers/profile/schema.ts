/**
 * @file Esquemas Zod para la entidad Profile
 * @module transformers/profile/schema
 
 */

import { z } from 'zod';

export const ProfileBaseSchema = z.object({
	id: z.string().uuid(),
	name: z.string().min(1).max(100),
	email: z.string().email(),
	avatar: z.string().url().nullable(),
	bio: z.string().max(500).nullable(),
	website: z.string().url().nullable(),
	location: z.string().max(100).nullable(),
	isActive: z.boolean(),
	preferences: z.any(),
	createdAt: z.date(),
	updatedAt: z.date(),
});

export const ProfileStatisticsSchema = z.object({
	totalImages: z.number().int().min(0),
	totalVideos: z.number().int().min(0),
	totalCollections: z.number().int().min(0),
	totalFavorites: z.number().int().min(0),
	totalActivities: z.number().int().min(0),
	lastActivity: z.date(),
	joinDate: z.date(),
	isVerified: z.boolean(),
});

export const ProfileWithStatsSchema = ProfileBaseSchema.extend({
	stats: ProfileStatisticsSchema,
});

export type ProfileSchemaType = z.infer<typeof ProfileBaseSchema>;
export type ProfileStatisticsSchemaType = z.infer<typeof ProfileStatisticsSchema>;
export type ProfileWithStatsSchemaType = z.infer<typeof ProfileWithStatsSchema>;
