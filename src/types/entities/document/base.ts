/**
 * @file Tipos base para la entidad Document.
 * @module types/entities/document/base
 * @description Define los tipos canónicos para la entidad Document usando el patrón Base + Statistics + WithStats.
 * ✅ MIGRADO A DRIZZLE - Enero 2025
 */

/**
 * 📄 Tipo base de Document directamente desde el schema de Drizzle.
 * Representa las propiedades fundamentales de un documento sin estadísticas calculadas.
 */
export interface DocumentBase {
	// Identificación
	id: string;
	name: string;
	path: string;

	// Propiedades del archivo
	size: number;
	hash: string;
	mimeType: string;
	extension: string;

	// Relaciones
	folderId: string;

	// Estados
	isFavorite: boolean;
	isArchived: boolean;

	// Metadatos de documento
	pageCount: number | null;
	wordCount: number | null;
	language: string | null;

	// Metadatos de PDF/documento
	title: string | null;
	author: string | null;
	subject: string | null;
	keywords: string | null;
	creator: string | null;
	producer: string | null;
	creationDate: Date | null;
	modificationDate: Date | null;
	encrypted: boolean | null;
	version: string | null;

	// Contenido
	content: string | null;
	summary: string | null;

	// Timestamps del sistema
	createdAt: Date;
	updatedAt: Date;
}

/**
 * 📊 Estadísticas calculadas y métricas para un documento.
 */
export interface DocumentStatistics {
	/** Número total de palabras en el documento */
	wordCount: number;
	/** Número total de caracteres */
	charCount: number;
	/** Tiempo estimado de lectura en minutos */
	readingTime: number;
	/** Número de versiones del documento */
	versionCount: number;
}

/**
 * 📄 Tipo enriquecido de Document que incluye estadísticas calculadas.
 * Este es el tipo canónico que debe usarse en la aplicación.
 */
export interface DocumentWithStats extends DocumentBase {
	entityType: 'document';
	stats: DocumentStatistics;
}
