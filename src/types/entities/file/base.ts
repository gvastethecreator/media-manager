/**
 * @file Tipos base para la entidad File.
 * @module types/entities/file/base
 * @description Define los tipos canónicos para File usando el patrón Base + Statistics + WithStats.
 * ✅ MIGRADO A DRIZZLE - Enero 2025
 */

/**
 * 📁 Enum para tipos de archivos.
 */
export enum FileType {
	IMAGE = 'image',
	VIDEO = 'video',
	AUDIO = 'audio',
	DOCUMENT = 'document',
	TEXT = 'text',
	ARCHIVE = 'archive',
	CODE = 'code',
	EXECUTABLE = 'executable',
	FONT = 'font',
	DATA = 'data',
	DIRECTORY = 'directory',
	UNKNOWN = 'unknown',
}

/**
 * 📁 Tipo base de File directamente desde el schema de Drizzle.
 * Representa las propiedades fundamentales de un archivo sin estadísticas calculadas.
 */
export interface FileBase {
	// Identificación
	id: string;
	name: string;
	path: string;

	// Propiedades del archivo
	size: number;
	hash: string;
	mimeType: string;
	extension: string;
	type: FileType;

	// Metadatos del sistema
	isDirectory: boolean;
	parentPath: string;
	absolutePath: string;
	relativePath: string;

	// Fechas del sistema de archivos
	modifiedAt: Date;
	accessedAt: Date;

	// Relaciones
	folderId: string | null;

	// Estados
	isHidden: boolean;
	isReadonly: boolean;

	// Timestamps del sistema
	createdAt: Date;
	updatedAt: Date;
}

/**
 * 📊 Estadísticas calculadas y métricas para un archivo.
 */
export interface FileStatistics {
	/** Tamaño formateado legible para humanos */
	formattedSize: string;
	/** Tipo de archivo legible para humanos */
	typeLabel: string;
	/** Ícono recomendado para el tipo de archivo */
	iconName: string;
	/** Color recomendado para el tipo de archivo */
	colorCode: string;
	/** Días desde la última modificación */
	daysSinceModified: number;
	/** Días desde el último acceso */
	daysSinceAccessed: number;
	/** Indica si es un archivo reciente (modificado en los últimos 7 días) */
	isRecent: boolean;
	/** Indica si es un archivo grande (> 100MB) */
	isLarge: boolean;
	/** Fecha de modificación formateada */
	formattedModifiedAt: string;
	/** Número de elementos hijos (solo para directorios) */
	childCount: number;
	/** Ruta relativa corta para mostrar */
	shortPath: string;

	// File system properties for browser integration
	/** File size in bytes */
	size: number;
	/** Last modification time */
	mtime: Date;
	/** File creation time */
	birthtime: Date;
	/** File type for browser compatibility */
	type: string;
	/** Whether this is a directory */
	isDirectory: boolean;
	/** Whether this is a file */
	isFile: boolean;
}

/**
 * 📁 Tipo enriquecido de File que incluye estadísticas calculadas.
 * Este es el tipo canónico que debe usarse en la aplicación.
 */
export interface FileWithStats extends FileBase {
	stats: FileStatistics;
}
