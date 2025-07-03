import { useCallback, useRef, useState } from 'react';
import type { ProcessStatus } from '@/app/actions/folders/types';
import { clientLogger } from '@/lib/logger/client-logger';
import { normalizeId } from '@/lib/utils/id.utils';

const pollingLogger = clientLogger.withContext('FoldersPolling');

interface UsePollingOptions {
	onStatusUpdate: (status: ProcessStatus) => void;
	onComplete: (folderId: string) => void;
}

// 🛠️ FIX: Polling robusto y UX reactiva
// - Reduce el umbral de intentos sin estado a 3
// - Polling cada 10s si el proceso está en 'starting', luego cada 30s
// - Si tras 3 intentos no hay estado, fuerza error y notifica

const DEFAULT_POLLING_INTERVAL = 30000; // 30s
const FAST_POLLING_INTERVAL = 10000; // 10s para fase 'starting'
const MAX_NO_STATUS_ATTEMPTS = 3;

/**
 * Hook para gestionar el polling de estado de carpetas
 */
export function useFoldersPolling({ onStatusUpdate, onComplete }: UsePollingOptions) {
	const [isPolling, setIsPolling] = useState(false);

	// Referencias para el polling
	const pollingTimerRef = useRef<NodeJS.Timeout | null>(null);
	const processingFolderRef = useRef<string | null>(null);
	const originalFolderIdRef = useRef<string | null>(null);
	const lastUpdatedRef = useRef<Record<string, number>>({});
	// Intervalo de polling más espaciado para reducir llamadas al servidor
	const pollingIntervalRef = useRef<number>(30000); // 30 segundos
	const pollingErrorCountRef = useRef<number>(0);
	const consecutiveNoStatusCountRef = useRef<number>(0);

	// Detener polling - definido primero para evitar errores de referencia
	const stopPolling = useCallback(() => {
		if (pollingTimerRef.current) {
			clearInterval(pollingTimerRef.current);
			pollingTimerRef.current = null;
			setIsPolling(false);
			pollingLogger.info('🛑 Deteniendo polling', {
				originalFolderId: originalFolderIdRef.current,
				normalizedFolderId: processingFolderRef.current,
			});

			// Reiniciar contadores
			pollingErrorCountRef.current = 0;
			consecutiveNoStatusCountRef.current = 0;
		}
	}, []);

	// Función para obtener el estado actual
	const pollForStatus = useCallback(async () => {
		if (!processingFolderRef.current) return;

		try {
			const folderId = processingFolderRef.current;
			const originalId = originalFolderIdRef.current || folderId;

			pollingLogger.info('📡 Polling de estado para carpeta', {
				originalId,
				normalizedId: folderId,
			});

			// TODO: Implementar getFolderProcessingStatus cuando esté disponible
			// Por ahora retornamos un estado simulado
			const data = { isComplete: false };

			pollingErrorCountRef.current = 0;

			// Ajustar intervalo de polling según fase
			let interval = DEFAULT_POLLING_INTERVAL;
			let statusObj: ProcessStatus | undefined;
			if ('status' in data && data.status && typeof data.status === 'object') {
				statusObj = data.status as ProcessStatus;
				if (statusObj.phase === 'starting') {
					interval = FAST_POLLING_INTERVAL;
				}
			}
			if (pollingIntervalRef.current !== interval) {
				if (pollingTimerRef.current) {
					clearInterval(pollingTimerRef.current);
					pollingTimerRef.current = setInterval(pollForStatus, interval);
				}
				pollingIntervalRef.current = interval;
			}

			if ('isComplete' in data && data.isComplete) {
				pollingLogger.info('✅ API indica que el proceso está completo:', {
					folderId,
					originalId,
					finishedAt: data.finishedAt,
					mappings: data.knownMappings,
				});
				const completeStatus: ProcessStatus = {
					folderId,
					phase: 'complete',
					progress: 100,
					status: 'Proceso completado',
					timestamp: Date.now(),
				};
				onStatusUpdate(completeStatus);
				onComplete(folderId);
				setTimeout(() => {
					stopPolling();
				}, 500);
				return;
			}

			if (statusObj) {
				consecutiveNoStatusCountRef.current = 0;
				pollingLogger.info('📊 Progreso obtenido vía polling:', statusObj);
				lastUpdatedRef.current[folderId] = statusObj.timestamp || Date.now();
				onStatusUpdate(statusObj);
				const isComplete =
					statusObj.phase === 'complete' ||
					(statusObj.progress === 100 && statusObj.phase === 'metadata') ||
					(statusObj.progress === 100 &&
						typeof statusObj.filesProcessed === 'number' &&
						typeof statusObj.totalFiles === 'number' &&
						statusObj.filesProcessed > 0 &&
						statusObj.totalFiles > 0 &&
						statusObj.filesProcessed >= statusObj.totalFiles);
				if (isComplete) {
					pollingLogger.info('✅ Proceso completado detectado vía polling:', statusObj);
					onComplete(folderId);
					setTimeout(() => {
						stopPolling();
					}, 500);
				}
			} else {
				consecutiveNoStatusCountRef.current++;
				pollingLogger.warn('⚠️ No se encontró estado para la carpeta', {
					folderId,
					originalId,
					consecutiveNoStatus: consecutiveNoStatusCountRef.current,
					mappings: data.knownMappings,
				});
				if (consecutiveNoStatusCountRef.current >= MAX_NO_STATUS_ATTEMPTS) {
					pollingLogger.error('❌ Estado de proceso no disponible tras varios intentos. Forzando error.', {
						folderId,
						attempts: consecutiveNoStatusCountRef.current,
					});
					const errorStatus: ProcessStatus = {
						folderId,
						phase: 'error',
						progress: 0,
						status: 'Error: no se pudo obtener el estado del proceso',
						timestamp: Date.now(),
					};
					onStatusUpdate(errorStatus);
					stopPolling();
				}
			}
		} catch (error) {
			pollingErrorCountRef.current++;
			const errorMessage = `Error en polling: ${error instanceof Error ? error.message : String(error)}`;
			pollingLogger.error(errorMessage, {
				errorCount: pollingErrorCountRef.current,
				folderId: processingFolderRef.current,
				originalId: originalFolderIdRef.current,
			});
			if (pollingErrorCountRef.current >= 5) {
				pollingLogger.error('Demasiados errores de polling, deteniendo', { errorCount: pollingErrorCountRef.current });
				stopPolling();
			}
		}
	}, [onStatusUpdate, onComplete, stopPolling]);

	// Iniciar polling
	const startPolling = useCallback(
		(folderId: string) => {
			// Guardar el ID original para referencia
			originalFolderIdRef.current = folderId;

			// Normalizar el ID para evitar inconsistencias
			const normalizedId = normalizeId(folderId);

			// Establecer el ID de carpeta que estamos procesando (usando ID normalizado)
			processingFolderRef.current = normalizedId;

			pollingLogger.info('🔄 Iniciando polling para carpeta', {
				originalId: folderId,
				normalizedId,
			});

			// Reiniciar contadores
			pollingErrorCountRef.current = 0;
			consecutiveNoStatusCountRef.current = 0;

			// Limpiar cualquier polling anterior
			stopPolling();

			// Ejecutar un polling inmediato para obtener el estado actual
			pollForStatus().catch((error) => pollingLogger.error('Error en polling inicial:', error));

			// Configurar intervalo de polling más espacioso
			pollingIntervalRef.current = 30000; // 30 segundos
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
