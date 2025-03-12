import type { ExtendedProcessStatus, ProcessStatus } from '@/types/process';
import type { Image } from './images';

export interface FolderStats {
	totalFolders: number;
	totalFiles: number;
	totalSize: number;
	lastIndexed: Date | null;
	createdAt: Date;
	updatedAt: Date;
}

export interface Folder {
	id: string;
	name: string;
	path: string;
	totalFiles?: number;
	totalSize?: number;
	lastIndexed?: Date | string | null;
	createdAt: Date | string;
	updatedAt: Date | string;
	autoReindex?: boolean;
	featuredImage?: string | null;
	isFavorite?: boolean;

	// Relaciones
	images?: Image[];

	// Imágenes recientes para mostrar en la tarjeta
	recentImages?: string[];

	// Contadores
	_count?: {
		images?: number;
	};
}

export type { ProcessStatus, ExtendedProcessStatus };
