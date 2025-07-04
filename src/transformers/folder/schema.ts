/**
 * @file Esquemas Zod para la entidad Folder
 * @module transformers/folder/schema
 * @description Definición de esquemas de validación para la entidad Folder
 * ✅ MIGRADO A DRIZZLE - Sin dependencias de Prisma
 */

import { z } from 'zod';

/**
 * Esquema base para la entidad Folder
 */
export const FolderSchema = z.object({
	id: z.string().uuid('ID debe ser un UUID válido'),
	name: z.string()
		.min(1, 'El nombre es requerido')
		.max(255, 'El nombre no puede exceder 255 caracteres'),
	path: z.string()
		.min(1, 'La ruta es requerida')
		.max(500, 'La ruta no puede exceder 500 caracteres'),
	description: z.string()
		.max(1000, 'La descripción no puede exceder 1000 caracteres')
		.nullable()
		.optional(),
	emoji: z.string()
		.max(10, 'El emoji no puede exceder 10 caracteres')
		.nullable()
		.optional(),
	color: z.string()
		.regex(/^#[0-9A-Fa-f]{6}$/, 'Color debe ser un hexadecimal válido')
		.nullable()
		.optional(),
	featuredImage: z.string()
		.url('Debe ser una URL válida')
		.nullable()
		.optional(),
	isFavorite: z.boolean().default(false),
	totalFiles: z.number()
		.int('Debe ser un número entero')
		.min(0, 'No puede ser negativo')
		.default(0),
	totalSize: z.number()
		.int('Debe ser un número entero')
		.min(0, 'No puede ser negativo')
		.default(0),
	autoReindex: z.boolean().default(false),
	lastIndexed: z.date().nullable().optional(),
	parentId: z.string()
		.uuid('Parent ID debe ser un UUID válido')
		.nullable()
		.optional(),
	presetId: z.string()
		.uuid('Preset ID debe ser un UUID válido')
		.nullable()
		.optional(),
	createdAt: z.date(),
	updatedAt: z.date(),
});

/**
 * Esquema para crear carpetas
 */
export const FolderCreateSchema = z.object({
	name: z.string()
		.min(1, 'El nombre es requerido')
		.max(255, 'El nombre no puede exceder 255 caracteres'),
	path: z.string()
		.min(1, 'La ruta es requerida')
		.max(500, 'La ruta no puede exceder 500 caracteres'),
	description: z.string()
		.max(1000, 'La descripción no puede exceder 1000 caracteres')
		.nullable()
		.optional(),
	emoji: z.string()
		.max(10, 'El emoji no puede exceder 10 caracteres')
		.nullable()
		.optional(),
	color: z.string()
		.regex(/^#[0-9A-Fa-f]{6}$/, 'Color debe ser un hexadecimal válido')
		.nullable()
		.optional(),
	featuredImage: z.string()
		.url('Debe ser una URL válida')
		.nullable()
		.optional(),
	isFavorite: z.boolean().default(false),
	autoReindex: z.boolean().default(false),
	parentId: z.string()
		.uuid('Parent ID debe ser un UUID válido')
		.nullable()
		.optional(),
	presetId: z.string()
		.uuid('Preset ID debe ser un UUID válido')
		.nullable()
		.optional(),
});

/**
 * Esquema para actualizar carpetas
 */
export const FolderUpdateSchema = z.object({
	name: z.string()
		.min(1, 'El nombre no puede estar vacío')
		.max(255, 'El nombre no puede exceder 255 caracteres')
		.optional(),
	path: z.string()
		.min(1, 'La ruta no puede estar vacía')
		.max(500, 'La ruta no puede exceder 500 caracteres')
		.optional(),
	description: z.string()
		.max(1000, 'La descripción no puede exceder 1000 caracteres')
		.nullable()
		.optional(),
	emoji: z.string()
		.max(10, 'El emoji no puede exceder 10 caracteres')
		.nullable()
		.optional(),
	color: z.string()
		.regex(/^#[0-9A-Fa-f]{6}$/, 'Color debe ser un hexadecimal válido')
		.nullable()
		.optional(),
	featuredImage: z.string()
		.url('Debe ser una URL válida')
		.nullable()
		.optional(),
	isFavorite: z.boolean().optional(),
	totalFiles: z.number()
		.int('Debe ser un número entero')
		.min(0, 'No puede ser negativo')
		.optional(),
	totalSize: z.number()
		.int('Debe ser un número entero')
		.min(0, 'No puede ser negativo')
		.optional(),
	autoReindex: z.boolean().optional(),
	lastIndexed: z.date().nullable().optional(),
	parentId: z.string()
		.uuid('Parent ID debe ser un UUID válido')
		.nullable()
		.optional(),
	presetId: z.string()
		.uuid('Preset ID debe ser un UUID válido')
		.nullable()
		.optional(),
});

/**
 * Esquema para estadísticas de carpetas
 */
export const FolderStatisticsSchema = z.object({
	hierarchyDepth: z.number().int().min(0),
	totalDescendants: z.number().int().min(0),
	directChildren: z.number().int().min(0),
	contentDiversity: z.number().min(0).max(100),
	organizationScore: z.number().min(0).max(100),
	totalItems: z.number().int().min(0),
	accessFrequency: z.number().min(0).max(100),
	lastActivity: z.date(),
	imageCount: z.number().int().min(0),
	videoCount: z.number().int().min(0),
	noteCount: z.number().int().min(0),
	documentCount: z.number().int().min(0),
	folderCount: z.number().int().min(0),
	formattedSize: z.string(),
	averageFileSize: z.number().min(0),
	largestFile: z.number().min(0),
	hasConsistentNaming: z.boolean(),
	hasDeepHierarchy: z.boolean(),
	isWellOrganized: z.boolean(),
	breadcrumbs: z.array(z.object({
		id: z.string(),
		name: z.string(),
		path: z.string(),
	})),
	fullPath: z.string(),
	relativePath: z.string(),
	autoTags: z.array(z.string()),
	qualityGrade: z.enum(['A', 'B', 'C', 'D']),
	totalRelations: z.number().int().min(0),
});

/**
 * Esquema para carpeta con estadísticas
 */
export const FolderWithStatsSchema = FolderSchema.extend({
	statistics: FolderStatisticsSchema,
	_count: z.object({
		children: z.number().int().min(0),
		images: z.number().int().min(0),
		videos: z.number().int().min(0),
	}),
});

/**
 * Esquema para filtros de búsqueda
 */
export const FolderFiltersSchema = z.object({
	search: z.string().optional(),
	isFavorite: z.boolean().optional(),
	parentId: z.string().uuid().nullable().optional(),
	hasImages: z.boolean().optional(),
});

/**
 * Esquema para opciones de búsqueda
 */
export const FolderSearchOptionsSchema = z.object({
	skip: z.number().int().min(0).optional(),
	take: z.number().int().min(1).max(1000).optional(),
	orderBy: z.any().optional(),
	filters: FolderFiltersSchema.optional(),
	include: z.any().optional(),
});

/**
 * Tipos inferidos desde los esquemas
 */
export type FolderSchemaType = z.infer<typeof FolderSchema>;
export type FolderCreateSchemaType = z.infer<typeof FolderCreateSchema>;
export type FolderUpdateSchemaType = z.infer<typeof FolderUpdateSchema>;
export type FolderStatisticsSchemaType = z.infer<typeof FolderStatisticsSchema>;
export type FolderWithStatsSchemaType = z.infer<typeof FolderWithStatsSchema>;
export type FolderFiltersSchemaType = z.infer<typeof FolderFiltersSchema>;
export type FolderSearchOptionsSchemaType = z.infer<typeof FolderSearchOptionsSchema>;