/**
 * @file Esquemas Zod para la entidad JsonFile
 * @module transformers/json-file/schema
 * ✅ MIGRADO A DRIZZLE - Sin dependencias de Prisma
 */

import { z } from 'zod';

export const JsonFileBaseSchema = z.object({
	id: z.string().uuid(),
	name: z.string().min(1).max(255),
	path: z.string().min(1),
	content: z.any(),
	schema: z.string().nullable(),
	isValid: z.boolean(),
	size: z.number().int().min(0),
	createdAt: z.date(),
	updatedAt: z.date(),
});

export const JsonFileStatisticsSchema = z.object({
	lineCount: z.number().int().min(0),
	keyCount: z.number().int().min(0),
	depth: z.number().int().min(0),
	hasValidation: z.boolean(),
	lastValidated: z.date().optional(),
	errorCount: z.number().int().min(0),
});

export const JsonFileWithStatsSchema = JsonFileBaseSchema.extend({
	stats: JsonFileStatisticsSchema,
});

export type JsonFileSchemaType = z.infer<typeof JsonFileBaseSchema>;
export type JsonFileStatisticsSchemaType = z.infer<typeof JsonFileStatisticsSchema>;
export type JsonFileWithStatsSchemaType = z.infer<typeof JsonFileWithStatsSchema>;