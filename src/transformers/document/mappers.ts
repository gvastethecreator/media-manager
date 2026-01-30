/**
 * @file Mappers para la entidad Document.
 * @module transformers/document/mappers
 * @description Contiene funciones para transformar datos de Document entre tipos base y enriquecidos.
 * ✅ MIGRADO A DRIZZLE - Enero 2025
 */

import { createDefaultEntityStats } from '@/lib/utils';
import type { DocumentBase, DocumentStatistics, DocumentWithStats } from '@/types/entities/document';

/** Constante para cálculo de tiempo de lectura (palabras por minuto) */
const WORDS_PER_MINUTE = 200;

/**
 * 📊 Calcula las estadísticas de un documento.
 *
 * @param document - El documento base desde Drizzle
 * @returns Las estadísticas calculadas del documento
 */
function calculateDocumentStats(document: DocumentBase): DocumentStatistics {
	const wordCount = document.wordCount || 0;
	const charCount = document.content?.length || 0;

	// Calcular tiempo de lectura estimado en minutos
	const readingTime = wordCount > 0 ? Math.ceil(wordCount / WORDS_PER_MINUTE) : 0;

	return {
		...createDefaultEntityStats(),
		charCount,
		readingTime,
		versionCount: 0, // Placeholder para futuras implementaciones
	} as DocumentStatistics;
}

/**
 * 📄 Transforma un documento base en un documento con estadísticas.
 * Esta es la función principal de transformación para la entidad Document.
 *
 * @param document - El documento base desde Drizzle
 * @returns Un documento enriquecido con estadísticas calculadas
 */
export function toDocumentWithStats(document: DocumentBase): DocumentWithStats {
	const stats = calculateDocumentStats(document);

	return {
		...document,
		stats,
		entityType: 'document',
	};
}

/**
 * 📄 Transforma una lista de documentos base en documentos con estadísticas.
 *
 * @param documents - Lista de documentos base desde Drizzle
 * @returns Lista de documentos enriquecidos con estadísticas
 */
export function toDocumentWithStatsList(documents: DocumentBase[]): DocumentWithStats[] {
	return documents.map(toDocumentWithStats);
}
