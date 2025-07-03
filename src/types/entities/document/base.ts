/**
 * @file Tipos base para la entidad Document.
 * @module types/entities/document/base
 * @description Define los tipos canónicos para la entidad Document, incluyendo el tipo
 *              base, el tipo con estadísticas y el tipo de Prisma.
 */

import type { Document } from '@prisma/client';

// --- TIPO BASE DE PRISMA ---
/**
 * Tipo base de Document directamente desde el schema de Prisma.
 * @typedef {Document} DocumentBase
 */
export type DocumentBase = Document;

/**
 * Alias para el tipo de Prisma para mantener consistencia.
 * En este caso, no hay relaciones para contar, por lo que es igual a DocumentBase.
 * @typedef {Document} PrismaDocument
 */
export type PrismaDocument = Document;

// --- TIPOS CON ESTADÍSTICAS ---

/**
 * Métricas y estadísticas calculadas para un documento.
 */
export interface DocumentStatistics {
	/** Número total de palabras */
	wordCount: number;
	/** Número total de caracteres */
	charCount: number;
	/** Densidad de palabras clave (ejemplo, no implementado) */
	keywordDensity: Record<string, number>;
	/** Puntuación de sentimiento (ejemplo, no implementado) */
	sentiment: 'positive' | 'negative' | 'neutral' | 'unknown';
	/** Número de versiones o historial de cambios (ejemplo) */
	versionCount: number;
}

/**
 * Tipo enriquecido de Document que incluye estadísticas.
 * Este es el tipo canónico para usar en la aplicación.
 * @typedef {DocumentBase & { stats: DocumentStatistics }} DocumentWithStats
 */
export interface DocumentWithStats extends DocumentBase {
	stats: DocumentStatistics;
}

// --- TIPOS PARA MUTACIONES ---

/**
 * 🆕 Tipo para crear un nuevo Document
 * Omite campos autogenerados (id, timestamps)
 */
export type DocumentCreateInput = Omit<DocumentBase, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * ✏️ Tipo para actualizar un Document existente
 * Todos los campos son opcionales excepto id
 */
export type DocumentUpdateInput = Partial<DocumentCreateInput>;
