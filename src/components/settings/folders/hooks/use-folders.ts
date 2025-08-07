import { useCallback, useEffect, useState } from 'react';
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
			}, 1500); // ⏱️ Reducido el timeout para mayor reactividad
		},
		[loadFolders, loadStats]
	);

	// Función para manejar los errores de procesamiento
	const handleProcessError = useCallback(
		(errorData: ErrorResponse) => {
			folderLogger.error('❌ Error procesando carpeta:', errorData);

			// Actualizar estado global
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

			// Mostrar notificación de error
			toastService.error(errorData.message || 'Error desconocido al procesar la carpeta');
		},
		[updateFolder, processStatus.folderId]
	);

	// Función para manejar las actualizaciones de progreso
	const handleStatusUpdate = useCallback(
		(status: ProcessStatus) => {
			// Añadir log detallado con el estado completo para diagnóstico
			folderLogger.info('📊 Actualización de estado recibida (detallada):', JSON.stringify(status));

			// Si no hay fase o ID, ignorar la actualización
			if (!status.folderId) {
				folderLogger.warn('⚠️ Actualización de estado sin folderId, ignorando');
				return;
			}

			// Actualizar progreso general
			if (typeof status.progress === 'number') {
				setProcessProgress(status.progress);
			}

			// Actualizar estado del proceso
			setProcessStatus((prevStatus: ExtendedProcessStatus) => {
				const updatedStatus = {
					...prevStatus,
					...status,
					timestamp: status.timestamp || Date.now(),
				};
				folderLogger.info('🔄 Estado actualizado:', {
					folderId: updatedStatus.folderId,
					progress: updatedStatus.progress,
					phase: updatedStatus.phase,
				});
				return updatedStatus;
			});

			// Verificar si hay un folderId y actualizar el estado de carpeta específica
			if (status.folderId) {
				// Marcar como procesando si no está en fase de finalización
				if (status.phase !== 'complete' && status.progress !== 100) {
					setIsProcessing(true);
				}
			}

			// Verificar si es una fase de finalización
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
				folderLogger.info('✅ Proceso completado detectado:', status);

				// Si tenemos el ID de la carpeta, marcarla como completada
				if (status.folderId) {
					handleProcessComplete(status.folderId);
					toastService.success('Proceso completado correctamente');
				}
			}
		},
		[handleProcessComplete]
	);

	// Función para manejar el progreso del reindexado global
	const handleReindexAllProgress = useCallback(
		(status: ProcessStatus & { currentFolder?: string }) => {
			folderLogger.info('🌍 Progreso de reindexado global:', status);

			setGlobalReindexStatus((prev) => ({
				...prev,
				isProcessing: status.isProcessing,
				progress: status.progress || 0,
				currentFolder: status.currentFolder || prev.currentFolder,
				processedFolders: status.filesProcessed || prev.processedFolders,
				totalFolders: status.totalFiles || prev.totalFolders,
				lastUpdate: Date.now(),
			}));

			// Si el reindexado global ha terminado (progress 100% Y isProcessing false)
			if (!status.isProcessing && status.progress === 100) {
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

				// Recargar datos para reflejar cambios
				loadFolders().catch((err) => {
					folderLogger.error('Error recargando carpetas tras reindexado global:', err);
				});
			}
		},
		[loadFolders]
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
		onError: (error) => setError(error.toString()),
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
	const reindexAll = useCallback(async () => {
		folderLogger.info('🔄 Iniciando reindexación global');

		try {
			setGlobalReindexStatus((prev) => ({
				...prev,
				isProcessing: true,
				progress: 0,
				processedFolders: 0,
				errors: [],
				startTime: Date.now(),
			}));

			const result = await reindexAllFoldersMutation.mutateAsync();

			folderLogger.info('✅ Reindexación global completada:', result);

			if (result.errors.length > 0) {
				toastService.error(`Reindexación completada con ${result.errors.length} errores`);
			} else {
				toastService.success(`Reindexación completada correctamente. ${result.processed} carpetas procesadas`);
			}

			// Recargar datos
			await Promise.all([loadFolders(), loadStats()]);
		} catch (error) {
			folderLogger.error('❌ Error en reindexación global:', error);
			toastService.error('Error en la reindexación global');
		} finally {
			setGlobalReindexStatus((prev) => ({
				...prev,
				isProcessing: false,
				endTime: Date.now(),
			}));
		}
	}, [reindexAllFoldersMutation, loadFolders, loadStats]);

	// Función para manejar el reindex de una carpeta específica
	const reindexFolder = useCallback(
		async (folderId: string) => {
			if (!folderId || folderId === 'undefined' || typeof folderId !== 'string') {
				folderLogger.error('[useFolders] ❌ Error: Invalid folderId provided to reindexFolder:', folderId);
				return;
			}

			folderLogger.info(`🔄 Iniciando reindex de carpeta: ${folderId}`);

			try {
				await foldersOperations.handleReindexFolder(folderId);
			} catch (error) {
				folderLogger.error(`❌ Error en reindex de carpeta ${folderId}:`, error);
				handleProcessError({
					error: error instanceof Error ? error.message : 'Error desconocido',
					message: error instanceof Error ? error.message : 'Error desconocido',
					folderId,
					timestamp: Date.now(),
				});
			}
		},
		[foldersOperations, handleProcessError]
	);

	// Función para alternar el auto-reindex
	const toggleAutoReindex = useCallback(
		async (folderId: string, value: boolean) => {
			try {
				await foldersOperations.handleAutoReindexToggle(folderId, value);
				updateSpecificFolder(folderId, { autoReindex: value });
				toastService.success(`Auto-reindex ${value ? 'activado' : 'desactivado'}`);
			} catch (error) {
				folderLogger.error('❌ Error toggling auto-reindex:', error);
				toastService.error('Error al cambiar configuración de auto-reindex');
			}
		},
		[foldersOperations, updateSpecificFolder]
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
				} catch (error) {
					folderLogger.error('❌ Error eliminando carpeta:', error);
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
		toggleAutoReindex,
		selectFolder,

		// Operaciones desde foldersOperations
		handleAddFolder: foldersOperations.handleAddFolder,
		handleReindexFolder: foldersOperations.handleReindexFolder,
		handleReindexAll: foldersOperations.handleReindexAll,
		handleAutoReindexToggle: foldersOperations.handleAutoReindexToggle,
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

// Re-export hook específico para operaciones
export { useReindexAllFolders };

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
