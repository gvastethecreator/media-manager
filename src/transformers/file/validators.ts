/**
 * @file Validadores Zod para la entidad File.
 * @module transformers/file/validators
 * @description Esquemas de validación para File usando Zod.
 * ✅ MIGRADO A DRIZZLE - Enero 2025
 */

import { z } from 'zod';
import { FileType } from '../../types/entities/file';

/**
 * 📁 Esquema base para validar archivos.
 */
export const fileBaseSchema = z.object({
	id: z.string().uuid('ID debe ser un UUID válido'),
	name: z.string().min(1, 'Nombre es requerido'),
	path: z.string().min(1, 'Ruta es requerida'),
	size: z.number().int().min(0, 'Tamaño debe ser positivo'),
	hash: z.string().min(1, 'Hash es requerido'),
	mimeType: z.string().min(1, 'Tipo MIME es requerido'),
	extension: z.string(),
	type: z.nativeEnum(FileType, {
		errorMap: () => ({ message: 'Tipo de archivo no válido' }),
	}),
	isDirectory: z.boolean(),
	parentPath: z.string(),
	absolutePath: z.string(),
	relativePath: z.string(),
	modifiedAt: z.date(),
	accessedAt: z.date(),
	folderId: z.string().uuid().nullable(),
	isHidden: z.boolean(),
	isReadonly: z.boolean(),
	createdAt: z.date(),
	updatedAt: z.date(),
});

/**
 * 📊 Esquema para estadísticas de archivos.
 */
export const fileStatisticsSchema = z.object({
	formattedSize: z.string(),
	typeLabel: z.string(),
	iconName: z.string(),
	colorCode: z.string(),
	daysSinceModified: z.number().int().min(0),
	daysSinceAccessed: z.number().int().min(0),
	isRecent: z.boolean(),
	isLarge: z.boolean(),
	formattedModifiedAt: z.string(),
	childCount: z.number().int().min(0),
	shortPath: z.string(),
});

/**
 * 📁 Esquema para archivo con estadísticas.
 */
export const fileWithStatsSchema = fileBaseSchema.extend({
	stats: fileStatisticsSchema,
});

/**
 * 🆕 Esquema para crear archivos.
 */
export const fileCreateSchema = fileBaseSchema.omit({
	id: true,
	createdAt: true,
	updatedAt: true,
});

/**
 * ✏️ Esquema para actualizar archivos.
 */
export const fileUpdateSchema = fileCreateSchema.partial();

/**
 * 🔍 Esquema para búsqueda de archivos.
 */
export const fileSearchSchema = z.object({
	query: z.string().optional(),
	path: z.string().optional(),
	parentPath: z.string().optional(),
	types: z.array(z.nativeEnum(FileType)).optional(),
	extensions: z.array(z.string()).optional(),
	mimeTypes: z.array(z.string()).optional(),
	isDirectory: z.boolean().optional(),
	isHidden: z.boolean().optional(),
	isReadonly: z.boolean().optional(),
	minSize: z.number().int().min(0).optional(),
	maxSize: z.number().int().min(0).optional(),
	modifiedAfter: z.date().optional(),
	modifiedBefore: z.date().optional(),
	accessedAfter: z.date().optional(),
	accessedBefore: z.date().optional(),
	sortBy: z.enum(['name', 'size', 'modifiedAt', 'type', 'createdAt']).optional(),
	sortOrder: z.enum(['asc', 'desc']).optional(),
});

/**
 * 📂 Esquema para operaciones de directorio.
 */
export const directoryOperationSchema = z.object({
	path: z.string().min(1, 'Ruta es requerida'),
	recursive: z.boolean().default(false),
	includeHidden: z.boolean().default(false),
	maxDepth: z.number().int().min(1).max(10).optional(),
});

// Tipos inferidos desde esquemas Zod
export type FileBase = z.infer<typeof fileBaseSchema>;
export type FileStatistics = z.infer<typeof fileStatisticsSchema>;
export type FileWithStats = z.infer<typeof fileWithStatsSchema>;
export type FileCreateInput = z.infer<typeof fileCreateSchema>;
export type FileUpdateInput = z.infer<typeof fileUpdateSchema>;
export type FileSearchInput = z.infer<typeof fileSearchSchema>;
export type DirectoryOperationInput = z.infer<typeof directoryOperationSchema>;
