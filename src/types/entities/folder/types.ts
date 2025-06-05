/**
 * @file Tipos para la entidad Folder
 * @module types/entities/folder/types
 * @description Define los tipos relacionados con Folder, adaptando el esquema de Prisma
 * para una mejor tipificación en la aplicación
 */

import type { Folder as PrismaFolder } from '@prisma/client';
import type { Image } from '../image';
import type { Video } from '../video';
import { FolderSortBy, FolderViewMode } from './enums';

/**
 * Tipo base para datos de Folder según el esquema de Drizzle
 */
export type FolderBase = PrismaFolder;

/**
 * Interfaz que extiende el tipo base de Folder con propiedades para UI
 */
export interface FolderExtended extends FolderBase {
	// Propiedades adicionales para UI
	isSelected?: boolean;
	isOpen?: boolean;
	level?: number;
	isLoading?: boolean;
	hasError?: boolean;
	recentImages?: string[] | null;
}

/**
 * Interfaz completa de Folder que representa todos los campos deserializados
 * y estructuras completas
 */
export interface FolderComplete extends FolderBase {
	// Aunque Folder no tiene campos JSON para deserializar en Prisma,
	// mantenemos esta interfaz para consistencia con otras entidades
}

/**
 * Interfaz que extiende FolderComplete y agrega propiedades de UI
 * y relaciones completas
 */
export interface FolderExtendedComplete extends FolderComplete, FolderExtended {
	// Relaciones
	parent?: FolderExtendedComplete | null;
	children?: FolderExtendedComplete[];
	images?: Image[];
	videos?: Video[];

	// Contadores de relaciones
	_count?: {
		children: number;
		images: number;
		videos: number;
	};
}

/**
 * Interfaz para estadísticas de carpeta
 */
export interface FolderStats {
	// Estadísticas básicas
	totalFiles: number;
	totalSize: number;
	lastIndexed: Date | null;

	// Distribución por tipo de archivo
	fileDistribution?: {
		images: number;
		videos: number;
		other: number;
	};

	// Distribución por tamaño
	sizeDistribution?: {
		images: number;
		videos: number;
		other: number;
	};

	// Metadata procesada
	metadataStats?: {
		processed: number;
		pending: number;
		failed: number;
	};

	// Estadísticas de procesamiento
	processingStats?: {
		lastProcessingTime: number;
		averageProcessingTime: number;
		processingStatus: 'idle' | 'processing' | 'error';
	};
}

/**
 * Interfaz para crear una carpeta
 */
export interface CreateFolderData {
	name: string;
	description?: string | null;
	path: string;
	emoji?: string | null;
	color?: string | null;
	featuredImage?: string | null;
	isFavorite?: boolean;
	autoReindex?: boolean;
	parentId?: string | null;
	presetId?: string | null;
}

/**
 * Interfaz para actualizar una carpeta
 */
export interface UpdateFolderData {
	name?: string;
	description?: string | null;
	path?: string;
	emoji?: string | null;
	color?: string | null;
	featuredImage?: string | null;
	isFavorite?: boolean;
	autoReindex?: boolean;
	totalFiles?: number;
	totalSize?: number;
	lastIndexed?: Date | null;
	parentId?: string | null;
	presetId?: string | null;
}

/**
 * Interfaz para filtros de búsqueda de carpetas
 */
export interface FolderFilters {
	searchQuery?: string;
	parentId?: string | null;
	onlyFavorites?: boolean;
	pathContains?: string;
	hasAutoReindex?: boolean;
}

/**
 * Tipo para carpetas en árbol de navegación
 */
export interface FolderTreeItem {
	id: string;
	name: string;
	path: string;
	parentId: string | null;
	emoji: string | null;
	color: string | null;

	children: FolderTreeItem[];
	level: number;
	isOpen: boolean;
	isSelected: boolean;
	hasChildren: boolean;
	totalItems?: number;
}

/**
 * Tipo para información resumida de carpeta
 */
export interface FolderSummary {
	id: string;
	name: string;
	path: string;
	imageCount: number;
	totalSize: number;
	lastIndexed: Date | null;
}

