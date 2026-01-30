import { useCallback, useEffect, useRef, useState } from 'react';

// Helpers top-level para reducir complejidad cognitiva en callbacks
const isStatusComplete = (s: ProcessStatus): boolean =>
	s.phase === 'complete' || s.progress === 100 || (s.isProcessing === false && (s.progress || 0) > 90);

const shouldIgnoreAsOrphan = (
	s: ProcessStatus,
	activeId: string,
	flags: { isReindexAll: boolean; isProcessing: boolean }
): boolean => {
	if (flags.isReindexAll) {
		return false;
	}
	if (flags.isProcessing) {
		return false;
	}
	// No ignorar si no tenemos carpeta activa aún (evita perder el primer SSE)
	if (!activeId) {
		return false;
	}
	// No ignorar si el propio evento indica que está procesando
	if ((s as any).isProcessing) {
		return false;
	}
	return activeId !== s.folderId;
};
// Extra: encapsular aplicación de estado para reducir complejidad del callback
function applyLatestStatus(
	latest: ProcessStatus,
	ctx: {
		activeFolderId: string;
		isReindexAll: boolean;
		isProcessing: boolean;
		orphanWarned: Set<string>;
		setProcessProgress: (n: number) => void;
		setProcessStatus: (updater: (prev: ExtendedProcessStatus) => ExtendedProcessStatus) => void;
		setIsProcessing: (v: boolean) => void;
		onComplete: (folderId: string) => void;
		setProgressByFolder?: React.Dispatch<React.SetStateAction<Record<string, ExtendedProcessStatus>>>;
	}
) {
	if (!latest.folderId) {
		folderLogger.warn('⚠️ Actualización de estado sin folderId, ignorando');
		return;
	}
	const ignoreAsOrphan = shouldIgnoreAsOrphan(latest, ctx.activeFolderId, {
		isReindexAll: ctx.isReindexAll,
		isProcessing: ctx.isProcessing,
	});
	if (ignoreAsOrphan) {
		if (!ctx.orphanWarned.has(latest.folderId)) {
			ctx.orphanWarned.add(latest.folderId);
			folderLogger.warn('⚠️ Evento SSE huérfano detectado para carpeta no activa, ignorando:', {
				eventFolderId: latest.folderId,
				currentFolderId: ctx.activeFolderId,
				isProcessing: ctx.isProcessing,
			});
		}
		return;
	}
	if (typeof latest.progress === 'number') {
		ctx.setProcessProgress(latest.progress);
	}
	ctx.setProcessStatus((prevStatus: ExtendedProcessStatus) => ({
		...prevStatus,
		...latest,
		timestamp: latest.timestamp || Date.now(),
	}));

	// Actualizar mapa de progreso por carpeta si corresponde
	if (latest.folderId && ctx.setProgressByFolder) {
		const key = latest.folderId as string;
		ctx.setProgressByFolder((prev) => ({
			...prev,
			[key]: {
				isProcessing: latest.isProcessing ?? true,
				progress: typeof latest.progress === 'number' ? latest.progress : (prev[key]?.progress ?? 0),
				message: latest.message ?? prev[key]?.message,
				folderId: key,
				phase: latest.phase ?? prev[key]?.phase ?? 'processing',
				timestamp: latest.timestamp || Date.now(),
				filesProcessed: latest.filesProcessed ?? prev[key]?.filesProcessed,
				totalFiles: latest.totalFiles ?? prev[key]?.totalFiles,
				status: (latest as any).status ?? prev[key]?.status ?? 'processing',
				startTime: prev[key]?.startTime ?? Date.now(),
			},
		}));
	}
	if (latest.folderId && latest.phase !== 'complete' && latest.progress !== 100) {
		ctx.setIsProcessing(true);
	}
	if (isStatusComplete(latest) && latest.folderId) {
		ctx.onComplete(latest.folderId);
		toastService.success('Proceso completado correctamente');
	}
}

import { useReindexAllFolders } from '@/lib/api/folders';
import { clientLogger } from '@/lib/logger/client-logger';
import { toastService } from '@/lib/ui/toast';
import type { FolderWithStats } from '@/types/entities/folder';
import type { ErrorResponse, ProcessStatus } from '@/types/folders';
import { type ExtendedProcessStatus, initialGlobalReindexStatus } from '../folder-types';
import { useFoldersEvents } from './use-folders-events';
import { useFoldersOperations } from './use-folders-operations';
import { useFoldersState } from './use-folders-state';

