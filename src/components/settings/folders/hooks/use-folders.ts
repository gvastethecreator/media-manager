'use client';

import { useCallback, useEffect, useState } from 'react';
import { reindexAllFolders } from '@/app/actions/folders';
import type {
	ErrorResponse,
	FolderResponse,
	ProcessStatus,
	ReindexAllCompleteData,
	ReindexAllProgressData,
} from '@/app/actions/folders/folder-types';
import { clientLogger } from '@/lib/logger/client-logger';
import { toastService } from '@/services/toast.service';
import type { FolderComplete } from '@/types/entities/folder/types';
import { initialGlobalReindexStatus } from '../folder-types';
import { useFoldersEvents } from './use-folders-events';
import { useFoldersOperations } from './use-folders-operations';
import { useFoldersPolling } from './use-folders-polling';
import { useFoldersState } from './use-folders-state';

const folderLogger = clientLogger.withContext('useFolders');

/**
 * Hook principal para la gestión completa de carpetas
 */
export function useFolders() {
	// Estados locales específicos de este hook
	const [isProcessing, setIsProcessing] = useState(false);
	const [processProgress, setProcessProgress] = useState(0);
	const [processStatus, setProcessStatus] = useState<ExtendedProcessStatus>({});
	const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
	const [globalReindexStatus, setGlobalReindexStatus] = useState(initialGlobalReindexStatus);
	const [showReindexDialog, setShowReindexDialog] = useState(false);
	const [reindexAllDialogOpen, setReindexAllDialogOpen] = useState(false);

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
				status: 'Proceso completado',
				progress: 100,
				folderId: folderId,
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
						return {};
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
					setProcessStatus({});
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

	// Iniciar un proceso
	const startProcessing = useCallback((folderId: string) => {
		setIsProcessing(true);
		setProcessStatus({
			folderId,
			status: 'Iniciando proceso...',
			progress: 0,
			phase: 'starting',
			startTime: Date.now(),
			timestamp: Date.now(),
		});
		setProcessProgress(0);
	}, []);

	// Sistema de polling - AHORA ES SEGURO USARLO PORQUE LAS FUNCIONES YA ESTÁN DEFINIDAS
	const { startPolling, stopPolling } = useFoldersPolling({
		onStatusUpdate: handleStatusUpdate,
		onComplete: handleProcessComplete,
	});

	// --- FIX: Validación defensiva para evitar pasar un objeto como folderId ---
	const safeStartPolling = useCallback(
		(folderId: string) => {
			if (typeof folderId !== 'string') {
				folderLogger.warn('⚠️ [FIX] startPolling llamado con folderId no string:', folderId);
				return;
			}
			startPolling(folderId);
		},
		[startPolling]
	);

	// Configurar eventos de servidor (respaldo)
	useFoldersEvents({
		onProgress: handleStatusUpdate,
		onError: handleProcessError,
		onComplete: (data: FolderResponse) => {
			folderLogger.info('✅ Evento de finalización recibido:', data);

			// Actualizar carpetas con resultado
			if (data?.id) {
				// Convertir fechas string a objetos Date
				const folderUpdate: Partial<FolderComplete> = {
					...data,
					_count: {
						images: data.stats?.total || 0,
					},
					totalSize: data.stats?.totalSize || 0,
					lastIndexed: new Date(),
					// Convertir strings a Date donde sea necesario
					createdAt: data.createdAt ? new Date(data.createdAt) : undefined,
					updatedAt: data.updatedAt ? new Date(data.updatedAt) : undefined,
				};

				updateFolder(data.id, folderUpdate);

				// Actualizar estadísticas globales si hay datos
				if (data.stats) {
					updateStats({
						totalFiles: data.stats.total || 0,
						totalSize: data.stats.totalSize || 0,
						lastIndexed: new Date(),
					});
				}

				// Marcar proceso como completado
				handleProcessComplete(data.id);
			}
		},
		onStats: updateStats,
		onReindexAllStart: (data: { totalFolders: number }) => {
			folderLogger.info('🔄 Evento de inicio de reindexación global recibido:', data);
			setGlobalReindexStatus({
				isProcessing: true,
				progress: 0,
				processedFolders: 0,
				totalFolders: data.totalFolders,
				errors: [],
				phase: 'preparing',
				status: 'Preparando proceso...',
				startTime: Date.now(),
			});
		},
		onReindexAllProgress: (data: ReindexAllProgressData) => {
			folderLogger.info('🔄 Evento de progreso de reindexación global recibido:', data);
			setGlobalReindexStatus((prev) => ({
				...prev,
				processedFolders: data.processedFolders,
				progress: data.processedFolders > 0 ? (data.processedFolders / prev.totalFolders) * 100 : prev.progress,
				currentFolder: data.currentFolder,
				phase: data.phase || prev.phase,
				status: data.status || prev.status,
				errors: [
					...prev.errors,
					...(data.errors || []).filter(
						(error) => !prev.errors.some((e) => e.folderId === error.folderId && e.error === error.error)
					),
				],
				lastUpdate: Date.now(),
			}));
		},
		onReindexAllComplete: (data: ReindexAllCompleteData) => {
			folderLogger.info('✅ Evento de finalización de reindexación global recibido:', data);
			const endTime = Date.now();
			const duration = endTime - (globalReindexStatus.startTime || endTime);

			setGlobalReindexStatus((prev) => ({
				...prev,
				isProcessing: false,
				progress: 100,
				processedFolders: data.processedFolders || prev.totalFolders,
				phase: 'complete',
				status: 'Proceso completado',
				endTime,
				duration,
			}));

			// Recargar estadísticas
			loadStats();

			// Recargar carpetas después de completar
			loadFolders().catch((error) => folderLogger.error('Error recargando carpetas:', error));
		},
	});

	// Operaciones CRUD
	const {
		handleAddFolder,
		handleReindexFolder,
		handleRemoveFolder,
		handleAutoReindexToggle,
		handleReindexAll,
		handleClearCache,
	} = useFoldersOperations({
		onStartProcessing: (folderId: string) => {
			startProcessing(folderId);
			safeStartPolling(folderId);
		},
		onLoadData: loadInitialData,
		onError: (error) => {
			const errorMessage = typeof error === 'string' ? error : error.message;
			setError(errorMessage);
			stopPolling();
			setIsProcessing(false);
		},
		onReindexAllStart: () => setReindexAllDialogOpen(true),
	});

	// Manejador para establecer carpeta seleccionada (para eliminación)
	const handleFolderClick = useCallback((folderId: string) => {
		setSelectedFolder((prev) => (prev === folderId ? null : folderId));
	}, []);

	// Manejador para confirmar reindexación global
	const handleConfirmReindexAll = useCallback(async () => {
		try {
			folderLogger.info('🔄 Confirmando reindexación global');

			// Cerrar diálogos
			setReindexAllDialogOpen(false);
			setShowReindexDialog(false);

			// Establecer estado de procesamiento global
			setGlobalReindexStatus({
				...initialGlobalReindexStatus,
				isProcessing: true,
				progress: 0,
				phase: 'preparing',
				status: 'Preparando reindexación global...',
				startTime: Date.now(),
			});

			// Llamar a la acción del servidor para reindexar todas las carpetas
			await reindexAllFolders();

			// Nota: Los eventos del servidor actualizarán el estado y mostrarán el progreso
		} catch (error) {
			folderLogger.error('❌ Error en reindexación global:', error);

			// Actualizar estado global
			setGlobalReindexStatus({
				...initialGlobalReindexStatus,
				isProcessing: false,
				errors: [{ folderId: '', error: error instanceof Error ? error.message : 'Error desconocido' }],
			});

			// Mostrar error
			setError(error instanceof Error ? error.message : 'Error en la reindexación global');
		}
	}, [setError]);

	// Cargar datos iniciales
	useEffect(() => {
		loadInitialData().catch((error) => {
			folderLogger.error('❌ Error cargando datos iniciales:', error);
			setError(error instanceof Error ? error.message : 'Error cargando datos iniciales');
		});

		// Limpiar polling al desmontar
		return () => {
			stopPolling();
		};
	}, [loadInitialData, stopPolling, setError]);

	// Gestionar polling según estado de procesamiento
	useEffect(() => {
		if (!isProcessing && processStatus.folderId) {
			// Si se detiene el procesamiento pero hay una carpeta en estado, detener polling
			stopPolling();
		}
	}, [isProcessing, processStatus.folderId, stopPolling]);

	// Devolver interfaz pública del hook
	return {
		// Estado
		folders,
		stats,
		error,
		isLoading,
		isProcessing,
		isGloballyProcessing,
		processProgress,
		processStatus,
		selectedFolder,
		globalReindexStatus,
		showReindexDialog,
		reindexAllDialogOpen,

		// Manejadores
		handleAddFolder,
		handleReindexFolder,
		handleFolderClick,
		handleReindexAll,
		handleConfirmReindexAll,
		handleAutoReindexToggle,
		handleClearCache,
		handleRemoveFolder,

		// Métodos
		loadStats,
		setShowReindexDialog,
		setReindexAllDialogOpen,
		setError,
	};
}

// Definición local para ExtendedProcessStatus
export interface ExtendedProcessStatus extends ProcessStatus {
	globalProgress?: {
		current: number;
		total: number;
		progress: number;
	};
}

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
