/**
 * 📄 Tipos canónicos para la entidad Document
 * - Usar SIEMPRE estos tipos en transformers, services y server actions.
 * - Validar con Zod antes de persistir datos.
 * - No usar ni importar tipos legacy.
 * - Basado en el schema real de Prisma.
 */

import { type BaseEntity } from '@/types/common/transformer';

/**
 * 📄 Tipo canónico para un documento.
 * Este es el tipo principal que se usa en toda la aplicación.
 * Basado en el schema real de Prisma.
 */
export interface Document extends BaseEntity {
	id: string;
	name: string;
	filePath: string;
	content: string;
	createdAt: Date;
	updatedAt: Date;
}

/**
 * 🧱 Tipo base para un documento, sin relaciones.
 * Alias del tipo canónico para compatibilidad.
 */
export type DocumentBase = Document;

/**
 * 📊 Conteos de relaciones de Document (actualmente vacío porque no tiene relaciones en Prisma)
 */
export interface DocumentCounts {
	_count: Record<string, never>; // Document no tiene relaciones en el schema actual
}

/**
 * 💾 Datos para crear o actualizar un documento.
 */
export type DocumentFormData = Omit<Document, 'id' | 'createdAt' | 'updatedAt'> & {
	// Campos opcionales para compatibilidad con formularios
	description?: string | null;
	format?: string;
	size?: number;
	isFavorite?: boolean;
	// Relaciones legacy que se ignoran pero se mantienen para compatibilidad
	images?: { id: string }[];
	videos?: { id: string }[];
	audio?: { id: string }[];
	file3d?: { id: string }[];
	jsonFiles?: { id: string }[];
	albums?: { id: string }[];
	collections?: { id: string }[];
	tags?: { id: string }[];
	characters?: { id: string }[];
	places?: { id: string }[];
	worldItems?: { id: string }[];
	concepts?: { id: string }[];
	prompts?: { id: string }[];
	notes?: { id: string }[];
	wildcards?: { id: string }[];
	properties?: { id: string }[];
	groups?: { id: string }[];
};

/**
 * 🔗 Datos de relación para input (legacy, se mantiene para compatibilidad)
 */
export type DocumentRelationInput = Pick<DocumentFormData,
	'images' | 'videos' | 'audio' | 'file3d' | 'jsonFiles' | 'albums' | 'collections' |
	'tags' | 'characters' | 'places' | 'worldItems' | 'concepts' | 'prompts' |
	'notes' | 'wildcards' | 'properties' | 'groups'
>;

/**
 * 📝 Datos para crear un Document
 */
export type DocumentCreateInput = Omit<DocumentBase, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * 📝 Datos para actualizar un Document
 */
export type DocumentUpdateInput = Partial<Omit<DocumentBase, 'id'>>;

/**
 * 🔢 Tipo de un documento con los conteos de sus relaciones.
 */
export type DocumentWithCounts = Document & DocumentCounts;

/**
 * 🔄 Tipo completo de Document (actualmente igual a DocumentWithCounts)
 */
export type DocumentComplete = DocumentWithCounts;

/**
 * 🎯 Filtros específicos para Document
 */
export interface DocumentFilters {
	search?: string;
	contentSearch?: string;
	dateRange?: {
		start?: Date;
		end?: Date;
	};
}

/**
 * 🔍 Opciones de búsqueda para Document
 */
export interface DocumentSearchOptions {
	skip?: number;
	take?: number;
	orderBy?: {
		[key in keyof Document]?: 'asc' | 'desc';
	};
	where?: DocumentFilters;
}

/**
 * 📊 Resultado de búsqueda de Documents
 */
export interface DocumentSearchResult {
	items: DocumentComplete[];
	total: number;
	hasMore: boolean;
}

// Legacy types maintained for compatibility
export type DocumentRelations = DocumentRelationInput;
export type DocumentWithRelations = Document;
