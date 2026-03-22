/**
 * @file Tipos para archivos cargados
 * @module types/uploaded-files
 */

import { z } from 'zod';
import type { EntityId, JSONString } from '@/lib/utils/types/utility-types';
import { UploadedImageType as EntityUploadedImageType } from './entities/uploaded-image';
import type { MediaMetadata } from './metadata.types';

/**
 * Estado de carga de archivo
 */
export const UploadStatus = {
	PENDING: 'pending',
	UPLOADING: 'uploading',
	PROCESSING: 'processing',
	COMPLETE: 'complete',
	ERROR: 'error',
} as const;
export type UploadStatus = (typeof UploadStatus)[keyof typeof UploadStatus];

/**
 * Tipo de archivo subido
 */
export const UploadedFileType = {
	IMAGE: 'image',
	VIDEO: 'video',
	AUDIO: 'audio',
	DOCUMENT: 'document',
	OTHER: 'other',
} as const;
export type UploadedFileType = (typeof UploadedFileType)[keyof typeof UploadedFileType];

// Re-export the entity type for backwards compatibility
export type UploadedImageType = EntityUploadedImageType;

/**
 * Interfaz para archivo subido
 */
export interface UploadedFile {
	error?: string;
	id: EntityId;
	metadata: JSONString<MediaMetadata>;
	mimeType: string;
	name: string;
	originalName: string;
	path: string;
	progress: number;
	size: number;
	status: UploadStatus;
	type: UploadedFileType;
	uploadedAt: Date;
	userId: EntityId;
}

/**
 * Opciones de carga
 */
export interface UploadOptions {
	allowedTypes?: UploadedFileType[];
	batch?: boolean;
	destination?: string;
	generateThumbnails?: boolean;
	maxSize?: number;
	overwrite?: boolean;
	processMetadata?: boolean;
}

/**
 * Resultado de carga
 */
export interface UploadResult {
	error?: string;
	file?: UploadedFile;
	success: boolean;
}

/**
 * Estado de carga múltiple
 */
export interface BatchUploadState {
	completed: number;
	errors: Map<string, string>;
	failed: number;
	files: Map<string, UploadedFile>;
	inProgress: number;
	total: number;
}

// Validaciones Zod
export const uploadStatusSchema = z.enum([
	UploadStatus.PENDING,
	UploadStatus.UPLOADING,
	UploadStatus.PROCESSING,
	UploadStatus.COMPLETE,
	UploadStatus.ERROR,
]);
export const uploadedFileTypeSchema = z.enum([
	UploadedFileType.IMAGE,
	UploadedFileType.VIDEO,
	UploadedFileType.AUDIO,
	UploadedFileType.DOCUMENT,
	UploadedFileType.OTHER,
]);

export const uploadedFileSchema = z.object({
	id: z.string(),
	name: z.string(),
	originalName: z.string(),
	path: z.string(),
	type: uploadedFileTypeSchema,
	mimeType: z.string(),
	size: z.number().positive(),
	status: uploadStatusSchema,
	progress: z.number().min(0).max(100),
	error: z.string().optional(),
	metadata: z.string(),
	uploadedAt: z.date(),
	userId: z.string(),
});

export const uploadOptionsSchema = z.object({
	generateThumbnails: z.boolean().optional(),
	processMetadata: z.boolean().optional(),
	allowedTypes: z.array(uploadedFileTypeSchema).optional(),
	maxSize: z.number().positive().optional(),
	destination: z.string().optional(),
	overwrite: z.boolean().optional(),
	batch: z.boolean().optional(),
});

export const uploadResultSchema = z.object({
	success: z.boolean(),
	file: uploadedFileSchema.optional(),
	error: z.string().optional(),
});

/**
 * Metadata for uploaded images
 */
export interface UploadedImageMetadata {
	compression?: number;
	format?: string;
	hash?: string;
	mimeType?: string;
	originalName?: string;
	originalPath?: string;
	quality?: number;
	[key: string]: unknown;
}

/**
 * Dimensions with aspect ratio
 */
export interface UploadedImageDimensions {
	aspectRatio: number;
	height: number;
	width: number;
}

/**
 * Stats for uploaded images
 */
export interface UploadedImageStats {
	averageSize: number;
	byType: Record<UploadedImageType, number>;
	total: number;
	totalSize: number;
}

/**
 * Filters for querying uploaded images
 */
export interface UploadedImageFilters {
	category?: string;
	maxHeight?: number;
	maxSize?: number;
	maxWidth?: number;
	minHeight?: number;
	minSize?: number;
	minWidth?: number;
	page?: number;
	pageSize?: number;
	search?: string;
	sortBy?: 'createdAt' | 'name' | 'size' | 'type';
	sortOrder?: 'asc' | 'desc';
	type?: UploadedImageType;
}

/**
 * Result type for a single uploaded image
 */
export interface UploadedImageResult {
	category: string;
	createdAt: Date;
	dimensions: UploadedImageDimensions;
	hash: string;
	height: number;
	id: string;
	imageId: string;
	metadata: UploadedImageMetadata | null;
	name: string;
	path: string;
	size: number;
	thumbnailUrl?: string;
	type: UploadedImageType;
	updatedAt: Date;
	url: string;
	width: number;
}

/**
 * Paginated list of uploaded images with stats
 */
export interface UploadedImageResults {
	items: UploadedImageResult[];
	page: number;
	pageSize: number;
	stats: UploadedImageStats;
	total: number;
}

export interface UploadedImageFile extends Partial<File> {
	path: string;
	size: number;
}

export interface CreateUploadedImageParams {
	category: string;
	dimensions: UploadedImageDimensions;
	file: UploadedImageFile;
	hash?: string;
	imageId?: string;
	metadata?: UploadedImageMetadata;
	name: string;
	processingOptions?: UploadedImageProcessingOptions;
	type: UploadedImageType;
}

export interface UpdateUploadedImageParams {
	category?: string;
	dimensions?: UploadedImageDimensions;
	file?: UploadedImageFile;
	hash?: string;
	id: string;
	imageId?: string;
	metadata?: UploadedImageMetadata;
	name?: string;
	processingOptions?: UploadedImageProcessingOptions;
	type?: UploadedImageType;
}

export interface GetUploadedImagesParams {
	filters?: UploadedImageFilters;
	includeDimensions?: boolean;
	includeThumbnails?: boolean;
	targetDimensions?: UploadedImageDimensions;
}

export interface UploadedImageEvents {
	IMAGE_CREATED: string;
	IMAGE_DELETED: string;
	IMAGE_UPDATED: string;
	IMAGES_CHANGED: string;
}

export const UPLOADED_IMAGE_EVENTS: UploadedImageEvents = {
	IMAGE_CREATED: 'uploaded-image:created',
	IMAGE_UPDATED: 'uploaded-image:updated',
	IMAGE_DELETED: 'uploaded-image:deleted',
	IMAGES_CHANGED: 'uploaded-images:changed',
};

export interface UploadedImageProcessingOptions {
	background?: string;
	fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
	format?: 'jpeg' | 'png' | 'webp';
	height?: number;
	optimizationLevel?: number;
	position?: 'center' | 'top' | 'right top' | 'right' | 'right bottom' | 'bottom' | 'left bottom' | 'left' | 'left top';
	progressive?: boolean;
	quality?: number;
	width?: number;
	withoutEnlargement?: boolean;
}

// Tipos inferidos
export type UploadedFileValidated = z.infer<typeof uploadedFileSchema>;
export type UploadOptionsValidated = z.infer<typeof uploadOptionsSchema>;
export type UploadResultValidated = z.infer<typeof uploadResultSchema>;
