/**
 * @file Adaptador para conectar los server actions de carpetas con el nuevo store de carpetas
 * @module adapters/folder
 */

import { serverLogger } from '@/lib/logger/server-logger';
import { transformFolderToExtended } from '@/transformers/folder';
import type {
    CreateFolderData,
    FolderComplete,
    FolderExtended,
    UpdateFolderData,
} from '@/types/entities/folder';

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
 * Adapta la respuesta de una carpeta a una respuesta de acción con datos extendidos.
 * @param folderResponse Respuesta del server action que devuelve una carpeta completa.
 * @returns Respuesta en el nuevo formato ActionResponse<FolderExtended>.
 */
export function adaptFolderResponse(
	folderResponse: FolderComplete | null
): ActionResponse<FolderExtended> {
	if (!folderResponse) {
		return {
			success: false,
			message: 'No se encontró la carpeta',
		};
	}

	try {
		const transformedFolder = transformFolderToExtended(folderResponse);

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
 * Adapta un arreglo de carpetas al formato estándar de ActionResponse.
 * @param foldersResponse Un array de carpetas completas.
 * @returns Respuesta en formato ActionResponse<FolderExtended[]>.
 */
export function adaptFoldersArray(
	foldersResponse: FolderComplete[] | null | undefined
): ActionResponse<FolderExtended[]> {
	try {
		if (!foldersResponse || foldersResponse.length === 0) {
			return {
				success: true,
				message: 'No hay carpetas disponibles',
				data: [],
			};
		}

		const transformedFolders = foldersResponse.map((folder) =>
			transformFolderToExtended(folder)
		);

		return {
			success: true,
			message: 'Carpetas obtenidas correctamente',
			data: transformedFolders,
		};
	} catch (error) {
		adapterLogger.error('❌ Error adaptando array de carpetas:', error);
		return {
			success: false,
			message: 'Error al procesar la lista de carpetas',
			errors: error instanceof Error ? error.message : String(error),
		};
	}
}

/**
 * Adapta los datos de creación de carpeta. Por ahora, parece que solo devuelve el ID.
 * Esta función podría necesitar revisión dependiendo del caso de uso.
 * @param createData - Datos para crear la carpeta.
 * @returns El ID de la carpeta creada (aparentemente).
 */
export function adaptCreateFolderData(createData: CreateFolderData): CreateFolderData {
	// Actualmente, esta función no parece adaptar nada, solo pasa los datos.
	// Se mantiene por consistencia, pero podría ser eliminada o refactorizada.
	adapterLogger.info('Adaptando datos de creación de carpeta...', { createData });
	return createData;
}

/**
 * Adapta los datos de actualización de carpeta.
 * @param id - El ID de la carpeta a actualizar.
 * @param updateData - Los datos para actualizar.
 * @returns Un objeto con el ID y los datos de actualización.
 */
export function adaptUpdateFolderData(
	id: string,
	updateData: UpdateFolderData
): { id: string; data: UpdateFolderData } {
	adapterLogger.info(`Adaptando datos de actualización para la carpeta ${id}`, {
		updateData,
	});
	return { id, data: updateData };
}

/**
 * Interfaz genérica para el estado de un proceso.
 */
export interface ProcessStatus {
	status: 'processing' | 'completed' | 'failed';
	message: string;
	progress?: number;
}

/**
 * Adapta el estado de un proceso a una respuesta de acción.
 * @param status - El estado del proceso.
 * @returns Una respuesta de acción.
 */
export function adaptProcessStatus(status: ProcessStatus): ActionResponse<ProcessStatus> {
	adapterLogger.info('Adaptando estado del proceso:', { status });
	return {
		success: status.status !== 'failed',
		message: status.message,
		data: status,
	};
}

/**
 * Maneja errores de las acciones de carpeta y devuelve una respuesta estandarizada.
 * @param error - El error capturado.
 * @returns Una respuesta de acción de error.
 */
export function handleFolderActionError(error: unknown): ActionResponse {
	const errorMessage =
		error instanceof Error ? error.message : 'Ocurrió un error desconocido.';
	adapterLogger.error('❌ Error en la acción de carpeta:', { error });

	return {
		success: false,
		message: errorMessage,
		errors: error,
	};
}
