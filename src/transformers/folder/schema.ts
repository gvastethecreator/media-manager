/**
 * @file Esquemas Zod para la entidad Folder (compat)
 * Re-exporta los esquemas canónicos desde types/entities/folder/schema
 * manteniendo nombres legacy usados en transformers.
 */

import { z } from 'zod';
import {
	FolderBaseSchema as CanonicalFolderSchema,
	CreateFolderSchema as CanonicalFolderCreateSchema,
	UpdateFolderSchema as CanonicalFolderUpdateSchema,
	FolderStatisticsSchema as CanonicalFolderStatisticsSchema,
	FolderFiltersSchema as CanonicalFolderFiltersSchema,
	FolderSearchOptionsSchema as CanonicalFolderSearchOptionsSchema,
} from '@/types/entities/folder/schema';

// Aliases legacy -> canónicos
export const FolderSchema = CanonicalFolderSchema;
export const FolderCreateSchema = CanonicalFolderCreateSchema;
export const FolderUpdateSchema = CanonicalFolderUpdateSchema;
export const FolderStatisticsSchema = CanonicalFolderStatisticsSchema;
export const FolderFiltersSchema = CanonicalFolderFiltersSchema;
export const FolderSearchOptionsSchema = CanonicalFolderSearchOptionsSchema;

// Compat: este schema expone "statistics" en lugar de "stats"
export const FolderWithStatsSchema = FolderSchema.extend({
	statistics: FolderStatisticsSchema,
	_count: z.object({
		children: z.number().int().min(0),
		images: z.number().int().min(0),
		videos: z.number().int().min(0),
	}),
});

// Tipos inferidos
export type FolderSchemaType = z.infer<typeof FolderSchema>;
export type FolderCreateSchemaType = z.infer<typeof FolderCreateSchema>;
export type FolderUpdateSchemaType = z.infer<typeof FolderUpdateSchema>;
export type FolderStatisticsSchemaType = z.infer<typeof FolderStatisticsSchema>;
export type FolderWithStatsSchemaType = z.infer<typeof FolderWithStatsSchema>;
export type FolderFiltersSchemaType = z.infer<typeof FolderFiltersSchema>;
export type FolderSearchOptionsSchemaType = z.infer<typeof FolderSearchOptionsSchema>;
