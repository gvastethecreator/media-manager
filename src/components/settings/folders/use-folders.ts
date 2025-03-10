'use client';

import { createFolder, deleteFolder, reindexFolder, updateFolderAutoReindex } from '@/app/actions/folders';
import type { FolderResponse } from '@/app/actions/folders/folder-types.actions';
import { useToast } from '@/components/ui/use-toast';
import { logger } from '@/lib/logger';
import { FOLDER_EVENTS, folderService, getFolders } from '@/services/folder.service';
import type { Folder, FolderStats } from '@/types/entities/folders';
import type {
	ErrorResponse,
	ExtendedProcessStatus,
	ProcessStatus,
	ReindexAllCompleteData,
	ReindexAllProgressData,
} from '@/types/process';
import { useCallback, useEffect, useState } from 'react';
import {
	type ExtendedFolder,
	initialGlobalProcessingState,
	initialGlobalReindexStatus,
	initialStats,
} from './folder-types';

const folderLogger = logger.withContext('useFolders');

export function useFolders() {
	const { toast } = useToast();
	const [error, setError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [isProcessing, setIsProcessing] = useState(false);
	const [processProgress, setProcessProgress] = useState(0);
	const [stats, setStats] = useState<FolderStats>(initialStats);
	const [folders, setFolders] = useState<ExtendedFolder[]>([]);
	const [processStatus, setProcessStatus] = useState<ExtendedProcessStatus>({});
	const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
	const [globalReindexStatus, setGlobalReindexStatus] = useState(initialGlobalReindexStatus);
	const [_globalProcessingState, setGlobalProcessingState] = useState(initialGlobalProcessingState);
	const [_extendedStats, _setExtendedStats] = useState<ProcessStatus['extendedStats']>({
		fileTypes: {},
		averageSize: 0,
		processingSpeed: 0,
		errorsByType: {},
		healthScore: 100,
	});
	const [showReindexDialog, setShowReindexDialog] = useState(false);
	const [reindexAllDialogOpen, setReindexAllDialogOpen] = useState(false);

	// Check if any process is running
	const isGloballyProcessing = isProcessing || globalReindexStatus.isProcessing;

	// Event handlers
	const handleProgress = useCallback(
		(status: ProcessStatus) => {
			if (!status) {
				return;
			}

			folderLogger.info('📊 Progreso del proceso:', status);

			// Actualizar estado global de procesamiento
			if (status.currentFile) {
				setGlobalProcessingState((prev) => ({
					...prev,
					isProcessing: true,
					currentFolder: status.folderId
						? folders.find((f) => f.id === status.folderId)?.name || prev.currentFolder
						: prev.currentFolder,
					currentFile: status.currentFile || null,
					fileProgress: {
						processed: status.filesProcessed || 0,
						total: status.totalFiles || 0,
						current: status.currentFile || '',
					},
				}));
			}

			// Actualizar progreso general
			setProcessProgress(status.progress || 0);

			// Actualizar estado del proceso
			setProcessStatus((prevStatus) => ({
				...prevStatus,
				...status,
				status: status.status || 'Procesando...',
				phase: status.phase || prevStatus.phase,
				filesProcessed: status.filesProcessed || prevStatus.filesProcessed,
				totalFiles: status.totalFiles || prevStatus.totalFiles,
				fileDetails: status.fileDetails || prevStatus.fileDetails,
				extendedStats: status.extendedStats
					? {
							...prevStatus.extendedStats,
							...status.extendedStats,
							fileTypes: {
								...prevStatus.extendedStats?.fileTypes,
								...status.extendedStats.fileTypes,
							},
							errorsByType: {
								...prevStatus.extendedStats?.errorsByType,
								...status.extendedStats.errorsByType,
							},
						}
					: prevStatus.extendedStats,
				errors: status.errors
					? [
							...(prevStatus.errors || []),
							...status.errors.filter(
								(error) => !prevStatus.errors?.some((e) => e.file === error.file && e.error === error.error)
							),
						]
					: prevStatus.errors,
				globalProgress: status.globalProgress || prevStatus.globalProgress,
			}));
		},
		[folders]
	);

	const handleError = useCallback(
		(error: ErrorResponse) => {
			folderLogger.error('❌ Error procesando carpeta:', error);

			// Actualizar estado global
			setIsProcessing(false);
			setProcessProgress(0);

			// Reflejar el error en el estado local
			if (error.folderId) {
				// Actualizar la carpeta con el error
				setFolders((prevFolders) =>
					prevFolders.map((folder) =>
						folder.id === error.folderId
							? {
									...folder,
									error: error.message,
									lastIndexed: new Date(), // Actualizar fecha de último indexado para reflejar el intento
								}
							: folder
					)
				);

				// Si estamos procesando esa carpeta específicamente, limpiar su estado
				if (processStatus.folderId === error.folderId) {
					setProcessStatus({});
					setProcessProgress(0);
				}
			}

			// Notificar al usuario
			toast({
				title: 'Error en el proceso',
				description: error.message || 'Error desconocido durante el procesamiento',
				variant: 'destructive',
			});

			// Limpiar estado de procesamiento global
			setIsProcessing(false);
		},
		[toast, processStatus.folderId]
	);

	const handleReindexAllStart = useCallback((data: { totalFolders: number }) => {
		folderLogger.info('🔄 Iniciando reindexación de todas las carpetas:', data);

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
	}, []);

	const handleReindexAllProgress = useCallback((data: ReindexAllProgressData) => {
		folderLogger.info('🔄 Progreso de reindexación global:', data);

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
	}, []);

	const handleReindexAllComplete = useCallback(
		(data: ReindexAllCompleteData) => {
			folderLogger.info('✅ Reindexación global completada:', data);

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

			toast({
				title: 'Reindexación completada',
				description: `${data.processedFolders} carpetas procesadas en ${Math.round(duration / 1000)} segundos`,
			});

			// Cargar estadísticas actualizadas
			loadStats();
		},
		[globalReindexStatus.startTime, toast]
	);

	const handleComplete = useCallback((data: FolderResponse) => {
		if (!data) {
			return;
		}

		folderLogger.info('✅ Proceso completado:', {
			folderId: data.id,
			stats: data.stats,
		});

		// Resetear estado global de procesamiento
		setGlobalProcessingState(initialGlobalProcessingState);

		setFolders((prevFolders) =>
			prevFolders.map((folder) =>
				folder.id === data.id
					? {
							...folder,
							...data,
							_count: {
								images: data.stats?.total || folder._count?.images || 0,
							},
							totalSize: data.stats?.totalSize || folder.totalSize,
							lastIndexed: new Date(),
							createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
							updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date(),
						}
					: {
							...folder,
							lastIndexed: folder.lastIndexed ? new Date(folder.lastIndexed) : null,
							createdAt: new Date(folder.createdAt),
							updatedAt: new Date(folder.updatedAt),
						}
			)
		);

		if (data.stats) {
			setStats((prevStats) => ({
				...prevStats,
				totalFiles: prevStats.totalFiles + (data.stats?.total || 0),
				totalSize: prevStats.totalSize + (data.stats?.totalSize || 0),
				lastIndexed: new Date(),
			}));
		}
	}, []);

	const handleStats = useCallback((stats: FolderStats) => {
		folderLogger.info('📊 Estadísticas actualizadas:', stats);
		setStats((prevStats) => ({
			...prevStats,
			...stats,
		}));
	}, []);

	// Load stats from API
	const loadStats = useCallback(async () => {
		try {
			folderLogger.info('🔄 Cargando estadísticas...');
			setIsLoading(true);
			await loadFolders();
			// Las estadísticas se cargan con las carpetas
			setIsLoading(false);
			folderLogger.info('✅ Estadísticas cargadas');
		} catch (error) {
			folderLogger.error('❌ Error cargando estadísticas:', error);
			setError(error instanceof Error ? error.message : 'Error cargando estadísticas');
			setIsLoading(false);
		}
	}, []);

	// Load folders from API
	const loadFolders = useCallback(async () => {
		try {
			setIsLoading(true);
			setError(null);
			const folders = await getFolders();

			// Transformar datos de manera segura
			const transformedFolders = folders.map((folder: Folder) => ({
				...folder,
				lastIndexed: folder.lastIndexed ? new Date(folder.lastIndexed) : null,
				createdAt: new Date(folder.createdAt || new Date()),
				updatedAt: new Date(folder.updatedAt || new Date()),
				_count: {
					images: folder._count?.images || 0,
				},
				totalSize: Number(folder.totalSize || 0),
				autoReindex: folder.autoReindex || false,
			}));

			folderLogger.info('✅ Carpetas cargadas:', {
				count: transformedFolders.length,
			});
			setFolders(transformedFolders);
		} catch (error) {
			folderLogger.error('❌ Error cargando carpetas:', error);
			setError(error instanceof Error ? error.message : 'No se pudieron cargar las carpetas');
		} finally {
			setIsLoading(false);
		}
	}, []);

	// Effect to load initial data
	const loadInitialData = useCallback(async () => {
		folderLogger.info('🚀 Cargando datos iniciales');
		await loadFolders();
		await loadStats();
		folderLogger.info('✅ Datos iniciales cargados');
	}, [loadFolders, loadStats]);

	useEffect(() => {
		loadInitialData().catch((error) => {
			folderLogger.error('❌ Error cargando datos iniciales:', error);
			setError(error instanceof Error ? error.message : 'Error cargando datos iniciales');
		});
	}, [loadInitialData]);

	// Effect to subscribe to folder service events
	useEffect(() => {
		// Suscribirse a eventos
		folderService.onProgress(handleProgress);
		folderService.onError(handleError);
		folderService.onComplete(handleComplete);
		folderService.onStats(handleStats);

		folderService.on(FOLDER_EVENTS.REINDEX_ALL_START, handleReindexAllStart);
		folderService.on(FOLDER_EVENTS.REINDEX_ALL_PROGRESS, handleReindexAllProgress);
		folderService.on(FOLDER_EVENTS.REINDEX_ALL_COMPLETE, handleReindexAllComplete);

		// Cleanup
		return () => {
			folderLogger.info('🧹 Limpiando suscripciones de eventos');
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

	// Handler for adding a new folder
	const handleAddFolder = async (folderPath: string) => {
		try {
			setIsProcessing(true);
			folderLogger.info('➕ Agregando carpeta:', { path: folderPath });

			// Llamar a la acción del servidor
			const result = await createFolder(folderPath);

			folderLogger.info('✅ Carpeta agregada correctamente:', result);
			await loadInitialData(); // Recargar datos

			toast({
				title: 'Carpeta agregada',
				description: `La carpeta ${result.name} se ha agregado correctamente`,
			});
		} catch (error) {
			folderLogger.error('❌ Error al agregar carpeta:', error);
			toast({
				title: 'Error al agregar carpeta',
				description: error instanceof Error ? error.message : 'Error desconocido',
				variant: 'destructive',
			});
		} finally {
			setIsProcessing(false);
		}
	};

	// Handler for reindexing a specific folder
	const handleReindexFolder = async (folderId: string) => {
		try {
			// Verificar si ya hay un proceso en curso
			if (isGloballyProcessing) {
				folderLogger.warn('⚠️ No se puede reindexar con un proceso en curso');
				toast({
					title: 'Proceso en curso',
					description: 'Hay otro proceso en ejecución. Por favor, espere a que termine.',
					variant: 'destructive',
				});
				return;
			}

			folderLogger.info('🔄 Reindexando carpeta:', { folderId });

			// Actualizar estado de la UI
			setIsProcessing(true);
			setProcessStatus({
				folderId,
				status: 'Iniciando reindexación...',
				progress: 0,
				phase: 'starting',
			});
			setProcessProgress(0);

			// Crear un temporizador para detectar si el proceso se queda bloqueado
			const timeoutId = setTimeout(() => {
				// Si después de 30 segundos no hubo respuesta, considerarlo como un error
				if (isProcessing && processStatus.folderId === folderId) {
					folderLogger.warn('⚠️ Timeout detectado en reindexación, actualizando estado...');

					// Actualizar la carpeta con el error
					setFolders((prevFolders) =>
						prevFolders.map((folder) =>
							folder.id === folderId
								? {
										...folder,
										error: 'Timeout en la reindexación',
										lastIndexed: new Date(),
									}
								: folder
						)
					);

					// Limpiar estados
					setProcessStatus({});
					setProcessProgress(0);
					setIsProcessing(false);

					toast({
						title: 'Error en la reindexación',
						description: 'El proceso tardó demasiado tiempo. Por favor, intente nuevamente.',
						variant: 'destructive',
					});
				}
			}, 30000); // 30 segundos es un tiempo razonable para detectar problemas

			// Llamar a la acción del servidor
			await reindexFolder(folderId);
			folderLogger.info('✅ Solicitud de reindexación enviada correctamente');

			// Limpiar el temporizador ya que la solicitud se completó
			clearTimeout(timeoutId);

			// No reiniciamos isProcessing aquí porque el proceso continuará asíncronamente
			// y será actualizado por los eventos
		} catch (error) {
			folderLogger.error('❌ Error al reindexar carpeta:', error);

			// Mostrar el error al usuario
			toast({
				title: 'Error al reindexar',
				description: error instanceof Error ? error.message : 'No se pudo reindexar la carpeta',
				variant: 'destructive',
			});

			// Actualizar la carpeta con el error
			setFolders((prevFolders) =>
				prevFolders.map((folder) =>
					folder.id === folderId
						? {
								...folder,
								error: error instanceof Error ? error.message : 'Error desconocido',
								lastIndexed: new Date(), // Actualizar fecha de último indexado para reflejar el intento
							}
						: folder
				)
			);

			// Limpiar estados
			setProcessStatus({});
			setProcessProgress(0);
			setIsProcessing(false);
		}
	};

	// Handler for removing a folder
	const handleRemoveFolder = async (folderId: string) => {
		try {
			folderLogger.info('🗑️ Eliminando carpeta:', { folderId });

			// Quitar de la UI inmediatamente (optimistic update)
			setFolders((prevFolders) => prevFolders.filter((folder) => folder.id !== folderId));

			// Llamar a la acción del servidor
			await deleteFolder(folderId);

			folderLogger.info('✅ Carpeta eliminada correctamente');
			toast({
				title: 'Carpeta eliminada',
				description: 'La carpeta se eliminó correctamente',
			});

			// Actualizar estadísticas
			await loadStats();
			setSelectedFolder(null);
		} catch (error) {
			folderLogger.error('❌ Error al eliminar carpeta:', error);
			toast({
				title: 'Error',
				description: error instanceof Error ? error.message : 'No se pudo eliminar la carpeta',
				variant: 'destructive',
			});

			// Restaurar carpeta eliminada (si falla)
			await loadFolders();
		}
	};

	// Handler for clicking on a folder (select/delete)
	const handleFolderClick = async (folderId: string) => {
		if (selectedFolder === folderId) {
			try {
				folderLogger.info('🗑️ Eliminando carpeta por doble click:', {
					folderId,
				});
				await deleteFolder(folderId);

				folderLogger.info('✅ Carpeta eliminada correctamente');
				toast({
					title: 'Carpeta eliminada',
					description: 'La carpeta se eliminó correctamente',
				});

				await loadStats();
				setSelectedFolder(null);
			} catch (error) {
				folderLogger.error('❌ Error eliminando carpeta:', error);
				toast({
					title: 'Error',
					description: 'No se pudo eliminar la carpeta',
					variant: 'destructive',
				});
			}
		} else {
			setSelectedFolder(folderId);
		}
	};

	// Handler for starting reindex all process
	const handleReindexAll = async () => {
		try {
			// Verificar si ya hay un proceso de reindexación en curso
			if (globalReindexStatus.isProcessing) {
				toast({
					title: 'Proceso en curso',
					description: 'Ya hay un proceso de reindexación en ejecución',
					variant: 'destructive',
				});
				return;
			}

			// Mostrar diálogo de confirmación
			setShowReindexDialog(true);
		} catch (error) {
			folderLogger.error('❌ Error al iniciar reindexación:', error);
			toast({
				title: 'Error',
				description: 'No se pudo iniciar el proceso de reindexación',
				variant: 'destructive',
			});
		}
	};

	// Handler for confirming reindex all action
	const handleConfirmReindexAll = async () => {
		try {
			folderLogger.info('🔄 Iniciando reindexación de todas las carpetas');
			setShowReindexDialog(false);

			// Preparar estado para mostrar progreso
			setGlobalReindexStatus({
				isProcessing: true,
				progress: 0,
				processedFolders: 0,
				totalFolders: folders.length,
				errors: [],
				phase: 'starting',
				startTime: Date.now(),
			});

			// Enviar solicitud a la API
			const response = await fetch('/api/folders/reindex-all', {
				method: 'POST',
			});

			if (!response.ok) {
				throw new Error('Error al iniciar el proceso de reindexación');
			}

			folderLogger.info('✅ Solicitud de reindexación iniciada correctamente');
		} catch (error: unknown) {
			setGlobalReindexStatus((prev) => ({
				...prev,
				isProcessing: false,
				errors: [
					...(prev.errors || []),
					{
						folderId: 'global',
						error: error instanceof Error ? error.message : 'Error desconocido',
					},
				],
			}));

			folderLogger.error('❌ Error al iniciar reindexación:', error);
			toast({
				title: 'Error',
				description: error instanceof Error ? error.message : 'No se pudo iniciar el proceso de reindexación',
				variant: 'destructive',
			});
		}
	};

	// Handler for toggling auto-reindex setting
	const handleAutoReindexToggle = async (folderId: string, value: boolean) => {
		try {
			folderLogger.info('🔄 Cambiando configuración de reindexado automático:', {
				folderId,
				value,
			});

			// Actualizar UI inmediatamente (optimistic update)
			setFolders((prevFolders) =>
				prevFolders.map((folder) => (folder.id === folderId ? { ...folder, autoReindex: value } : folder))
			);

			// Llamar a la acción del servidor
			await updateFolderAutoReindex(folderId, value);

			folderLogger.info('✅ Configuración actualizada correctamente');
			toast({
				title: 'Configuración actualizada',
				description: `Reindexado automático ${value ? 'activado' : 'desactivado'}`,
			});
		} catch (error) {
			folderLogger.error('❌ Error actualizando configuración:', error);
			toast({
				title: 'Error',
				description: 'No se pudo actualizar la configuración',
				variant: 'destructive',
			});

			// Revertir cambio en caso de error
			await loadFolders();
		}
	};

	// Handler for clearing metadata cache
	const handleClearCache = async () => {
		try {
			setIsProcessing(true);
			folderLogger.info('🧹 Limpiando caché de metadatos');

			toast({
				title: 'Limpiando caché',
				description: 'Espere mientras se limpia la caché de metadatos...',
			});

			const response = await fetch('/api/cache/clear', {
				method: 'POST',
			});

			if (!response.ok) {
				throw new Error('Error al limpiar la caché');
			}

			toast({
				title: 'Caché limpiada',
				description: 'La caché de metadatos se ha limpiado correctamente',
			});
		} catch (error) {
			toast({
				title: 'Error',
				description: 'Error al limpiar la caché de metadatos',
				variant: 'destructive',
			});
			folderLogger.error('Error al limpiar caché:', error);
		} finally {
			setIsProcessing(false);
		}
	};

	return {
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
		loadStats,
		handleAddFolder,
		handleReindexFolder,
		handleRemoveFolder,
		handleFolderClick,
		handleReindexAll,
		handleConfirmReindexAll,
		handleAutoReindexToggle,
		handleClearCache,
		setShowReindexDialog,
		setReindexAllDialogOpen,
		setError,
	};
}
