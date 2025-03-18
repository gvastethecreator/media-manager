import type { ExtendedProcessStatus, ProcessStatus } from '@/types/process';
import type { Prisma } from '@prisma/client';

export interface FolderStats {
	totalFolders: number;
	totalFiles: number;
	totalSize: number;
	lastIndexed: Date | null;
	createdAt: Date;
	updatedAt: Date;
}

/**
 * Representación de una carpeta en el sistema
 */
export type Folder = Prisma.FolderGetPayload<Record<string, never>> & {
	totalFiles?: number;
	totalSize?: number;
	imageCount?: number;
	lastIndexed?: Date | string;
	path?: string;
	presetId?: string | null;
};

/**
 * Datos para crear una carpeta
 */
export interface CreateFolderData {
	name: string;
	path: string;
	description?: string;
	emoji?: string;
	presetId?: string | null;
}

/**
 * Datos para actualizar una carpeta
 */
export interface UpdateFolderData {
	name?: string;
	description?: string;
	emoji?: string;
	presetId?: string | null;
}

/**
 * Resumen de una carpeta
 */
export interface FolderSummary {
	id: string;
	name: string;
	path: string;
	imageCount: number;
	totalSize: number;
	lastIndexed: Date | null;
}

export type { ExtendedProcessStatus, ProcessStatus };
