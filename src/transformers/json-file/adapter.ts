/**
 * @file Adaptador para JsonFileWithStats - Patrón estandarizado para componentes de lista
 * @module transformers/json-file/adapter
 * @description Convierte datos de Drizzle a JsonFileWithStats con estadísticas completas
 */

import type { JsonFileBase, JsonFileStatistics, JsonFileWithStats } from '@/types/entities/json-file';

/**
 * Estadísticas por defecto para JsonFile
 * Se utiliza cuando no hay datos de conteo disponibles
 */
export function defaultJsonFileStats(): JsonFileStatistics {
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
		type: 'json-file',

		// Campos específicos de JsonFileStatistics
		nestingDepth: 0,
		isValid: true,
		keyCount: 0,
	};
}

/**
 * Adaptador principal: convierte JsonFileBase a JsonFileWithStats
 * @param jsonFile - Objeto JsonFileBase de Drizzle
 * @param counts - Conteos opcionales de relaciones
 * @returns JsonFileWithStats con estadísticas calculadas
 */
export function adaptJsonFileWithStats(
	jsonFile: JsonFileBase,
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
): JsonFileWithStats {
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
	if (jsonFile.name?.trim()) completenessScore += 1;
	if (jsonFile.path?.trim()) completenessScore += 1;
	if (jsonFile.size > 0) completenessScore += 1;
	if (jsonFile.content?.trim()) completenessScore += 1;

	// Campos de validación (peso: 1 punto cada uno)
	if (jsonFile.isValid === true) completenessScore += 1;
	if (jsonFile.schema?.trim()) completenessScore += 1;
	if ((jsonFile.keyCount || 0) > 0) completenessScore += 1;
	if (totalRelations > 0) completenessScore += 1;

	const completeness = Math.round((completenessScore / maxScore) * 100);

	// Analizar el contenido JSON para estadísticas específicas
	let nestingDepth = jsonFile.depth || 0;
	let isValid = jsonFile.isValid !== false;
	let keyCount = jsonFile.keyCount || 0;

	// Si tenemos contenido, intentar parsearlo para estadísticas más precisas
	if (jsonFile.content && isValid) {
		try {
			const parsed = JSON.parse(jsonFile.content);
			keyCount = countKeys(parsed);
			nestingDepth = calculateDepth(parsed);
		} catch (error) {
			isValid = false;
		}
	}

	// Crear estadísticas
	const stats: JsonFileStatistics = {
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
		lastUpdated: jsonFile.updatedAt || new Date(),
		lastViewed: null,
		lastModified: jsonFile.updatedAt || new Date(),

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
		needsAttention: !isValid || completeness < 50,

		// Propiedades del sistema de archivos
		size: jsonFile.size || 0,
		mtime: jsonFile.updatedAt || new Date(),
		birthtime: jsonFile.createdAt || new Date(),
		type: 'json-file',

		// Campos específicos de JsonFileStatistics
		nestingDepth,
		isValid,
		keyCount,
	};

	// Crear objeto JsonFileWithStats
	return {
		...jsonFile,
		entityType: 'json-file',
		stats,
	};
}

/**
 * Función auxiliar para contar claves en un objeto JSON
 */
function countKeys(obj: any): number {
	if (typeof obj !== 'object' || obj === null) {
		return 0;
	}

	if (Array.isArray(obj)) {
		return obj.reduce((sum, item) => sum + countKeys(item), 0);
	}

	let count = Object.keys(obj).length;
	for (const value of Object.values(obj)) {
		count += countKeys(value);
	}
	return count;
}

/**
 * Función auxiliar para calcular la profundidad de anidamiento
 */
function calculateDepth(obj: any): number {
	if (typeof obj !== 'object' || obj === null) {
		return 0;
	}

	if (Array.isArray(obj)) {
		return Math.max(0, ...obj.map((item) => 1 + calculateDepth(item)));
	}

	const depths = Object.values(obj).map((value) => 1 + calculateDepth(value));
	return Math.max(0, ...depths);
}

/**
 * Adaptador para listas: convierte array de JsonFileBase a JsonFileWithStats[]
 * @param jsonFiles - Array de objetos JsonFileBase
 * @param countsMap - Mapa opcional de conteos por ID de jsonFile
 * @returns Array de JsonFileWithStats
 */
export function adaptJsonFilesWithStats(
	jsonFiles: JsonFileBase[],
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
): JsonFileWithStats[] {
	return jsonFiles.map((jsonFile) => adaptJsonFileWithStats(jsonFile, countsMap?.[jsonFile.id]));
}
