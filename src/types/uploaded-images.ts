import type { UploadedImageType } from '@/types/entities/entities';

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

export interface UploadedImageDimensions {
	width: number;
	height: number;
	aspectRatio: number;
}

export interface UploadedImageStats {
	total: number;
	byType: Record<UploadedImageType, number>;
	totalSize: number;
	averageSize: number;
}

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

export interface UploadedImageResult {
	id: string;
	name: string;
	path: string;
	type: UploadedImageType;
	category: string;
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
