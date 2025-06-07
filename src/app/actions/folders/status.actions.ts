'use server';

import { serverLogger } from '@/lib/logger/server-logger';
import { normalizeId } from '@/lib/utils/id.utils';
import { FOLDER_EVENTS, folderService } from '@/services/folder-service-export';
import type { ProcessStatus } from '@/types/process';

// Logger específico para el archivo
const statusActionsLogger = serverLogger.withContext('FolderStatusActions');

// Estado global compartido para procesos de reindexación (en memoria de esta instancia del servidor)
const lastProcessStatus: Record<string, ProcessStatus> = {};
const folderCompletionStatus: Record<string, boolean> = {};
const processFinishTime: Record<string, number> = {};
const rawToNormalizedIds: Record<string, string> = {}; // Mapeo entre IDs originales y normalizados

// Función para programar limpieza de estado
function scheduleStatusCleanup(folderId: string) {
	// Aumentar el tiempo a 30 segundos para dar más margen al cliente para verificar
	setTimeout(() => {
		// Solo limpiar si ha pasado al menos 30 segundos desde la finalización
		const finishTime = processFinishTime[folderId] || 0;
		const elapsed = Date.now() - finishTime;

		if (elapsed >= 30000) {
			delete lastProcessStatus[folderId];
			delete folderCompletionStatus[folderId];
			delete processFinishTime[folderId];
			statusActionsLogger.info(`🧹 Limpiando estado de carpeta ${folderId} después de ${elapsed}ms`);
		}
	}, 30000);
}

// Mantener un registro de los últimos estados procesados
// Estos listeners se ejecutarán cuando el módulo sea inicializado en el servidor
folderService.onProgress((status: ProcessStatus) => {
	if (status?.folderId) {
		const originalId = status.folderId;
		const folderId = normalizeId(originalId);
		rawToNormalizedIds[originalId] = folderId;

		const isComplete =
			status.phase === 'complete' ||
			(status.progress === 100 && status.phase === 'metadata') ||
			(status.progress === 100 &&
				typeof status.filesProcessed === 'number' &&
				typeof status.totalFiles === 'number' &&
				status.filesProcessed >= status.totalFiles);

		lastProcessStatus[folderId] = {
			...lastProcessStatus[folderId],
			...status,
			folderId, // Usar el ID normalizado
			timestamp: Date.now(),
		};

		statusActionsLogger.info(`📊 Actualización de estado para carpeta ${folderId}:`, {
			progress: status.progress,
			phase: status.phase,
			isComplete,
			originalId,
			normalizedId: folderId,
		});

		if (isComplete) {
			folderCompletionStatus[folderId] = true;
			processFinishTime[folderId] = Date.now();
			lastProcessStatus[folderId] = {
				...lastProcessStatus[folderId],
				phase: 'complete',
				status: 'Proceso completado',
				progress: 100,
				timestamp: Date.now(),
			};
			statusActionsLogger.info(`✅ Marcando carpeta ${folderId} como completada`);
			scheduleStatusCleanup(folderId);
		}
	}
});

// Manejar evento de completado (para asegurar limpieza y estado final)
// Definir el tipo FolderResponse ya que no está disponible en el módulo importado
interface FolderResponse {
	id: string;
	name: string;
	path?: string;
	totalFiles?: number;
	totalSize?: number;
	success?: boolean;
	error?: string;
}

folderService.on(FOLDER_EVENTS.COMPLETE, (data: FolderResponse) => {
	if (data?.id) {
		const originalId = data.id;
		const folderId = normalizeId(originalId);
		rawToNormalizedIds[originalId] = folderId;
		folderCompletionStatus[folderId] = true;
		processFinishTime[folderId] = Date.now();
		lastProcessStatus[folderId] = {
			...lastProcessStatus[folderId],
			phase: 'complete',
			status: 'Proceso completado',
			progress: 100,
			filesProcessed: data.totalFiles || 0,
			totalFiles: data.totalFiles || 0,
			timestamp: Date.now(),
			folderId,
		};
		statusActionsLogger.info(`✅ Evento COMPLETE recibido para carpeta ${folderId}`, {
			originalId,
			normalizedId: folderId,
		});
		scheduleStatusCleanup(folderId);
	}
});

/**
 * Server Action para obtener el estado de procesamiento de carpetas.
 * Si se proporciona folderId, devuelve el estado de esa carpeta. De lo contrario, devuelve todos los estados activos.
 * @param folderId Opcional: ID de la carpeta a consultar.
 * @returns Objeto con el estado del procesamiento.
 */
export async function getFolderProcessingStatus(folderId?: string) {
	try {
		statusActionsLogger.info(`⚡ Server Action: getFolderProcessingStatus (folderId: ${folderId || 'all'})`);

		if (folderId) {
			const normalizedFolderId = normalizeId(folderId);

			const knownMappings = Object.entries(rawToNormalizedIds)
				.filter(([original, normalized]) => normalized === normalizedFolderId || original === folderId)
				.map(([original, normalized]) => ({ original, normalized }));

			const status = lastProcessStatus[normalizedFolderId];
			const isComplete = folderCompletionStatus[normalizedFolderId] || false;
			const finishedAt = processFinishTime[normalizedFolderId] || null;

			statusActionsLogger.info(`Retornando estado para carpeta ${normalizedFolderId}:`, {
				hasStatus: !!status,
				isComplete,
				timeElapsed: finishedAt ? Date.now() - finishedAt : null,
				originalId: folderId,
				normalizedId: normalizedFolderId,
				knownMappings: knownMappings.length > 0 ? knownMappings : 'ninguno',
				allKnownIds: Object.keys(lastProcessStatus),
				currentStatus: status
					? {
							progress: status.progress,
							phase: status.phase,
						}
					: null,
			});

			return {
				status,
				isComplete,
				finishedAt,
				timestamp: Date.now(),
				originalId: folderId,
				normalizedId: normalizedFolderId,
				allActiveIds: Object.keys(lastProcessStatus),
				knownMappings: knownMappings.length > 0 ? knownMappings : null,
			};
		}

		// Devolver todos los estados activos
		return {
			statuses: lastProcessStatus,
			completionStatus: folderCompletionStatus,
			finishTimes: processFinishTime,
			idMappings: rawToNormalizedIds,
			timestamp: Date.now(),
		};
	} catch (error) {
		statusActionsLogger.error('❌ Error en getFolderProcessingStatus:', error);
		throw new Error(`Error obteniendo estado de carpetas: ${error instanceof Error ? error.message : String(error)}`);
	}
}