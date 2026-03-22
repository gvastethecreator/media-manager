/**
 * @file Tipos base para la entidad JsonFile.
 * @module types/entities/json-file/base
 * @description Define los tipos canónicos para la entidad JsonFile, siguiendo el nuevo patrón de `...WithStats`.
 */

/**
 * 🟫 Tipo base de JsonFile directamente desde el schema de Drizzle.
 */
export interface JsonFileBase {
	content: string | null;
	createdAt: Date;
	depth: number | null;
	extension: string;
	folderId: string;
	hash: string;
	id: string;
	isArchived: boolean;
	isFavorite: boolean;
	isValid: boolean | null;
	keyCount: number | null;
	mimeType: string;
	name: string;
	path: string;
	schema: string | null;
	size: number;
	updatedAt: Date;
	validationErrors: string | null;
}

import { EntityStats } from '../entity.types';

/**
 * 📊 Métricas y estadísticas calculadas para un archivo JSON.
 * Estas métricas se enfocan en la estructura y validez del contenido JSON.
 */
export interface JsonFileStatistics extends EntityStats {
	/** Indica si el contenido JSON es válido y parseable */
	isValid: boolean;
	/** Número total de claves en el objeto JSON */
	keyCount: number;
	/** Profundidad máxima de anidamiento del JSON */
	nestingDepth: number;
}

/**
 * ✨ Tipo enriquecido de JsonFile que incluye estadísticas.
 * Este es el tipo canónico para usar en la aplicación.
 */
export interface JsonFileWithStats extends JsonFileBase {
	entityType: 'jsonFile';
	stats: JsonFileStatistics;
}

/**
 * @deprecated Usar JsonFileWithStats en su lugar
 * Alias de compatibilidad para código legacy
 */
export type JsonFileComplete = JsonFileWithStats;

// --- TIPOS PARA MUTACIONES ---

/**
 * 🆕 Tipo para crear un nuevo JsonFile
 * Omite campos autogenerados (id, timestamps)
 */
export type JsonFileCreateInput = Omit<JsonFileBase, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * ✏️ Tipo para actualizar un JsonFile existente
 * Todos los campos son opcionales excepto id
 */
export type JsonFileUpdateInput = Partial<JsonFileCreateInput>;
