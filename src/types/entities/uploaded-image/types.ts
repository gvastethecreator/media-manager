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
	category: string | null;
	createdAt: Date;
	hash: string;
	height: number | null;
	id: string;
	imageId: string;
	isFavorite: boolean;
	metadata: string | null;
	name: string;
	path: string;
	size: number;
	type: string | null;
	updatedAt: Date;
	width: number | null;
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
	aspectRatio: number;
	height: number;
	width: number;
}

import { EntityStats } from '../entity.types';

/**
 * Estadísticas de imagen subida
 */
export interface UploadedImageStatistics extends EntityStats {
	lastAccessed: string;
	processingTime?: number;
	totalViews: number;
}

/**
 * Versión extendida con dimensiones y estadísticas
 */
export interface UploadedImageExtended extends UploadedImageBase {
	dimensions: UploadedImageDimensions;
	stats?: UploadedImageStatistics;
	thumbnailUrl?: string;
	uploadedAt: Date;
	url: string;
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
