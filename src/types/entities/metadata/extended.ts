import type { MetadataBase } from './types';

// Tipo extendido para UI con información adicional
export interface MetadataExtended extends MetadataBase {
	// Propiedades calculadas adicionales (para metadatos genéricos no aplican)
	// aspectRatio: number;
	// formattedSize: string;
	// dimensions: string;

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
	category: string | null;
	id: string;
	key: string;
	type: string | null;
	value: string | null;
}

// Tipo para la vista de lista de metadatos
export interface MetadataListItem {
	entityId: string;
	id: string;
	key: string;
	type: string | null;
	updatedAt: Date;
	value: string | null;
}

// Tipo para filtros de metadatos
export interface MetadataFilter {
	category?: string;
	entityType?: string;
	key?: string;
	type?: string;
}

// Tipo para verificar que MetadataExtended tiene todas las propiedades necesarias
export interface MetadataComplete extends MetadataBase {
	// Todas las propiedades están en MetadataBase
}

// Tipo con estadísticas para el store
export interface MetadataWithStats extends MetadataBase {
	// Estadísticas
	stats: {
		usageCount: number;
		lastAccessed: Date;
	};
}

// Asegurar que MetadataExtended implementa MetadataComplete
export type MetadataExtendedVerified = MetadataExtended & MetadataComplete;
