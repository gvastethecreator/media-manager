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
	absolutePath: string;
	accessedAt: Date;

	// Timestamps del sistema
	createdAt: Date;
	extension: string;

	// Relaciones
	folderId: string | null;
	hash: string;
	// Identificación
	id: string;

	// Metadatos del sistema
	isDirectory: boolean;

	// Estados
	isHidden: boolean;
	isReadonly: boolean;
	mimeType: string;

	// Fechas del sistema de archivos
	modifiedAt: Date;
	name: string;
	parentPath: string;
	path: string;
	relativePath: string;

	// Propiedades del archivo
	size: number;
	type: FileType;
	updatedAt: Date;
}

import { EntityStats } from '../entity.types';

/**
 * 📊 Estadísticas calculadas y métricas para un archivo.
 */
export interface FileStatistics extends EntityStats {
	/** Checksum del archivo para verificación de integridad */
	checksum: string;
	/** Número de elementos hijos (solo para directorios) */
	childCount: number;
	/** Color recomendado para el tipo de archivo */
	colorCode: string;
	/** Días desde el último acceso */
	daysSinceAccessed: number;
	/** Días desde la última modificación */
	daysSinceModified: number;
	/** Fecha de modificación formateada */
	formattedModifiedAt: string;
	/** Tamaño formateado legible para humanos */
	formattedSize: string;
	/** Ícono recomendado para el tipo de archivo */
	iconName: string;

	// File system functions
	isDirectory: boolean;
	isFile: boolean;
	/** Indica si es un archivo grande (> 100MB) */
	isLarge: boolean;
	/** Indica si es un archivo reciente (modificado en los últimos 7 días) */
	isRecent: boolean;
	/** Ruta relativa corta para mostrar */
	shortPath: string;
	/** Tipo de archivo legible para humanos */
	typeLabel: string;
}

/**
 * 📁 Tipo enriquecido de File que incluye estadísticas calculadas.
 * Este es el tipo canónico que debe usarse en la aplicación.
 */
export interface FileWithStats extends FileBase {
	// Campos opcionales para compatibilidad con DisplayableEntity
	description?: string | null;
	stats: FileStatistics;
}