/**
 * Enumeración para criterios de ordenación
 */
export enum FolderSortCriteria {
	NAME_ASC = 'name:asc',
	NAME_DESC = 'name:desc',
	PATH_ASC = 'path:asc',
	PATH_DESC = 'path:desc',
	SIZE_ASC = 'size:asc',
	SIZE_DESC = 'size:desc',
	FILES_ASC = 'files:asc',
	FILES_DESC = 'files:desc',
	CREATED_ASC = 'created:asc',
	CREATED_DESC = 'created:desc',
	UPDATED_ASC = 'updated:asc',
	UPDATED_DESC = 'updated:desc',
	INDEXED_ASC = 'indexed:asc',
	INDEXED_DESC = 'indexed:desc',
}

/**
 * Mapa de propiedades para ordenación
 */
export const FOLDER_SORT_PROPERTY_MAP: Record<FolderSortCriteria, string> = {
	[FolderSortCriteria.NAME_ASC]: 'name',
	[FolderSortCriteria.NAME_DESC]: 'name',
	[FolderSortCriteria.PATH_ASC]: 'path',
	[FolderSortCriteria.PATH_DESC]: 'path',
	[FolderSortCriteria.SIZE_ASC]: 'totalSize',
	[FolderSortCriteria.SIZE_DESC]: 'totalSize',
	[FolderSortCriteria.FILES_ASC]: 'totalFiles',
	[FolderSortCriteria.FILES_DESC]: 'totalFiles',
	[FolderSortCriteria.CREATED_ASC]: 'createdAt',
	[FolderSortCriteria.CREATED_DESC]: 'createdAt',
	[FolderSortCriteria.UPDATED_ASC]: 'updatedAt',
	[FolderSortCriteria.UPDATED_DESC]: 'updatedAt',
	[FolderSortCriteria.INDEXED_ASC]: 'lastIndexed',
	[FolderSortCriteria.INDEXED_DESC]: 'lastIndexed',
};

/**
 * 📋 Propiedades base de un Folder
 */
export interface Folder {
	id: string;
	name: string;
	path: string;
	description: string;
	color: string;
	emoji: string;
	parentId: string | null;
	createdAt: Date;
	updatedAt: Date;
	_count?: {
		children: number;
		images: number;
		uploadedImages: number;
		tags: number;
	};
}

/**
 * 📊 Estadísticas de un Folder
 */
export interface FolderStats {
	totalImages: number;
	totalUploadedImages: number;
	totalChildren: number;
	totalTags: number;
	lastUpdated: Date;
	createdAt: Date;
	level: number;
	isRoot: boolean;
	isEmpty: boolean;
	hasChildren: boolean;
	size: number;
}

/**
 * 📁 Folder con estadísticas
 */
export interface FolderWithStats extends Folder {
	stats: FolderStats;
}

/**
 * 📂 Propiedades adicionales de UI para un Folder
 */
export interface FolderUIProps {
	isSelected: boolean;
	isOpen: boolean;
	isLoading: boolean;
	hasError: boolean;
	isDragging: boolean;
	isDropTarget: boolean;
	level: number;
}

/**
 * 📁 Folder completo con todas las relaciones
 */
export interface FolderComplete extends Folder {
	children: Folder[];
	parent: Folder | null;
	stats: FolderStats | null;
	metadata: Record<string, any>;
}

/**
 * 📂 Folder extendido para UI
 */
export interface FolderExtended extends FolderComplete, FolderUIProps {}

/**
 * 📋 Filtros para la búsqueda de Folders
 */
export interface FolderFilter {
	id?: string;
	name?: string;
	path?: string;
	parentId?: string | null;
	createdAt?: Date | { gte?: Date; lte?: Date };
	updatedAt?: Date | { gte?: Date; lte?: Date };
}

/**
 * 📋 Opciones de inclusión para búsquedas
 */
export interface FolderInclude {
	parent?: boolean;
	children?: boolean;
	images?: boolean;
	count?: boolean;
}

/**
 * 📋 Opciones para la búsqueda de Folders
 */
