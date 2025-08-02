/**
 * @file Serializadores para la entidad Document.
 * @module transformers/document/serializers
 * @description Contiene funciones para serializar datos de Document para respuestas API y cliente.
 * ✅ MIGRADO A DRIZZLE - Enero 2025
 */

import type { DocumentBase, DocumentWithStats } from '@/types/entities/document';

/**
 * 📄 Serializa un documento base para respuestas API.
 * Omite campos sensibles y aplica formato estándar.
 *
 * @param document - Documento base desde Drizzle
 * @returns Documento serializado para API
 */
export function serializeDocumentBase(document: DocumentBase) {
	return {
		id: document.id,
		name: document.name,
		path: document.path,
		size: document.size,
		hash: document.hash,
		mimeType: document.mimeType,
		extension: document.extension,
		folderId: document.folderId,
		isFavorite: document.isFavorite,
		isArchived: document.isArchived,
		pageCount: document.pageCount,
		wordCount: document.wordCount,
		language: document.language,
		title: document.title,
		author: document.author,
		subject: document.subject,
		keywords: document.keywords,
		creator: document.creator,
		producer: document.producer,
		creationDate: document.creationDate?.toISOString() || null,
		modificationDate: document.modificationDate?.toISOString() || null,
		encrypted: document.encrypted,
		version: document.version,
		// content omitido por seguridad - usar endpoint específico
		summary: document.summary,
		createdAt: document.createdAt.toISOString(),
		updatedAt: document.updatedAt.toISOString(),
	};
}

/**
 * 📊 Serializa un documento con estadísticas para respuestas API.
 *
 * @param document - Documento con estadísticas
 * @returns Documento serializado con estadísticas
 */
export function serializeDocumentWithStats(document: DocumentWithStats) {
	return {
		...serializeDocumentBase(document),
		stats: {
			charCount: document.stats.charCount,
			readingTime: document.stats.readingTime,
			versionCount: document.stats.versionCount,
			// wordCount viene del DocumentBase, no de las estadísticas
			wordCount: document.wordCount,
		},
	};
}

/**
 * 📄 Serializa una lista de documentos para respuestas API.
 *
 * @param documents - Lista de documentos con estadísticas
 * @returns Lista serializada
 */
export function serializeDocumentList(documents: DocumentWithStats[]) {
	return documents.map(serializeDocumentWithStats);
}

/**
 * 🔍 Serializa contenido de documento (para endpoint específico).
 *
 * @param document - Documento base
 * @returns Contenido serializado
 */
export function serializeDocumentContent(document: DocumentBase) {
	return {
		id: document.id,
		name: document.name,
		content: document.content,
		mimeType: document.mimeType,
		wordCount: document.wordCount,
		charCount: document.content?.length || 0,
	};
}
