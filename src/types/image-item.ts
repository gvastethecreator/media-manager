/**
 * @file Tipos específicos para imágenes
 * @module types/image-item
 */

import type { JSONString } from '@/utils/types/utility-types';
import { z } from 'zod';
import type { MediaMetadata } from './metadata.types';
import type { BaseEntity } from './store.types';

/**
 * Estado de procesamiento de imagen
 */
export enum ImageProcessingStatus {
    PENDING = 'pending',
    PROCESSING = 'processing',
    OPTIMIZING = 'optimizing',
    GENERATING_THUMBNAILS = 'generating-thumbnails',
    EXTRACTING_METADATA = 'extracting-metadata',
    COMPLETE = 'complete',
    ERROR = 'error'
}

/**
 * Calidad de imagen
 */
export enum ImageQuality {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
    ORIGINAL = 'original'
}

/**
 * Formato de imagen
 */
export enum ImageFormat {
    JPEG = 'jpeg',
    PNG = 'png',
    WEBP = 'webp',
    AVIF = 'avif',
    GIF = 'gif'
}

/**
 * Interfaz base para imágenes
 */
export interface ImageItem extends BaseEntity {
    name: string;
    path: string;
    originalPath: string;
    format: ImageFormat;
    width: number;
    height: number;
    size: number;
    mimeType: string;
    hash: string;
    metadata: JSONString<MediaMetadata>;
    status: ImageProcessingStatus;
    quality: ImageQuality;
    optimized: boolean;
    hasThumbnails: boolean;
    isFavorite: boolean;
    isPublic: boolean;
    uploadedAt: Date;
    processingError?: string;
}

/**
 * Opciones de procesamiento de imagen
 */
export interface ImageProcessingOptions {
    format?: ImageFormat;
    quality?: ImageQuality;
    width?: number;
    height?: number;
    optimize?: boolean;
    strip?: boolean;
    generateThumbnails?: boolean;
    extractMetadata?: boolean;
}

/**
 * Resultado de procesamiento
 */
export interface ImageProcessingResult {
    success: boolean;
    image?: ImageItem;
    error?: string;
    processingTime?: number;
}

// Validaciones Zod
export const imageProcessingStatusSchema = z.nativeEnum(ImageProcessingStatus);
export const imageQualitySchema = z.nativeEnum(ImageQuality);
export const imageFormatSchema = z.nativeEnum(ImageFormat);

export const imageItemSchema = z.object({
    id: z.string(),
    name: z.string(),
    path: z.string(),
    originalPath: z.string(),
    format: imageFormatSchema,
    width: z.number().positive(),
    height: z.number().positive(),
    size: z.number().positive(),
    mimeType: z.string(),
    hash: z.string(),
    metadata: z.string(),
    status: imageProcessingStatusSchema,
    quality: imageQualitySchema,
    optimized: z.boolean(),
    hasThumbnails: z.boolean(),
    isFavorite: z.boolean(),
    isPublic: z.boolean(),
    uploadedAt: z.date(),
    processingError: z.string().optional(),
    createdAt: z.date(),
    updatedAt: z.date()
});

export const imageProcessingOptionsSchema = z.object({
    format: imageFormatSchema.optional(),
    quality: imageQualitySchema.optional(),
    width: z.number().positive().optional(),
    height: z.number().positive().optional(),
    optimize: z.boolean().optional(),
    strip: z.boolean().optional(),
    generateThumbnails: z.boolean().optional(),
    extractMetadata: z.boolean().optional()
});

export const imageProcessingResultSchema = z.object({
    success: z.boolean(),
    image: imageItemSchema.optional(),
    error: z.string().optional(),
    processingTime: z.number().optional()
});

// Tipos inferidos
export type ImageItemValidated = z.infer<typeof imageItemSchema>;
export type ImageProcessingOptionsValidated = z.infer<typeof imageProcessingOptionsSchema>;
export type ImageProcessingResultValidated = z.infer<typeof imageProcessingResultSchema>;
