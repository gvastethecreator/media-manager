/**
 * @file Validadores Zod para la entidad File3D.
 * @module transformers/file3d/validators
 * @description Esquemas de validación para File3D usando Zod.
 * ✅ MIGRADO A DRIZZLE - Enero 2025
 */

import { z } from 'zod';

/**
 * 🎯 Esquema base para validar archivos 3D.
 */
export const file3dBaseSchema = z.object({
	id: z.string().uuid('ID debe ser un UUID válido'),
	name: z.string().min(1, 'Nombre es requerido').max(255, 'Nombre muy largo'),
	filePath: z.string().min(1, 'Ruta de archivo es requerida'),
	format: z.string().min(1, 'Formato es requerido'),
	size: z.number().int().min(0, 'Tamaño debe ser positivo'),
	vertexCount: z.number().int().min(0).nullable(),
	faceCount: z.number().int().min(0).nullable(),
	textureCount: z.number().int().min(0).nullable(),
	materialCount: z.number().int().min(0).nullable(),
	boundingBoxMin: z.string().nullable(),
	boundingBoxMax: z.string().nullable(),
	hasAnimations: z.boolean(),
	hasTextures: z.boolean(),
	hasMaterials: z.boolean(),
	isOptimized: z.boolean(),
	compressionLevel: z.number().min(0).max(100).nullable(),
	thumbnail: z.string().nullable(),
	metadata: z.string().nullable(),
	folderId: z.string().uuid().nullable(),
	createdAt: z.date(),
	updatedAt: z.date(),
});

/**
 * 📊 Esquema para estadísticas de archivos 3D.
 */
export const file3dStatisticsSchema = z.object({
	formatLabel: z.string(),
	formattedSize: z.string(),
	formattedVertexCount: z.string(),
	formattedFaceCount: z.string(),
	complexityLevel: z.enum(['low', 'medium', 'high', 'ultra']),
	qualityScore: z.number().min(0).max(100),
	isLargeModel: z.boolean(),
	hasOptimizations: z.boolean(),
	renderPreviewUrl: z.string().nullable(),
});

/**
 * 🎯 Esquema para archivo 3D con estadísticas.
 */
export const file3dWithStatsSchema = file3dBaseSchema.extend({
	stats: file3dStatisticsSchema,
});

/**
 * 🆕 Esquema para crear archivos 3D.
 */
export const file3dCreateSchema = file3dBaseSchema.omit({
	id: true,
	createdAt: true,
	updatedAt: true,
});

/**
 * ✏️ Esquema para actualizar archivos 3D.
 */
export const file3dUpdateSchema = file3dCreateSchema.partial();

/**
 * 🔍 Esquema para búsqueda de archivos 3D.
 */
export const file3dSearchSchema = z.object({
	query: z.string().optional(),
	format: z.array(z.string()).optional(),
	folderId: z.string().uuid().optional(),
	hasAnimations: z.boolean().optional(),
	hasTextures: z.boolean().optional(),
	hasMaterials: z.boolean().optional(),
	isOptimized: z.boolean().optional(),
	minSize: z.number().int().min(0).optional(),
	maxSize: z.number().int().min(0).optional(),
	minVertexCount: z.number().int().min(0).optional(),
	maxVertexCount: z.number().int().min(0).optional(),
	complexityLevel: z.array(z.enum(['low', 'medium', 'high', 'ultra'])).optional(),
	dateFrom: z.date().optional(),
	dateTo: z.date().optional(),
});

// Tipos inferidos desde esquemas Zod
export type File3DBase = z.infer<typeof file3dBaseSchema>;
export type File3DStatistics = z.infer<typeof file3dStatisticsSchema>;
export type File3DWithStats = z.infer<typeof file3dWithStatsSchema>;
export type File3DCreateInput = z.infer<typeof file3dCreateSchema>;
export type File3DUpdateInput = z.infer<typeof file3dUpdateSchema>;
export type File3DSearchInput = z.infer<typeof file3dSearchSchema>;