const folderLogger = clientLogger.withContext('useFolders');

/**
 * Hook principal para la gestión completa de carpetas
 * Migrado a usar FolderWithStats para mejor rendimiento
 */
export function useFolders() {
	// Estados locales específicos de este hook
	const [isProcessing, setIsProcessing] = useState(false);
	const [processProgress, setProcessProgress] = useState(0);
	const [processStatus, setProcessStatus] = useState<ExtendedProcessStatus>({
		folderId: '',
		status: 'completed',
		progress: 0,
		isProcessing: false,
		phase: 'complete',
		timestamp: Date.now(),
	});
	const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
	const [globalReindexStatus, setGlobalReindexStatus] = useState(initialGlobalReindexStatus);
	// Progreso por carpeta y orden de reindexado para UI
	const [progressByFolder, setProgressByFolder] = useState<Record<string, ExtendedProcessStatus>>({});
	const [reindexOrder, setReindexOrder] = useState<string[]>([]);
	// Refs para optimización de eventos y evitar cierres obsoletos
	const rafIdRef = useRef<number | null>(null);
	const lastStatusRef = useRef<ProcessStatus | null>(null);
	const orphanWarnedRef = useRef<Set<string>>(new Set());
	const isProcessingRef = useRef(false);
	const processStatusRef = useRef<ExtendedProcessStatus | null>(null);
	const isReindexAllRef = useRef(false);
	// Estados de diálogos eliminados - reindexado directo sin confirmación

	// Estado básico
	const {
		folders,
		stats,
		error,
		isLoading,
		loadFolders,
		loadStats,
		loadInitialData,
		updateFolder,
		updateStats,
		setError,
	} = useFoldersState();

	// Check if any process is running
	const isGloballyProcessing = isProcessing || globalReindexStatus.isProcessing;

	// Mantener refs sincronizadas
	useEffect(() => {
		isProcessingRef.current = isProcessing;
	}, [isProcessing]);

	useEffect(() => {
		processStatusRef.current = processStatus;
	}, [processStatus]);

	useEffect(() => {
		isReindexAllRef.current = globalReindexStatus.isProcessing;
	}, [globalReindexStatus.isProcessing]);

	// Función para manejar la finalización de un proceso
	const handleProcessComplete = useCallback(
		async (folderId: string) => {
			folderLogger.info('✅ Proceso completado:', { folderId });

			// Limpiar estados INMEDIATAMENTE
			setIsProcessing(false);
			setProcessProgress(0);

			// Actualizar UI para mostrar completado por un momento
			setProcessStatus((prev: ExtendedProcessStatus) => ({
				...prev,
				phase: 'complete',
				status: 'completed',
				progress: 100,
				folderId,
			}));

			// 🟢 FIX: Forzar recarga inmediata de carpetas y estadísticas tras completar
			try {
				await Promise.all([loadFolders(/*forceNoCache*/), loadStats()]);
				folderLogger.info('🟢 Carpetas y stats recargadas tras completar proceso');
			} catch (err) {
				folderLogger.error('❌ Error recargando carpetas/stats tras completar:', err);
			}

			// Limpiar estado después de mostrar completado
			setTimeout(() => {
				setProcessStatus((prev: ExtendedProcessStatus) => {
					// Solo limpiar si el folderId aún coincide (evita limpiar un proceso diferente)
					if (prev.folderId === folderId) {
						folderLogger.info('🧹 Limpiando estado de proceso para carpeta:', folderId);
						return {
							folderId: '',
							status: 'completed',
							progress: 0,
							isProcessing: false,
							phase: 'complete',
							timestamp: Date.now(),
						};
					}
					return prev;
				});

				// Asegurarse una vez más que se ha limpiado el estado de procesamiento
				setIsProcessing(false);
				setProcessProgress(0);
			}, 1000); // ⏱️ Reducido el timeout para mayor reactividad
		},
		[loadFolders, loadStats]
	);

	// Función para manejar los errores de procesamiento
	const handleProcessError = useCallback(
		(errorData: ErrorResponse) => {
			folderLogger.error('❌ Error procesando carpeta:', errorData);

			// 🔧 FIX: Limpiar estado inmediatamente al recibir error
			setIsProcessing(false);
			setProcessProgress(0);

			// Reflejar el error en el estado local
			if (errorData.folderId) {
				// Actualizar la carpeta con el error
				updateFolder(errorData.folderId, {
					error: errorData.message,
					lastIndexed: new Date(),
				});

				// Si estamos procesando esa carpeta específicamente, limpiar su estado
				if (processStatus.folderId === errorData.folderId) {
					setProcessStatus({
						folderId: '',
						status: 'completed',
						progress: 0,
						isProcessing: false,
						phase: 'complete',
						timestamp: Date.now(),
					});
					setProcessProgress(0);
				}
			}

			// 🔧 FIX: Limpiar estados globales después de error
			setTimeout(() => {
				setIsProcessing(false);
				setProcessProgress(0);
				setProcessStatus({
					folderId: '',
					status: 'completed',
					progress: 0,
					isProcessing: false,
					phase: 'complete',
					timestamp: Date.now(),
				});
			}, 100);

			// Mostrar notificación de error
			toastService.error(errorData.message || 'Error desconocido al procesar la carpeta');
		},
		[updateFolder, processStatus.folderId]
	);

	// Función para manejar las actualizaciones de progreso
	const handleStatusUpdate = useCallback(
		(status: ProcessStatus) => {
			// Coalescer múltiples updates por frame para reducir renders
			lastStatusRef.current = status;
			if (rafIdRef.current !== null) {
				return;
			}
			rafIdRef.current = requestAnimationFrame(() => {
				rafIdRef.current = null;
				const latest = lastStatusRef.current;
				if (!latest) {
					return;
				}

				applyLatestStatus(latest, {
					activeFolderId: processStatusRef.current?.folderId || '',
					isReindexAll: isReindexAllRef.current,
					isProcessing: isProcessingRef.current,
					orphanWarned: orphanWarnedRef.current,
					setProcessProgress,
					setProcessStatus,
					setIsProcessing,
					onComplete: handleProcessComplete,
					setProgressByFolder,
				});
			});
		},
		[handleProcessComplete]
	);

	// Función para manejar el progreso del reindexado global
	const handleReindexAllProgress = useCallback(
		(status: ProcessStatus & { currentFolder?: string }) => {
			folderLogger.info('🌍 Progreso de reindexado global:', status);

			// Derivar estado de procesamiento de forma robusta
			const pct = Math.max(0, Math.min(100, status.progress ?? 0));
			const computedIsProcessing = Boolean(status.isProcessing) || pct < 100;
			const currentFolderId = status.currentFolder || status.folderId;

			setGlobalReindexStatus((prev) => ({
				...prev,
				isProcessing: computedIsProcessing,
				progress: pct,
				currentFolder: (currentFolderId as string) || prev.currentFolder,
				processedFolders: status.filesProcessed || prev.processedFolders,
				totalFolders: status.totalFiles || prev.totalFolders,
				lastUpdate: Date.now(),
			}));

			// Mantener progreso por carpeta durante reindexado global
			if (status.folderId) {
				setProgressByFolder((prev) => ({
					...prev,
					[status.folderId as string]: {
						isProcessing: computedIsProcessing && (currentFolderId === status.folderId || pct < 100),
						progress: pct ?? prev[status.folderId as string]?.progress ?? 0,
						folderId: status.folderId,
						phase: status.phase || 'processing',
						timestamp: status.timestamp || Date.now(),
						filesProcessed: status.filesProcessed ?? prev[status.folderId as string]?.filesProcessed,
						totalFiles: status.totalFiles ?? prev[status.folderId as string]?.totalFiles,
						status: (status as any).status ?? prev[status.folderId as string]?.status ?? 'processing',
						startTime: prev[status.folderId as string]?.startTime ?? Date.now(),
					},
				}));
			}

			// Asegurar que la carpeta actual va primero en el orden observado
			if (currentFolderId) {
				setReindexOrder((prev) => [currentFolderId as string, ...prev.filter((id) => id !== currentFolderId)]);
			}

			// Considerar finalizado cuando el progreso llega a 100
			if (pct === 100) {
				folderLogger.info('✅ Reindexado global completado');

				// Actualizar estado final
				setGlobalReindexStatus((prev) => ({
					...prev,
					isProcessing: false,
					progress: 100,
					endTime: Date.now(),
				}));

				// Notificar éxito
				toastService.success('Reindexado global completado correctamente');

				// Recargar datos para reflejar cambios (carpetas + estadísticas)
				Promise.all([loadFolders(), loadStats()]).catch((err) => {
					folderLogger.error('Error recargando carpetas/stats tras reindexado global:', err);
				});

				// Limpiar mapa de progreso y orden al finalizar
				setProgressByFolder({});
				setReindexOrder([]);
			}
		},
		[loadFolders, loadStats]
	);

	// Función de procesamiento simplificada (sin polling)
	const startProcessing = useCallback((folderId: string) => {
		setIsProcessing(true);
		setProcessStatus((prev) => ({
			...prev,
			folderId,
			status: 'processing',
			progress: 0,
			phase: 'starting',
			startTime: Date.now(),
			isProcessing: true,
		}));
	}, []);

	// Función para actualizar una carpeta específica
	const updateSpecificFolder = useCallback(
		(folderId: string, updates: Partial<FolderWithStats>) => {
			updateFolder(folderId, updates);
		},
		[updateFolder]
	);

	// Hooks de funcionalidades específicas
	const foldersEvents = useFoldersEvents({
		onProgress: handleStatusUpdate,
		onError: handleProcessError,
		onComplete: (data) => {
			if (data.folderId) {
				handleProcessComplete(data.folderId);
			} else if (data.id) {
				handleProcessComplete(data.id);
			}
		},
		onStats: () => {
			// Callback vacío para stats
		},
		onReindexAllProgress: handleReindexAllProgress,
		onDirectoryDeleted: ({ folderId }) => {
			if (folderId) {
				// Remover carpeta de estado y refrescar estadísticas
				setProgressByFolder((prev) => {
					const copy = { ...prev };
					delete copy[folderId];
					return copy;
				});
				setReindexOrder((prev) => prev.filter((id) => id !== folderId));
				// Recargar desde API para reflejar eliminación
				Promise.all([loadFolders(), loadStats()]).catch((err) =>
					folderLogger.error('Error recargando tras directory:deleted:', err)
				);
			}
		},
	});

	const foldersOperations = useFoldersOperations({
		onStartProcessing: (folderId: string) => {
			setIsProcessing(true);
			setProcessStatus((prev) => ({
				...prev,
				folderId,
				status: 'processing',
				progress: 0,
				isProcessing: true,
				phase: 'starting',
				timestamp: Date.now(),
			}));
		},
		onLoadData: loadFolders,
		onError: (err) => setError(err.toString()),
		onReindexAllStart: () => {
			setGlobalReindexStatus((prev) => ({
				...prev,
				isProcessing: true,
				progress: 0,
				processedFolders: 0,
				startTime: Date.now(),
			}));
		},
	});

	// Polling removido - la reindexación es síncrona
	// const foldersPolling = useFoldersPolling({
	//	onStatusUpdate: handleStatusUpdate,
	//	onComplete: handleProcessComplete,
	// });

	// Hook para reindexación global - debe estar en el nivel superior
	const reindexAllFoldersMutation = useReindexAllFolders();

	// Función para reiniciar todas las carpetas
	const reindexAll = useCallback(
		async (options?: { useStructuredFlow?: boolean; skipThumbnails?: boolean; skipMetadata?: boolean }) => {
			// 🔧 FIX: Evitar bucle infinito si ya está procesando
			if (globalReindexStatus.isProcessing) {
				folderLogger.warn('⚠️ Reindexación global ya en progreso, omitiendo');
				return;
			}

			folderLogger.info('🔄 Iniciando reindexación global', { options });

			try {
				setGlobalReindexStatus((prev) => ({
					...prev,
					isProcessing: true,
					progress: 0,
					processedFolders: 0,
					errors: [],
					startTime: Date.now(),
				}));

				// Resetear estructuras de tracking
				setProgressByFolder({});
				setReindexOrder([]);

				// 🔧 FIX: Usar await para asegurar que no se llame múltiples veces
				const result = await reindexAllFoldersMutation.mutateAsync(options);

				folderLogger.info('✅ Reindexación global completada:', result);

				if (result.errors.length > 0) {
					toastService.error(`Reindexación completada con ${result.errors.length} errores`);
				} else {
					toastService.success(`Reindexación completada correctamente. ${result.processed} carpetas procesadas`);
				}

				// Recargar datos solo después de que termine completamente
				await Promise.all([loadFolders(), loadStats()]);
			} catch (reindexError) {
				folderLogger.error('❌ Error en reindexación global:', reindexError);
				toastService.error('Error en la reindexación global');
			} finally {
				// 🔧 FIX: Asegurar que siempre se limpie el estado
				setGlobalReindexStatus((prev) => ({
					...prev,
					isProcessing: false,
					progress: 100, // Asegurar que llegue al 100%
					endTime: Date.now(),
				}));
			}
		},
		[reindexAllFoldersMutation, loadFolders, loadStats, globalReindexStatus.isProcessing]
	);

	// Función para manejar el reindex de una carpeta específica
	const reindexFolder = useCallback(
		async (
			folderId: string,
			options?: {
				useStructuredFlow?: boolean;
				skipThumbnails?: boolean;
				skipMetadata?: boolean;
			}
		) => {
			if (!folderId || folderId === 'undefined' || typeof folderId !== 'string') {
				folderLogger.error('[useFolders] ❌ Error: Invalid folderId provided to reindexFolder:', folderId);
				return;
			}

			folderLogger.info(`🔄 Iniciando reindex de carpeta: ${folderId}`, { options });

			try {
				await foldersOperations.handleReindexFolder(folderId, options);
			} catch (err1) {
				folderLogger.error(`❌ Error en reindex de carpeta ${folderId}:`, err1);
				handleProcessError({
					error: err1 instanceof Error ? err1.message : 'Error desconocido',
					message: err1 instanceof Error ? err1.message : 'Error desconocido',
					folderId,
					timestamp: Date.now(),
				});
			}
		},
		[foldersOperations, handleProcessError]
	);

	// Función para manejar click en carpeta (seleccionar o eliminar)
	const handleFolderClick = useCallback(
		async (folderId: string) => {
			if (selectedFolder === folderId) {
				// Si ya está seleccionada, eliminar
				try {
					await foldersOperations.handleRemoveFolder(folderId);
					setSelectedFolder(null);
					toastService.success('Carpeta eliminada correctamente');
				} catch (err2) {
					folderLogger.error('❌ Error eliminando carpeta:', err2);
					toastService.error('Error al eliminar la carpeta');
				}
			} else {
				// Si no está seleccionada, seleccionar para eliminar
				setSelectedFolder(folderId);
			}
		},
		[selectedFolder, foldersOperations]
	);

	// Función para seleccionar carpeta
	const selectFolder = useCallback((folderId: string | null) => {
		setSelectedFolder(folderId);
	}, []);

	// Efecto para cargar datos iniciales
	useEffect(() => {
		loadInitialData();
	}, [loadInitialData]);

	// Cleanup al desmontar
	useEffect(() => {
		return () => {
			// foldersPolling.cleanup?.(); // Polling removido
			// No cleanup needed for foldersEvents
		};
	}, []);

	return {
		// Datos
		folders,
		stats,
		selectedFolder,
		progressByFolder,
		reindexOrder,

		// Estados de carga y error
		isLoading,
		error,
		isProcessing,
		isGloballyProcessing,
		processProgress,
		processStatus,
		globalReindexStatus,

		// Estados de UI eliminados - no más diálogos de confirmación

		// Acciones principales
		reindexFolder,
		reindexAll,
		selectFolder,

		// Operaciones desde foldersOperations
		handleAddFolder: foldersOperations.handleAddFolder,
		handleReindexFolder: foldersOperations.handleReindexFolder,
		handleReindexAll: foldersOperations.handleReindexAll,
		handleClearCache: foldersOperations.handleClearCache,
		handleFolderClick,

		// Funciones de UI eliminadas - no más diálogos de confirmación

		// Funciones de datos
		loadFolders,
		loadStats,
		updateFolder: updateSpecificFolder,
		setError, // desde useFoldersState

		// Funciones de utilidad
		startProcessing,
		handleProcessComplete,
		handleProcessError,
		handleStatusUpdate,
	};
}

// Re-export del hook eliminado para evitar exportar imports (regla lint)

// Re-export tipos necesarios
export type { ExtendedProcessStatus } from '../folder-types';

/**
 * 🛠️ FIX: Se fuerza la recarga de carpetas y estadísticas tras la finalización de un proceso
 * para asegurar que la UI refleje el estado actualizado en tiempo real, incluso si hay delays
 * de caché o diferencias de IDs entre backend y frontend.
 *
 * - Se reduce el timeout de limpieza para mayor reactividad.
 * - Se documenta el motivo y el flujo.
 *
 * Diagrama de flujo:
 *
 * ```mermaid
 * graph TD
 *   A[Proceso Backend Termina] --> B[Evento/Callback onComplete]
 *   B --> C[setProcessStatus(complete)]
 *   C --> D[loadFolders() + loadStats()]
 *   D --> E[UI Refresca Estado]
 *   E --> F[setTimeout Limpia Estado]
 * ```
 */
