/**
 * @file Tipos del servicio de imágenes
 * @module services/image/types
 */

import type { ImageWithStats } from '@/types/entities/image/types';

export interface GetImagesOptions {
	folderId?: string;
	limit?: number;
	offset?: number;
	search?: string;
	sortBy?: string;
	sortOrder?: 'asc' | 'desc';
	tagIds?: string[];
	isFavorite?: boolean;
	pageSize?: number;
	page?: number;
}

export interface GetImagesResult {
	images: ImageWithStats[];
	total: number;
	hasMore: boolean;
	pagination?: {
		page: number;
		pageSize: number;
		total: number;
		totalPages: number;
		hasNext: boolean;
		hasPrev: boolean;
	};
}

export type CreateImageInput = {
	name: string;
	path: string;
	size: number;
	width: number;
	height: number;
	hash: string;
	folderId: string;
	metadata?: Record<string, string | number | boolean | string[] | null | undefined>;
};

export type ImageProcessingOptions = {
	quality?: number;
	width?: number;
	height?: number;
	format?: 'webp' | 'jpeg' | 'png';
	fit?: 'cover' | 'contain' | 'inside' | 'outside';
	type?: string;
};
