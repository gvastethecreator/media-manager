'use client';

import { normalizeId } from '@/lib/id-utils';
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

	// Detener polling - definido primero para evitar errores de referencia
	const stopPolling = useCallback(() => {
		if (pollingTimerRef.current) {
			clearInterval(pollingTimerRef.current);
			pollingTimerRef.current = null;
			setIsPolling(false);
			pollingLogger.info('🛑 Deteniendo polling');
		}
	}, []);

	// Función para obtener el estado actual
	const pollForStatus = useCallback(async () => {
		if (!processingFolderRef.current) {
			return;
		}

		try {
			const folderId = processingFolderRef.current;
			const url = `/api/folders/status?folderId=${folderId}`;

			pollingLogger.info(`📡 Polling de estado para carpeta ${folderId}`);

			const response = await fetch(url, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
				},
				cache: 'no-store',
				next: { revalidate: 0 }, // Asegurar que siempre obtenemos datos frescos
			});

			if (!response.ok) {
				throw new Error(`Error obteniendo estado: ${response.status}`);
			}

			const data = await response.json();

			// Verificar primero si el proceso está marcado como completo en la API
			if (data.isComplete) {
				pollingLogger.info('✅ API indica que el proceso está completo:', { folderId, finishedAt: data.finishedAt });

				// Notificar sobre la finalización forzando un estado completo
				const completeStatus: ProcessStatus = {
					folderId,
					phase: 'complete',
					progress: 100,
					status: 'Proceso completado',
					timestamp: Date.now(),
				};

				// Actualizar estado y notificar finalización
				onStatusUpdate(completeStatus);
				onComplete(folderId);

				// Detener polling inmediatamente
				setTimeout(() => {
					stopPolling();
				}, 500);

				return;
			}

			// Procesar el estado normalmente si no está marcado como completo
			if (data.status) {
				const status = data.status as ProcessStatus;

				// IMPORTANTE: Siempre procesamos el estado, sin importar el timestamp
				pollingLogger.info('📊 Progreso obtenido vía polling:', status);

				// Actualizar timestamp para referencia
				lastUpdatedRef.current[folderId] = status.timestamp || Date.now();

				// Notificar sobre la actualización
				onStatusUpdate(status);

				// Verificar si se completó el proceso
				const isComplete =
					status.phase === 'complete' ||
					(status.progress === 100 && status.phase === 'metadata') ||
					(status.progress === 100 &&
						typeof status.filesProcessed === 'number' &&
						typeof status.totalFiles === 'number' &&
						status.filesProcessed > 0 &&
						status.totalFiles > 0 &&
						status.filesProcessed >= status.totalFiles);

				if (isComplete) {
					pollingLogger.info('✅ Proceso completado detectado vía polling:', status);

					// Notificar sobre la finalización
					onComplete(folderId);

					// Detener polling después de un tiempo
					setTimeout(() => {
						stopPolling();
					}, 500);
				}
			} else if (!data.status && data.isComplete) {
				// Si no hay estado pero se indica que está completo
				pollingLogger.info('✅ No hay estado pero API indica proceso completo:', { folderId });
				onComplete(folderId);
				stopPolling();
			}
		} catch (error) {
			pollingLogger.error('Error en polling:', error);
		}
	}, [onStatusUpdate, onComplete, stopPolling]);

	// Iniciar polling
	const startPolling = useCallback(
		(folderId: string) => {
			// Normalizar el ID para evitar inconsistencias
			const normalizedId = normalizeId(folderId);

			// Establecer el ID de carpeta que estamos procesando (usando ID normalizado)
			processingFolderRef.current = normalizedId;

			pollingLogger.info(`🔄 Iniciando polling para carpeta: ${folderId} (normalizado: ${normalizedId})`);

			// Limpiar cualquier polling anterior
			stopPolling();

			// Ejecutar un polling inmediato para obtener el estado actual
			pollForStatus().catch((error) => pollingLogger.error('Error en polling inicial:', error));

			// Configurar nuevo intervalo de polling con intervalo más corto para mayor capacidad de respuesta
			pollingIntervalRef.current = 750; // Reducir a 750ms para mayor frecuencia
			pollingTimerRef.current = setInterval(pollForStatus, pollingIntervalRef.current);
			setIsPolling(true);
		},
		[pollForStatus, stopPolling]
	);

	return {
		isPolling,
		currentFolder: processingFolderRef.current,
		startPolling,
		stopPolling,
	};
}
