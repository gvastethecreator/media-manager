'use client';

import type { FolderResponse } from '@/app/actions/folders/folder-types.actions';
import { clientLogger } from '@/lib/logger/client-logger';
import { FOLDER_EVENTS, folderService } from '@/services/folder-service-export';
import type { FolderStats } from '@/types/entities/folder';
import type { ErrorResponse, ProcessStatus, ReindexAllCompleteData, ReindexAllProgressData } from '@/types/process';
import { useCallback, useEffect } from 'react';

const eventsLogger = clientLogger.withContext('FoldersEvents');

interface FolderEventsCallbacks {
	onProgress: (status: ProcessStatus) => void;
	onError: (error: ErrorResponse) => void;
	onComplete: (data: FolderResponse) => void;
	onStats: (stats: FolderStats) => void;
	onReindexAllStart: (data: { totalFolders: number }) => void;
	onReindexAllProgress: (data: ReindexAllProgressData) => void;
	onReindexAllComplete: (data: ReindexAllCompleteData) => void;
}

/**
 * Hook para gestionar los eventos del servidor relacionados con carpetas
 */
export function useFoldersEvents({
	onProgress,
	onError,
	onComplete,
	onStats,
	onReindexAllStart,
	onReindexAllProgress,
	onReindexAllComplete,
}: FolderEventsCallbacks) {
	// Manejador de progreso (como respaldo al polling)
	const handleProgress = useCallback(
		(status: ProcessStatus) => {
			if (!status) {
				return;
			}

			// Este método ahora sólo actúa como respaldo, ya que el polling es la fuente principal
			eventsLogger.info('📊 Progreso del proceso vía eventos:', status);

			try {
				// Asegurarnos de que el evento llegue al manejador principal
				onProgress(status);
			} catch (error) {
				eventsLogger.error('Error procesando evento de progreso:', error);
			}
		},
		[onProgress]
	);

	// Manejador de errores
	const handleError = useCallback(
		(error: ErrorResponse) => {
			eventsLogger.error('❌ Error procesando carpeta:', error);

			try {
				onError(error);
			} catch (err) {
				eventsLogger.error('Error al manejar el evento de error:', err);
			}
		},
		[onError]
	);

	// Manejador de finalización
	const handleComplete = useCallback(
		(data: FolderResponse) => {
			if (!data) {
				return;
			}

			eventsLogger.info('✅ Proceso completado vía evento complete:', {
				folderId: data.id,
				stats: data.stats,
			});

			try {
				onComplete(data);
			} catch (error) {
				eventsLogger.error('Error al manejar el evento de finalización:', error);
			}
		},
		[onComplete]
	);

	// Manejador de estadísticas
	const handleStats = useCallback(
		(stats: FolderStats) => {
			eventsLogger.info('📊 Estadísticas actualizadas:', stats);
			onStats(stats);
		},
		[onStats]
	);

	// Manejador de inicio de reindexación global
	const handleReindexAllStart = useCallback(
		(data: { totalFolders: number }) => {
			eventsLogger.info('🔄 Iniciando reindexación de todas las carpetas:', data);
			onReindexAllStart(data);
		},
		[onReindexAllStart]
	);

	// Manejador de progreso de reindexación global
	const handleReindexAllProgress = useCallback(
		(data: ReindexAllProgressData) => {
			eventsLogger.info('🔄 Progreso de reindexación global:', data);
			onReindexAllProgress(data);
		},
		[onReindexAllProgress]
	);

	// Manejador de finalización de reindexación global
	const handleReindexAllComplete = useCallback(
		(data: ReindexAllCompleteData) => {
			eventsLogger.info('✅ Reindexación global completada:', data);
			onReindexAllComplete(data);
		},
		[onReindexAllComplete]
	);

	// Subscribirse a los eventos del servicio
	useEffect(() => {
		// Suscribirse a eventos con logging detallado
		eventsLogger.info('🎯 Suscribiéndose a eventos del servidor');

		folderService.onProgress(handleProgress);
		folderService.onError(handleError);
		folderService.onComplete(handleComplete);
		folderService.onStats(handleStats);

		folderService.on(FOLDER_EVENTS.REINDEX_ALL_START, handleReindexAllStart);
		folderService.on(FOLDER_EVENTS.REINDEX_ALL_PROGRESS, handleReindexAllProgress);
		folderService.on(FOLDER_EVENTS.REINDEX_ALL_COMPLETE, handleReindexAllComplete);

		// Cleanup
		return () => {
			eventsLogger.info('🧹 Limpiando suscripciones de eventos');
			// Cancelar suscripciones específicas
			folderService.offProgress(handleProgress);
			folderService.offError(handleError);
			folderService.offComplete(handleComplete);
			folderService.offStats(handleStats);

			// Cancelar suscripciones genéricas
			folderService.off(FOLDER_EVENTS.REINDEX_ALL_START, handleReindexAllStart);
			folderService.off(FOLDER_EVENTS.REINDEX_ALL_PROGRESS, handleReindexAllProgress);
			folderService.off(FOLDER_EVENTS.REINDEX_ALL_COMPLETE, handleReindexAllComplete);
		};
	}, [
		handleProgress,
		handleError,
		handleComplete,
		handleStats,
		handleReindexAllStart,
		handleReindexAllProgress,
		handleReindexAllComplete,
	]);

	// También devolvemos funciones útiles para depuración
	return {
		emitManualProgress: (status: ProcessStatus) => {
			eventsLogger.info('🧪 Emitiendo evento de progreso manual:', status);
			handleProgress(status);
		},
		emitManualComplete: (data: FolderResponse) => {
			eventsLogger.info('🧪 Emitiendo evento de finalización manual:', data);
			handleComplete(data);
		},
	};
}
