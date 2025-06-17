/**
 * @file Tipos para archivos cargados
 * @module types/uploaded-files
 */

import { z } from 'zod';
import type { EntityId, JSONString } from '@/utils/types/utility-types';
import type { UploadedImageType as EntityUploadedImageType } from './entities/uploaded-image';
import type { MediaMetadata } from './metadata.types';

/**
 * Estado de carga de archivo
 */
export enum UploadStatus {
	PENDING = 'pending',
	UPLOADING = 'uploading',
	PROCESSING = 'processing',
	COMPLETE = 'complete',
	ERROR = 'error',
}

/**
 * Tipo de archivo subido
 */
export enum UploadedFileType {
	IMAGE = 'image',
	VIDEO = 'video',
	AUDIO = 'audio',
	DOCUMENT = 'document',
	OTHER = 'other',
}

// Re-export the entity type for backwards compatibility
export type UploadedImageType = EntityUploadedImageType;

/**
 * Interfaz para archivo subido
 */
export interface UploadedFile {
	id: EntityId;
	name: string;
	originalName: string;
	path: string;
	type: UploadedFileType;
	mimeType: string;
	size: number;
	status: UploadStatus;
	progress: number;
	error?: string;
	metadata: JSONString<MediaMetadata>;
	uploadedAt: Date;
	userId: EntityId;
}

/**
 * Opciones de carga
 */
export interface UploadOptions {
	generateThumbnails?: boolean;
	processMetadata?: boolean;
	allowedTypes?: UploadedFileType[];
	maxSize?: number;
	destination?: string;
	overwrite?: boolean;
	batch?: boolean;
}

/**
 * Resultado de carga
 */
export interface UploadResult {
	success: boolean;
	file?: UploadedFile;
	error?: string;
}

/**
 * Estado de carga múltiple
 */
export interface BatchUploadState {
	total: number;
	completed: number;
	failed: number;
	inProgress: number;
	files: Map<string, UploadedFile>;
	errors: Map<string, string>;
}

// Validaciones Zod
export const uploadStatusSchema = z.nativeEnum(UploadStatus);
export const uploadedFileTypeSchema = z.nativeEnum(UploadedFileType);

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
	mimeType?: string;
	format?: string;
	quality?: number;
	compression?: number;
	originalName?: string;
	originalPath?: string;
	hash?: string;
	[key: string]: unknown;
}

/**
 * Dimensions with aspect ratio
 */
export interface UploadedImageDimensions {
	width: number;
	height: number;
	aspectRatio: number;
}

/**
 * Stats for uploaded images
 */
export interface UploadedImageStats {
	total: number;
	byType: Record<UploadedImageType, number>;
	totalSize: number;
	averageSize: number;
}

/**
 * Filters for querying uploaded images
 */
export interface UploadedImageFilters {
	type?: UploadedImageType;
	category?: string;
	minWidth?: number;
	maxWidth?: number;
	minHeight?: number;
	maxHeight?: number;
	minSize?: number;
	maxSize?: number;
	search?: string;
	sortBy?: 'createdAt' | 'name' | 'size' | 'type';
	sortOrder?: 'asc' | 'desc';
	page?: number;
	pageSize?: number;
}

/**
 * Result type for a single uploaded image
 */
export interface UploadedImageResult {
	id: string;
	name: string;
	path: string;
	type: UploadedImageType;
	category: string;
	hash: string;
	imageId: string;
	size: number;
	width: number;
	height: number;
	metadata: UploadedImageMetadata | null;
	dimensions: UploadedImageDimensions;
	url: string;
	thumbnailUrl?: string;
	createdAt: Date;
	updatedAt: Date;
}

/**
 * Paginated list of uploaded images with stats
 */
export interface UploadedImageResults {
	items: UploadedImageResult[];
	total: number;
	page: number;
	pageSize: number;
	stats: UploadedImageStats;
}

export interface UploadedImageFile extends Partial<File> {
	path: string;
	size: number;
}

export interface CreateUploadedImageParams {
	name: string;
	type: UploadedImageType;
	category: string;
	file: UploadedImageFile;
	dimensions: UploadedImageDimensions;
	metadata?: UploadedImageMetadata;
	hash?: string;
	imageId?: string;
	processingOptions?: UploadedImageProcessingOptions;
}

export interface UpdateUploadedImageParams {
	id: string;
	name?: string;
	type?: UploadedImageType;
	category?: string;
	file?: UploadedImageFile;
	dimensions?: UploadedImageDimensions;
	metadata?: UploadedImageMetadata;
	hash?: string;
	imageId?: string;
	processingOptions?: UploadedImageProcessingOptions;
}

export interface GetUploadedImagesParams {
	filters?: UploadedImageFilters;
	includeDimensions?: boolean;
	includeThumbnails?: boolean;
	targetDimensions?: UploadedImageDimensions;
}

export interface UploadedImageEvents {
	IMAGE_CREATED: string;
	IMAGE_UPDATED: string;
	IMAGE_DELETED: string;
	IMAGES_CHANGED: string;
}

export const UPLOADED_IMAGE_EVENTS: UploadedImageEvents = {
	IMAGE_CREATED: 'uploaded-image:created',
	IMAGE_UPDATED: 'uploaded-image:updated',
	IMAGE_DELETED: 'uploaded-image:deleted',
	IMAGES_CHANGED: 'uploaded-images:changed',
};

export interface UploadedImageProcessingOptions {
	width?: number;
	height?: number;
	quality?: number;
	format?: 'jpeg' | 'png' | 'webp';
	fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
	position?: 'center' | 'top' | 'right top' | 'right' | 'right bottom' | 'bottom' | 'left bottom' | 'left' | 'left top';
	background?: string;
	withoutEnlargement?: boolean;
	progressive?: boolean;
	optimizationLevel?: number;
}

// Tipos inferidos
export type UploadedFileValidated = z.infer<typeof uploadedFileSchema>;
export type UploadOptionsValidated = z.infer<typeof uploadOptionsSchema>;
export type UploadResultValidated = z.infer<typeof uploadResultSchema>;
