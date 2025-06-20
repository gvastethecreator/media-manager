/**
 * 🎲 Tipos canónicos para la entidad File3D
 * - Usar SIEMPRE estos tipos en transformers, services y server actions.
 * - Validar con Zod antes de persistir datos.
 * - No usar ni importar tipos legacy.
 */

import { type BaseEntity } from '@/types/common/transformer';

/**
 * 🎲 Tipo canónico para un archivo 3D.
 * Este es el tipo principal que se usa en toda la aplicación.
 */
export interface File3D extends BaseEntity {
	id: string;
	name: string;
	description?: string | null;
	filePath: string;
	format: string;
	size: number;
	vertices?: number | null;
	faces?: number | null;
	materials?: string | null;
	isFavorite: boolean;
	createdAt: Date;
	updatedAt: Date;
}

/**
 * 🧱 Tipo base para un archivo 3D, sin relaciones.
 * Alias del tipo canónico para compatibilidad.
 */
export type File3DBase = File3D;

/**
 * 🔗 Relaciones de File3D
 */
export interface File3DRelations {
	images?: { id: string }[];
	videos?: { id: string }[];
	audio?: { id: string }[];
	documents?: { id: string }[];
	jsonFiles?: { id: string }[];
	workflows?: { id: string }[];
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
}

/**
 * 📊 Conteos de relaciones de File3D
 */
export interface File3DCounts {
	_count: {
		images: number;
		videos: number;
		audio: number;
		documents: number;
		jsonFiles: number;
		workflows: number;
		albums: number;
		collections: number;
		tags: number;
		characters: number;
		places: number;
		worldItems: number;
		concepts: number;
		prompts: number;
		notes: number;
		wildcards: number;
		properties: number;
		groups: number;
	};
}

/**
 * 🛠️ Relaciones que puede tener un archivo 3D para input.
 */
export type File3DRelationInput = File3DRelations;

/**
 * 💾 Datos para crear o actualizar un archivo 3D.
 */
export type File3DFormData = Omit<File3D, 'id' | 'createdAt' | 'updatedAt' | 'filePath'> &
	File3DRelationInput & {
		filePath?: string;
	};

/**
 * 📝 Datos para crear un File3D
 */
export type File3DCreateInput = Omit<File3DBase, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * 📝 Datos para actualizar un File3D
 */
export type File3DUpdateInput = Partial<Omit<File3DBase, 'id'>>;

/**
 * ✨ Tipo de un archivo 3D con todas sus relaciones anidadas.
 */
export type File3DWithRelations = File3D & {
	images?: any[]; // Importar tipos específicos causaría dependencias circulares
	videos?: any[];
	audio?: any[];
	documents?: any[];
	jsonFiles?: any[];
	workflows?: any[];
	albums?: any[];
	collections?: any[];
	tags?: any[];
	characters?: any[];
	places?: any[];
	worldItems?: any[];
	concepts?: any[];
	prompts?: any[];
	notes?: any[];
	wildcards?: any[];
	properties?: any[];
	groups?: any[];
};

/**
 * 🔢 Tipo de un archivo 3D con los conteos de sus relaciones.
 */
export type File3DWithCounts = File3D & File3DCounts;

/**
 * 🔄 Unión de los tipos con relaciones y con conteos.
 */
export type File3DComplete = File3DWithRelations & File3DWithCounts;

/**
 * 🎯 Filtros específicos para File3D
 */
export interface File3DFilters {
	search?: string;
	format?: string;
	sizeMin?: number;
	sizeMax?: number;
	verticesMin?: number;
	verticesMax?: number;
	facesMin?: number;
	facesMax?: number;
	hasMaterials?: boolean;
	isFavorite?: boolean;
	dateRange?: {
		start?: Date;
		end?: Date;
	};
}

/**
 * 🔍 Opciones de búsqueda para File3D
 */
export interface File3DSearchOptions {
	skip?: number;
	take?: number;
	orderBy?: {
		[key in keyof File3D]?: 'asc' | 'desc';
	};
	where?: File3DFilters;
	include?: {
		[key in keyof File3DRelations]?: boolean;
	};
}

/**
 * 📊 Resultado de búsqueda de File3Ds
 */
export interface File3DSearchResult {
	items: File3DComplete[];
	total: number;
	hasMore: boolean;
}