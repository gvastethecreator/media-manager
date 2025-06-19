/**
 * @file Tipos unificados para metadatos
 * @module types/metadata
 */

import { z } from 'zod';

/**
 * Metadatos base que comparten todas las entidades
 */
export interface BaseMetadata {
	totalSize: number;
	itemCount: number;
	lastModified: Date;
	customFields?: Record<string, unknown>;
}

/**
 * Metadatos de localización
 */
export interface LocationMetadata {
	name: string;
	latitude: number;
	longitude: number;
	count: number;
}

/**
 * Metadatos específicos de archivos
 */
export interface FileMetadata extends BaseMetadata {
	format: string;
	width?: number;
	height?: number;
	duration?: number;
	fileSize: number;
	mimeType: string;
	encoding?: string;
	hash?: string;
}

/**
 * Metadatos de IA
 */
export interface AIMetadata {
	model?: string;
	prompt?: string;
	negativePrompt?: string;
	seed?: number;
	samplingSteps?: number;
	cfgScale?: number;
	samplingMethod?: string;
	extraParameters?: Record<string, unknown>;
}

/**
 * Metadatos EXIF
 */
export interface ExifMetadata {
	make?: string;
	model?: string;
	exposureTime?: string | number;
	fNumber?: number;
	iso?: number;
	focalLength?: string | number;
	lensModel?: string;
	dateTimeOriginal?: string;
	gpsLatitude?: number;
	gpsLongitude?: number;
	orientation?: number;
}

/**
 * Metadatos completos para imágenes/videos
 */
export interface MediaMetadata extends FileMetadata {
	exif?: ExifMetadata;
	iptc?: Record<string, unknown>;
	xmp?: Record<string, unknown>;
	icc?: Record<string, unknown>;
	ai?: AIMetadata;
	gps?: {
		latitude?: number;
		longitude?: number;
		altitude?: number;
	};
	// Propiedades adicionales para compatibilidad
	colorSpace?: string;
	colorProfile?: string;
	hasAlpha?: boolean;
	orientation?: number;
	density?: number;
	isAnimated?: boolean;
	sizeInBytes?: number;
	dimensions?: {
		width: number;
		height: number;
	};
	lastModified?: Date;
}

// Validadores Zod
export const locationMetadataSchema = z.object({
	name: z.string(),
	latitude: z.number(),
	longitude: z.number(),
	count: z.number().int().min(1),
});

export const baseMetadataSchema = z.object({
	totalSize: z.number().min(0),
	itemCount: z.number().int().min(0),
	lastModified: z.date(),
	customFields: z.record(z.unknown()).optional(),
});

export const fileMetadataSchema = baseMetadataSchema.extend({
	format: z.string(),
	width: z.number().int().positive().optional(),
	height: z.number().int().positive().optional(),
	duration: z.number().positive().optional(),
	fileSize: z.number().positive(),
	mimeType: z.string(),
	encoding: z.string().optional(),
	hash: z.string().optional(),
});

export const aiMetadataSchema = z.object({
	model: z.string().optional(),
	prompt: z.string().optional(),
	negativePrompt: z.string().optional(),
	seed: z.number().int().optional(),
	samplingSteps: z.number().int().positive().optional(),
	cfgScale: z.number().positive().optional(),
	samplingMethod: z.string().optional(),
	extraParameters: z.record(z.unknown()).optional(),
});

export const exifMetadataSchema = z
	.object({
		make: z.string().optional(),
		model: z.string().optional(),
		exposureTime: z.union([z.string(), z.number()]).optional(),
		fNumber: z.number().optional(),
		iso: z.number().int().optional(),
		focalLength: z.union([z.string(), z.number()]).optional(),
		lensModel: z.string().optional(),
		dateTimeOriginal: z.string().optional(),
		gpsLatitude: z.number().optional(),
		gpsLongitude: z.number().optional(),
		orientation: z.number().int().min(1).max(8).optional(),
	})
	.catchall(z.unknown());

export const mediaMetadataSchema = fileMetadataSchema.extend({
	exif: exifMetadataSchema.optional(),
	iptc: z.record(z.unknown()).optional(),
	xmp: z.record(z.unknown()).optional(),
	icc: z.record(z.unknown()).optional(),
	ai: aiMetadataSchema.optional(),
});

// Tipos inferidos
export type LocationMetadataValidated = z.infer<typeof locationMetadataSchema>;
export type BaseMetadataValidated = z.infer<typeof baseMetadataSchema>;
export type FileMetadataValidated = z.infer<typeof fileMetadataSchema>;
export type AIMetadataValidated = z.infer<typeof aiMetadataSchema>;
export type ExifMetadataValidated = z.infer<typeof exifMetadataSchema>;
export type MediaMetadataValidated = z.infer<typeof mediaMetadataSchema>;
