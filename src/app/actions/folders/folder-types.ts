import type {
    CreateFolderData,
    FolderBase,
    FolderExtended,
    FolderSummary,
    UpdateFolderData,
} from '@/types/entities/folder';
import type { FolderStats } from '@/types/entities/folder/types';

// Re-exportamos los tipos principales
export type { CreateFolderData, FolderBase, FolderExtended, FolderStats, FolderSummary, UpdateFolderData };

// Estos tipos son específicos de las operaciones de procesamiento
// y no forman parte del modelo de datos central

/**
 * Estado del proceso de indexación
 */
export interface ProcessStatus {
	status?: string;
	current?: number;
	total?: number;
	progress?: number;
	currentFile?: string;
	timestamp?: number;
	folderId?: string;
	phase?:
		| 'scanning'
		| 'indexing'
		| 'thumbnails'
		| 'metadata'
		| 'error'
		| 'starting'
		| 'prepare'
		| 'scan'
		| 'index'
		| 'cleanup'
		| 'complete'
		| 'cancelled';
	filesProcessed?: number;
	totalFiles?: number;
	fileDetails?: {
		name: string;
		size: number;
		type: string;
		dimensions?: {
			width: number;
			height: number;
		};
	};
	extendedStats?: {
		fileTypes: { [key: string]: number };
		averageSize: number;
		processingSpeed: number;
		errorsByType: { [key: string]: number };
		healthScore: number;
	};
	errors?: Array<{
		file: string;
		error: string;
		timestamp: number;
	}>;
	globalProgress?: {
		current: number;
		total: number;
		progress: number;
	};
	startTime?: number;
	endTime?: number;
	processingSpeed?: number;
	estimatedTimeRemaining?: number;
	canCancel?: boolean;
	error?: string;
	// Propiedades adicionales para integraciones
	success?: boolean;
	message?: string;
	id?: string;
	name?: string;
	path?: string;
	totalSize?: number;
	stats?: {
		processed: number;
		total: number;
		totalSize: number;
	};
}

/**
 * Respuesta de operaciones de carpeta
 */
export interface FolderResponse {
	id: string;
	name: string;
	path: string;
	totalFiles?: number;
	totalSize?: number;
	lastIndexed?: string | null;
	createdAt?: string;
	updatedAt?: string;
	autoReindex?: boolean;
	_count?: {
		images: number;
	};
	folder?: {
		id: string;
		name: string;
		path: string;
		totalFiles?: number;
		totalSize?: number;
		lastIndexed?: string | null;
		createdAt: string;
		updatedAt: string;
		autoReindex?: boolean;
	};
	stats?: {
		processed: number;
		total: number;
		totalSize: number;
	};
	timestamp?: number;
	// Campos adicionales para respuestas de indexación
	success?: boolean;
	error?: string;
	total?: number;
	size?: number;
}

// Constantes
export const SUPPORTED_FORMATS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];

/**
 * Códigos de error específicos para operaciones de carpetas
 */
export enum FOLDER_ERROR_CODES {
	NOT_FOUND = 'FOLDER_NOT_FOUND',
	ALREADY_EXISTS = 'FOLDER_ALREADY_EXISTS',
	PATH_INVALID = 'FOLDER_PATH_INVALID',
	OPERATION_IN_PROGRESS = 'OPERATION_IN_PROGRESS',
	INDEXING_FAILED = 'INDEXING_FAILED',
	PERMISSION_DENIED = 'PERMISSION_DENIED',
	NETWORK_ERROR = 'NETWORK_ERROR',
	UNEXPECTED_ERROR = 'UNEXPECTED_ERROR',
}

/**
 * Respuesta de error en operaciones
 */
export interface ErrorResponse {
	message: string;
	details?: string;
	folderId?: string;
	phase?: string;
	timestamp: number;
	type?: string;
	code?: string;
}

// Callbacks para operaciones de indexación
export interface IndexCallbacks {
	onProgress?: (status: ProcessStatus) => void;
	onError?: (error: ErrorResponse) => void;
	onComplete?: (data: FolderResponse) => void;
	onCancel?: () => void;
}

/**
 * Interfaz para errores del servicio de carpetas
 */
export interface FolderError {
	name: string;
	message: string;
	code: FOLDER_ERROR_CODES;
	timestamp: number;
	folderId?: string;
	details?: string;
	stack?: string;
	cause?: unknown;
}

/**
 * Crea un objeto de error para operaciones de carpetas (enfoque funcional)
 */
export function createFolderError(
	message: string,
	code: FOLDER_ERROR_CODES = FOLDER_ERROR_CODES.UNEXPECTED_ERROR,
	details?: string,
	folderId?: string,
	cause?: unknown
): FolderError {
	return {
		name: 'FolderServiceError',
		message,
		code,
		timestamp: Date.now(),
		folderId,
		details: details || (cause instanceof Error ? cause.stack : undefined),
		stack: new Error(message).stack,
		cause,
	};
}

