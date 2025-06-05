'use server';

/**
 * Reexportaciones para mantener compatibilidad con importaciones
 * que usan @/app/actions/folder (singular) en lugar de @/app/actions/folders (plural)
 */

// Importar específicamente desde folders/crud.actions
import {
	createFolder as createFolderAction,
	deleteFolder as deleteFolderAction,
	getFolders as getAllFoldersAction,
	getFolderById as getFolderByIdAction,
	updateFolder as updateFolderAction,
} from '../folders/crud.actions';

// Importar específicamente desde folders/process.actions
import { indexFolder as indexFolderAction, reindexFolder as reindexFolderAction } from '../folders/process.actions';

// Re-exportar acciones específicas como funciones async
export async function createFolder(data: any) {
	return createFolderAction(data);
}

export async function deleteFolder(id: string) {
	return deleteFolderAction(id);
}

export async function getAllFolders(params?: any) {
	return getAllFoldersAction(params);
}

export async function getFolderById(id: string) {
	return getFolderByIdAction(id);
}

export async function updateFolder(id: string, data: any) {
	return updateFolderAction(id, data);
}

export async function indexFolder(id: string, options?: any) {
	return indexFolderAction(id, options);
}

export async function reindexFolder(id: string, options?: any) {
	return reindexFolderAction(id, options);
}

// Re-exportar tipos específicos para compatibilidad
export type {
	FolderResponse,
	ProcessStatus,
} from '../folders/folder-types';
