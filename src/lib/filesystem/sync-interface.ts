/**
 * @file FileSystemSync interface — seam between filesystem operations and DB persistence.
 * @module lib/filesystem/sync-interface
 * @description Define el contrato para sincronización de archivos con la base de datos.
 * Los callers dependen de esta interfaz, no de la implementación que mezcla FS + DB.
 * Ver #6 deepening opportunity en architecture review.
 */

import type { FileInfo } from '@/types/file-entity-mapper';

export interface FileSystemSync {
	/** Sincroniza un archivo individual: verifica existencia en FS, compara hash, actualiza DB */
	syncFile(filePath: string, folderId: string): Promise<SyncFileResult>;

	/** Detecta archivos eliminados en FS que aún existen en DB */
	detectDeletedFiles(folderId: string): Promise<string[]>;

	/** Detecta archivos nuevos en FS que no existen en DB */
	detectNewFiles(folderId: string): Promise<FileInfo[]>;

	/** Limpia registros huérfanos en DB (archivo ya no existe en FS) */
	cleanOrphanRecords(folderId: string): Promise<number>;
}

export interface SyncFileResult {
	fileId: string;
	entityType: string;
	action: 'created' | 'updated' | 'skipped' | 'deleted';
	hash?: string;
}

/**
 * Operation de sincronización completa de carpeta.
 */
export interface FolderSyncResult {
	folderId: string;
	totalFiles: number;
	created: number;
	updated: number;
	skipped: number;
	deleted: number;
	errors: SyncError[];
	durationMs: number;
}

export interface SyncError {
	filePath: string;
	message: string;
}
