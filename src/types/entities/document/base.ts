/**
 * @file Tipos base para la entidad Document.
 * @module types/entities/document/base
 * @description Define los tipos canónicos para la entidad Document, incluyendo el tipo
 *              base y el tipo con estadísticas.
 */

/**
 * Tipo base de Document directamente desde el schema de Drizzle.
 */
export type DocumentBase = {
    id: string;
    name: string;
    path: string;
    size: number;
    hash: string;
    mimeType: string;
    extension: string;
    folderId: string;
    isFavorite: boolean;
    isArchived: boolean;
    pageCount: number | null;
    wordCount: number | null;
    language: string | null;
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
    content: string | null;
    summary: string | null;
    createdAt: Date;
    updatedAt: Date;
};

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
