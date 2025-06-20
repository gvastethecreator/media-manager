/**
 * ⚙️ Tipos canónicos para la entidad Workflow
 * - Usar SIEMPRE estos tipos en transformers, services y server actions.
 * - Validar con Zod antes de persistir datos.
 * - No usar ni importar tipos legacy.
 */

import { type BaseEntity } from '@/types/common/transformer';

/**
 * ⚙️ Tipo canónico para un workflow.
 * Este es el tipo principal que se usa en toda la aplicación.
 */
export interface Workflow extends BaseEntity {
	id: string;
	name: string;
	description?: string | null;
	filePath: string;
	format: string;
	content?: string | null;
	version?: string | null;
	size: number;
	isFavorite: boolean;
	createdAt: Date;
	updatedAt: Date;
}

/**
 * 🧱 Tipo base para un workflow, sin relaciones.
 * Alias del tipo canónico para compatibilidad.
 */
export type WorkflowBase = Workflow;

/**
 * 🔗 Relaciones de Workflow
 */
export interface WorkflowRelations {
	images?: { id: string }[];
	videos?: { id: string }[];
	audio?: { id: string }[];
	file3d?: { id: string }[];
	documents?: { id: string }[];
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
}

/**
 * 📊 Conteos de relaciones de Workflow
 */
export interface WorkflowCounts {
	_count: {
		images: number;
		videos: number;
		audio: number;
		file3d: number;
		documents: number;
		jsonFiles: number;
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
 * 🛠️ Relaciones que puede tener un workflow para input.
 */
export type WorkflowRelationInput = WorkflowRelations;

/**
 * 💾 Datos para crear o actualizar un workflow.
 */
export type WorkflowFormData = Omit<Workflow, 'id' | 'createdAt' | 'updatedAt' | 'filePath'> &
	WorkflowRelationInput & {
		filePath?: string;
	};

/**
 * 📝 Datos para crear un Workflow
 */
export type WorkflowCreateInput = Omit<WorkflowBase, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * 📝 Datos para actualizar un Workflow
 */
export type WorkflowUpdateInput = Partial<Omit<WorkflowBase, 'id'>>;

/**
 * ✨ Tipo de un workflow con todas sus relaciones anidadas.
 */
export type WorkflowWithRelations = Workflow & {
	images?: any[]; // Importar tipos específicos causaría dependencias circulares
	videos?: any[];
	audio?: any[];
	file3d?: any[];
	documents?: any[];
	jsonFiles?: any[];
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
 * 🔢 Tipo de un workflow con los conteos de sus relaciones.
 */
export type WorkflowWithCounts = Workflow & WorkflowCounts;

/**
 * 🔄 Unión de los tipos con relaciones y con conteos.
 */
export type WorkflowComplete = WorkflowWithRelations & WorkflowWithCounts;

/**
 * 🎯 Filtros específicos para Workflow
 */
export interface WorkflowFilters {
	search?: string;
	format?: string;
	version?: string;
	hasContent?: boolean;
	sizeMin?: number;
	sizeMax?: number;
	isFavorite?: boolean;
	dateRange?: {
		start?: Date;
		end?: Date;
	};
}

/**
 * 🔍 Opciones de búsqueda para Workflow
 */
export interface WorkflowSearchOptions {
	skip?: number;
	take?: number;
	orderBy?: {
		[key in keyof Workflow]?: 'asc' | 'desc';
	};
	where?: WorkflowFilters;
	include?: {
		[key in keyof WorkflowRelations]?: boolean;
	};
}

/**
 * 📊 Resultado de búsqueda de Workflows
 */
export interface WorkflowSearchResult {
	items: WorkflowComplete[];
	total: number;
	hasMore: boolean;
}
