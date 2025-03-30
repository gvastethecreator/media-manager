/**
 * @file Definición de tipos para acciones relacionadas con imágenes
 * @module app/actions/images/image-types
 */

import type {
    CreateImageData,
    ImageBase,
    ImageExtended
} from '@/types/entities/image';
import type { ImageResult } from '@/types/entities/image/transformer';

/**
 * Re-exportamos los tipos principales desde el módulo de tipos
 */
export type { CreateImageData, ImageBase, ImageExtended, ImageResult };

/**
 * Datos de entrada para crear una imagen
 */
export type CreateImageInput = {
	name: string;
	path: string;
	size: number;
	width: number;
	height: number;
	hash: string;
	folderId: string;
	metadata?: Record<string, unknown>;
	isPublic?: boolean;
};

/**
 * Opciones para el procesamiento de imágenes
 */
export type ImageProcessingOptions = {
	quality?: number;
	width?: number;
	height?: number;
	format?: 'webp' | 'jpeg' | 'png';
	fit?: 'cover' | 'contain' | 'inside' | 'outside';
};

/**
 * Opciones para obtener imágenes
 */
export type GetImagesOptions = {
	page?: number;
	pageSize?: number;
	sortBy?: string;
	sortOrder?: 'asc' | 'desc';
	folderId?: string;
	tagIds?: string[];
	collectionIds?: string[];
	isFavorite?: boolean;
	isPublic?: boolean;
	search?: string;
};

/**
 * Resultado de la operación de obtener imágenes
 */
export type GetImagesResult = {
	images: ImageResult[];
	total: number;
	page: number;
	pageSize: number;
};

/**
 * Resultado de estadísticas de miniaturas
 */
export type ThumbnailStatsResult = {
	total: number;
	withThumbnail: number;
	withError: number;
	optimized: number;
	averageSize: number;
};

/**
 * Resultado del reprocesamiento de miniaturas
 */
export type ReprocessThumbnailsResult = {
	processed: number;
	errors: number;
	totalTime: number;
};

/**
 * Resultado de la limpieza de miniaturas
 */
export type CleanupThumbnailsResult = {
	cleaned: number;
	errors: number;
	totalSize: number;
};
