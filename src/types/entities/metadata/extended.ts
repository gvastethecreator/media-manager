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
	id: string;
	key: string;
	value: string | null;
	type: string | null;
	category: string | null;
}

// Tipo para la vista de lista de metadatos
export interface MetadataListItem {
	id: string;
	entityId: string;
	key: string;
	value: string | null;
	type: string | null;
	updatedAt: Date;
}

// Tipo para filtros de metadatos
export interface MetadataFilter {
	entityType?: string;
	key?: string;
	type?: string;
	category?: string;
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
