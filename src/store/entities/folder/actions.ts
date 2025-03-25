/**
 * @file Acciones integradas para el store de carpetas que conectan con los server actions
 * @module store/entities/folder/actions
 */

import {
	createFolder as createFolderAction,
	deleteFolder as deleteFolderAction,
	getFolder as getFolderAction,
	getFolders as getFoldersAction,
	updateFolder as updateFolderAction
} from '@/app/actions/folders/folder-crud.actions';

import {
	adaptCreateFolderData,
	adaptFolderResponse,
	adaptFoldersArray,
	adaptUpdateFolderData,
	handleFolderActionError
} from '@/adapters/folder';

import { clientLogger } from '@/lib/logger/client-logger';
import type { CreateFolderData, UpdateFolderData } from '@/types/entities/folder';

const actionsLogger = clientLogger.withContext('FolderStoreActions');

/**
 * Obtiene todas las carpetas
 * @returns Promise con el resultado de la operación
 */
export async function fetchFolders() {
  try {
    actionsLogger.info('🔍 Obteniendo todas las carpetas');
    const foldersData = await getFoldersAction();
    return adaptFoldersArray(foldersData);
  } catch (error) {
    return handleFolderActionError(error);
  }
}

/**
 * Obtiene una carpeta por su ID
 * @param id ID de la carpeta
 * @returns Promise con el resultado de la operación
 */
export async function fetchFolderById(id: string) {
  try {
    actionsLogger.info(`🔍 Obteniendo carpeta con ID: ${id}`);
    const folderData = await getFolderAction(id);
    return adaptFolderResponse(folderData);
  } catch (error) {
    return handleFolderActionError(error);
  }
}

/**
 * Crea una nueva carpeta
 * @param data Datos para la creación de la carpeta
 * @returns Promise con el resultado de la operación
 */
export async function createFolder(data: CreateFolderData) {
  try {
    actionsLogger.info('➕ Creando nueva carpeta');
    const adaptedData = adaptCreateFolderData(data);
    const result = await createFolderAction(adaptedData);
    return adaptFolderResponse(result);
  } catch (error) {
    return handleFolderActionError(error);
  }
}

/**
 * Actualiza una carpeta existente
 * @param id ID de la carpeta
 * @param data Datos para actualizar
 * @returns Promise con el resultado de la operación
 */
export async function updateFolder(id: string, data: UpdateFolderData) {
  try {
    actionsLogger.info(`✏️ Actualizando carpeta con ID: ${id}`);
    const { id: folderId, data: updateData } = adaptUpdateFolderData(id, data);
    const result = await updateFolderAction(folderId, updateData);
    return adaptFolderResponse(result);
  } catch (error) {
    return handleFolderActionError(error);
  }
}

/**
 * Elimina una carpeta
 * @param id ID de la carpeta
 * @returns Promise con el resultado de la operación
 */
export async function deleteFolder(id: string) {
  try {
    actionsLogger.info(`🗑️ Eliminando carpeta con ID: ${id}`);
    await deleteFolderAction(id);
    return {
      success: true,
      message: 'Carpeta eliminada correctamente'
    };
  } catch (error) {
    return handleFolderActionError(error);
  }
}

// Exportar todas las acciones integradas
export const folderActions = {
  fetchFolders,
  fetchFolderById,
  createFolder,
  updateFolder,
  deleteFolder
};