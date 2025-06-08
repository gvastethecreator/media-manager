'use client';

import { getFolderProcessingStatus } from '@/app/actions/folders/status.actions';
import { clientLogger } from '@/lib/logger/client-logger';
import { normalizeId } from '@/lib/utils/id.utils';
import type { ProcessStatus } from '@/types/process';
import { useCallback, useRef, useState } from 'react';

const pollingLogger = clientLogger.withContext('FoldersPolling');

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
		if (!processingFolderRef.current) {
			return;
		}

		try {
			const folderId = processingFolderRef.current;
			const originalId = originalFolderIdRef.current || folderId;

			// Usar el ID original para la solicitud para obtener diagnósticos
			const url = `/api/folders/status?folderId=${originalId}`;

			pollingLogger.info('📡 Polling de estado para carpeta', {
				originalId,
				normalizedId: folderId,
			});

			// ✨ Reemplazar llamada a API con Server Action
			const data = await getFolderProcessingStatus(folderId);

			// Verificar si la Server Action retornó un error
			if (data.error) {
				throw new Error(`Error obteniendo estado: ${data.error}`);
			}

			// Reiniciar contador de errores
			pollingErrorCountRef.current = 0;

			// Verificar primero si el proceso está marcado como completo
			if (data.isComplete) {
				pollingLogger.info('✅ API indica que el proceso está completo:', {
					folderId,
					originalId,
					finishedAt: data.finishedAt,
					mappings: data.knownMappings,
				});

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

			// Ver si podemos encontrar el estado usando cualquiera de los IDs activos
			if (!data.status && data.allActiveIds && data.allActiveIds.length > 0) {
				pollingLogger.info('🔍 Buscando estado alternativo entre IDs activos', {
					activeIds: data.allActiveIds,
					originalId,
					normalizedId: folderId,
				});

                                // Verificar si hay un ID similar al actual
                                for (const activeId of data.allActiveIds) {
                                        if (activeId.includes(folderId.substring(0, 10)) || folderId.includes(activeId.substring(0, 10))) {
                                                try {
                                                        const altData = await getFolderProcessingStatus(activeId);
                                                        if (altData.status) {
                                                                pollingLogger.info('✅ Encontrado estado usando ID alternativo', {
                                                                        alternativeId: activeId,
                                                                        originalId,
                                                                        normalizedId: folderId,
                                                                });

                                                                // Usar este estado alternativo
                                                                data.status = altData.status;
                                                                break;
                                                        }
                                                } catch (error) {
                                                        pollingLogger.warn('❌ Error al consultar estado alternativo', { alternativeId: activeId, error });
                                                }
                                        }
                                }
			}

			// Procesar el estado normalmente si está disponible
			if (data.status) {
				const status = data.status as ProcessStatus;

				// Reiniciar contador de no estado
				consecutiveNoStatusCountRef.current = 0;

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
			} else {
				// Incrementar contador de no estado
				consecutiveNoStatusCountRef.current++;

				pollingLogger.warn('⚠️ No se encontró estado para la carpeta', {
					folderId,
					originalId,
					consecutiveNoStatus: consecutiveNoStatusCountRef.current,
					mappings: data.knownMappings,
				});

				// Si no hay estado por 10 verificaciones consecutivas y hay progreso
				// forzar un estado completo para evitar que se quede atascado
				if (consecutiveNoStatusCountRef.current >= 10) {
					pollingLogger.info('⚠️ Forzando finalización después de múltiples intentos sin estado', {
						folderId,
						originalId,
						attempts: consecutiveNoStatusCountRef.current,
					});

					// Generar estado completo forzado
					const forcedStatus: ProcessStatus = {
						folderId,
						phase: 'complete',
						progress: 100,
						status: 'Proceso completado',
						timestamp: Date.now(),
					};

					// Actualizar estado y notificar finalización
					onStatusUpdate(forcedStatus);
					onComplete(folderId);

					// Detener polling
					stopPolling();
				}
			}
		} catch (error) {
			// Incrementar contador de errores
			pollingErrorCountRef.current++;

			const errorMessage = `Error en polling: ${error instanceof Error ? error.message : String(error)}`;
			pollingLogger.error(errorMessage, {
				errorCount: pollingErrorCountRef.current,
				folderId: processingFolderRef.current,
				originalId: originalFolderIdRef.current,
			});

			// Si hay demasiados errores consecutivos, detener el polling
			if (pollingErrorCountRef.current >= 5) {
				pollingLogger.error('Demasiados errores de polling, deteniendo', {
					errorCount: pollingErrorCountRef.current,
				});
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
