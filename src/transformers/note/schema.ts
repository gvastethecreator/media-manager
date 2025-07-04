/**
 * @file Esquemas Zod para la entidad Note
 * @module transformers/note/schema
 * ✅ MIGRADO A DRIZZLE - Sin dependencias de Prisma
 */

import { z } from 'zod';

export const NoteBaseSchema = z.object({
	id: z.string().uuid(),
	title: z.string().min(1).max(255),
	content: z.string().nullable(),
	excerpt: z.string().max(500).nullable(),
	category: z.string().max(100).nullable(),
	emoji: z.string().max(10).nullable(),
	color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).nullable(),
	isFavorite: z.boolean(),
	isPinned: z.boolean(),
	isArchived: z.boolean(),
	createdAt: z.date(),
	updatedAt: z.date(),
});

export const NoteStatisticsSchema = z.object({
	wordCount: z.number().int().min(0),
	characterCount: z.number().int().min(0),
	readTime: z.number().min(0),
	tagCount: z.number().int().min(0),
	linkCount: z.number().int().min(0),
	attachmentCount: z.number().int().min(0),
	lastViewed: z.date().optional(),
	viewCount: z.number().int().min(0),
});

export const NoteWithStatsSchema = NoteBaseSchema.extend({
	stats: NoteStatisticsSchema,
});

export type NoteSchemaType = z.infer<typeof NoteBaseSchema>;
export type NoteStatisticsSchemaType = z.infer<typeof NoteStatisticsSchema>;
export type NoteWithStatsSchemaType = z.infer<typeof NoteWithStatsSchema>;