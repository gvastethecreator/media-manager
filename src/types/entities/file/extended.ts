/**
 * @file Tipos extendidos para la entidad File
 * @module types/entities/file/extended
 */

import type { DirectoryInfo, FileInfo, ImageFileInfo } from '@/transformers/file/mappers';
import { FileType } from './enums';

/**
 * Interfaz extendida para archivos de imagen con metadatos enriquecidos
 */
export interface EnhancedImageFile extends ImageFileInfo {
	// Propiedades adicionales para UI
	thumbnailUrl?: string;
	previewUrl?: string;

	// Metadatos EXIF/IPTC
	metadata?: {
		// Datos EXIF
		exif?: {
			make?: string;
			model?: string;
			dateTime?: string;
			exposureTime?: number;
			fNumber?: number;
			iso?: number;
			focalLength?: number;
			lens?: string;
			gps?: {
				latitude: number;
				longitude: number;
				altitude?: number;
			};
		};

		// Datos IPTC
		iptc?: {
			title?: string;
			caption?: string;
			keywords?: string[];
			copyright?: string;
			author?: string;
		};

		// Otros metadatos
		colorProfile?: string;
		colorSpace?: string;
		imageType?: string;
		compression?: string;
		transparencyIndex?: number;
		bitDepth?: number;
	};

	// Relaciones con otras entidades
	albumIds?: string[];
	tagIds?: string[];
	collectionIds?: string[];
}

/**
 * Interfaz para directorio con metadatos enriquecidos
 */
export interface EnhancedDirectory extends DirectoryInfo {
	// Propiedades adicionales para UI
	iconUrl?: string;
	thumbnailUrl?: string;

	// Estadísticas
	stats?: {
		fileTypes: Record<string, number>;
		totalSize: number;
		lastModified: Date;
		averageFileSize: number;
	};

	// Propiedades para árbol de navegación
	level?: number;
	isExpanded?: boolean;
	isSelected?: boolean;
	hasUnseenChanges?: boolean;

	// Análisis de contenido
	contentSummary?: {
		images: number;
		videos: number;
		documents: number;
		others: number;
	};
}

/**
 * Interfaz para representación de archivo en UI
 */
export interface FileListItem {
	// Identificadores
	id: string;
	path: string;
	name: string;

	// Metadata básica
	type: FileType | string;
	size: number;
	isDirectory: boolean;
	extension?: string;

	// Metadata para UI
	icon?: string;
	iconColor?: string;
	thumbnailUrl?: string;

	// Fechas
	modifiedAt: Date;
	createdAt: Date;

	// Estado UI
	isSelected?: boolean;
	isHighlighted?: boolean;
	isEditing?: boolean;

	// Permisos
	canRead?: boolean;
	canWrite?: boolean;
	canExecute?: boolean;
}

/**
 * Interfaz para un archivo favorito
 */
export interface FavoriteFile extends FileInfo {
	favoritedAt: Date;
	favoriteId: string;
	favoriteNotes?: string;
	lastAccessed?: Date;
	accessCount?: number;
}

/**
 * Interfaz para historial de operaciones sobre archivos
 */
export interface FileHistoryEntry {
	id: string;
	path: string;
	operation: string;
	timestamp: Date;
	user?: string;
	previousPath?: string;
	details?: string;
	success: boolean;
	error?: string;
}

/**
 * Interfaz para respuesta de búsqueda de archivos
 */
export interface FileSearchResults {
	query: string;
	totalResults: number;
	processingTime: number;
	items: FileListItem[];
	matchesByDirectory: Record<string, number>;
	hasMore: boolean;
}