/**
 * Convierte un error genérico a FolderError
 */
export function fromError(error: unknown, folderId?: string): FolderError {
	// Si ya es un FolderError, lo devolvemos
	if (
		error &&
		typeof error === 'object' &&
		'code' in error &&
		'name' in error &&
		(error as any).name === 'FolderServiceError'
	) {
		return error as FolderError;
	}

	// Si es un Error estándar
	if (error instanceof Error) {
		return createFolderError(error.message, FOLDER_ERROR_CODES.UNEXPECTED_ERROR, error.stack, folderId, error);
	}

	// Cualquier otro tipo
	return createFolderError(String(error), FOLDER_ERROR_CODES.UNEXPECTED_ERROR, undefined, folderId, error);
}

/**
 * Convierte un FolderError a un objeto ErrorResponse para las acciones
 */
export function folderErrorToResponse(error: FolderError): ErrorResponse {
	return {
		message: error.message,
		details: error.details || error.stack || '',
		timestamp: error.timestamp,
		folderId: error.folderId,
		code: error.code,
	};
}

export interface FolderCreate {
	name: string;
	path: string;
	totalFiles?: number;
	totalSize?: number;
	lastIndexed?: Date;
}

export interface FolderUpdate extends Partial<Omit<FolderCreate, 'path'>> {
	id: string;
	path?: string;
	autoReindex?: boolean;
}

// Definición de las interfaces relacionadas con imágenes
export interface ImageEntity {
	id: string;
	name: string;
}

export interface ImageWithRelations {
	id?: string;
	name?: string;
	path?: string;
	size?: number;
	width?: number;
	height?: number;
	metadata?: Record<string, unknown>;
	thumbnail?: Buffer;
	thumbnailSize?: number;
	thumbnailWidth?: number;
	thumbnailHeight?: number;
	isFavorite?: boolean;
	folderId?: string;
	createdAt?: Date | string;
	updatedAt?: Date | string;
	collections?: ImageEntity[];
	tags?: ImageEntity[];
	albums?: ImageEntity[];
	characters?: ImageEntity[];
	places?: ImageEntity[];
	worldItems?: ImageEntity[];
}

/**
 * Opciones para indexación
 */
export interface IndexOptions {
	recursive?: boolean;
	skipExisting?: boolean;
	onProgress?: (status: ProcessStatus) => void;
	includeHidden?: boolean;
	batchSize?: number;
	processMetadata?: boolean;
	maxConcurrent?: number;
}

/**
 * Opciones para reindexación
 */
export interface ReindexOptions extends IndexOptions {
	deleteOrphans?: boolean;
	forceScan?: boolean;
}

/**
 * Estado de indexación
 */
export interface IndexState {
	id: string;
	status: 'pending' | 'running' | 'completed' | 'error' | 'cancelled';
	progress: number;
	started: Date;
	completed?: Date;
	message?: string;
	error?: string;
	stats?: {
		processed: number;
		total: number;
		totalSize: number;
	};
}

/**
 * Opciones para crear una carpeta
 */
export interface CreateFolderOptions {
	name?: string;
	description?: string;
	emoji?: string;
	color?: string;
	autoReindex?: boolean;
	parentId?: string | null;
	// Solo campos que existen en el esquema
}

/**
 * Opciones para actualizar una carpeta
 */
export interface UpdateFolderOptions {
	name?: string;
	description?: string;
	emoji?: string;
	color?: string;
	autoReindex?: boolean;
	parentId?: string | null;
	path?: string;
	totalFiles?: number;
	totalSize?: number;
	lastIndexed?: Date;
	// Solo campos que existen en el esquema
}

/**
 * 📦 Datos de progreso para reindexación global de carpetas
 * Usado en eventos y estado global de reindexado
 */
export interface ReindexAllProgressData {
	processedFolders: number;
	totalFolders: number;
	currentFolder?: string;
	phase?: string; // Puede ser 'preparing', 'index', 'complete', etc.
	status?: string;
	errors?: Array<{ folderId: string; error: string }>;
}

/**
 * 📦 Datos de finalización para reindexación global de carpetas
 * Usado en eventos y estado global de reindexado
 */
export interface ReindexAllCompleteData {
	processedFolders: number;
	totalFolders: number;
	errors: Array<{ folderId: string; error: string }>;
	phase?: string; // 'complete'
	status?: string;
	endTime?: number;
	duration?: number;
}

// 📝 Documentación: Estos tipos se usan para tipar los eventos y el estado global de reindexado en hooks y UI.
// Ver diagrama de flujo en la documentación del módulo.
