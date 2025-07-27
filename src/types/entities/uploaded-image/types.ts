/**
 * @file Tipos canónicos para la entidad UploadedImage
 * @module types/entities/uploaded-image/types
 * @description Estructura unificada y validada para UploadedImage.
 * Última migración: 2025-06-18
 */

import { z } from 'zod';

/**
 * Enum para el tipo de archivo subido
 */
export enum UploadedFileType {
	IMAGE = 'image',
	VIDEO = 'video',
	AUDIO = 'audio',
	DOCUMENT = 'document',
	OTHER = 'other',
}

/**
 * Interfaz base canónica para UploadedImage
 */
export interface UploadedImageBase {
	id: string;
	name: string;
	path: string;
	size: number;
	hash: string;
	metadata: string | null;
	imageId: string;
	type: string | null;
	category: string | null;
	width: number | null;
	height: number | null;
	isFavorite: boolean;
	createdAt: Date;
	updatedAt: Date;
}

/**
 * Input para creación
 */
export type UploadedImageCreateInput = Omit<UploadedImageBase, 'id' | 'createdAt' | 'updatedAt' | 'hash' | 'imageId'>;

/**
 * Input para actualización
 */
export type UploadedImageUpdateInput = Partial<
	Omit<UploadedImageBase, 'id' | 'createdAt' | 'updatedAt' | 'hash' | 'imageId'>
>;

/**
 * Dimensiones de imagen
 */
export interface UploadedImageDimensions {
	width: number;
	height: number;
	aspectRatio: number;
}

/**
 * Estadísticas de imagen subida
 */
export interface UploadedImageStatistics {
	totalViews: number;
	lastAccessed: string;
	processingTime?: number;
}

/**
 * Versión extendida con dimensiones y estadísticas
 */
export interface UploadedImageExtended extends UploadedImageBase {
	uploadedAt: Date;
	dimensions: UploadedImageDimensions;
	url: string;
	thumbnailUrl?: string;
	stats?: UploadedImageStatistics;
}

/**
 * Versión con estadísticas calculadas
 */
export interface UploadedImageWithStats extends UploadedImageExtended {
	entityType: 'uploaded-image';
	stats: UploadedImageStatistics;
}

/**
 * Esquema Zod para validación de UploadedImage
 */
export const UploadedImageSchema = z.object({
	id: z.string(),
	name: z.string(),
	path: z.string(),
	type: z.nativeEnum(UploadedFileType),
	category: z.string(),
	hash: z.string(),
	imageId: z.string(),
	size: z.number(),
	width: z.number(),
	height: z.number(),
	isFavorite: z.boolean(),
	metadata: z.string().nullable().optional(),
	uploadedAt: z.date(),
	createdAt: z.date(),
	updatedAt: z.date(),
});

/**
 * Alias para compatibilidad - UploadedImageComplete
 */
export type UploadedImageComplete = UploadedImageWithStats;

// 🟢 Documentación:
// - Usar solo estos tipos en transformers, server actions y validaciones.
// - Validar siempre con UploadedImageSchema antes de persistir.
