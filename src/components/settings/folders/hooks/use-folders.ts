'use client';

import type { FolderResponse } from '@/app/actions/folders/folder-types.actions';
import { useToast } from '@/components/ui/use-toast';
import { logger } from '@/lib/logger';
import type { FolderStats } from '@/types/entities/folders';
import type {
	ErrorResponse,
	ExtendedProcessStatus,
	ProcessStatus,
	ReindexAllCompleteData,
	ReindexAllProgressData,
} from '@/types/process';
import { useCallback, useEffect, useState } from 'react';
import { type ExtendedFolder, initialGlobalProcessingState, initialGlobalReindexStatus } from '../folder-types';
import { useFoldersEvents } from './use-folders-events';
import { useFoldersOperations } from './use-folders-operations';
import { useFoldersPolling } from './use-folders-polling';
import { useFoldersState } from './use-folders-state';

const folderLogger = logger.withContext('useFolders');

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
		},
		[updateFolder, processStatus.folderId]
	);

	// Función para manejar las actualizaciones de progreso
	const handleStatusUpdate = useCallback((status: ProcessStatus) => {
		// Actualizar progreso general
		if (typeof status.progress === 'number') {
			setProcessProgress(status.progress);
		}

		// Actualizar estado del proceso
		setProcessStatus((prevStatus) => ({
			...prevStatus,
			...status,
			timestamp: status.timestamp || Date.now(),
		}));

		// Verificar si es una fase de finalización
		if (status.phase === 'complete') {
			folderLogger.info('✅ Proceso completado detectado:', status);
		}
	}, []);

	// Función para manejar la finalización de un proceso
	const handleProcessComplete = useCallback(
		(folderId: string) => {
			folderLogger.info('✅ Proceso completado:', { folderId });

			// Limpiar estados
			setIsProcessing(false);
			setProcessProgress(0);

			// Actualizar UI para mostrar completado por un momento
			setProcessStatus((prev) => ({
				...prev,
				phase: 'complete',
				status: 'Proceso completado',
				progress: 100,
			}));

			// Recargar datos
			setTimeout(() => {
				loadFolders().catch((error) => folderLogger.error('Error recargando carpetas:', error));
			}, 500);

			// Limpiar estado después de mostrar completado
			setTimeout(() => {
				setProcessStatus({});
			}, 3000);
		},
		[loadFolders]
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

	// Sistema de polling
	const { startPolling, stopPolling } = useFoldersPolling({
		onStatusUpdate: handleStatusUpdate,
		onComplete: handleProcessComplete,
	});

	// Configurar eventos de servidor (respaldo)
	useFoldersEvents({
		onProgress: handleStatusUpdate,
		onError: handleProcessError,
		onComplete: (data: FolderResponse) => {
			// Actualizar carpetas con resultado
			if (data?.id) {
				updateFolder(data.id, {
					...data,
					_count: {
						images: data.stats?.total || 0,
					},
					totalSize: data.stats?.totalSize || 0,
					lastIndexed: new Date(),
					createdAt: new Date(),
					updatedAt: new Date(),
				});

				// Actualizar estadísticas globales si hay datos
				if (data.stats) {
					updateStats({
						totalFiles: data.stats.total || 0,
						totalSize: data.stats.totalSize || 0,
						lastIndexed: new Date(),
					});
				}
			}
		},
		onStats: updateStats,
		onReindexAllStart: (data: { totalFolders: number }) => {
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
			setGlobalReindexStatus((prev) => ({
				...prev,
				processedFolders: data.processedFolders,
				progress: (data.processedFolders / prev.totalFolders) * 100,
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
		onReindexAllComplete: () => {
			const endTime = Date.now();
			const duration = endTime - (globalReindexStatus.startTime || endTime);

			setGlobalReindexStatus((prev) => ({
				...prev,
				isProcessing: false,
				progress: 100,
				processedFolders: prev.totalFolders,
				phase: 'complete',
				status: 'Proceso completado',
				endTime,
				duration,
			}));

			// Recargar estadísticas
			loadStats();
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
			startPolling(folderId);
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
		// Esta función sería implementada según necesidades específicas
		setReindexAllDialogOpen(false);
		setShowReindexDialog(false);
	}, []);

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
