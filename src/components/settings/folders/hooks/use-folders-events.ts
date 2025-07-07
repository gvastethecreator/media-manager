import { useCallback, useEffect } from 'react';
import { clientLogger } from '@/lib/logger/client-logger';
import type { ErrorResponse, FolderResponse, FolderStats, ProcessStatus } from '@/types/folders';

const eventsLogger = clientLogger.withContext('FoldersEvents');

interface FolderEventsCallbacks {
	onProgress?: (status: ProcessStatus) => void;
	onError?: (error: ErrorResponse) => void;
	onComplete?: (data: FolderResponse) => void;
	onStats?: (stats: FolderStats) => void;
}

/**
 * Hook para gestionar los eventos del servidor relacionados con carpetas
 */
export function useFoldersEvents({
	onProgress = () => {},
	onError = () => {},
	onComplete = () => {},
	onStats = () => {},
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
				folderId: data.folderId,
				success: data.success,
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

	// Subscribirse a los eventos del servicio
	useEffect(() => {
		// Suscribirse a eventos con logging detallado
		eventsLogger.info('🎯 Suscribiéndose a eventos del servidor');

		// TODO: Implementar suscripciones cuando estén disponibles en el servicio
		// Por ahora solo logging

		// Cleanup
		return () => {
			eventsLogger.info('🧹 Limpiando suscripciones de eventos');
			// TODO: Implementar cleanup cuando estén disponibles las suscripciones
		};
	}, []);

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
