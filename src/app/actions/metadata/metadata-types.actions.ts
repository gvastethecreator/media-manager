/**
 * @file Acciones para tipos de metadatos
 * @module app/actions/metadata/metadata-types
 * ✅ MIGRADO A DRIZZLE - Sin dependencias de Prisma
 */

'use server';

// Tipo local para Image (equivalente a Drizzle)
type DrizzleImage = {
	id: string;
	name: string | null;
	path: string;
	size: number;
	width: number | null;
	height: number | null;
	metadata: string | null;
	thumbnail: Buffer | null;
	thumbnailSize: number | null;
	thumbnailWidth: number | null;
	thumbnailHeight: number | null;
	thumbnailError: string | null;
	thumbnailErrorAt: Date | null;
	thumbnailOptimizedAt: Date | null;
	isFavorite: boolean;
	folderId: string | null;
	addedAt: Date;
	createdAt: Date;
	updatedAt: Date;
};

import { serverLogger } from '@/lib/logger/server-logger';

const metadataLogger = serverLogger.withContext('MetadataTypesActions');

/**
 * Obtiene los tipos de metadatos disponibles para una imagen
 */
export async function getAvailableMetadataTypes(imageId: string): Promise<string[]> {
	try {
		metadataLogger.info('Obteniendo tipos de metadatos disponibles', { imageId });
		// TODO: Implementar con Drizzle cuando esté disponible
		return ['exif', 'iptc', 'xmp'];
	} catch (error) {
		metadataLogger.error('Error al obtener tipos de metadatos', { error, imageId });
		throw new Error('No se pudieron obtener los tipos de metadatos');
	}
}

/**
 * Valida si un tipo de metadato es soportado
 */
export async function validateMetadataType(type: string): Promise<boolean> {
	try {
		const supportedTypes = ['exif', 'iptc', 'xmp', 'custom'];
		return supportedTypes.includes(type.toLowerCase());
	} catch (error) {
		metadataLogger.error('Error al validar tipo de metadato', { error, type });
		return false;
	}
}

// Configuración de retry
export interface RetryConfig {
	maxAttempts: number;
	initialDelay: number;
	maxDelay: number;
	backoffFactor: number;
	jitter: boolean;
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
	maxAttempts: 3,
	initialDelay: 100,
	maxDelay: 1000,
	backoffFactor: 2,
	jitter: true,
};

// Configuraciones específicas
export const METADATA_RETRY_CONFIG: RetryConfig = {
	...DEFAULT_RETRY_CONFIG,
	maxAttempts: 5,
	maxDelay: 2000,
	backoffFactor: 1.5,
};

// Tipos auxiliares para ExifReader
export interface ExifTag {
	id: number;
	value: unknown;
	description: string;
}

export interface ExifTags {
	[key: string]: ExifTag | ExifTags;
}

// Aliasing del tipo de formato de Sharp para evitar conflictos
export type SharpFormatEnum = keyof sharp.FormatEnum;
export type SharpColourspaceEnum = keyof sharp.ColourspaceEnum;

// Tipos para los formatos de archivo
// Definición más restrictiva para evitar conflictos con los tipos de Sharp
export type ImageFormat = 'jpeg' | 'png' | 'gif' | 'webp' | 'tiff' | 'svg' | 'avif' | 'jpg' | 'tif' | 'bmp' | 'unknown';

// Tipos para la extracción de metadata
export interface MetadataOptions {
	skipExif?: boolean;
	skipSharp?: boolean;
	skipParser?: boolean;
	skipIptc?: boolean;
	skipXmp?: boolean;
	retry?: RetryConfig;
}

// ELIMINADO: ExtendedFileMetadata - Usar directamente FileMetadata con campos adicionales según sea necesario

// Interfaz para manejar metadatos de cámara y ubicación
export interface MetadataWithCamera extends Partial<FileMetadata> {
	camera?: {
		make?: string;
		model?: string;
	};
	location?: {
		latitude: number;
		longitude: number;
		altitude?: number;
	};
	captureDate?: string;
}

// Otras interfaces y tipos exportados
export type { AIMetadata, FileMetadata };

// Tipos para las operaciones de metadatos
export type ImageMetadata = {
	format?: string;
	colorSpace?: string;
	hasAlpha?: boolean;
	orientation?: number;
	exif?: {
		make?: string;
		model?: string;
		exposureTime?: string;
		fNumber?: number;
		iso?: number;
		focalLength?: string;
		lensModel?: string;
		dateTimeOriginal?: string;
		gpsLatitude?: number;
		gpsLongitude?: number;
	};
};

export type ImageWithMetadata = Image & {
	parsedMetadata?: ImageMetadata;
};

export type UpdateMetadataInput = {
	format?: string;
	width?: number;
	height?: number;
	size?: number;
	colorSpace?: string;
	hasAlpha?: boolean;
	orientation?: number;
	exif?: {
		make?: string;
		model?: string;
		exposureTime?: string;
		fNumber?: number;
		iso?: number;
		focalLength?: string;
		lensModel?: string;
		dateTimeOriginal?: string;
		gpsLatitude?: number;
		gpsLongitude?: number;
	};
};
