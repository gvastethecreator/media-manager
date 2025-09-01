/**
 * @file Adaptador para DocumentWithStats - Patrón estandarizado para componentes de lista
 * @module transformers/document/adapter
 * @description Convierte datos de Drizzle a DocumentWithStats con estadísticas completas
 */

import type { DocumentBase, DocumentStatistics, DocumentWithStats } from '@/types/entities/document';

/**
 * Estadísticas por defecto para Document
 * Se utiliza cuando no hay datos de conteo disponibles
 */
export function defaultDocumentStats(): DocumentStatistics {
	return {
		// Conteos de relaciones
		imageCount: 0,
		videoCount: 0,
		albumCount: 0,
		collectionCount: 0,
		tagCount: 0,
		characterCount: 0,
		placeCount: 0,
		worldItemCount: 0,
		conceptCount: 0,
		promptCount: 0,
		noteCount: 0,
		wildcardCount: 0,
		propertyCount: 0,
		groupCount: 0,

		// Métricas globales
		totalItems: 0,
		totalAssociations: 0,

		// Timestamps
		lastUpdated: new Date(),
		lastViewed: null,
		lastModified: null,

		// Métricas de uso
		viewCount: 0,
		downloadCount: 0,
		likeCount: 0,
		commentCount: 0,

		// Métricas de calidad
		qualityScore: 0,
		completenessScore: 0,

		// Estado
		isDuplicate: false,
		isOrphaned: false,
		needsAttention: false,

		// Propiedades del sistema de archivos
		size: 0,
		mtime: new Date(),
		birthtime: new Date(),
		type: 'document',

		// Campos específicos de DocumentStatistics
		charCount: 0,
		readingTime: 0,
		versionCount: 1,
	};
}

/**
 * Adaptador principal: convierte DocumentBase a DocumentWithStats
 * @param document - Objeto DocumentBase de Drizzle
 * @param counts - Conteos opcionales de relaciones
 * @returns DocumentWithStats con estadísticas calculadas
 */
export function adaptDocumentWithStats(
	document: DocumentBase,
	counts?: {
		images?: number;
		videos?: number;
		albums?: number;
		collections?: number;
		tags?: number;
		characters?: number;
		places?: number;
		worldItems?: number;
		concepts?: number;
		prompts?: number;
		notes?: number;
		wildcards?: number;
		properties?: number;
		groups?: number;
	}
): DocumentWithStats {
	// Calcular el total de relaciones
	const totalRelations = counts
		? (counts.images || 0) +
			(counts.videos || 0) +
			(counts.albums || 0) +
			(counts.collections || 0) +
			(counts.tags || 0) +
			(counts.characters || 0) +
			(counts.places || 0) +
			(counts.worldItems || 0) +
			(counts.concepts || 0) +
			(counts.prompts || 0) +
			(counts.notes || 0) +
			(counts.wildcards || 0) +
			(counts.properties || 0) +
			(counts.groups || 0)
		: 0;

	// Calcular completeness basado en campos requeridos
	let completenessScore = 0;
	const maxScore = 8;

	// Campos básicos requeridos (peso: 1 punto cada uno)
	if (document.name?.trim()) completenessScore += 1;
	if (document.path?.trim()) completenessScore += 1;
	if (document.mimeType?.trim()) completenessScore += 1;
	if (document.size > 0) completenessScore += 1;

	// Campos de metadatos (peso: 1 punto cada uno)
	if (document.title?.trim()) completenessScore += 1;
	if (document.author?.trim()) completenessScore += 1;
	if (document.content?.trim()) completenessScore += 1;
	if (totalRelations > 0) completenessScore += 1;

	const completeness = Math.round((completenessScore / maxScore) * 100);

	// Calcular estadísticas específicas del documento
	const charCount = document.content?.length || 0;
	const wordCount = document.wordCount || 0;
	const readingTime = Math.ceil(wordCount / 200); // ~200 palabras por minuto

	// Crear estadísticas
	const stats: DocumentStatistics = {
		// Conteos de relaciones
		imageCount: counts?.images || 0,
		videoCount: counts?.videos || 0,
		albumCount: counts?.albums || 0,
		collectionCount: counts?.collections || 0,
		tagCount: counts?.tags || 0,
		characterCount: counts?.characters || 0,
		placeCount: counts?.places || 0,
		worldItemCount: counts?.worldItems || 0,
		conceptCount: counts?.concepts || 0,
		promptCount: counts?.prompts || 0,
		noteCount: counts?.notes || 0,
		wildcardCount: counts?.wildcards || 0,
		propertyCount: counts?.properties || 0,
		groupCount: counts?.groups || 0,

		// Métricas globales
		totalItems: totalRelations,
		totalAssociations: totalRelations,

		// Timestamps
		lastUpdated: document.updatedAt || new Date(),
		lastViewed: null,
		lastModified: document.modificationDate || document.updatedAt || new Date(),

		// Métricas de uso
		viewCount: 0,
		downloadCount: 0,
		likeCount: 0,
		commentCount: 0,

		// Métricas de calidad
		qualityScore: completeness,
		completenessScore: completeness,

		// Estado
		isDuplicate: false,
		isOrphaned: totalRelations === 0,
		needsAttention: completeness < 50 || document.encrypted === true,

		// Propiedades del sistema de archivos
		size: document.size || 0,
		mtime: document.modificationDate || document.updatedAt || new Date(),
		birthtime: document.creationDate || document.createdAt || new Date(),
		type: 'document',

		// Campos específicos de DocumentStatistics
		charCount,
		readingTime,
		versionCount: 1, // Por defecto, se puede incrementar si hay versiones
	};

	// Crear objeto DocumentWithStats
	return {
		...document,
		entityType: 'document',
		stats,
	};
}

/**
 * Adaptador para listas: convierte array de DocumentBase a DocumentWithStats[]
 * @param documents - Array de objetos DocumentBase
 * @param countsMap - Mapa opcional de conteos por ID de document
 * @returns Array de DocumentWithStats
 */
export function adaptDocumentsWithStats(
	documents: DocumentBase[],
	countsMap?: Record<
		string,
		{
			images?: number;
			videos?: number;
			albums?: number;
			collections?: number;
			tags?: number;
			characters?: number;
			places?: number;
			worldItems?: number;
			concepts?: number;
			prompts?: number;
			notes?: number;
			wildcards?: number;
			properties?: number;
			groups?: number;
		}
	>
): DocumentWithStats[] {
	return documents.map((document) => adaptDocumentWithStats(document, countsMap?.[document.id]));
}
