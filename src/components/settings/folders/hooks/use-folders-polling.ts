'use client';

import { logger } from '@/lib/logger';
import type { ProcessStatus } from '@/types/process';
import { useCallback, useRef, useState } from 'react';

const pollingLogger = logger.withContext('FoldersPolling');

interface UsePollingOptions {
	onStatusUpdate: (status: ProcessStatus) => void;
	onComplete: (folderId: string) => void;
}

/**
 * Hook para gestionar el polling de estado de carpetas
 */
export function useFoldersPolling({ onStatusUpdate, onComplete }: UsePollingOptions) {
	const [isPolling, setIsPolling] = useState(false);

	// Referencias para el polling
	const pollingTimerRef = useRef<NodeJS.Timeout | null>(null);
	const processingFolderRef = useRef<string | null>(null);
	const lastUpdatedRef = useRef<Record<string, number>>({});
	const pollingIntervalRef = useRef<number>(1500); // 1.5 segundos de intervalo

	// Función para obtener el estado actual
	const pollForStatus = useCallback(async () => {
		if (!processingFolderRef.current) {
			return;
		}

		try {
			const folderId = processingFolderRef.current;
			const url = `/api/folders/status?folderId=${folderId}`;

			const response = await fetch(url, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
				},
				cache: 'no-store',
			});

			if (!response.ok) {
				throw new Error(`Error obteniendo estado: ${response.status}`);
			}

			const data = await response.json();

			if (data.status) {
				const status = data.status as ProcessStatus;

				// Actualizar solo si el estado es más reciente que el último que tenemos
				const lastTimestamp = lastUpdatedRef.current[folderId] || 0;
				const newTimestamp = status.timestamp || Date.now();

				if (newTimestamp > lastTimestamp) {
					lastUpdatedRef.current[folderId] = newTimestamp;

					pollingLogger.info('📊 Progreso actualizado vía polling:', status);

					// Notificar sobre la actualización
					onStatusUpdate(status);

					// Verificar si se completó
					if (status.phase === 'complete') {
						pollingLogger.info('✅ Proceso completado detectado vía polling:', status);

						// Notificar sobre la finalización
						onComplete(folderId);

						// Detener polling después de un tiempo
						setTimeout(() => {
							stopPolling();
						}, 3000);
					}
				}
			}
		} catch (error) {
			pollingLogger.error('Error en polling:', error);
		}
	}, [onStatusUpdate, onComplete]);

	// Iniciar polling
	const startPolling = useCallback(
		(folderId: string) => {
			// Establecer el ID de carpeta que estamos procesando
			processingFolderRef.current = folderId;

			// Limpiar cualquier polling anterior
			stopPolling();

			// Configurar nuevo intervalo de polling
			pollingTimerRef.current = setInterval(pollForStatus, pollingIntervalRef.current);
			setIsPolling(true);

			pollingLogger.info('🔄 Iniciando polling para:', folderId);
		},
		[pollForStatus]
	);

	// Detener polling
	const stopPolling = useCallback(() => {
		if (pollingTimerRef.current) {
			clearInterval(pollingTimerRef.current);
			pollingTimerRef.current = null;
			setIsPolling(false);
			pollingLogger.info('🛑 Deteniendo polling');
		}
	}, []);

	return {
		isPolling,
		currentFolder: processingFolderRef.current,
		startPolling,
		stopPolling,
	};
}
