export class FolderError extends Error {
	constructor(
		message: string,
		public cause?: unknown
	) {
		super(message);
		this.name = 'FolderError';
	}
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

export interface ProcessStatus {
	status?: string;
	current?: number;
	total?: number;
	progress?: number;
	currentFile?: string;
	timestamp?: number;
	folderId?: string;
	phase?: 'scanning' | 'indexing' | 'thumbnails' | 'metadata' | 'error' | 'starting';
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
}

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
	isPublic?: boolean;
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

// Constantes
export const SUPPORTED_FORMATS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];

export interface ErrorResponse {
	message: string;
	details?: string;
	folderId?: string;
	phase?: string;
	timestamp: number;
	type?: string;
}

export interface IndexCallbacks {
	onProgress?: (status: ProcessStatus) => void;
	onError?: (error: ErrorResponse) => void;
	onComplete?: (data: FolderResponse) => void;
}
