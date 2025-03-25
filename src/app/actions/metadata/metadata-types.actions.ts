import type { AIMetadata, FileMetadata } from '@/types/metadata';
import type { Image } from '@prisma/client';
import type sharp from 'sharp';

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
	retry?: RetryConfig;
}

// Extensión de FileMetadata para incluir formato
export interface ExtendedFileMetadata extends FileMetadata {
	format?: ImageFormat;
	colorSpace?: string;
	hasAlpha?: boolean;
}

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
