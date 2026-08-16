/**
 * @file Tipos base para la entidad Document.
 * @module types/entities/document/base
 * @description Define los tipos canónicos para la entidad Document usando el patrón Base + Statistics + WithStats.
 * ✅ MIGRADO A DRIZZLE - Enero 2025
 */

import { EntityStats } from '../entity.types';

/**
 * 📄 Tipo base de Document directamente desde el schema de Drizzle.
 * Representa las propiedades fundamentales de un documento sin estadísticas calculadas.
 */
export interface DocumentBase {
	author: string | null;

	// Contenido
	content: string | null;

	// Timestamps del sistema
	createdAt: Date;
	creationDate: Date | null;
	creator: string | null;

	// Campos adicionales para compatibilidad con DisplayableEntity
	description?: string | null;
	encrypted: boolean | null;
	extension: string;

	// Relaciones
	folderId: string;
	hash: string;
	// Identificación
	id: string;
	isArchived: boolean;

	// Estados
	isFavorite: boolean;
	keywords: string | null;
	language: string | null;
	mimeType: string;
	modificationDate: Date | null;
	name: string;

	// Metadatos de documento
	pageCount: number | null;
	path: string;
	producer: string | null;

	// Propiedades del archivo
	size: number;
	subject: string | null;
	summary: string | null;

	// Metadatos de PDF/documento
	title: string | null;
	updatedAt: Date;
	version: string | null;
	wordCount: number | null;
}

/**
 * 📊 Estadísticas calculadas y métricas para un documento.
 */
export interface DocumentStatistics extends EntityStats {
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
