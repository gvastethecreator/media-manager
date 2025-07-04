/**
 * @file Esquemas de validación Zod para la entidad Audio
 * @module transformers/audio/schema
 * ✅ MIGRADO A DRIZZLE - Julio 2025
 * Estado: Completo, sin dependencias de Prisma
 */

import { z } from 'zod';

/**
 * Esquema base para audios
 */
export const audioBaseSchema = z.object({
	id: z.string(),
	name: z.string().min(1).max(255),
	path: z.string().min(1),
	size: z.number().nonnegative(),
	hash: z.string(),
	mimeType: z.string(),
	extension: z.string(),
	folderId: z.string(),
	isFavorite: z.boolean(),
	isArchived: z.boolean(),
	duration: z.number().nullable(),
	bitrate: z.number().nullable(),
	sampleRate: z.number().nullable(),
	channels: z.number().nullable(),
	format: z.string().nullable(),
	codec: z.string().nullable(),
	title: z.string().nullable(),
	artist: z.string().nullable(),
	album: z.string().nullable(),
	year: z.number().nullable(),
	genre: z.string().nullable(),
	track: z.number().nullable(),
	disc: z.number().nullable(),
	albumArtist: z.string().nullable(),
	composer: z.string().nullable(),
	comment: z.string().nullable(),
	lyrics: z.string().nullable(),
	bpm: z.number().nullable(),
	key: z.string().nullable(),
	mood: z.string().nullable(),
	createdAt: z.date(),
	updatedAt: z.date(),
});

/**
 * Esquema para estadísticas de audio
 */
export const audioStatisticsSchema = z.object({
	duration: z.number().nonnegative(),
	format: z.string(),
	bitrate: z.number().nonnegative(),
	volumePeaks: z.array(z.number()),
	sampleRate: z.number().nonnegative(),
});

/**
 * Esquema para audios completos con estadísticas
 */
export const audioWithStatsSchema = audioBaseSchema.extend({
	stats: audioStatisticsSchema,
});

/**
 * Esquema para creación de audios
 */
export const createAudioSchema = audioBaseSchema.omit({
	id: true,
	createdAt: true,
	updatedAt: true,
});

/**
 * Esquema para actualización de audios
 */
export const updateAudioSchema = createAudioSchema.partial();

/**
 * Esquema para filtros de audios
 */
export const audioFiltersSchema = z.object({
	searchQuery: z.string().optional(),
	formats: z.array(z.string()).optional(),
	genres: z.array(z.string()).optional(),
	artists: z.array(z.string()).optional(),
	isFavorite: z.boolean().optional(),
	isArchived: z.boolean().optional(),
	minDuration: z.number().nonnegative().optional(),
	maxDuration: z.number().nonnegative().optional(),
	minSize: z.number().nonnegative().optional(),
	maxSize: z.number().nonnegative().optional(),
	minYear: z.number().optional(),
	maxYear: z.number().optional(),
	startDate: z.union([z.string(), z.date()]).optional(),
	endDate: z.union([z.string(), z.date()]).optional(),
	limit: z.number().positive().max(100).optional(),
	offset: z.number().nonnegative().optional(),
});

/**
 * Esquema para response de listado de audios
 */
export const audioListResponseSchema = z.object({
	audios: z.array(audioWithStatsSchema),
	totalCount: z.number(),
	hasMore: z.boolean(),
});

// Exportaciones de tipos derivados
export type AudioBaseSchemaType = z.infer<typeof audioBaseSchema>;
export type AudioStatisticsSchemaType = z.infer<typeof audioStatisticsSchema>;
export type AudioWithStatsSchemaType = z.infer<typeof audioWithStatsSchema>;
export type CreateAudioSchemaType = z.infer<typeof createAudioSchema>;
export type UpdateAudioSchemaType = z.infer<typeof updateAudioSchema>;
export type AudioFiltersSchemaType = z.infer<typeof audioFiltersSchema>;
export type AudioListResponseSchemaType = z.infer<typeof audioListResponseSchema>;