export interface FolderSearchOptions {
	filter?: FolderFilter;
	sortBy?: FolderSortBy;
	skip?: number;
	take?: number;
	include?: FolderInclude;
}

/**
 * 📋 Datos para crear un Folder
 */
export interface FolderCreateInput {
	name: string;
	path?: string;
	description?: string;
	color?: string;
	emoji?: string;
	parentId?: string | null;
	metadata?: Record<string, any>;
}

/**
 * 📋 Datos para actualizar un Folder
 */
export interface FolderUpdateInput {
	name?: string;
	path?: string;
	description?: string;
	color?: string;
	emoji?: string;
	parentId?: string | null;
	metadata?: Record<string, any>;
}

/**
 * 📂 Estado core de Folder para el store
 */
export interface FolderCoreState {
	items: FolderComplete[];
	selected: FolderComplete | null;
	isLoading: boolean;
	error: Error | null;
}

/**
 * 📋 Acciones core para el store de Folder
 */
export interface FolderCoreActions {
	// Carga de datos
	loadFolders: () => Promise<void>;
	loadFolder: (id: string) => Promise<FolderComplete | null>;

	// Operaciones CRUD
	createFolder: (data: FolderCreateInput) => Promise<FolderComplete>;
	updateFolder: (id: string, data: FolderUpdateInput) => Promise<FolderComplete>;
	deleteFolder: (id: string) => Promise<void>;

	// Selección
	setSelected: (folder: FolderComplete | null) => void;

	// Estado
	setLoading: (isLoading: boolean) => void;
	setError: (error: Error | null) => void;
	reset: () => void;
}

/**
 * 📋 Filtros para Folder
 */
export interface FolderFilters {
	searchTerm: string;
	sortBy: FolderSortBy;
	parentId: string | null;
	onlyFavorites: boolean;
}

/**
 * 📋 Acciones de filtro para el store de Folder
 */
export interface FolderFilterActions {
	updateFilters: (filters: Partial<FolderFilters>) => void;
	clearFilters: () => void;
	getFilteredFolders: () => FolderComplete[];
	getSortedFolders: () => FolderComplete[];
}

/**
 * 📋 Estado UI para Folder
 */
export interface FolderUIState {
	viewMode: FolderViewMode;
	selectedIds: string[];
	expandedIds: string[];
	isModalOpen: boolean;
	currentModalId: string | null;
	modalMode: 'create' | 'edit' | 'delete' | null;
}

/**
 * 📋 Acciones UI para el store de Folder
 */
export interface FolderUIActions {
	setViewMode: (mode: FolderViewMode) => void;

	// Selección
	selectFolder: (id: string) => void;
	unselectFolder: (id: string) => void;
	selectMultipleFolders: (ids: string[]) => void;
	clearSelection: () => void;

	// Expansión
	expandFolder: (id: string) => void;
	collapseFolder: (id: string) => void;
	toggleFolderExpansion: (id: string) => void;

	// Modales
	openCreateModal: () => void;
	openEditModal: (id: string) => void;
	openDeleteModal: (id: string) => void;
	closeModal: () => void;
}

/**
 * 📋 Store completo de Folder
 */
export interface FolderStore extends FolderCoreState, FolderCoreActions {
	filters: FolderFilters;
	ui: FolderUIState;

	// Acciones de filtros
	updateFilters: (filters: Partial<FolderFilters>) => void;
	clearFilters: () => void;
	getFilteredFolders: () => FolderComplete[];
	getSortedFolders: () => FolderComplete[];

	// Acciones de UI
	setViewMode: (mode: FolderViewMode) => void;
	selectFolder: (id: string) => void;
	unselectFolder: (id: string) => void;
	selectMultipleFolders: (ids: string[]) => void;
	clearSelection: () => void;
	expandFolder: (id: string) => void;
	collapseFolder: (id: string) => void;
	toggleFolderExpansion: (id: string) => void;
	openCreateModal: () => void;
	openEditModal: (id: string) => void;
	openDeleteModal: (id: string) => void;
	closeModal: () => void;
}
