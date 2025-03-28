/**
 * @file Adaptador para conectar los server actions de carpetas con el nuevo store de carpetas
 * @module adapters/folder
 */

import type { FolderResponse, ProcessStatus } from '@/app/actions/folders/folder-types';
import { serverLogger } from '@/lib/logger/server-logger';
import { deserializeFolderResponse } from '@/transformers/folder';
import type { CreateFolderData, FolderExtended, UpdateFolderData } from '@/types/entities/folder';

const adapterLogger = serverLogger.withContext('FolderAdapter');

/**
 * Tipo para respuesta estandarizada de server actions
 */
export interface ActionResponse<T = any> {
	success: boolean;
	message: string;
	data?: T;
	errors?: any;
}

/**
 * Adapta el formato antiguo de respuesta al nuevo formato estandarizado
 * @param folderResponse Respuesta del server action antiguo
 * @returns Respuesta en el nuevo formato
 */
export function adaptFolderResponse(folderResponse: FolderResponse | null): ActionResponse<FolderExtended> {
	if (!folderResponse) {
		return {
			success: false,
			message: 'No se encontró la carpeta',
		};
	}

	try {
		// Usar el transformador para convertir al nuevo formato
		const transformedFolder = deserializeFolderResponse(folderResponse);

		return {
			success: true,
			message: 'Carpeta obtenida correctamente',
			data: transformedFolder,
		};
	} catch (error) {
		adapterLogger.error('❌ Error adaptando respuesta de carpeta:', error);
		return {
			success: false,
			message: 'Error al procesar datos de carpeta',
			errors: error instanceof Error ? error.message : String(error),
		};
	}
}

/**
 * Adapta un arreglo de carpetas al formato estándar
 * @param foldersResponse Respuesta con múltiples carpetas
 * @returns Respuesta en formato estándar
 */
export function adaptFoldersArray(foldersResponse: FolderResponse[]): ActionResponse<FolderExtended[]> {
	try {
		const transformedFolders = foldersResponse.map(deserializeFolderResponse);

		return {
			success: true,
			message: 'Carpetas obtenidas correctamente',
			data: transformedFolders,
		};
	} catch (error) {
		adapterLogger.error('❌ Error adaptando respuesta de carpetas:', error);
		return {
			success: false,
			message: 'Error al procesar datos de carpetas',
			errors: error instanceof Error ? error.message : String(error),
		};
	}
}

/**
 * Adapta los datos de creación al formato esperado por el server action
 * @param createData Datos para crear carpeta en nuevo formato
 * @returns Datos en formato esperado por el server action
 */
export function adaptCreateFolderData(createData: CreateFolderData): string {
	// El server action actual solo requiere la ruta como parámetro
	return createData.path;
}

/**
 * Adapta los datos de actualización al formato esperado por el server action
 * @param id ID de la carpeta
 * @param updateData Datos para actualizar en el nuevo formato
 * @returns Datos en formato esperado por el server action
 */
export function adaptUpdateFolderData(id: string, updateData: UpdateFolderData): { id: string; data: any } {
	// Adaptar al formato actual del server action
	return {
		id,
		data: {
			name: updateData.name,
			description: updateData.description,
			emoji: updateData.emoji,
			color: updateData.color,
			isFavorite: updateData.isFavorite,
			autoReindex: updateData.autoReindex,
			// Otros campos según sea necesario
		},
	};
}

/**
 * Adapta el estado de procesamiento del formato antiguo al nuevo
 * @param status Estado de procesamiento en formato antiguo
 * @returns Estado en formato estandarizado
 */
export function adaptProcessStatus(status: ProcessStatus): any {
	return {
		status: status.status || 'unknown',
		progress: status.progress || 0,
		currentFile: status.currentFile,
		phase: status.phase || 'unknown',
		filesProcessed: status.filesProcessed || 0,
		totalFiles: status.totalFiles || 0,
		startTime: status.startTime,
		endTime: status.endTime,
		processingSpeed: status.processingSpeed,
		estimatedTimeRemaining: status.estimatedTimeRemaining,
		errors: status.errors || [],
	};
}

/**
 * Maneja errores de forma estándar para los server actions de carpetas
 * @param error Error capturado
 * @returns Respuesta de error estandarizada
 */
export function handleFolderActionError(error: unknown): ActionResponse {
	adapterLogger.error('❌ Error en acción de carpeta:', error);

	let message = 'Error desconocido al procesar la carpeta';

	if (error instanceof Error) {
		message = error.message;

		// Manejo específico según el tipo de error
		if (error.name === 'FolderError') {
			switch (message) {
				case 'PATH_REQUIRED':
					message = 'Se requiere una ruta para la carpeta';
					break;
				case 'PATH_NOT_FOUND':
					message = 'La ruta especificada no existe';
					break;
				case 'FOLDER_EXISTS':
					message = 'La carpeta ya está registrada en el sistema';
					break;
				default:
					// Mantener el mensaje original
					break;
			}
		}
	}

	return {
		success: false,
		message,
		errors: error,
	};
}
