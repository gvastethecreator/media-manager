/**
 * @file Mappers para la entidad Document.
 * @module transformers/document/mappers
 * @description Contiene funciones para transformar datos de la entidad Document.
 */
import type { Document } from '@prisma/client';
import type { DocumentStatistics, DocumentWithStats } from '@/types/entities/document';

const WORDS_PER_MINUTE = 200;

/**
 * Calcula las estadísticas de un documento.
 *
 * @param document El objeto Document de Prisma.
 * @returns Un objeto de tipo DocumentStatistics.
 */
function calculateDocumentStats(document: Document): DocumentStatistics {
	const { wordCount, charCount } = document;

	// Calcular tiempo de lectura estimado
	const readingTime = wordCount > 0 ? Math.ceil(wordCount / WORDS_PER_MINUTE) : 0;

	return {
		wordCount,
		charCount,
		readingTime,
		versionCount: 0, // Placeholder para futuras implementaciones
	};
}

/**
 * Convierte un objeto Document de Prisma a un objeto canónico DocumentWithStats.
 *
 * @param document El objeto Document de Prisma.
 * @returns Un objeto DocumentWithStats.
 */
export function toDocumentWithStats(document: Document): DocumentWithStats {
	const { wordCount, charCount, ...baseDocument } = document;
	const stats = calculateDocumentStats(document);

	return {
		...baseDocument,
		stats,
	};
}
