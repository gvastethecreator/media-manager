import type { MetadataBase } from './types';

// Tipo extendido para UI con información adicional
export interface MetadataExtended extends MetadataBase {
	// Propiedades calculadas adicionales
	aspectRatio: number;
	formattedSize: string;
	dimensions: string;

	// Datos EXIF opcionales
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
}

// Tipo para la vista de metadatos en tarjetas
export interface MetadataCard {
	id: string;
	dimensions: string;
	formattedSize: string;
	format: string;
	hasExif: boolean;
}

// Tipo para la vista de lista de metadatos
export interface MetadataListItem {
	id: string;
	imageId: string;
	dimensions: string;
	format: string;
	size: number;
	formattedSize: string;
	updatedAt: Date;
}

// Tipo para filtros numéricos
export interface MetadataNumericFilter {
	width: number;
	height: number;
	size: number;
}

// Tipo para verificar que MetadataExtended tiene todas las propiedades necesarias
export interface MetadataComplete extends MetadataBase {
	aspectRatio: number;
	formattedSize: string;
	dimensions: string;
}

// Tipo con estadísticas para el store
export interface MetadataWithStats extends MetadataBase {
	// Propiedades calculadas adicionales
	aspectRatio: number;
	formattedSize: string;
	dimensions: string;

	// Estadísticas
	stats: {
		autoTags: number;
		organizationScore: number;
	};

	// Datos EXIF opcionales
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
}

// Asegurar que MetadataExtended implementa MetadataComplete
export type MetadataExtendedVerified = MetadataExtended & MetadataComplete;
