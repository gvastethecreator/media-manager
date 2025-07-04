/**
 * @file Validadores Zod para la entidad Document.
 * @module transformers/document/validators
 * @description Esquemas de validación para Document usando Zod.
 * ✅ MIGRADO A DRIZZLE - Enero 2025
 */

import { z } from 'zod';

/**
 * 📄 Esquema base para validar documentos.
 */
export const documentBaseSchema = z.object({
	id: z.string().uuid('ID debe ser un UUID válido'),
	name: z.string().min(1, 'Nombre es requerido').max(255, 'Nombre muy largo'),
	path: z.string().min(1, 'Ruta es requerida'),
	size: z.number().int().min(0, 'Tamaño debe ser positivo'),
	hash: z.string().min(1, 'Hash es requerido'),
	mimeType: z.string().min(1, 'Tipo MIME es requerido'),
	extension: z.string().min(1, 'Extensión es requerida'),
	folderId: z.string().uuid('ID de carpeta debe ser UUID válido'),
	isFavorite: z.boolean(),
	isArchived: z.boolean(),
	pageCount: z.number().int().min(0).nullable(),
	wordCount: z.number().int().min(0).nullable(),
	language: z.string().nullable(),
	title: z.string().nullable(),
	author: z.string().nullable(),
	subject: z.string().nullable(),
	keywords: z.string().nullable(),
	creator: z.string().nullable(),
	producer: z.string().nullable(),
	creationDate: z.date().nullable(),
	modificationDate: z.date().nullable(),
	encrypted: z.boolean().nullable(),
	version: z.string().nullable(),
	content: z.string().nullable(),
	summary: z.string().nullable(),
	createdAt: z.date(),
	updatedAt: z.date(),
});

/**
 * 📊 Esquema para estadísticas de documentos.
 */
export const documentStatisticsSchema = z.object({
	wordCount: z.number().int().min(0),
	charCount: z.number().int().min(0),
	readingTime: z.number().int().min(0),
	versionCount: z.number().int().min(0),
});

/**
 * 📄 Esquema para documento con estadísticas.
 */
export const documentWithStatsSchema = documentBaseSchema.extend({
	stats: documentStatisticsSchema,
});

/**
 * 🆕 Esquema para crear documentos.
 */
export const documentCreateSchema = documentBaseSchema.omit({
	id: true,
	createdAt: true,
	updatedAt: true,
});

/**
 * ✏️ Esquema para actualizar documentos.
 */
export const documentUpdateSchema = documentCreateSchema.partial();

/**
 * 🔍 Esquema para búsqueda de documentos.
 */
export const documentSearchSchema = z.object({
	query: z.string().optional(),
	folderId: z.string().uuid().optional(),
	mimeType: z.string().optional(),
	author: z.string().optional(),
	language: z.string().optional(),
	isFavorite: z.boolean().optional(),
	isArchived: z.boolean().optional(),
	minSize: z.number().int().min(0).optional(),
	maxSize: z.number().int().min(0).optional(),
	minWordCount: z.number().int().min(0).optional(),
	maxWordCount: z.number().int().min(0).optional(),
	dateFrom: z.date().optional(),
	dateTo: z.date().optional(),
});

// Tipos inferidos desde esquemas Zod
export type DocumentBase = z.infer<typeof documentBaseSchema>;
export type DocumentStatistics = z.infer<typeof documentStatisticsSchema>;
export type DocumentWithStats = z.infer<typeof documentWithStatsSchema>;
export type DocumentCreateInput = z.infer<typeof documentCreateSchema>;
export type DocumentUpdateInput = z.infer<typeof documentUpdateSchema>;
export type DocumentSearchInput = z.infer<typeof documentSearchSchema>;
